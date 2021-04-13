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
        title="Deathmatch Ratings"
        chartOneLabel="1v1 Deathmatch"
        chartTwoLabel="Team Deathmatch"
        chartAltLink="/"
        chartAltLinkText="Random Map"
        dataLabelOne={Labels.DEATHMATCH_RATING}
        dataLabelTwo={Labels.TEAM_DEATHMATCH_RATING}
        dataLabelThree={Labels.DEATHMATCH_COMBO_RATING}
      ></Page>
    );
  }
}

/**
 * This function only gets called when the page is built. It does not become a part of the web page.
 * The return value of this function is sent to the React component above as props.
 */
export async function getStaticProps(context) {
  let apiCaller = new ApiCaller();

  // Generate data for the public directory
  fs.writeFileSync(
    "public/leaderboard1.json",
    JSON.stringify(await apiCaller.getLeaderboardData(1))
  );

  fs.writeFileSync(
    "public/leaderboard2.json",
    JSON.stringify(await apiCaller.getLeaderboardData(2))
  );

  // Generate data for page
  let deathmatchLeaderboard = await apiCaller.getLeaderboardData(1);
  let teamDeathmatchMapLeaderboard = await apiCaller.getLeaderboardData(2);
  let mergedLeaderboard = apiCaller.mergePlayerData(
    deathmatchLeaderboard,
    teamDeathmatchMapLeaderboard
  );
  let wrappedLeaderboard = apiCaller.wrapLeaderboardData(mergedLeaderboard);
  return wrappedLeaderboard;
}
