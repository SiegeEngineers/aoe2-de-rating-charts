import React, { Component } from 'react'

const got = require('got');
const fs = require('fs');

export default class extends Component {
  state = { }

  componentDidMount() {
    console.log(this.props.histogram);
    let histogramArray = this.props.histogram;
    let timestamp = this.props.timestamp ? this.props.timestamp : 0;
    google.charts.load("current", {packages:["corechart"]});
    google.charts.setOnLoadCallback(drawChart);
    function drawChart() {
      var data = google.visualization.arrayToDataTable(histogramArray);

      var options = {
        title: 'Age of Empires II: Definitive Edition ELO',
        subtitle: '1v1 Random Map',
        legend: { position: 'none' },
      };

      var chart = new google.visualization.Histogram(document.getElementById('chart_div'));
      chart.draw(data, options);
    }

    let lastUpdatedDiv = document.getElementById("last_updated");
    lastUpdatedDiv.textContent = `Last updated: ${new Date(timestamp)}`;

  }

  render() {
    return (
        <html>
            <head>
            <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
            </head>
            <body>
            <div id="chart_div" style={{width: "900px", height: "500px"}}></div>
            <div id="last_updated"></div>
            </body>
        </html>
    )
  }
}

const NUMBER_OF_BUCKETS = 100;
const CACHE_FILE_PATH = "cache/apiCache.json";
const CACHE_EXPIRATION_IN_HOURS = 23; // Change this to 0 to bypass cache
const API_CALL_CHUNK_SIZE = 1000;
const API_CALL_DELAY_IN_MS = 2000;

/**
 * This function gets called when only the page is built. It does not become a part of the web page. The resturn vale of this function are 
 * sent to the React component above as props.
 */
export async function getStaticProps(context) {
    try {
        let updatedTime = 0;
        let leaderboard = [];

        // Get the data -- If this API call has been cached in the last CACHE_EXPIRATION_IN_HOURS hours use the cached file
        if(fs.existsSync(CACHE_FILE_PATH) && Date.now() - fs.statSync(CACHE_FILE_PATH).mtimeMs < CACHE_EXPIRATION_IN_HOURS * 60 * 60 * 1000) {
            console.log("Using cache to avoid API call to aoe2.net...");
            leaderboard = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf8'));
            updatedTime = fs.statSync(CACHE_FILE_PATH).mtimeMs;
        } else {
            console.log("Fetching data from aoe2.net...");
            let firstResponse = await got('https://aoe2.net/api/leaderboard?game=aoe2de&leaderboard_id=3&start=1&count=1').json();
            let numberOfRankedPlayers = firstResponse.total;

            let numberOfRequests = Math.ceil(numberOfRankedPlayers/API_CALL_CHUNK_SIZE);

            console.log("Number of API requests required", numberOfRequests, "to retrieve", numberOfRankedPlayers, "players");

            // The max number of leaderboard entries we can request is 1000, so we'll do it in chunks
            for(let i = 0; i < numberOfRequests; i++) {
                let startIndex = i * API_CALL_CHUNK_SIZE;
                console.log("Requesting",startIndex,"to",startIndex + API_CALL_CHUNK_SIZE)

                let dataResponse = await got(`https://aoe2.net/api/leaderboard?game=aoe2de&leaderboard_id=3&start=${startIndex}&count=${API_CALL_CHUNK_SIZE}`).json();
                leaderboard = leaderboard.concat(dataResponse.leaderboard);
                console.log("Leaderboard",leaderboard.length);

                // Wait a litte bit before we make the next api call
                await new Promise(r => setTimeout(r, API_CALL_DELAY_IN_MS));
            }

            console.log("Leaderboard length", leaderboard.length);

            // Write the result to the file system cache so we don't have to make the api call each time we build
            fs.writeFile(CACHE_FILE_PATH, JSON.stringify(leaderboard), function (err) {
                if (err) {
                    console.log("Error writing API cache file");
                    console.log(err);
                    return;
                }                
                console.log("API response written to cache")
            });
            updatedTime = Math.floor(new Date()/1000);
        }
        
        /*
        // Create the histogram buckets

        let maxElo = Math.round(leaderboard[0].rating);
        let minElo = Math.round(leaderboard[leaderboard.length - 1].rating);
        let bucketSize = (maxElo - minElo)/NUMBER_OF_BUCKETS;
        console.log("Constants", maxElo, minElo, bucketSize);

        let cutoffs = [];
        for(let c = NUMBER_OF_BUCKETS-1; c >= 0; c -= 1) {
            cutoffs.push(c*bucketSize+minElo);
        }
        let cutoffIndex = 0;

        console.log("Bucket Cutoffs", cutoffs);
    
        // Put each of the players in one of the buckets
        let buckets = new Array(NUMBER_OF_BUCKETS);
        for(let i = 0; i < NUMBER_OF_BUCKETS; i++) {
            buckets[i] = 0;
        }
        for(let i = 0; i < leaderboard.length; i++) {
            console.log(leaderboard[i].rating + " " + cutoffs[cutoffIndex]);
            while(leaderboard[i].rating <= cutoffs[cutoffIndex]) {
                cutoffIndex++;
            }
            let currentNumbnerOfPlayersInBucket = buckets[cutoffIndex];
            buckets[cutoffIndex] = currentNumbnerOfPlayersInBucket + 1;
        }

        console.log("Filled Bucket", buckets);
        */

        // Format the data so Google Charts can comsume it
        let histogramData = [['Player Name', 'ELO']];
        for(let i = 0; i < leaderboard.length; i++) {
            let name = leaderboard[i].name;
            let rating = leaderboard[i].rating;
            histogramData.push([name, rating]);
        }

        console.log("Number of players", histogramData.length);


        // will be passed to the page component as props
        return {
            props: {
                histogram: histogramData,
                timestamp: updatedTime
            } 
        }
    } catch (error) {
        console.log("ERROR" + error);
        console.log(error);
        return {
            props: {}
        }
    }
}