import React, { Component } from "react";
import {} from "../components";

import ApiCaller from "../helpers/api-caller.js";

export default class extends Component {
  render() {
    return (
      <div>
        <div>Hello Embedded!</div>
        <Histogram
          {...this.props}
          title="Deathmatch Ratings"
          xmin="1v1 Deathmatch"
          xmax="Team Deathmatch"
          data="/"
          chartOneLabel="Random Map"
        ></Histogram>
      </div>
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
  //return {};
}
