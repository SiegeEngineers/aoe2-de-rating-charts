// Shared, PURE logic for the player-count history feature.
//
// Used both by the one-time backfill script (plain node / CommonJS) and by the
// history page (Next.js / webpack), so this file is written as CommonJS and is
// kept dependency-free. In particular it does NOT touch `fs`: this module is
// imported into the client bundle (the page uses LEADERBOARDS in render()), and
// referencing a node built-in here would break the browser build. File I/O
// lives in the server-only callers (scripts/backfill-history.js and the page's
// getStaticProps).
//
// The history series is leaderboard-generic: each point stores a `counts` map
// keyed by leaderboard id (e.g. "3" = 1v1 Random Map, "4" = Team Random Map,
// "13"/"14" = Empire Wars). This lets a single file/backfill/daily-update serve
// multiple history pages.

// Convenience leaderboard groupings for the pages.
const LEADERBOARDS = Object.freeze({
  RANDOM_MAP: { solo: "3", team: "4" },
  EMPIRE_WARS: { solo: "13", team: "14" },
});

// Earliest date the charts display. The full series (back to 2020) is kept in
// the data file, but data before this is from older, less consistent sources,
// so the pages only plot from here on.
const MIN_DISPLAY_DATE = "2021-06-01";

// Anomaly detection: rather than hand-maintaining a list of bad days, we flag
// isolated one-day data glitches (partial scrapes). A day is anomalous when a
// rated-player count drops more than ANOMALY_TOLERANCE below BOTH the day
// before and the day after, AND those two neighboring days agree with each
// other (within ANOMALY_TOLERANCE). That "stable surroundings, one-day dip"
// shape is a fetch glitch that snaps back the next day. It deliberately does
// NOT flag multi-day events such as ranked-season resets, where the count drops
// and then climbs back gradually over weeks (the neighbors disagree, so the
// dip is recognised as real data rather than a glitch).
const ANOMALY_TOLERANCE = 0.1; // 10%

/**
 * Return only the points on or after `minDate` (a "YYYY-MM-DD" string). The
 * series is assumed sorted ascending by date.
 */
function filterSince(series, minDate) {
  return series.filter((p) => p.date >= minDate);
}

/**
 * Return the series with the given dates removed.
 */
function excludeDates(series, dates) {
  const set = new Set(dates);
  return series.filter((p) => !set.has(p.date));
}

/**
 * Detect isolated one-day glitches in `series` for each of the given count
 * `keys` (e.g. ["3","4"]). A day is flagged when its count drops more than
 * `tolerance` below BOTH the day before and the day after, and those two
 * neighboring days agree with each other (their difference is within
 * `tolerance`). This catches single-day partial scrapes that snap back, while
 * leaving multi-day events (e.g. ranked-season resets, where the neighbors
 * disagree because the count is still recovering) in place. First/last points
 * have no pair of neighbors and are not tested. The series is assumed sorted
 * ascending by date. Returns a sorted array of unique dates.
 */
function detectAnomalousDates(series, keys, opts) {
  const tol = (opts && opts.tolerance) || ANOMALY_TOLERANCE;
  const flagged = new Set();

  for (const key of keys) {
    const pts = series.filter((p) => p.counts && p.counts[key] !== undefined);
    for (let i = 1; i < pts.length - 1; i++) {
      const v = pts[i].counts[key];
      const prev = pts[i - 1].counts[key];
      const next = pts[i + 1].counts[key];
      const lower = Math.min(prev, next);
      const upper = Math.max(prev, next);
      // Below both neighbors by > tol (lower is the binding one), and the two
      // neighbors are within tol of each other (stable surroundings).
      const belowBoth = v < lower * (1 - tol);
      const neighborsAgree = upper > 0 && upper - lower <= tol * upper;
      if (belowBoth && neighborsAgree) {
        flagged.add(pts[i].date);
      }
    }
  }

  return Array.from(flagged).sort();
}

// All leaderboard ids the backfill should look for in history.
const ALL_LEADERBOARD_IDS = ["3", "4", "13", "14"];

/**
 * Count the number of rated players in a formatted leaderboard object of the
 * form { timestamp, data: { <profileId>: {...} } }.
 */
function countPlayers(leaderboardObj) {
  if (!leaderboardObj || !leaderboardObj.data) {
    return 0;
  }
  return Object.keys(leaderboardObj.data).length;
}

/**
 * Convert an epoch-millisecond timestamp to a UTC "YYYY-MM-DD" date string.
 * This date is the idempotency key for the history series.
 */
function toUtcDate(tsMs) {
  return new Date(tsMs).toISOString().slice(0, 10);
}

/**
 * Insert-or-replace a point in the series keyed by `date`. The `counts` map is
 * MERGED into any existing point for that date (so a Random Map run and an
 * Empire Wars run on the same day each contribute their own leaderboard keys
 * without clobbering the other). The series is kept sorted ascending by date.
 *
 * The optional `unique` map (distinct players in a group, e.g. { rm, ew }) is
 * merged the same way, so each page contributes only its own group's value.
 *
 * @param series the existing array of points (mutated and returned)
 * @param point  { date, ts, counts, unique? } counts keyed by leaderboard id,
 *               unique keyed by group ("rm" | "ew")
 */
function upsertCounts(series, point) {
  const existing = series.find((p) => p.date === point.date);
  if (existing) {
    existing.ts = point.ts;
    existing.counts = Object.assign({}, existing.counts, point.counts);
    if (point.unique) {
      existing.unique = Object.assign({}, existing.unique, point.unique);
    }
  } else {
    const fresh = { date: point.date, ts: point.ts, counts: point.counts };
    if (point.unique) {
      fresh.unique = point.unique;
    }
    series.push(fresh);
    series.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }
  return series;
}

module.exports = {
  LEADERBOARDS,
  ALL_LEADERBOARD_IDS,
  MIN_DISPLAY_DATE,
  ANOMALY_TOLERANCE,
  filterSince,
  excludeDates,
  detectAnomalousDates,
  countPlayers,
  toUtcDate,
  upsertCounts,
};
