// One-time bootstrap: dredge git history to build ratings/history.json.
//
// Two eras of data are recovered:
//
//   1. Pre-2021 ("static-export" era): before the ratings/leaderboard*.json
//      files existed, each daily build baked the data into the exported site at
//      <out|docs>/_next/data/<buildId>/index.json. Two formats appear there:
//        - Format A (Google Charts, 2020-03 .. ~mid 2020): pageProps.histogram
//          is [["Player Name","ELO"], [name, elo], ...] -> 1v1 only.
//        - Format B (Plotly, ~mid 2020 .. 2021-04-13): pageProps.data is a
//          stringified { id: [id, name, rm1v1, rmTeam] } -> 1v1 and team.
//   2. Ratings era (2021-04-13 .. now): ratings/leaderboard{3,4,13,14}.json,
//      each { timestamp, data: { profileId: {...} } }.
//
// For every snapshot commit we count the rated players and record a per-day
// point. Idempotent and re-runnable: it merges into any existing history file.
//
//   node scripts/backfill-history.js
//
// Kept in the repo so the backfill is reproducible.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const {
  ALL_LEADERBOARD_IDS,
  countPlayers,
  toUtcDate,
  upsertCounts,
} = require("../helpers/history.js");

const HISTORY_PATH = "ratings/history.json";
const REPO_ROOT = path.join(__dirname, "..");

function readHistory(p) {
  try {
    if (!fs.existsSync(p)) {
      return { series: [] };
    }
    const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
    return parsed && Array.isArray(parsed.series) ? parsed : { series: [] };
  } catch (e) {
    console.log("Could not read history file, starting fresh:", p, e.message);
    return { series: [] };
  }
}

function writeHistory(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj));
}

function git(args, opts) {
  return execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024, // leaderboard blobs can be a few MB
    ...opts,
  });
}

function leaderboardPath(id) {
  return `ratings/leaderboard${id}.json`;
}

// Read a leaderboard blob at a specific commit; returns null if it doesn't
// exist / can't be parsed at that commit (e.g. Empire Wars before it began).
function readBlobAt(sha, id) {
  let raw;
  try {
    // Silence git's stderr: a missing path at a commit is expected (e.g.
    // Empire Wars leaderboards before they existed) and handled below.
    raw = git(["show", `${sha}:${leaderboardPath(id)}`], {
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch (e) {
    return null; // path absent at this commit
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null; // unparseable
  }
}

// Last day of the pre-ratings static-export era (inclusive). The ratings/
// files begin 2021-04-13; the ratings-era pass overwrites any boundary overlap.
const STATIC_EXPORT_UNTIL = "2021-04-13 23:59:59";

// Locate and parse the baked static-export data blob at a pre-2021 commit.
// Returns { counts, ts } or null.
function readOldExportAt(sha) {
  let listing;
  try {
    listing = git(
      ["ls-tree", "-r", "--name-only", sha, "docs/_next/data", "out/_next/data"],
      { stdio: ["ignore", "pipe", "ignore"] }
    );
  } catch (e) {
    return null;
  }
  const blobPath = listing
    .split("\n")
    .map((s) => s.trim())
    .find((p) => /_next\/data\/.*\/index\.json$/.test(p));
  if (!blobPath) {
    return null;
  }

  let json;
  try {
    json = JSON.parse(
      git(["show", `${sha}:${blobPath}`], { stdio: ["ignore", "pipe", "ignore"] })
    );
  } catch (e) {
    return null;
  }

  const pp = json.pageProps;
  if (!pp || typeof pp.timestamp !== "number") {
    return null;
  }
  // Format A (2020) stores the timestamp in SECONDS; format B/C use
  // milliseconds. Normalize anything that looks like seconds (< ~2001 in ms).
  let ts = pp.timestamp;
  if (ts < 1e12) {
    ts *= 1000;
  }
  const counts = {};
  const unique = {};

  if (Array.isArray(pp.histogram)) {
    // Format A: header row + one row per rated 1v1 player. 1v1 only, so the
    // unique Random Map total equals the 1v1 count.
    counts["3"] = Math.max(0, pp.histogram.length - 1);
    unique.rm = counts["3"];
  } else if (typeof pp.data === "string") {
    // Format B: entries are [id, name, rm1v1, rmTeam] (older), or
    // { "3": rating, "4": rating } objects (defensive fallback). One entry per
    // player, so the unique Random Map total is the number of entries that have
    // any Random Map rating.
    let data;
    try {
      data = JSON.parse(pp.data);
    } catch (e) {
      return null;
    }
    let solo = 0;
    let team = 0;
    let uniq = 0;
    for (const k in data) {
      const e = data[k];
      let hasSolo = false;
      let hasTeam = false;
      if (Array.isArray(e)) {
        hasSolo = e[2] != null;
        hasTeam = e[3] != null;
      } else if (e && typeof e === "object") {
        hasSolo = e["3"] != null;
        hasTeam = e["4"] != null;
      }
      if (hasSolo) solo++;
      if (hasTeam) team++;
      if (hasSolo || hasTeam) uniq++;
    }
    counts["3"] = solo;
    if (team > 0) {
      counts["4"] = team;
    }
    unique.rm = uniq;
  } else {
    return null;
  }

  return { counts, ts, unique };
}

// Pass 1: recover the pre-2021 static-export era (formats A and B).
function backfillStaticExportEra(history) {
  const shas = git([
    "log",
    "--reverse",
    `--until=${STATIC_EXPORT_UNTIL}`,
    "--format=%H",
    "--",
    "docs/_next/data",
    "out/_next/data",
  ])
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Pre-2021 static-export era: ${shas.length} commits to scan...`);
  let processed = 0;
  for (const sha of shas) {
    const result = readOldExportAt(sha);
    if (!result || Object.keys(result.counts).length === 0) {
      continue;
    }
    upsertCounts(history.series, {
      date: toUtcDate(result.ts),
      ts: result.ts,
      counts: result.counts,
      unique: result.unique,
    });
    processed++;
    if (processed % 100 === 0) {
      console.log(`  ...scanned ${processed}/${shas.length} export commits`);
    }
  }
}

function main() {
  const history = readHistory(HISTORY_PATH);

  // Pass 1: pre-2021 static-export era. Run first so the ratings-era pass below
  // takes precedence on the 2021-04-13 boundary date.
  backfillStaticExportEra(history);

  const pathsArg = ALL_LEADERBOARD_IDS.map(leaderboardPath);
  const shas = git(["log", "--reverse", "--format=%H", "--", ...pathsArg])
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Ratings era: ${shas.length} snapshot commits to process...`);

  let processed = 0;
  for (const sha of shas) {
    const counts = {};
    const keysById = {};
    let ts;

    for (const id of ALL_LEADERBOARD_IDS) {
      const blob = readBlobAt(sha, id);
      if (!blob) {
        continue;
      }
      counts[id] = countPlayers(blob);
      keysById[id] = blob.data ? Object.keys(blob.data) : [];
      // Use the first available leaderboard's timestamp as the day's reference.
      if (ts === undefined && typeof blob.timestamp === "number") {
        ts = blob.timestamp;
      }
    }

    // Skip commits where nothing usable was found.
    if (Object.keys(counts).length === 0 || ts === undefined) {
      continue;
    }

    // Unique players per group = distinct profile ids across the group's two
    // leaderboards (players who appear on both are counted once).
    const unique = {};
    if (keysById["3"] || keysById["4"]) {
      unique.rm = new Set([
        ...(keysById["3"] || []),
        ...(keysById["4"] || []),
      ]).size;
    }
    if (keysById["13"] || keysById["14"]) {
      unique.ew = new Set([
        ...(keysById["13"] || []),
        ...(keysById["14"] || []),
      ]).size;
    }

    upsertCounts(history.series, { date: toUtcDate(ts), ts, counts, unique });

    processed++;
    if (processed % 100 === 0) {
      console.log(`  ...processed ${processed}/${shas.length} commits`);
    }
  }

  writeHistory(HISTORY_PATH, history);
  console.log(
    `Done. Wrote ${history.series.length} daily points to ${HISTORY_PATH}.`
  );
  if (history.series.length > 0) {
    console.log("  First:", JSON.stringify(history.series[0]));
    console.log(
      "  Last: ",
      JSON.stringify(history.series[history.series.length - 1])
    );
  }
}

main();
