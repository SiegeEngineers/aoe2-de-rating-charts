import React, { Component } from "react";

import Data from "../helpers/data.js";
import AnnotationSeparator from "../helpers/annotation-separator.js";
import styles from "./page.module.css";

const DEFAULT_COLOR = "#0eac22"; // green
const TEAM_ONE_COLOR = "#6311a5"; // purple
const TEAM_TWO_COLOR = "#fe9918"; // orange

// Common chart variables
const AXIS_FONT_SIZE = 14;
const AXIS_FONT_COLOR = "#7f7f7f";
const TITLE_FONT_SIZE = 18;
const FONT = "Roboto, Arial, sans-serif";
const MARGINS = {
  l: 50,
  r: 15,
  t: 50,
  b: 40,
};

export default class extends Component {
  state = {
    data: null,
    teamOne: [],
    teamTwo: [],
  };

  componentDidMount() {
    let startTime = new Date();
    let dataSet = new Data(this.props.data);
    let xmin = this.props.xmin; // TODO: remove the 'x' there are just absolute max and min values
    let xmax = this.props.xmax;

    // Random Map Histogram
    var trace = {
      x: dataSet.getAllSoloRatings(),
      type: "histogram",
      marker: {
        color: DEFAULT_COLOR,
      },
      hovertemplate:
        "# of Players: %{y}<br>Rating Range: %{x}<br>Percentile: %{text}<extra></extra>",
    };
    var layout = {
      title: {
        text: this.props.chartOneLabel,
        font: {
          family: FONT,
          size: TITLE_FONT_SIZE,
        },
        xanchor: "center",
        yanchor: "bottom",
      },
      margin: MARGINS,
      xaxis: {
        title: {
          text: "Rating",
          font: {
            family: FONT,
            size: AXIS_FONT_SIZE,
            color: AXIS_FONT_COLOR,
          },
        },
        range: [xmin, xmax],
        fixedrange: true,
      },
      yaxis: {
        title: {
          text: "Number of Players",
          font: {
            family: FONT,
            size: AXIS_FONT_SIZE,
            color: AXIS_FONT_COLOR,
          },
        },
        fixedrange: true,
      },
      marker: { color: DEFAULT_COLOR },
      hovermode: "false",
    };
    var data = [trace];
    let randomMapPlot = Plotly.newPlot("random_map_histogram", data, layout, {
      scrollZoom: false,
      responsive: true,
      showLink: true,
      plotlyServerURL: "https://chart-studio.plotly.com",
    });

    // Remove the loading div
    Promise.all([randomMapPlot]).then(
      function (values) {
        let contentDiv = document.getElementById("loading-hider");
        contentDiv.classList.remove("hidden");

        let loadingDiv = document.getElementById("loading");
        loadingDiv.classList.add("none");

        this.randomMapDiv = values[0];

        // Adding these event make it possible to scroll the page whenever touching a plotly chart.
        // Without them there appears to be some plotly events that prevent the scroll action.
        this.randomMapDiv.addEventListener(
          "touchstart",
          function (event) {
            event.stopPropagation();
          },
          true
        );

        // Now that the plots have been rendered, we know the characteristics of the bins (count, range, ratings) so we can add the text lables
        addTextAttributeToTrace(this.randomMapDiv, dataSet, "solo");

        let queryString = window.location.search;
        let parsed = parseQueryString(queryString);
        this.setState({
          data: dataSet,
          teamOne: parsed.team_one ? parsed.team_one.split("-") : [],
          teamTwo: parsed.team_two ? parsed.team_two.split("-") : [],
        });

        // Record elapsed time
        gtag("event", "timing_complete", {
          name: "Load " + this.props.title,
          value: new Date() - startTime,
          event_category: "JS Dependencies",
        });
      }.bind(this)
    );
  }

  componentDidUpdate() {
    // Don't update the graph if it was never ready to begin with
    if (this.randomMapDiv) {
      return;
    }

    let teamOneSelection = this.state.teamOne
      ? this.state.teamOne.filter((profileId) =>
          this.state.data.exists(profileId)
        )
      : [];
    let teamTwoSelection = this.state.teamTwo
      ? this.state.teamTwo.filter((profileId) =>
          this.state.data.exists(profileId)
        )
      : [];

    // Update 1v1 random map
    let soloRandomMapColorInfo = [];
    for (let i = 0; i < teamOneSelection.length; i++) {
      soloRandomMapColorInfo.push({
        color: TEAM_ONE_COLOR,
        value: this.state.data.getSoloRating(teamOneSelection[i]),
        name: this.state.data.getName(teamOneSelection[i]),
      });
    }
    for (let i = 0; i < teamTwoSelection.length; i++) {
      soloRandomMapColorInfo.push({
        color: TEAM_TWO_COLOR,
        value: this.state.data.getSoloRating(teamTwoSelection[i]),
        name: this.state.data.getName(teamTwoSelection[i]),
      });
    }
    highlightHistogramMarker(this.randomMapDiv, soloRandomMapColorInfo);

    // Record pageview
    gtag("event", "select_content", {
      event_label: window.location.pathname + window.location.search,
    });
  }

  render() {
    return (
      <html>
        <head>
          <title>Age of Empires II: Definitive Edition Rating Charts</title>
          <meta
            name="description"
            content="Histograms and a scatterplot for 'Age of Empires II: Definitive Edition' 1v1 Random Map and Team Random Map ratings elo. Updated daily."
          />
          <meta property="og:image" content="https://i.imgur.com/cVLgt68.png" />
          <script
            type="text/javascript"
            src="https://cdn.plot.ly/plotly-cartesian-latest.min.js"
          ></script>
          <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=UA-163727547-1"
          ></script>
          <script src="ga.js"></script>
          <link rel="shortcut icon" href="/favicon.ico" />
        </head>

        <body style={{ fontFamily: FONT }}>
          <div className={styles.center}>
            <div
              id="loading"
              style={{
                zIndex: 1,
                margin: "auto",
                width: "8%",
                marginTop: "100px",
              }}
            >
              <div className="loading-spinner">
                <div className="spinner-dot"></div>
                <div className="spinner-dot"></div>
                <div className="spinner-dot"></div>
                <div className="spinner-dot"></div>
                <div className="spinner-dot"></div>
                <div className="spinner-dot"></div>
              </div>
            </div>
            <div id="loading-hider" className="hidden">
              <div id="random_map_histogram"></div>
            </div>
          </div>
        </body>
      </html>
    );
  }
}

// Accepts values in the form {color: "rgb(31, 119, 180)", value: 1066, name:"GusTTShowbiz"}
function highlightHistogramMarker(chartElement, values) {
  let numberOfBuckets = chartElement.calcdata[0].length;

  // Filter out any values that are undefined
  values = values.filter((value) => value.value);

  // Get the unique colors, assign each color a number begining with 0 and counting by ones
  let counter = 1;
  let colors = {};
  for (let i = 0; i < values.length; i++) {
    let colorString = values[i].color;
    if (colors[colorString] === undefined) {
      colors[colorString] = counter;
      counter++;
    }
  }

  // Make sure the values are ordered
  values.sort(function (a, b) {
    return a.value - b.value;
  });

  // Find the buckets our values fit in
  let valueIndex = 0;
  let bucketColors = new Array(numberOfBuckets).fill(0); // All buckets start with the default color
  for (let i = 0; i < numberOfBuckets; i++) {
    // Check if any of our values are in this bucket
    while (
      valueIndex < values.length &&
      values[valueIndex].value >= chartElement.calcdata[0][i].ph0 &&
      values[valueIndex].value <= chartElement.calcdata[0][i].ph1
    ) {
      bucketColors[i] = colors[values[valueIndex].color];
      values[valueIndex].bucketIndex = i;
      valueIndex++;
    }

    // Check if we've bucketed every value
    if (valueIndex >= values.length) {
      break;
    }
  }

  // Format colorscale data
  const maxValueInBucketColors = Object.keys(colors).length;
  let colorscale = [[0, DEFAULT_COLOR]];
  for (const prop in colors) {
    let localArray = [colors[prop] / maxValueInBucketColors, prop];
    colorscale.push(localArray);
  }

  let styleUpdate = {};
  if (colorscale.length == 1) {
    // If there is just one color for all the markers, just set the color directly. Using a size one array here doesn't work.
    styleUpdate = {
      "marker.color": colorscale[0][1],
    };
  } else {
    // Update the color of specific markers on the 0th trace
    styleUpdate = {
      "marker.color": [bucketColors],
      "marker.colorscale": [colorscale],
      "marker.cmax": maxValueInBucketColors,
      "marker.cmin": 0,
    };
  }

  // Add the annotations!
  let rangeX =
    chartElement.layout.xaxis.range[1] - chartElement.layout.xaxis.range[0];
  let rangeY =
    chartElement.layout.yaxis.range[1] - chartElement.layout.yaxis.range[0];
  let annotations = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i].value) {
      let entry = {
        text: values[i].name,
        x: values[i].value,
        y: chartElement.calcdata[0][values[i].bucketIndex].s,
        ax: values[i].value,
        ay: chartElement.calcdata[0][values[i].bucketIndex].s + rangeX / 10, // We'd prefer the annotations above the data point
        axref: "x",
        ayref: "y",
        bgcolor: "rgba(255, 255, 255, 0.9)",
        arrowcolor: "rgba(0, 0, 0, 0.9)",
        font: { size: 12 },
        bordercolor: values[i].color,
        borderwidth: 1,
        arrowsize: 1,
        arrowwidth: 1,
      };
      annotations.push(entry);
    }
  }

  let seperator = new AnnotationSeparator(
    annotations,
    chartElement.layout.xaxis.range[0],
    chartElement.layout.xaxis.range[1],
    chartElement.layout.yaxis.range[0],
    chartElement.layout.yaxis.range[1]
  );
  let layoutUpdate = {
    annotations: seperator.getSeparatedAnnotations(),
  };

  // Update the plot with the highlights and annotations
  Object.assign(chartElement.layout, layoutUpdate);
  Plotly.restyle(chartElement, styleUpdate);
}

function addTextAttributeToTrace(chartElement, dataset, type) {
  let numberOfBuckets = chartElement.calcdata[0].length;
  let textArray = [];
  for (let i = 0; i < numberOfBuckets; i++) {
    let avg = chartElement.calcdata[0][i].p;
    if (type === "team") {
      textArray.push(
        dataset.formatPercentage(dataset.getPercentileForTeamRating(avg))
      );
    } else if (type === "solo") {
      textArray.push(
        dataset.formatPercentage(dataset.getPercentileForSoloRating(avg))
      );
    }
  }
  let textUpdate = {
    text: [textArray],
  };
  Plotly.update(chartElement, textUpdate);
}

function parseQueryString(queryString) {
  var query = {};
  var pairs = (queryString[0] === "?"
    ? queryString.substr(1)
    : queryString
  ).split("&");
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split("=");
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
  }
  return query;
}
