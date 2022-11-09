import React, { Component } from "react";

import ApiCaller from "../helpers/api-caller-relic.js";
import Page from "../components/page.js";
import Utils from "../helpers/utils.js";

const fs = require("fs");

let Labels = Utils.getAllLabels();

export default class extends Component {
  render() {
    return (
      <Page
        {...this.props}
        title="Empire Wars Ratings"
        chartOneLabel="1v1 Empire Wars"
        chartTwoLabel="Team Empire Wars"
        chartAltLink="/"
        chartAltLinkText="Random Map"
        dataLabelOne={Labels.EMPIRE_WARS_RATING}
        dataLabelTwo={Labels.EMPIRE_WARS_TEAM_RATING}
        dataLabelThree={Labels.EMPIRE_WARS_COMBO_RATING}
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
  if (!fs.existsSync("ratings-ignored")) {
    fs.mkdirSync("ratings-ignored");
  }

  fs.writeFileSync(
    "ratings-ignored/leaderboard13.json",
    JSON.stringify(await apiCaller.getLeaderboardData(13))
  );

  fs.writeFileSync(
    "ratings-ignored/leaderboard14.json",
    JSON.stringify(await apiCaller.getLeaderboardData(14))
  );

  // Generate data for page
  let empireWarsLeaderboard = await apiCaller.getLeaderboardData(13);
  let teamEmpireWarsMapLeaderboard = await apiCaller.getLeaderboardData(14);
  let mergedLeaderboard = apiCaller.mergePlayerData(
    empireWarsLeaderboard,
    teamEmpireWarsMapLeaderboard
  );
  let wrappedLeaderboard = apiCaller.wrapLeaderboardData(mergedLeaderboard);
  return wrappedLeaderboard;
}
