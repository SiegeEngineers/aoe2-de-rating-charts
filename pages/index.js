import React, { Component } from "react";
import Select from "../components/select.js";
import TeamTable from "../components/team-table.js";

import Data from "../helpers/data.js";
import AnnotationSeparator from "../helpers/annotation-separator.js";
import styles from "./index.module.css";

const got = require("got");
const fs = require("fs");

// Set this to true for development. You won't get all the data, but it will build MUCH faster after the API calls are cached.
const DEFAULT_COLOR = "#0eac22"; // green
const TEAM_ONE_COLOR = "#6311a5"; // purple
const TEAM_TWO_COLOR = "#fe9918"; // orange

// Common chart variables
const AXIS_FONT_SIZE = 14;
const AXIS_FONT_COLOR = "#7f7f7f";
const TITLE_FONT_SIZE = 18;
const FONT = "Roboto, Arial, sans-serif";
const MIN_ANNOTATION_DISTANCE_FROM_VALUE = 100;

/*
TODO:
3) What if multiple players on different teams map to the same bucket?
4) Variable names...
7) "Trace 2" on hover
13) Select box turns blue when selected instead of team color
14) Color chips in select box
15) There are a different number of buckets in each histogram
*/

export default class extends Component {
  state = {
    data: null,
    teamOne: [],
    teamTwo: []
  };

  componentDidMount() {
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
        color: DEFAULT_COLOR
      }
    };
    var layout = {
      title: {
        text: "1v1 Random Map",
        font: {
          family: FONT,
          size: TITLE_FONT_SIZE
        },
        xanchor: "center",
        yanchor: "bottom"
      },
      margin: {
        l: 50,
        r: 15,
        t: 50,
        b: 30
      },
      xaxis: {
        title: {
          text: "Rating",
          font: {
            family: FONT,
            size: AXIS_FONT_SIZE,
            color: AXIS_FONT_COLOR
          }
        },
        range: [xmin, xmax]
      },
      yaxis: {
        title: {
          text: "Number of Players",
          font: {
            family: FONT,
            size: AXIS_FONT_SIZE,
            color: AXIS_FONT_COLOR
          }
        }
      },
      marker: { color: DEFAULT_COLOR }
    };
    var data = [trace];
    let randomMapPlot = Plotly.newPlot("random_map_histogram", data, layout, {
      scrollZoom: false,
      responsive: true
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
        color: DEFAULT_COLOR
      }
    };
    var layout = {
      title: {
        text: "Team Random Map",
        font: {
          family: FONT,
          size: TITLE_FONT_SIZE
        },
        xanchor: "center",
        yanchor: "bottom"
      },
      margin: {
        l: 50,
        r: 15,
        t: 50,
        b: 30
      },
      xaxis: {
        title: {
          text: "Rating",
          font: {
            family: FONT,
            size: AXIS_FONT_SIZE,
            color: AXIS_FONT_COLOR
          }
        },
        range: [xmin, xmax]
      },
      yaxis: {
        title: {
          text: "Number of Players",
          font: {
            family: FONT,
            size: AXIS_FONT_SIZE,
            color: AXIS_FONT_COLOR
          }
        }
      }
    };
    var data = [trace];
    let teamRandomMapPlot = Plotly.newPlot(
      "team_random_map_histogram",
      data,
      layout,
      { scrollZoom: false, responsive: true }
    );

    // Combo Scatterplot
    var trace1 = {
      x: dataSet.getAllSoloRatings(),
      y: dataSet.getAllTeamRatings(),
      mode: "markers",
      type: "scattergl",
      textposition: "top center",
      textfont: {
        family: FONT
      },
      marker: { size: 2, color: DEFAULT_COLOR }
    };

    var data = [trace1];

    var layout = {
      showlegend: false,
      title: {
        text: "1v1 Random Map vs<br>Team Random Map",
        font: {
          family: FONT,
          size: TITLE_FONT_SIZE
        },
        xanchor: "center",
        yanchor: "bottom"
      },
      margin: {
        l: 50,
        r: 15,
        t: 50,
        b: 30
      },
      xaxis: {
        title: {
          text: "1v1 Random Map Rating",
          font: {
            family: FONT,
            size: AXIS_FONT_SIZE,
            color: AXIS_FONT_COLOR
          }
        },
        range: [xmin, xmax]
      },
      yaxis: {
        title: {
          text: "Team Random Map Rating",
          font: {
            family: FONT,
            size: AXIS_FONT_SIZE,
            color: AXIS_FONT_COLOR
          }
        }
      }
    };

    let scatterPlot = Plotly.newPlot("combo_scatterplot", data, layout, {
      scrollZoom: false,
      responsive: true
    });

    let lastUpdatedDiv = document.getElementById("last_updated");
    lastUpdatedDiv.innerHTML = `Last updated on <i>${new Date(timestamp)}</i>`;

    // Remove the loading div
    Promise.all([randomMapPlot, teamRandomMapPlot, scatterPlot]).then(
      function(values) {
        let loadingDiv = document.getElementById("loading");
        loadingDiv.style.display = "none";

        this.randomMapDiv = values[0];
        this.teamRandomMapDiv = values[1];
        this.scatterplotDiv = values[2];

        let queryString = window.location.search;
        let parsed = parseQueryString(queryString);
        this.setState({
          data: dataSet,
          teamOne: parsed.team_one ? parsed.team_one.split("-") : [],
          teamTwo: parsed.team_two ? parsed.team_two.split("-") : []
        });
      }.bind(this)
    );
  }

  componentDidUpdate() {
    // Don't update the graphs if they were never ready to beign with
    if (!this.randomMapDiv || !this.teamRandomMapDiv || !this.scatterplotDiv) {
      return;
    }

    let teamOneSelection = this.state.teamOne
      ? this.state.teamOne.filter(steamId => this.state.data.exists(steamId))
      : [];
    let teamTwoSelection = this.state.teamTwo
      ? this.state.teamTwo.filter(steamId => this.state.data.exists(steamId))
      : [];

    // Update 1v1 random map
    let soloRandomMapColorInfo = [];
    for (let i = 0; i < teamOneSelection.length; i++) {
      soloRandomMapColorInfo.push({
        color: TEAM_ONE_COLOR,
        value: this.state.data.getSoloRating(teamOneSelection[i]),
        name: this.state.data.getName(teamOneSelection[i])
      });
    }
    for (let i = 0; i < teamTwoSelection.length; i++) {
      soloRandomMapColorInfo.push({
        color: TEAM_TWO_COLOR,
        value: this.state.data.getSoloRating(teamTwoSelection[i]),
        name: this.state.data.getName(teamTwoSelection[i])
      });
    }
    highlightHistogramMarker(this.randomMapDiv, soloRandomMapColorInfo);

    // Update team random map
    let teamRandomMapColorInfo = [];
    for (let i = 0; i < teamOneSelection.length; i++) {
      teamRandomMapColorInfo.push({
        color: TEAM_ONE_COLOR,
        value: this.state.data.getTeamRating(teamOneSelection[i]),
        name: this.state.data.getName(teamOneSelection[i])
      });
    }
    for (let i = 0; i < teamTwoSelection.length; i++) {
      teamRandomMapColorInfo.push({
        color: TEAM_TWO_COLOR,
        value: this.state.data.getTeamRating(teamTwoSelection[i]),
        name: this.state.data.getName(teamTwoSelection[i])
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
        name: this.state.data.getName(teamOneSelection[i])
      });
    }
    for (let i = 0; i < teamTwoSelection.length; i++) {
      scatterPlotColorInfo.push({
        color: TEAM_TWO_COLOR,
        valueX: this.state.data.getSoloRating(teamTwoSelection[i]),
        valueY: this.state.data.getTeamRating(teamTwoSelection[i]),
        name: this.state.data.getName(teamTwoSelection[i])
      });
    }
    highlightScatterplotMarker(this.scatterplotDiv, scatterPlotColorInfo);
  }

  render() {
    let table = null;
    if (this.state.teamOne.length !== 0 || this.state.teamTwo.length !== 0) {
      table = (
        <div>
          <div>
            <table
              class="tg"
              style={{
                fontSize: "12px",
                width: "100%",
                tableLayout: "fixed",
                overflow: "hidden",
                textAlign: "center",
                borderCollapse: "collapse"
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
            content="Histograms and a scatterplot for 'Age of Empires II: Definitive Edition' 1v1 Random Map and Team Random Map."
          />
          <script
            type="text/javascript"
            src="https://cdn.plot.ly/plotly-latest.min.js"
          ></script>
        </head>
        <body style={{ fontFamily: FONT }}>
          <div class={styles.center}>
            <div
              id="loading"
              style={{
                backgroundColor: "black",
                display: "flex",
                zIndex: 1,
                padding: "10px",
                borderRadius: "25px"
              }}
            >
              <img
                src="/puff.svg"
                alt="Loading..."
                style={{
                  backgroundColor: "black",
                  width: "100px",
                  height: "100px",
                  padding: "10px"
                }}
              ></img>
              <div
                style={{ padding: "33px", color: "white", fontSize: "30pt" }} // FIX ME to PX
              >
                Loading...
              </div>
            </div>
            <div>
              <h2>Age of Empires II: Definitive Edition Rating Charts</h2>
            </div>
            <div id="selectors">
              <div>
                <label htmlFor="teamOne">Team 1:</label>
                <div
                  style={{
                    border: TEAM_ONE_COLOR,
                    borderStyle: "solid",
                    borderRadius: "7px"
                  }}
                >
                  <Select
                    id="teamOne"
                    dataSet={this.state.data}
                    blacklist={this.state.teamTwo}
                    value={this.state.teamOne}
                    onSelection={function(selection) {
                      // This setTimeout seems to help responsiveness
                      setTimeout(
                        function() {
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
                    borderRadius: "7px"
                  }}
                >
                  <Select
                    id="teamTwo"
                    dataSet={this.state.data}
                    blacklist={this.state.teamOne}
                    value={this.state.teamTwo}
                    onSelection={function(selection) {
                      // This setTimeout seems to help responsiveness
                      setTimeout(
                        function() {
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
            <hr class={styles.divider}></hr>
            <div id="table">{table}</div>
            <hr class={styles.divider}></hr>
            <div id="random_map_histogram"></div>
            <div id="team_random_map_histogram"></div>
            <div id="combo_scatterplot"></div>
            <div id="footer" style={{ fontSize: "12px" }}>
              * Combo rating = Sqrt(RandomMapRating^2 + TeamRandomMapRating^2)
              <div id="last_updated"></div>
              View source code on{" "}
              <a href="https://github.com/thbrown/aoe2-de-elo-histogram">
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

const CACHE_DIRECTORY = "cache/";
const CACHE_FILE_NAME = "ApiCache.json";
const CACHE_EXPIRATION_IN_HOURS = 9999999; // Change this to 0 to bypass cache
const API_CALL_CHUNK_SIZE = 1000;
const API_CALL_DELAY_IN_MS = 2000;

/**
 * This function only gets called when the page is built. It does not become a part of the web page. The return value of this function is
 * sent to the React component above as props.
 */
export async function getStaticProps(context) {
  try {
    let updatedTime = 0;

    // Get the data
    let randomMapLeaderboardResult = await getLeaderboardData(3);
    let teamRandomMapLeaderboardResult = await getLeaderboardData(4);

    let randomMapLeaderboard = randomMapLeaderboardResult.leaderboard;
    let teamRandomMapLeaderbaord = teamRandomMapLeaderboardResult.leaderboard;
    updatedTime = Math.min(
      randomMapLeaderboardResult.updatedTime,
      teamRandomMapLeaderboardResult.updatedTime
    );

    // Format the data
    let aoeData = {}; // {"steamId: [name, randomMapRating, teamRandomMapRating]"}
    let xmax = 0;
    let xmin = Number.MAX_VALUE;
    for (let i = 0; i < randomMapLeaderboard.length; i++) {
      let name = randomMapLeaderboard[i].name;
      let steamId = randomMapLeaderboard[i].steam_id;
      let soloRating = randomMapLeaderboard[i].rating;
      aoeData[steamId] = [name, soloRating, null];

      // Update min and max
      if (soloRating < xmin) {
        xmin = soloRating;
      }
      if (soloRating > xmax) {
        xmax = soloRating;
      }
    }

    console.log(
      "Number of ranked random map players",
      randomMapLeaderboard.length
    );

    for (let i = 0; i < teamRandomMapLeaderbaord.length; i++) {
      let name = teamRandomMapLeaderbaord[i].name;
      let steamId = teamRandomMapLeaderbaord[i].steam_id;
      let teamRating = teamRandomMapLeaderbaord[i].rating;
      if (aoeData[steamId] == undefined) {
        aoeData[steamId] = [name, null, teamRating];
      } else {
        aoeData[steamId][2] = teamRating;
      }
      // Update min and max
      if (teamRating < xmin) {
        xmin = teamRating;
      }
      if (teamRating > xmax) {
        xmax = teamRating;
      }
    }

    console.log(
      "Number of ranked team random map players",
      teamRandomMapLeaderbaord.length
    );

    let allData = [];
    for (const property in aoeData) {
      allData.push([property].concat(aoeData[property]));
    }

    console.log("Total number of ranked players", allData.length);
    console.log("Doing nextjs stuff...");

    // the return value will be passed to the page component as props
    return {
      props: {
        // Nextjs is inexplicably slow if 'allData' is passed as an array so we'll serialize it ourselves
        data: JSON.stringify(allData),
        timestamp: updatedTime,
        xmin: xmin,
        xmax: xmax
      }
    };
  } catch (error) {
    console.log("ERROR" + error);
    console.log(error);
    return {
      props: {}
    };
  }
}

//  Unranked=0, 1v1 Deathmatch=1, Team Deathmatch=2, 1v1 Random Map=3, Team Random Map=4
async function getLeaderboardData(leaderboardId) {
  let updatedTime = 0;
  let leaderboard = [];
  const CACHE_FILE_PATH = CACHE_DIRECTORY + leaderboardId + CACHE_FILE_NAME;
  // Get the data -- If this API call has been cached in the last CACHE_EXPIRATION_IN_HOURS hours use the cached file
  console.log(
    "Looking for cache file (" + CACHE_FILE_PATH + ") modified within the last",
    CACHE_EXPIRATION_IN_HOURS,
    "hours..."
  );
  if (
    fs.existsSync(CACHE_FILE_PATH) &&
    Date.now() - fs.statSync(CACHE_FILE_PATH).mtimeMs <
      CACHE_EXPIRATION_IN_HOURS * 60 * 60 * 1000
  ) {
    console.log(
      `Using cache file to avoid API calls to aoe2.net for leaderboard ${leaderboardId}...`
    );
    leaderboard = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, "utf8"));
    updatedTime = fs.statSync(CACHE_FILE_PATH).mtimeMs;
  } else {
    console.log(
      `Fetching data from aoe2.net for leaderboard ${leaderboardId}...`
    );
    let firstResponse = await got(
      `https://aoe2.net/api/leaderboard?game=aoe2de&leaderboard_id=${leaderboardId}&start=1&count=1`
    ).json();
    let numberOfRankedPlayers = firstResponse.total;

    let numberOfRequests = Math.ceil(
      numberOfRankedPlayers / API_CALL_CHUNK_SIZE
    );

    console.log(
      "It will require",
      numberOfRequests,
      "API requests to retrieve",
      numberOfRankedPlayers,
      "players"
    );

    // The max number of leaderboard entries we can request is 1000, so we'll do it in chunks
    for (let i = 0; i < numberOfRequests; i++) {
      let startIndex = i * API_CALL_CHUNK_SIZE;
      console.log(
        "Requesting",
        startIndex,
        "to",
        startIndex + API_CALL_CHUNK_SIZE
      );

      let dataResponse = await got(
        `https://aoe2.net/api/leaderboard?game=aoe2de&leaderboard_id=${leaderboardId}&start=${startIndex}&count=${API_CALL_CHUNK_SIZE}`
      ).json();
      leaderboard = leaderboard.concat(dataResponse.leaderboard);

      // Wait a litte bit between each api call. There are currently no API limits but still want to respect the server.
      console.log("WAITING...");
      await new Promise(r => setTimeout(r, API_CALL_DELAY_IN_MS));
    }

    console.log("Total rows fetched", leaderboard.length);

    // Write the result to the file system cache so we don't have to make the api call each time we build
    if (!fs.existsSync(CACHE_DIRECTORY)) {
      fs.mkdirSync(CACHE_DIRECTORY);
    }
    fs.writeFile(CACHE_FILE_PATH, JSON.stringify(leaderboard), function(err) {
      if (err) {
        console.log("Error writing API cache file");
        console.log(err);
        return;
      }
      console.log("API responses were cached");
    });
    updatedTime = Math.floor(new Date());
  }
  return {
    updatedTime: updatedTime,
    leaderboard: leaderboard
  };
}

// Accepts values in the form {color: "rgb(31, 119, 180)", value: 1066, name:"GusTTShowbiz"}
function highlightHistogramMarker(chartElement, values) {
  let numberOfBuckets = chartElement.calcdata[0].length;

  // Filter out any values that are undefined
  values = values.filter(value => value.value);

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
  values.sort(function(a, b) {
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
      "marker.color": colorscale[0][1]
    };
  } else {
    // Update the color of specific markers on the 0th trace
    styleUpdate = {
      "marker.color": [bucketColors],
      "marker.colorscale": [colorscale],
      "marker.cmax": maxValueInBucketColors,
      "marker.cmin": 0
    };
  }

  Plotly.restyle(chartElement, styleUpdate, 0);

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
        ay: chartElement.calcdata[0][values[i].bucketIndex].s + rangeX / 15,
        axref: "x",
        ayref: "y",
        bgcolor: "rgba(255, 255, 255, 0.9)",
        arrowcolor: "rgba(0, 0, 0, 0.9)",
        font: { size: 12 },
        bordercolor: values[i].color,
        borderwidth: 1,
        arrowsize: 1,
        arrowwidth: 1
      };
      annotations.push(entry);
    }
  }

  let seperator = new AnnotationSeparator(
    annotations,
    chartElement.layout.xaxis.range[0],
    chartElement.layout.xaxis.range[1],
    chartElement.layout.yaxis.range[0],
    chartElement.layout.yaxis.range[1],
    rangeX / 5,
    rangeY / 15
  );
  let layoutUpdate = {
    annotations: seperator.getSeparatedAnnotations()
  };
  Plotly.relayout(chartElement, layoutUpdate);
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
        y: [values[i].valueY]
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
      marker: { size: 8, color: prop }
    };
    newTraces.push(trace);
  }
  Plotly.addTraces(chartElement, newTraces);

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
        ay: values[i].valueY + rangeY / 15,
        axref: "x",
        ayref: "y",
        bgcolor: "rgba(255, 255, 255, 0.9)",
        arrowcolor: "rgba(0, 0, 0, 0.9)",
        font: { size: 12 },
        bordercolor: values[i].color,
        borderwidth: 1,
        arrowsize: 1,
        arrowwidth: 1
      };
      annotations.push(entry);
    }
  }
  let seperator = new AnnotationSeparator(
    annotations,
    chartElement.layout.xaxis.range[0],
    chartElement.layout.xaxis.range[1],
    chartElement.layout.yaxis.range[0],
    chartElement.layout.yaxis.range[1],
    rangeX / 5,
    rangeY / 15
  );
  let update = {
    annotations: seperator.getSeparatedAnnotations()
  };
  Plotly.relayout(chartElement, update);
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
