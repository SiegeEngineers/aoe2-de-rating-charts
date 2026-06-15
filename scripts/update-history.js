// Daily history update, run once as a build step (see package.json
// "update-history" and .github/workflows/build.yml).
//
// Why a dedicated step instead of doing this in the history pages'
// getStaticProps: Next generates pages in parallel workers. If the history
// pages fetched leaderboard data and wrote ratings/history.json themselves they
// would (a) re-fetch leaderboards the rating pages already fetched and (b) race
// each other writing the same file. Running here, once and single-threaded,
// avoids both. It reuses the leaderboard JSON the rating pages already wrote to
// ratings-ignored/ during `next build`, so it makes NO extra API calls.
//
// This step must never break the build: on any problem it logs and exits 0,
// leaving history.json unchanged (the next run will catch up).

const fs = require("fs");

const {
  LEADERBOARDS,
  ALL_LEADERBOARD_IDS,
  countPlayers,
  toUtcDate,
  upsertCounts,
} = require("../helpers/history.js");

const HISTORY_PATH = "ratings/history.json";

function readLeaderboard(id) {
  // Written by the rating pages' getStaticProps during `next build`.
  const p = `ratings-ignored/leaderboard${id}.json`;
  try {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    }
  } catch (e) {
    console.log(`update-history: could not read ${p}:`, e.message);
  }
  return null;
}

function uniqueAcross(a, b) {
  const set = new Set();
  if (a && a.data) for (const k in a.data) set.add(k);
  if (b && b.data) for (const k in b.data) set.add(k);
  return set.size;
}

function main() {
  const lb = {};
  for (const id of ALL_LEADERBOARD_IDS) {
    lb[id] = readLeaderboard(id);
  }

  // A reference timestamp from whichever leaderboard we have.
  let ts;
  for (const id of ALL_LEADERBOARD_IDS) {
    if (lb[id] && typeof lb[id].timestamp === "number") {
      ts = lb[id].timestamp;
      break;
    }
  }
  if (ts === undefined) {
    console.log("update-history: no fresh leaderboard data found; skipping.");
    return;
  }

  const counts = {};
  for (const id of ALL_LEADERBOARD_IDS) {
    if (lb[id]) {
      counts[id] = countPlayers(lb[id]);
    }
  }

  const unique = {};
  const rm = LEADERBOARDS.RANDOM_MAP;
  const ew = LEADERBOARDS.EMPIRE_WARS;
  if (lb[rm.solo] || lb[rm.team]) {
    unique.rm = uniqueAcross(lb[rm.solo], lb[rm.team]);
  }
  if (lb[ew.solo] || lb[ew.team]) {
    unique.ew = uniqueAcross(lb[ew.solo], lb[ew.team]);
  }

  // Read existing history (tolerate missing/corrupt).
  let history = { series: [] };
  try {
    if (fs.existsSync(HISTORY_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));
      if (parsed && Array.isArray(parsed.series)) {
        history = parsed;
      }
    }
  } catch (e) {
    console.log("update-history: could not read history, starting fresh:", e.message);
  }

  upsertCounts(history.series, { date: toUtcDate(ts), ts, counts, unique });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history));
  console.log(
    `update-history: upserted ${toUtcDate(ts)} -> ${JSON.stringify(counts)} unique ${JSON.stringify(unique)} (${history.series.length} points total).`
  );
}

try {
  main();
} catch (e) {
  // Never fail the build over the history sidecar.
  console.log("update-history: unexpected error, skipping update:", e.message);
}
