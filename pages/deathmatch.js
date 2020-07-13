import React, { Component } from "react";

import ApiCaller from "../helpers/api-caller.js";
import Page from "../components/page.js";

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
  return await apiCaller.getApiData(1, 2);
}
