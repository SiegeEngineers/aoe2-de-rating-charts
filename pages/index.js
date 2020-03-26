import React, { Component } from "react";

const got = require("got");
const fs = require("fs");

export default class extends Component {
  state = {};

  componentDidMount() {
    let histogramArray = this.props.histogram;
    let timestamp = this.props.timestamp ? this.props.timestamp : 0;
    let xmin = this.props.xmin;
    let xmax = this.props.xmax;

    // Common chart variables
    const FONT = "Roboto, Arial, sans-serif";

    // Random Map Histogram
    var randomMapScores = [];
    for (var i = 0; i < histogramArray.length; i++) {
      randomMapScores[i] = histogramArray[i][1];
    }
    var trace = {
      x: randomMapScores,
      type: "histogram"
    };
    var layout = {
      title: {
        text: "Age of Empires II: Definitive Edition Ratings<br>1v1 Random Map",
        font: {
          family: FONT,
          size: 24
        },
        xref: "paper",
        x: 0.05
      },
      xaxis: {
        title: {
          text: "Rating",
          font: {
            family: FONT,
            size: 18,
            color: "#7f7f7f"
          }
        },
        range: [xmin, xmax]
      },
      yaxis: {
        title: {
          text: "Number of Players",
          font: {
            family: FONT,
            size: 18,
            color: "#7f7f7f"
          }
        }
      }
    };
    var data = [trace];
    Plotly.newPlot("random_map_histogram", data, layout, {scrollZoom: false});

    // Team Random Map Histogram
    var teamRandomMapScores = [];
    for (var i = 0; i < histogramArray.length; i++) {
      teamRandomMapScores[i] = histogramArray[i][2];
    }
    var trace = {
      x: teamRandomMapScores,
      type: "histogram"
    };
    var layout = {
      title: {
        text:
          "Age of Empires II: Definitive Edition Ratings<br>Team Random Map",
        font: {
          family: FONT,
          size: 24
        },
        xref: "paper",
        x: 0.05
      },
      xaxis: {
        title: {
          text: "Rating",
          font: {
            family: FONT,
            size: 18,
            color: "#7f7f7f"
          }
        },
        range: [xmin, xmax]
      },
      yaxis: {
        title: {
          text: "Number of Players",
          font: {
            family: FONT,
            size: 18,
            color: "#7f7f7f"
          }
        }
      }
    };
    var data = [trace];
    Plotly.newPlot("team_random_map_histogram", data, layout, {scrollZoom: false});

    // Combo Scatterplot
    var trace1 = {
      x: randomMapScores,
      y: teamRandomMapScores,
      mode: "markers",
      type: "scatter",
      textposition: "top center",
      textfont: {
        family: FONT
      },
      marker: { size: 2 }
    };

    var data = [trace1];

    var layout = {
      legend: {
        y: 0.5,
        yref: "paper",
        font: {
          family: FONT,
          size: 20,
          color: "grey"
        }
      },
      title: {
        text:
          "Age of Empires II: Definitive Edition Ratings<br> 1v1 Random Map vs Team Random Map Ratings",
        font: {
          family: FONT,
          size: 24
        },
        xref: "paper",
        x: 0.05
      },
      xaxis: {
        title: {
          text: "1v1 Random Map Rating",
          font: {
            family: FONT,
            size: 18,
            color: "#7f7f7f"
          }
        },
        range: [xmin, xmax]
      },
      yaxis: {
        title: {
          text: "Team Random Map Rating",
          font: {
            family: FONT,
            size: 18,
            color: "#7f7f7f"
          }
        }
      }
    };

    Plotly.newPlot("combo_scatterplot", data, layout, {scrollZoom: false});

    let lastUpdatedDiv = document.getElementById("last_updated");
    lastUpdatedDiv.textContent = `Updated on ${new Date(timestamp)}`;
  }

  render() {
    return (
      <html>
        <head>
          <title>Age of Empires II: Definitive Edition Rating Charts</title>
          <meta name="description" content="Histograms and a scatterplot for 'Age of Empires II: Definitive Edition' 1v1 Random Map and Team Random Map."/>
          <script
            type="text/javascript"
            src="https://cdn.plot.ly/plotly-latest.min.js"
          ></script>
        </head>
        <body>
          <div
            id="random_map_histogram"
            style={{ width: "900px", height: "500px" }}
          ></div>
          <div
            id="team_random_map_histogram"
            style={{ width: "900px", height: "500px" }}
          ></div>
          <div
            id="combo_scatterplot"
            style={{ width: "900px", height: "500px" }}
          ></div>
          <div id="last_updated"></div>
          <div id="github_footer">
            Source code on{" "}
            <a href="https://github.com/thbrown/aoe2-de-elo-histogram">
              github
            </a>
            <br></br>
            Data taken from{" "}
            <a href="https://aoe2.net/#api">https://aoe2.net/#api</a>
          </div>
        </body>
      </html>
    );
  }
}

const CACHE_DIRECTORY = "cache/";
const CACHE_FILE_NAME = "ApiCache.json";
const CACHE_EXPIRATION_IN_HOURS = 23; // Change this to 0 to bypass cache
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

    // Change 'numberOfPlayersToUse' to something like '1000' for development.
    // You won't get all the data, but it will build MUCH faster after the API calls are cached.
    let numberOfPlayersToUse = teamRandomMapLeaderbaord.length;
    for (let i = 0; i < numberOfPlayersToUse; i++) {
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

    let histogramData = [];
    for (const property in aoeData) {
      histogramData.push(aoeData[property]);
    }

    console.log("Total number of ranked players", histogramData.length);

    // Whatever happens after this takes forever, make sure the person who kicked off the build knows it's not hanging
    console.log(
      "Doing nextjs stuff, this next step may take a few minutes if using all the players. Please be patient..."
    );

    // the return calue will be passed to the page component as props
    return {
      props: {
        histogram: histogramData,
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
