const got = require("got");
const fs = require("fs");

import Utils from "../helpers/utils.js";

const CACHE_DIRECTORY = "cache/";
const CACHE_FILE_NAME = "ApiCache.json";
const CACHE_EXPIRATION_IN_HOURS = 9999999; // Change this to 0 to bypass cache
const API_CALL_CHUNK_SIZE = 1000;
const API_CALL_DELAY_IN_MS = 2000;

const LEADERBOARD_LABELS = Utils.getLeaderboardLabels();
const INVERTED_LEADERBOARD_LABELS = Utils.invert(LEADERBOARD_LABELS);
const ALL_LABELS = Utils.getAllLabels();

/**
 * Leaderboard ids:
 * Unranked=0, 1v1 Deathmatch=1, Team Deathmatch=2, 1v1 Random Map=3, Team Random Map=4
 */
class ApiCaller {
  /**
   * Accepts any number of leaderboard objects and merges them into a single leaderboard object.
   */
  mergePlayerData(...leaderboardData) {
    let mergedData = {
      timestamp: Number.MAX_VALUE,
      data: {},
    };
    for (let i = 0; i < leaderboardData.length; i++) {
      let leaderboard = leaderboardData[i];

      mergedData.timestamp = Math.min(
        mergedData.timestamp,
        leaderboard.timestamp
      );

      for (const property in leaderboard.data) {
        if (mergedData.data[property]) {
          mergedData.data[property] = Object.assign(
            mergedData.data[property],
            leaderboard.data[property]
          );
        } else {
          mergedData.data[property] = Object.assign(
            {},
            leaderboard.data[property]
          );
        }
      }
    }

    return mergedData;
  }

  /**
   * Add needed derived fields and format the data for passing to the react components
   */
  wrapLeaderboardData(leaderboardData) {
    let xmin = Number.MAX_VALUE;
    let xmax = Number.MIN_VALUE;
    let arrayData = [];
    for (const playerId in leaderboardData.data) {
      // Update min and max - used to show charts at the same scale

      // Calculate the local min/max (at the player level)
      let lowestRatingForPlayer = Number.MAX_VALUE;
      let highestRatingForPlayer = Number.MIN_VALUE;
      for (const property in leaderboardData.data[playerId]) {
        if (INVERTED_LEADERBOARD_LABELS[property] === undefined) {
          continue; // Not a rating (might be a 'name' for instance)
        }
        let rating = leaderboardData.data[playerId][property];
        if (rating < lowestRatingForPlayer) {
          lowestRatingForPlayer = rating;
        }
        if (rating > highestRatingForPlayer) {
          highestRatingForPlayer = rating;
        }
      }

      // Calculate global min/max (for all players)
      if (lowestRatingForPlayer < xmin) {
        xmin = lowestRatingForPlayer;
      }
      if (highestRatingForPlayer > xmax) {
        xmax = highestRatingForPlayer;
      }

      arrayData.push([playerId]);
    }

    return {
      props: {
        // Nextjs is inexplicably slow if 'allData' is passed as an array so we'll serialize in and pass it as a string
        // TODO: does this work okay now that we are passing an object instead of an array?
        data: JSON.stringify(leaderboardData.data),
        timestamp: leaderboardData.timestamp,
        xmin: xmin,
        xmax: xmax,
      },
    };
  }

  /**
   * Gets the formatted data for one leaderboard
   * @param leaderboardId
   * @returns
   */
  async getLeaderboardData(leaderboardId) {
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
        // TODO: I think it's actually 10000 now
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

          // Wait a little bit between each api call. There are currently no API limits but we still want to respect the server.
          console.log("WAITING...");
          await new Promise((r) => setTimeout(r, API_CALL_DELAY_IN_MS));
        }

        console.log("Total rows fetched", leaderboard.length);

        // Write the result to the file system cache so we don't have to make the api call each time we build
        if (!fs.existsSync(CACHE_DIRECTORY)) {
          fs.mkdirSync(CACHE_DIRECTORY);
        }
        fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(leaderboard));
        console.log("API responses were cached");
      }

      /*
      Format the data as a json object:
      {
      "timestamp" : 1234567890987,
      "data" : {
        "<profileId>": 
          {
            "<name_label>": "CrookedYams",
            "<randomMapRating_label>": 1234,
            "<teamRandomMapRating_label>": 5678
            ...
          }
        }
      }
      */
      let formattedData = {
        timestamp: fs.statSync(CACHE_FILE_PATH).mtimeMs,
        data: {},
      };
      for (let i = 0; i < leaderboard.length; i++) {
        let name = leaderboard[i].name;
        let profileId = leaderboard[i].profile_id;
        let rating = leaderboard[i].rating;
        let leaderboardLabel = LEADERBOARD_LABELS[leaderboardId];

        formattedData.data[profileId] = {};
        formattedData.data[profileId][ALL_LABELS.NAME] = name;
        formattedData.data[profileId][leaderboardLabel] = rating;
      }

      return formattedData;
    } catch (e) {
      // If something fails here the page still builds
      // We don't want Github Actions to build and deploy a site that didn't build properly (e.g. API requests fail)
      // So, we'll do a hard exit here with a failure code of 1.
      console.log("Something went wrong during the build", e);
      process.exit(1);
    }
  }
}

export default ApiCaller;
