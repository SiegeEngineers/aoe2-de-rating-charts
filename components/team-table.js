import React from "react";
import styles from "./team-table.module.css";
import Utils from "../helpers/utils.js";

const Labels = Utils.getAllLabels();

class TeamTable extends React.Component {
  state = {};

  calculateAverage(data, accessorFunction, dataLabel, profileIds) {
    let count = 0;
    let sum = 0;
    for (let i = 0; i < profileIds.length; i++) {
      let result = accessorFunction.call(data, dataLabel, profileIds[i]);
      if (result) {
        sum += result;
        count++;
      }
    }
    if (count > 0) {
      return sum / count;
    } else {
      return "-";
    }
  }

  formatAverage(value) {
    if (isNaN(value)) {
      return "";
    }
    return Math.round(value);
  }

  render() {
    const data = this.props.data;
    const players = this.props.players.filter((profileId) =>
      data.exists(profileId)
    );
    const color = this.props.color;
    const teamLabel = this.props.teamLabel;

    // Don't show this table if there are no players selected
    if (players.length === 0 || !players) {
      return null;
    }

    const items = [];

    for (let i = 0; i < players.length; i++) {
      let profileId = players[i];
      let name = data.getPlayerRating(Labels.NAME, profileId);
      let randomMapRating = data.getPlayerRating(
        this.props.dataLabelOne,
        profileId
      );
      let randomMapPercentile = data.getPlayerPercentile(
        this.props.dataLabelOne,
        profileId
      );
      let teamRandomMapRating = data.getPlayerRating(
        this.props.dataLabelTwo,
        profileId
      );
      let teamRandomMapPercentile = data.getPlayerPercentile(
        this.props.dataLabelTwo,
        profileId
      );
      let euclideanRating = data.getPlayerRating(
        this.props.dataLabelThree,
        profileId
      );
      let euclideanPercentile = data.getPlayerPercentile(
        this.props.dataLabelThree,
        profileId
      );

      items.push(
        <tr key={"player-" + profileId}>
          <th width="28%">{name}</th>
          <th width="12%" style={{ borderLeft: "1px solid " + color }}>
            {randomMapRating}
          </th>
          <th width="12%">{data.formatPercentage(randomMapPercentile)}</th>
          <th width="12%" style={{ borderLeft: "1px solid " + color }}>
            {teamRandomMapRating}
          </th>
          <th width="12%">{data.formatPercentage(teamRandomMapPercentile)}</th>
          <th width="12%" style={{ borderLeft: "1px solid " + color }}>
            {euclideanRating}
          </th>
          <th width="12%">{data.formatPercentage(euclideanPercentile)}</th>
        </tr>
      );
    }

    // If there is more than one player on a team, add a line for team averages
    if (players.length > 1) {
      let soloRatingAvg = this.calculateAverage(
        data,
        data.getPlayerRating,
        this.props.dataLabelOne,
        players
      );
      let soloPercentageAvg = this.calculateAverage(
        data,
        data.getPlayerPercentile,
        this.props.dataLabelOne,
        players
      );
      let teamRatingAvg = this.calculateAverage(
        data,
        data.getPlayerRating,
        this.props.dataLabelTwo,
        players
      );
      let teamPercentageAvg = this.calculateAverage(
        data,
        data.getPlayerPercentile,
        this.props.dataLabelTwo,
        players
      );
      let comboRankingAvg = this.calculateAverage(
        data,
        data.getPlayerRating,
        this.props.dataLabelThree,
        players
      );
      let comboPercentageAvg = this.calculateAverage(
        data,
        data.getPlayerPercentile,
        this.props.dataLabelThree,
        players
      );

      items.push(
        <tr style={{ borderTop: "1px solid " + color }}>
          <th className={styles.teamAvgRow}>
            <b>{teamLabel} Avg</b>
          </th>
          <th
            className={styles.teamAvgRow}
            style={{ borderLeft: "1px solid " + color }}
          >
            <b>{this.formatAverage(soloRatingAvg)}</b>
          </th>
          <th className={styles.teamAvgRow}>
            <b>{data.formatPercentage(soloPercentageAvg)}</b>
          </th>
          <th
            className={styles.teamAvgRow}
            style={{ borderLeft: "1px solid " + color }}
          >
            <b>{this.formatAverage(teamRatingAvg)}</b>
          </th>
          <th className={styles.teamAvgRow}>
            <b>{data.formatPercentage(teamPercentageAvg)}</b>
          </th>
          <th
            className={styles.teamAvgRow}
            style={{ borderLeft: "1px solid " + color }}
          >
            <b>{this.formatAverage(comboRankingAvg)}</b>
          </th>
          <th className={styles.teamAvgRow}>
            <b>{data.formatPercentage(comboPercentageAvg)}</b>
          </th>
        </tr>
      );
    }
    return (
      <div
        className={styles.teamTable}
        style={{ borderColor: this.props.color }}
      >
        <table
          style={{
            width: "100%",
            borderSpacing: "0px",
            fontSize: "12px",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <tbody>{items}</tbody>
        </table>
      </div>
    );
  }
}

export default TeamTable;
