const got = require("got");
const fs = require("fs");

const CACHE_DIRECTORY = "cache/";
const CACHE_FILE_NAME = "ApiCache.json";
const CACHE_EXPIRATION_IN_HOURS = 9999999; // Change this to 0 to bypass cache
const API_CALL_CHUNK_SIZE = 1000;
const API_CALL_DELAY_IN_MS = 2000;

class ApiCaller {
  /**
   * This function only gets called when the page is built. It does not become a part of the web page. The return value of this function is
   * sent to the React component above as props.
   *
   * leaderboard ids:
   * Unranked=0, 1v1 Deathmatch=1, Team Deathmatch=2, 1v1 Random Map=3, Team Random Map=4
   */
  async getApiData(leaderboardIdOne, leaderboardIdTwo) {
    try {
      let updatedTime = 0;

      // Get the data
      let randomMapLeaderboardResult = await this.getLeaderboardData(
        leaderboardIdOne
      );
      let teamRandomMapLeaderboardResult = await this.getLeaderboardData(
        leaderboardIdTwo
      );

      let randomMapLeaderboard = randomMapLeaderboardResult.leaderboard;
      let teamRandomMapLeaderboard = teamRandomMapLeaderboardResult.leaderboard;
      updatedTime = Math.min(
        randomMapLeaderboardResult.updatedTime,
        teamRandomMapLeaderboardResult.updatedTime
      );

      // Format the data
      let aoeData = {}; // {"profileId: [name, randomMapRating, teamRandomMapRating]"}
      let xmax = 0;
      let xmin = Number.MAX_VALUE;
      for (let i = 0; i < randomMapLeaderboard.length; i++) {
        let name = randomMapLeaderboard[i].name;
        let profileId = randomMapLeaderboard[i].profile_id;
        let soloRating = randomMapLeaderboard[i].rating;

        aoeData[profileId] = [name, soloRating, null];

        // Update min and max
        if (soloRating < xmin) {
          xmin = soloRating;
        }
        if (soloRating > xmax) {
          xmax = soloRating;
        }
      }

      console.log("TotalValid", aoeData.size);

      console.log(
        "Number of ranked random map players",
        randomMapLeaderboard.length
      );

      for (let i = 0; i < teamRandomMapLeaderboard.length; i++) {
        let name = teamRandomMapLeaderboard[i].name;
        let profileId = teamRandomMapLeaderboard[i].profile_id;
        let teamRating = teamRandomMapLeaderboard[i].rating;

        if (aoeData[profileId] == undefined) {
          aoeData[profileId] = [name, null, teamRating];
        } else {
          aoeData[profileId][2] = teamRating;
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
        teamRandomMapLeaderboard.length
      );

      let allData = [];
      for (const property in aoeData) {
        allData.push([property].concat(aoeData[property]));
      }

      console.log("Total number of ranked players", allData.length);
      console.log("Doing nextjs stuff...");

      // the return value will be passed to the page component as props
      console.log(allData);

      return {
        props: {
          // Nextjs is inexplicably slow if 'allData' is passed as an array so we'll serialize it ourselves
          data: JSON.stringify(allData),
          timestamp: updatedTime,
          xmin: xmin,
          xmax: xmax,
        },
      };
    } catch (error) {
      console.log("ERROR" + error);
      console.log(error);
      return {
        props: {},
      };
    }
  }

  async getLeaderboardData(leaderboardId) {
    let updatedTime = 0;
    let leaderboard = [];
    const CACHE_FILE_PATH = CACHE_DIRECTORY + leaderboardId + CACHE_FILE_NAME;
    // Get the data -- If this API call has been cached in the last CACHE_EXPIRATION_IN_HOURS hours use the cached file
    console.log(
      "Looking for cache file (" +
        CACHE_FILE_PATH +
        ") modified within the last",
      CACHE_EXPIRATION_IN_HOURS,
      "hours..."
    );

    try {
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
          await new Promise((r) => setTimeout(r, API_CALL_DELAY_IN_MS));
        }

        console.log("Total rows fetched", leaderboard.length);

        // Write the result to the file system cache so we don't have to make the api call each time we build
        if (!fs.existsSync(CACHE_DIRECTORY)) {
          fs.mkdirSync(CACHE_DIRECTORY);
        }
        fs.writeFile(CACHE_FILE_PATH, JSON.stringify(leaderboard), function (
          err
        ) {
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
        leaderboard: leaderboard,
      };
    } catch (e) {
      // If something fails here the page still builds
      // We don't want Github Actions to build and deploy a site that didn't build properly (e.g. API requests fail)
      // So, we'll do a hard exit here with a failure code.
      console.log("Something went wrong during the build", e);
      process.exit(1);
    }
  }
}

export default ApiCaller;
