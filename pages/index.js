import React, { Component } from "react";

import ApiCaller from "../helpers/api-caller.js";
import Page from "../components/page.js";
import Utils from "../helpers/utils.js";

const fs = require("fs");

let Labels = Utils.getAllLabels();

export default class extends Component {
  render() {
    return (
      <Page
        {...this.props}
        title="Random Map Ratings"
        chartOneLabel="1v1 Random Map"
        chartTwoLabel="Team Random Map"
        chartAltLink="/empire-wars"
        chartAltLinkText="Empire Wars"
        dataLabelOne={Labels.RANDOM_MAP_RATING}
        dataLabelTwo={Labels.TEAM_RANDOM_MAP_RATING}
        dataLabelThree={Labels.RANDOM_MAP_COMBO_RATING}
      ></Page>
    );
  }
}

/**
 * This function only gets called when the page is built. It does not become a part of the web page itself.
 * The return value of this function is sent to the React component above as props.
 *
 * <Page {...this.props} altLink="Deathmatch"></Page>
 */
export async function getStaticProps(context) {
  let apiCaller = new ApiCaller();

  // Generate data for the public directory
  if (!fs.existsSync("ratings-ignored")) {
    fs.mkdirSync("ratings-ignored");
  }

  fs.writeFileSync(
    "ratings-ignored/leaderboard3.json",
    JSON.stringify(await apiCaller.getLeaderboardData(3))
  );

  fs.writeFileSync(
    "ratings-ignored/leaderboard4.json",
    JSON.stringify(await apiCaller.getLeaderboardData(4))
  );

  // Generate page data
  let randomMapLeaderboard = await apiCaller.getLeaderboardData(3);
  let teamRandomMapLeaderboard = await apiCaller.getLeaderboardData(4);
  let mergedLeaderboard = apiCaller.mergePlayerData(
    randomMapLeaderboard,
    teamRandomMapLeaderboard
  );
  let wrappedLeaderboard = apiCaller.wrapLeaderboardData(mergedLeaderboard);
  console.log(
    wrappedLeaderboard.props.xmin,
    wrappedLeaderboard.props.xmax,
    wrappedLeaderboard.props.timestamp
  );

  return wrappedLeaderboard;
}
