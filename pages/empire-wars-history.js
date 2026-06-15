import React, { Component } from "react";

import HistoryChart from "../components/history-chart.js";
import {
  LEADERBOARDS,
  MIN_DISPLAY_DATE,
  ANOMALY_TOLERANCE,
  filterSince,
  excludeDates,
  detectAnomalousDates,
} from "../helpers/history.js";

// `fs` is only referenced inside getStaticProps, which Next strips from the
// client bundle (same pattern as pages/index.js).
const fs = require("fs");

const HISTORY_PATH = "ratings/history.json";

export default class extends Component {
  render() {
    return (
      <HistoryChart
        {...this.props}
        title="Empire Wars History"
        groupLabel="Empire Wars"
        backLink="/empire-wars"
        backLinkText="Empire Wars"
        uniqueKey="ew"
        soloKey={LEADERBOARDS.EMPIRE_WARS.solo}
        teamKey={LEADERBOARDS.EMPIRE_WARS.team}
        soloLabel="1v1 Empire Wars"
        teamLabel="Team Empire Wars"
      ></HistoryChart>
    );
  }
}

/**
 * Runs at build time. This page is READ-ONLY: it reads the committed history
 * file, hides anomalous days, and renders. Today's point is appended once,
 * single-threaded, by scripts/update-history.js (which runs between the two
 * `next build` passes) — not here — so the parallel page builds never fetch
 * leaderboards twice or race writing history.json, and the second build picks
 * up today's point. See scripts/update-history.js for details.
 */
export async function getStaticProps(context) {
  const soloKey = LEADERBOARDS.EMPIRE_WARS.solo;
  const teamKey = LEADERBOARDS.EMPIRE_WARS.team;

  // Read the committed history (tolerate a missing/corrupt file).
  let history = { series: [] };
  try {
    if (fs.existsSync(HISTORY_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));
      if (parsed && Array.isArray(parsed.series)) {
        history = parsed;
      }
    }
  } catch (e) {
    console.log("Could not read history file:", e.message);
  }

  // Hide likely fetch errors using the shared anomaly rule (raw data is kept).
  const visible = filterSince(history.series, MIN_DISPLAY_DATE);
  const excludedDates = detectAnomalousDates(visible, [soloKey, teamKey]);

  return {
    props: {
      series: excludeDates(visible, excludedDates),
      excludedDates,
      anomalyTolerance: ANOMALY_TOLERANCE,
    },
  };
}
