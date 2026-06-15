import React, { Component } from "react";

import styles from "./page.module.css";

// Colors reused from the histogram component for visual consistency
const SOLO_COLOR = "#0eac22"; // green
const TEAM_COLOR = "#fe9918"; // orange
const TOTAL_COLOR = "#6311a5"; // purple

// Common chart variables (mirrors components/histogram.js)
const AXIS_FONT_SIZE = 14;
const AXIS_FONT_COLOR = "#7f7f7f";
const TITLE_FONT_SIZE = 18;
const FONT = "Roboto, Arial, sans-serif";
const MARGINS = {
  l: 60,
  r: 15,
  t: 50,
  b: 40,
};

// Stock-market-style time navigation shared by every chart's x-axis.
function timeNavXAxis() {
  return {
    type: "date",
    rangeselector: {
      buttons: [
        { count: 1, label: "1m", step: "month", stepmode: "backward" },
        { count: 6, label: "6m", step: "month", stepmode: "backward" },
        { count: 1, label: "1y", step: "year", stepmode: "backward" },
        { step: "all", label: "All" },
      ],
    },
    rangeslider: {},
  };
}

function titleLayout(text) {
  return {
    text: text,
    font: { family: FONT, size: TITLE_FONT_SIZE },
    xanchor: "center",
    yanchor: "bottom",
  };
}

function yAxisTitle(text, extra) {
  return Object.assign(
    {
      title: {
        text: text,
        font: { family: FONT, size: AXIS_FONT_SIZE, color: AXIS_FONT_COLOR },
      },
    },
    extra || {}
  );
}

export default class extends Component {
  componentDidMount() {
    const series = this.props.series || [];
    const soloKey = this.props.soloKey;
    const teamKey = this.props.teamKey;

    // Build the x (date) and y (count) arrays for a single leaderboard,
    // skipping days where that leaderboard has no recorded count.
    const seriesFor = (key) => {
      const x = [];
      const y = [];
      for (const point of series) {
        const count = point.counts ? point.counts[key] : undefined;
        if (count === undefined) {
          continue;
        }
        x.push(point.date);
        y.push(count);
      }
      return { x, y };
    };

    const solo = seriesFor(soloKey);
    const team = seriesFor(teamKey);

    // Same modebar + "Edit in Chart Studio" tools as the other pages
    const config = {
      scrollZoom: false,
      responsive: true,
      showLink: true,
      plotlyServerURL: "https://chart-studio.plotly.com",
    };

    // Chart 1: number of rated solo (1v1) players over time
    const soloPlot = Plotly.newPlot(
      "players_solo",
      [
        {
          x: solo.x,
          y: solo.y,
          type: "scatter",
          mode: "lines",
          line: { color: SOLO_COLOR },
          hovertemplate: "%{x|%Y-%m-%d}<br>Players: %{y:,}<extra></extra>",
        },
      ],
      {
        title: titleLayout(this.props.soloLabel + " - Rated Players Over Time"),
        margin: MARGINS,
        xaxis: timeNavXAxis(),
        yaxis: yAxisTitle("Number of Players", { fixedrange: false }),
        hovermode: "x",
      },
      config
    );

    // Chart 2: number of rated team players over time
    const teamPlot = Plotly.newPlot(
      "players_team",
      [
        {
          x: team.x,
          y: team.y,
          type: "scatter",
          mode: "lines",
          line: { color: TEAM_COLOR },
          hovertemplate: "%{x|%Y-%m-%d}<br>Players: %{y:,}<extra></extra>",
        },
      ],
      {
        title: titleLayout(this.props.teamLabel + " - Rated Players Over Time"),
        margin: MARGINS,
        xaxis: timeNavXAxis(),
        yaxis: yAxisTitle("Number of Players", { fixedrange: false }),
        hovermode: "x",
      },
      config
    );

    // Charts 3 & 4 both need days where BOTH leaderboards have a count: the
    // total (solo + team) and the 100%-stacked share (so the bands sum to a
    // meaningful 100%).
    const uniqueKey = this.props.uniqueKey;
    const shareX = [];
    const shareSolo = [];
    const shareTeam = [];
    const totalY = [];
    const uniqueY = [];
    for (const point of series) {
      const c = point.counts || {};
      if (c[soloKey] === undefined || c[teamKey] === undefined) {
        continue;
      }
      shareX.push(point.date);
      shareSolo.push(c[soloKey]);
      shareTeam.push(c[teamKey]);
      totalY.push(c[soloKey] + c[teamKey]);
      // Distinct players across both leaderboards (null -> gap if unavailable).
      const u = point.unique ? point.unique[uniqueKey] : undefined;
      uniqueY.push(u === undefined ? null : u);
    }

    // Chart 3: total players over time - the sum of both leaderboards (which
    // double-counts players rated in both) alongside the true unique count.
    const totalPlot = Plotly.newPlot(
      "players_total",
      [
        {
          x: shareX,
          y: totalY,
          name: "1v1 + team (sum)",
          type: "scatter",
          mode: "lines",
          line: { color: TOTAL_COLOR },
          hovertemplate:
            "%{x|%Y-%m-%d}<br>Sum: %{y:,}<extra></extra>",
        },
        {
          x: shareX,
          y: uniqueY,
          name: "Unique players",
          type: "scatter",
          mode: "lines",
          line: { color: TOTAL_COLOR, dash: "dot" },
          connectgaps: false,
          hovertemplate:
            "%{x|%Y-%m-%d}<br>Unique: %{y:,}<extra></extra>",
        },
      ],
      {
        title: titleLayout(
          "Total " + this.props.groupLabel + " - Rated Players Over Time"
        ),
        margin: MARGINS,
        xaxis: timeNavXAxis(),
        yaxis: yAxisTitle("Number of Players", { fixedrange: false }),
        hovermode: "x unified",
        legend: { orientation: "h", x: 1, xanchor: "right", y: 1.08 },
      },
      config
    );

    const sharePlot = Plotly.newPlot(
      "players_share",
      [
        {
          x: shareX,
          y: shareSolo,
          name: this.props.soloLabel,
          type: "scatter",
          mode: "lines",
          line: { width: 0.5, color: SOLO_COLOR },
          stackgroup: "one",
          groupnorm: "percent",
          fillcolor: SOLO_COLOR,
          hovertemplate: "%{x|%Y-%m-%d}<br>%{y:.1f}%<extra>" +
            this.props.soloLabel +
            "</extra>",
        },
        {
          x: shareX,
          y: shareTeam,
          name: this.props.teamLabel,
          type: "scatter",
          mode: "lines",
          line: { width: 0.5, color: TEAM_COLOR },
          stackgroup: "one",
          fillcolor: TEAM_COLOR,
          hovertemplate: "%{x|%Y-%m-%d}<br>%{y:.1f}%<extra>" +
            this.props.teamLabel +
            "</extra>",
        },
      ],
      {
        title: titleLayout("Share of Rated Players: Solo vs Team"),
        margin: MARGINS,
        xaxis: timeNavXAxis(),
        yaxis: yAxisTitle("Share of Players", {
          range: [0, 100],
          ticksuffix: "%",
          fixedrange: true,
        }),
        hovermode: "x unified",
        legend: { orientation: "h", x: 1, xanchor: "right", y: 1.08 },
      },
      config
    );

    // Hide the loading spinner once every chart has rendered
    Promise.all([soloPlot, teamPlot, totalPlot, sharePlot]).then(function () {
      const contentDiv = document.getElementById("loading-hider");
      if (contentDiv) {
        contentDiv.classList.remove("hidden");
      }
      const loadingDiv = document.getElementById("loading");
      if (loadingDiv) {
        loadingDiv.classList.add("none");
      }
    });
  }

  render() {
    return (
      <html>
        <head>
          <title>{this.props.title}</title>
          <meta
            name="description"
            content="Historical counts of rated 'Age of Empires II: Definitive Edition' players over time. Updated daily."
          />
          <meta property="og:image" content="https://i.imgur.com/cVLgt68.png" />
          <script
            type="text/javascript"
            src="https://cdn.plot.ly/plotly-cartesian-latest.min.js"
          ></script>
          <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=UA-163727547-1"
          ></script>
          <script src="ga.js"></script>
          <link rel="shortcut icon" href="/favicon.ico" />
        </head>

        <body style={{ fontFamily: FONT }}>
          <div className={styles.center}>
            <div>
              <h2>Age of Empires II: Definitive Edition Rating Charts</h2>
              <div
                id="subheader"
                style={{
                  paddingBottom: "16px",
                  marginTop: "-16px",
                  fontSize: "9pt",
                }}
              >
                <i>
                  {this.props.title}. See instead{" "}
                  <a href={this.props.backLink}>{this.props.backLinkText}</a>
                  <br />
                  Updated daily
                </i>
              </div>
            </div>

            <div
              id="loading"
              style={{
                zIndex: 1,
                margin: "auto",
                width: "8%",
                marginTop: "100px",
              }}
            >
              <div className="loading-spinner">
                <div className="spinner-dot"></div>
                <div className="spinner-dot"></div>
                <div className="spinner-dot"></div>
                <div className="spinner-dot"></div>
                <div className="spinner-dot"></div>
                <div className="spinner-dot"></div>
              </div>
            </div>

            <div id="loading-hider" className="hidden">
              <div id="players_solo"></div>
              <div id="players_team"></div>
              <div id="players_total"></div>
              <div id="players_share"></div>
            </div>

            <div id="footer" style={{ fontSize: "12px", margin: "10px" }}>
              Counts are the number of players appearing on each ranked
              leaderboard each day, reconstructed from this site&apos;s daily
              history.
              <br />
              <br />†{" "}
              {"Days with likely fetch errors have been excluded by this criteria: a " +
                this.props.soloLabel +
                " or " +
                this.props.teamLabel +
                " count that drops more than " +
                Math.round((this.props.anomalyTolerance || 0.1) * 100) +
                "% below both adjacent days, while those two days are within " +
                Math.round((this.props.anomalyTolerance || 0.1) * 100) +
                "% of each other. "}
              {this.props.excludedDates && this.props.excludedDates.length > 0
                ? "Hidden days: " + this.props.excludedDates.join(", ") + "."
                : "Hidden days: none."}
            </div>
          </div>
        </body>
      </html>
    );
  }
}
