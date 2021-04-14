import React, { Component } from "react";

export default class extends Component {
  render() {
    return (
      <div>
        <div>Hello Embedded!</div>
      </div>
    );
  }
}

/**
 * This function only gets called when the page is built. It does not become a part of the web page.
 * The return value of this function is sent to the React component above as props.
 */
export async function getStaticProps(context) {
  //let apiCaller = new ApiCaller();
  //return await apiCaller.getApiData(1, 2);
  return { props: {} };
}
