import React, { Component } from "react";

export default class extends Component {
  componentDidMount() {
    var query = window.location.search;
    window.location.replace("/" + query);
  }
  render() {
    return "Redirecting you to https://ratings.aoe2.se";
  }
}
