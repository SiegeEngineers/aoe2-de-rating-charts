import React, { Component } from "react";
import Select from "./select.js";
import TeamTable from "./team-table.js";

import Data from "../helpers/data.js";
import AnnotationSeparator from "../helpers/annotation-separator.js";
import styles from "./page.module.css";

const DEFAULT_COLOR = "#0eac22"; // green
const TEAM_ONE_COLOR = "#6311a5"; // purple
const TEAM_TWO_COLOR = "#fe9918"; // orange

// Common chart variables
const AXIS_FONT_SIZE = 14;
const AXIS_FONT_COLOR = "#7f7f7f";
const TITLE_FONT_SIZE = 18;
const FONT = "Roboto, Arial, sans-serif";
const MARGINS = {
  l: 50,
  r: 15,
  t: 50,
  b: 40,
};

/*
TODO:
3) What if multiple players on different teams map to the same bucket?
4) Variable names...
13) Select box turns blue when selected instead of team color
14) Color chips in select box
16) Remove 'random map' ids from this component now that id displays deathmatch as well
*/

export default class extends Component {
  state = {
    data: null,
    teamOne: [],
    teamTwo: [],
  };

  componentDidMount() {
    let startTime = new Date();
    let dataSet = new Data(this.props.data);
    let histogramArray = []; // JSON.parse(this.props.histogram);
    let timestamp = this.props.timestamp ? this.props.timestamp : 0;
    let xmin = this.props.xmin; // TODO: remove the 'x' there are just absolute max and min values
    let xmax = this.props.xmax;

    // Random Map Histogram

    var trace = {
      x: dataSet.getAllSoloRatings(),
      type: "histogram",
      marker: {
        color: DEFAULT_COLOR,
      },
      hovertemplate:
        "# of Players: %{y}<br>Rating Range: %{x}<br>Percentile: %{text}<extra></extra>",
      selected: {
        marker: {
          color: "red",
        },
      },
      hovermode: "x unified",
      hoveron: "points+fills",
    };
    var layout = {
      title: {
        text: this.props.chartOneLabel,
        font: {
          family: FONT,
          size: TITLE_FONT_SIZE,
        },
        xanchor: "center",
        yanchor: "bottom",
      },
      margin: MARGINS,
      xaxis: {
        title: {
          text: "Rating",
          font: {
            family: FONT,
            size: AXIS_FONT_SIZE,
            color: AXIS_FONT_COLOR,
          },
        },
        range: [xmin, xmax],
        fixedrange: true,
      },
      yaxis: {
        title: {
          text: "Number of Players",
          font: {
            family: FONT,
            size: AXIS_FONT_SIZE,
            color: AXIS_FONT_COLOR,
          },
        },
        fixedrange: true,
      },
      marker: { color: DEFAULT_COLOR },
      hovermode: "false",
    };
    var data = [trace];
    let randomMapPlot = Plotly.newPlot("random_map_histogram", data, layout, {
      scrollZoom: false,
      responsive: true,
      showLink: true,
      plotlyServerURL: "https://chart-studio.plotly.com",
    });

    // Team Random Map Histogram
    var teamRandomMapScores = [];
    for (var i = 0; i < histogramArray.length; i++) {
      teamRandomMapScores[i] = histogramArray[i][2];
    }
    var trace = {
      x: dataSet.getAllTeamRatings(),
      type: "histogram",
      marker: {
        color: DEFAULT_COLOR,
      },
      hovertemplate:
        "# of Players: %{y}<br>Rating Range: %{x}<br>Percentile: %{text}<extra></extra>",
    };
    var layout = {
      title: {
        text: this.props.chartTwoLabel,
        font: {
          family: FONT,
          size: TITLE_FONT_SIZE,
        },
        xanchor: "center",
        yanchor: "bottom",
      },
      margin: MARGINS,
      xaxis: {
        title: {
          text: "Rating",
          font: {
            family: FONT,
            size: AXIS_FONT_SIZE,
            color: AXIS_FONT_COLOR,
          },
        },
        range: [xmin, xmax],
        fixedrange: true,
      },
      yaxis: {
        title: {
          text: "Number of Players",
          font: {
            family: FONT,
            size: AXIS_FONT_SIZE,
            color: AXIS_FONT_COLOR,
          },
        },
        fixedrange: true,
      },
    };
    var data = [trace];
    let teamRandomMapPlot = Plotly.newPlot(
      "team_random_map_histogram",
      data,
      layout,
      {
        scrollZoom: false,
        responsive: true,
        showLink: true,
        plotlyServerURL: "https://chart-studio.plotly.com",
      }
    );

    // Combo Scatterplot
    var trace1 = {
      x: dataSet.getAllSoloRatings(),
      y: dataSet.getAllTeamRatings(),
      text: dataSet.getAllNames(),
      mode: "markers",
      type: "scattergl",
      textposition: "top center",
      textfont: {
        family: FONT,
      },
      marker: { size: 2, color: DEFAULT_COLOR },
      hovertemplate: "Name: %{text}<br>Team: %{y}<br>1v1: %{x}<extra></extra>",
    };

    var data = [trace1];

    var layout = {
      hovermode: "closest",
      showlegend: false,
      title: {
        text: this.props.chartOneLabel + " vs<br>" + this.props.chartTwoLabel,
        font: {
          family: FONT,
          size: TITLE_FONT_SIZE,
        },
        xanchor: "center",
        yanchor: "bottom",
      },
      margin: MARGINS,
      xaxis: {
        title: {
          text: "1v1 Rating",
          font: {
            family: FONT,
            size: AXIS_FONT_SIZE,
            color: AXIS_FONT_COLOR,
          },
        },
        range: [xmin, xmax],
        fixedrange: true,
      },
      yaxis: {
        title: {
          text: "Team Rating",
          font: {
            family: FONT,
            size: AXIS_FONT_SIZE,
            color: AXIS_FONT_COLOR,
          },
        },
        fixedrange: true,
      },
    };

    let scatterPlot = Plotly.newPlot("combo_scatterplot", data, layout, {
      scrollZoom: false,
      responsive: true,
      showLink: true,
      plotlyServerURL: "https://chart-studio.plotly.com",
    });

    let lastUpdatedDiv = document.getElementById("last_updated");
    let date = new Date(timestamp);
    try {
      lastUpdatedDiv.innerHTML = `† Last updated on <i>${date.toLocaleString(
        "default",
        { timeZoneName: "short" }
      )}</i>`;
    } catch (e) {
      return e instanceof RangeError;
    }

    // Remove the loading div
    Promise.all([randomMapPlot, teamRandomMapPlot, scatterPlot]).then(
      function (values) {
        let contentDiv = document.getElementById("loading-hider");
        contentDiv.classList.remove("hidden");

        let loadingDiv = document.getElementById("loading");
        loadingDiv.classList.add("none");

        this.randomMapDiv = values[0];
        this.teamRandomMapDiv = values[1];
        this.scatterplotDiv = values[2];

        // Adding these event make it possible to scroll the page whenever touching a plotly chart.
        // Without them there appears to be some plotly events that prevent the scroll action.
        this.randomMapDiv.addEventListener(
          "touchstart",
          function (event) {
            event.stopPropagation();
          },
          true
        );

        this.teamRandomMapDiv.addEventListener(
          "touchstart",
          function (event) {
            event.stopPropagation();
          },
          true
        );

        this.scatterplotDiv.addEventListener(
          "touchstart",
          function (event) {
            event.stopPropagation();
          },
          true
        );

        // Now that the plots have been rendered, we know the characteristics of the bins (count, range, ratings) so we can add the text lables
        addTextAttributeToTrace(this.randomMapDiv, dataSet, "solo");
        addTextAttributeToTrace(this.teamRandomMapDiv, dataSet, "team");

        let queryString = window.location.search;
        let parsed = parseQueryString(queryString);
        this.setState({
          data: dataSet,
          teamOne: parsed.team_one ? parsed.team_one.split("-") : [],
          teamTwo: parsed.team_two ? parsed.team_two.split("-") : [],
        });

        // Record elapsed time
        gtag("event", "timing_complete", {
          name: "Load " + this.props.title,
          value: new Date() - startTime,
          event_category: "JS Dependencies",
        });
      }.bind(this)
    );
  }

  componentDidUpdate() {
    // TODO: Move a bunch of this to a web workers?
    // Don't update the graphs if they were never ready to beign with
    if (!this.randomMapDiv || !this.teamRandomMapDiv || !this.scatterplotDiv) {
      return;
    }

    let teamOneSelection = this.state.teamOne
      ? this.state.teamOne.filter((profileId) =>
          this.state.data.exists(profileId)
        )
      : [];
    let teamTwoSelection = this.state.teamTwo
      ? this.state.teamTwo.filter((profileId) =>
          this.state.data.exists(profileId)
        )
      : [];

    // Update 1v1 random map
    let soloRandomMapColorInfo = [];
    for (let i = 0; i < teamOneSelection.length; i++) {
      soloRandomMapColorInfo.push({
        color: TEAM_ONE_COLOR,
        value: this.state.data.getSoloRating(teamOneSelection[i]),
        name: this.state.data.getName(teamOneSelection[i]),
      });
    }
    for (let i = 0; i < teamTwoSelection.length; i++) {
      soloRandomMapColorInfo.push({
        color: TEAM_TWO_COLOR,
        value: this.state.data.getSoloRating(teamTwoSelection[i]),
        name: this.state.data.getName(teamTwoSelection[i]),
      });
    }
    highlightHistogramMarker(this.randomMapDiv, soloRandomMapColorInfo);

    // Update team random map
    let teamRandomMapColorInfo = [];
    for (let i = 0; i < teamOneSelection.length; i++) {
      teamRandomMapColorInfo.push({
        color: TEAM_ONE_COLOR,
        value: this.state.data.getTeamRating(teamOneSelection[i]),
        name: this.state.data.getName(teamOneSelection[i]),
      });
    }
    for (let i = 0; i < teamTwoSelection.length; i++) {
      teamRandomMapColorInfo.push({
        color: TEAM_TWO_COLOR,
        value: this.state.data.getTeamRating(teamTwoSelection[i]),
        name: this.state.data.getName(teamTwoSelection[i]),
      });
    }
    highlightHistogramMarker(this.teamRandomMapDiv, teamRandomMapColorInfo);

    // Update scatterplot
    let scatterPlotColorInfo = [];
    for (let i = 0; i < teamOneSelection.length; i++) {
      scatterPlotColorInfo.push({
        color: TEAM_ONE_COLOR,
        valueX: this.state.data.getSoloRating(teamOneSelection[i]),
        valueY: this.state.data.getTeamRating(teamOneSelection[i]),
        name: this.state.data.getName(teamOneSelection[i]),
      });
    }
    for (let i = 0; i < teamTwoSelection.length; i++) {
      scatterPlotColorInfo.push({
        color: TEAM_TWO_COLOR,
        valueX: this.state.data.getSoloRating(teamTwoSelection[i]),
        valueY: this.state.data.getTeamRating(teamTwoSelection[i]),
        name: this.state.data.getName(teamTwoSelection[i]),
      });
    }
    highlightScatterplotMarker(this.scatterplotDiv, scatterPlotColorInfo);

    // Record pageview
    gtag("event", "select_content", {
      event_label: window.location.pathname + window.location.search,
    });
  }

  render() {
    let table = null;
    if (this.state.teamOne.length !== 0 || this.state.teamTwo.length !== 0) {
      table = (
        <div>
          <div>
            <table
              className="tg"
              style={{
                fontSize: "12px",
                width: "100%",
                tableLayout: "fixed",
                overflow: "hidden",
                textAlign: "center",
                borderCollapse: "collapse",
              }}
            >
              <tr>
                <th rowSpan="2" width="28%"></th>
                <th colSpan="2" width="24%">
                  1v1
                </th>
                <th colSpan="2" width="24%">
                  Team
                </th>
                <th colSpan="2" width="24%">
                  Combo*
                </th>
              </tr>
              <tr>
                <td width="12%">Rating</td>
                <td width="12%">%</td>
                <td width="12%">Rating</td>
                <td width="12%">%</td>
                <td width="12%">Rating</td>
                <td width="12%">%</td>
              </tr>
            </table>
          </div>
          <TeamTable
            teamLabel="Team 1"
            data={this.state.data}
            players={this.state.teamOne}
            color={TEAM_ONE_COLOR}
          ></TeamTable>
          <TeamTable
            teamLabel="Team 2"
            data={this.state.data}
            players={this.state.teamTwo}
            color={TEAM_TWO_COLOR}
          ></TeamTable>
        </div>
      );
    }

    return (
      <html>
        <head>
          <title>Age of Empires II: Definitive Edition Rating Charts</title>
          <meta
            name="description"
            content="Histograms and a scatterplot for 'Age of Empires II: Definitive Edition' 1v1 Random Map and Team Random Map ratings elo. Updated daily."
          />
          <meta property="og:image" content="https://i.imgur.com/cVLgt68.png" />
          <script
            type="text/javascript"
            src="https://cdn.plot.ly/plotly-latest.min.js"
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
                  <a href={this.props.chartAltLink}>
                    {this.props.chartAltLinkText}
                  </a>
                  <br />
                  Updated daily†
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
              <div id="selectors">
                <div>
                  <label htmlFor="teamOne">Team 1:</label>
                  <div
                    style={{
                      border: TEAM_ONE_COLOR,
                      borderStyle: "solid",
                      borderRadius: "7px",
                    }}
                  >
                    <Select
                      id="teamOne"
                      dataSet={this.state.data}
                      blacklist={this.state.teamTwo}
                      value={this.state.teamOne}
                      onSelection={function (selection) {
                        // This setTimeout seems to help responsiveness
                        setTimeout(
                          function () {
                            this.setState({ teamOne: selection });
                          }.bind(this),
                          1
                        );
                        if (history) {
                          history.pushState(
                            null,
                            "",
                            "?team_one=" +
                              selection.join("-") +
                              "&team_two=" +
                              this.state.teamTwo.join("-")
                          );
                        }
                      }.bind(this)}
                    ></Select>
                  </div>
                </div>
                <div style={{ marginTop: "16px" }}>
                  <label htmlFor="teamTwo">Team 2:</label>
                  <div
                    style={{
                      border: TEAM_TWO_COLOR,
                      borderStyle: "solid",
                      borderRadius: "7px",
                    }}
                  >
                    <Select
                      id="teamTwo"
                      dataSet={this.state.data}
                      blacklist={this.state.teamOne}
                      value={this.state.teamTwo}
                      onSelection={function (selection) {
                        // This setTimeout seems to help responsiveness
                        setTimeout(
                          function () {
                            this.setState({ teamTwo: selection });
                          }.bind(this),
                          1
                        );
                        if (history) {
                          history.pushState(
                            null,
                            "",
                            "?team_one=" +
                              this.state.teamOne.join("-") +
                              "&team_two=" +
                              selection.join("-")
                          );
                        }
                      }.bind(this)}
                    ></Select>
                  </div>
                </div>
              </div>

              <hr className={styles.divider}></hr>
              <div id="table">{table}</div>
              <hr className={styles.divider}></hr>
              <div id="random_map_histogram"></div>
              <div id="team_random_map_histogram"></div>
              <div id="combo_scatterplot"></div>
            </div>
            <div id="footer" style={{ fontSize: "12px", margin: "10px" }}>
              <div id="last_updated"></div>* Combo rating =
              Sqrt(RandomMapRating^2 + TeamRandomMapRating^2)
              <br></br>
              Players will only appear if they have played at least 10 ranked
              games and at least one ranked game in the last 28 days
              <br></br>
              View source code on{" "}
              <a href="https://github.com/SiegeEngineers/aoe2-de-rating-charts">
                github
              </a>
              <br></br>
              Data from{" "}
              <a href="https://aoe2.net/#api">https://aoe2.net/#api</a>
            </div>
          </div>
        </body>
      </html>
    );
  }
}

// Accepts values in the form {color: "rgb(31, 119, 180)", value: 1066, name:"GusTTShowbiz"}
function highlightHistogramMarker(chartElement, values) {
  let numberOfBuckets = chartElement.calcdata[0].length;

  // Filter out any values that are undefined
  values = values.filter((value) => value.value);

  // Get the unique colors, assign each color a number begining with 0 and counting by ones
  let counter = 1;
  let colors = {};
  for (let i = 0; i < values.length; i++) {
    let colorString = values[i].color;
    if (colors[colorString] === undefined) {
      colors[colorString] = counter;
      counter++;
    }
  }

  // Make sure the values are ordered
  values.sort(function (a, b) {
    return a.value - b.value;
  });

  // Find the buckets our values fit in
  let valueIndex = 0;
  let bucketColors = new Array(numberOfBuckets).fill(0); // All buckets start with the default color
  for (let i = 0; i < numberOfBuckets; i++) {
    // Check if any of our values are in this bucket
    while (
      valueIndex < values.length &&
      values[valueIndex].value >= chartElement.calcdata[0][i].ph0 &&
      values[valueIndex].value <= chartElement.calcdata[0][i].ph1
    ) {
      bucketColors[i] = colors[values[valueIndex].color];
      values[valueIndex].bucketIndex = i;
      valueIndex++;
    }

    // Check if we've bucketed every value
    if (valueIndex >= values.length) {
      break;
    }
  }

  // Format colorscale data
  const maxValueInBucketColors = Object.keys(colors).length;
  let colorscale = [[0, DEFAULT_COLOR]];
  for (const prop in colors) {
    let localArray = [colors[prop] / maxValueInBucketColors, prop];
    colorscale.push(localArray);
  }

  let styleUpdate = {};
  if (colorscale.length == 1) {
    // If there is just one color for all the markers, just set the color directly. Using a size one array here doesn't work.
    styleUpdate = {
      "marker.color": colorscale[0][1],
    };
  } else {
    // Update the color of specific markers on the 0th trace
    styleUpdate = {
      "marker.color": [bucketColors],
      "marker.colorscale": [colorscale],
      "marker.cmax": maxValueInBucketColors,
      "marker.cmin": 0,
    };
  }

  // Add the annotations!
  let rangeX =
    chartElement.layout.xaxis.range[1] - chartElement.layout.xaxis.range[0];
  let rangeY =
    chartElement.layout.yaxis.range[1] - chartElement.layout.yaxis.range[0];
  let annotations = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i].value) {
      let entry = {
        text: values[i].name,
        x: values[i].value,
        y: chartElement.calcdata[0][values[i].bucketIndex].s,
        ax: values[i].value,
        ay: chartElement.calcdata[0][values[i].bucketIndex].s + rangeX / 10, // We'd prefer the annotations above the data point
        axref: "x",
        ayref: "y",
        bgcolor: "rgba(255, 255, 255, 0.9)",
        arrowcolor: "rgba(0, 0, 0, 0.9)",
        font: { size: 12 },
        bordercolor: values[i].color,
        borderwidth: 1,
        arrowsize: 1,
        arrowwidth: 1,
      };
      annotations.push(entry);
    }
  }

  let seperator = new AnnotationSeparator(
    annotations,
    chartElement.layout.xaxis.range[0],
    chartElement.layout.xaxis.range[1],
    chartElement.layout.yaxis.range[0],
    chartElement.layout.yaxis.range[1]
  );
  let layoutUpdate = {
    annotations: seperator.getSeparatedAnnotations(),
  };

  // Update the plot with the highlights and annotations
  Object.assign(chartElement.layout, layoutUpdate);
  Plotly.restyle(chartElement, styleUpdate);
}

// Accepts values in the form {color: "rgb(31, 119, 180)", valueX: 1066, valueY: 1442, name:"PizzaBob"}
function highlightScatterplotMarker(chartElement, values) {
  // Determine the number of unique colors - one trace per color
  let counter = 0;
  let colors = {};
  for (let i = 0; i < values.length; i++) {
    if (colors[values[i].color] === undefined) {
      colors[values[i].color] = {
        counter: counter,
        x: [values[i].valueX],
        y: [values[i].valueY],
      };
      counter++;
    } else {
      colors[values[i].color].x.push(values[i].valueX);
      colors[values[i].color].y.push(values[i].valueY);
    }
  }

  // Remove any existing highlight traces if they exists
  while (chartElement.data.length >= 2) {
    Plotly.deleteTraces(chartElement, 1);
  }

  // Add a new traces with our highlighted points
  let newTraces = [];
  for (const prop in colors) {
    var trace = {
      x: colors[prop].x,
      y: colors[prop].y,
      mode: "markers",
      type: "scattergl",
      textposition: "top center",
      marker: { size: 8, color: prop },
      hoverinfo: "skip",
    };
    newTraces.push(trace);
  }

  // Add the annotations!
  let rangeX =
    chartElement.layout.xaxis.range[1] - chartElement.layout.xaxis.range[0];
  let rangeY =
    chartElement.layout.yaxis.range[1] - chartElement.layout.yaxis.range[0];
  let annotations = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i].valueX && values[i].valueY) {
      let entry = {
        text: values[i].name,
        x: values[i].valueX,
        y: values[i].valueY,
        ax: values[i].valueX,
        ay: values[i].valueY + rangeY / 10,
        axref: "x",
        ayref: "y",
        bgcolor: "rgba(255, 255, 255, 0.9)",
        arrowcolor: "rgba(0, 0, 0, 0.9)",
        font: { size: 12 },
        bordercolor: values[i].color,
        borderwidth: 1,
        arrowsize: 1,
        arrowwidth: 1,
      };
      annotations.push(entry);
    }
  }
  let seperator = new AnnotationSeparator(
    annotations,
    chartElement.layout.xaxis.range[0],
    chartElement.layout.xaxis.range[1],
    chartElement.layout.yaxis.range[0],
    chartElement.layout.yaxis.range[1]
  );
  let update = {
    annotations: seperator.getSeparatedAnnotations(),
  };

  // Refresh the plot to apply the changes
  Plotly.react(
    chartElement,
    chartElement.data.concat(newTraces),
    Object.assign(chartElement.layout, update),
    chartElement.config
  );
}

function addTextAttributeToTrace(chartElement, dataset, type) {
  let numberOfBuckets = chartElement.calcdata[0].length;
  let textArray = [];
  for (let i = 0; i < numberOfBuckets; i++) {
    let avg = chartElement.calcdata[0][i].p;
    if (type === "team") {
      textArray.push(
        dataset.formatPercentage(dataset.getPercentileForTeamRating(avg))
      );
    } else if (type === "solo") {
      textArray.push(
        dataset.formatPercentage(dataset.getPercentileForSoloRating(avg))
      );
    }
  }
  let textUpdate = {
    text: [textArray],
  };
  Plotly.update(chartElement, textUpdate);
}

function parseQueryString(queryString) {
  var query = {};
  var pairs = (queryString[0] === "?"
    ? queryString.substr(1)
    : queryString
  ).split("&");
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split("=");
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
  }
  return query;
}
