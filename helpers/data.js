import PercentileTree from "../helpers/percentile-tree.js";
import Utils from "../helpers/utils.js";

/**
 * This class is responsible for holding API data, calculating derived stats, and formatting such data for ui component consumption.
 *
 * When using this class, you don't need to pass in data for all leaderboards.
 *
 * To make the if statements easier ratings of "0" exactly aren't counted
 */
const Labels = Utils.getAllLabels();

class Data {
  constructor(rawDataString) {
    this.rawData = undefined;
    try {
      this.rawData = JSON.parse(rawDataString);
    } catch (e) {
      console.log("An error occurred while parsing", rawDataString);
      throw e;
    }

    // Add derived properties to the rawData
    for (const profileId in this.rawData) {
      // Random map combo ratings
      let dataLabelOne = Labels.RANDOM_MAP_RATING;
      let dataLabelTwo = Labels.TEAM_RANDOM_MAP_RATING;
      if (
        this.rawData[profileId][dataLabelOne] &&
        this.rawData[profileId][dataLabelTwo]
      ) {
        let comboRating = Math.round(
          Math.round(
            Math.sqrt(
              Math.pow(this.rawData[profileId][dataLabelOne], 2) +
                Math.pow(this.rawData[profileId][dataLabelTwo], 2)
            )
          )
        );
        this.rawData[profileId][Labels.RANDOM_MAP_COMBO_RATING] = comboRating;
      }

      // Deathmatch combo ratings
      dataLabelOne = Labels.DEATHMATCH_RATING;
      dataLabelTwo = Labels.TEAM_DEATHMATCH_RATING;
      if (
        this.rawData[profileId][dataLabelOne] &&
        this.rawData[profileId][dataLabelTwo]
      ) {
        let comboRating = Math.round(
          Math.round(
            Math.sqrt(
              Math.pow(this.rawData[profileId][dataLabelOne], 2) +
                Math.pow(this.rawData[profileId][dataLabelTwo], 2)
            )
          )
        );
        this.rawData[profileId][Labels.DEATHMATCH_COMBO_RATING] = comboRating;
      }

      // Empire Wars combo ratings
      dataLabelOne = Labels.EMPIRE_WARS_RATING;
      dataLabelTwo = Labels.EMPIRE_WARS_TEAM_RATING;
      if (
        this.rawData[profileId][dataLabelOne] &&
        this.rawData[profileId][dataLabelTwo]
      ) {
        let comboRating = Math.round(
          Math.round(
            Math.sqrt(
              Math.pow(this.rawData[profileId][dataLabelOne], 2) +
                Math.pow(this.rawData[profileId][dataLabelTwo], 2)
            )
          )
        );
        this.rawData[profileId][Labels.EMPIRE_WARS_COMBO_RATING] = comboRating;
      }
    }

    // These trees allow us to calculate the percentile for any rating (without them we would only be able to calculate percentile for a player's rank)
    // We'll just hardcode the fields we expect
    let percentileTrees = {};
    percentileTrees[Labels.RANDOM_MAP_RATING] = new PercentileTree(
      this.rawData,
      Labels.RANDOM_MAP_RATING
    );
    percentileTrees[Labels.TEAM_RANDOM_MAP_RATING] = new PercentileTree(
      this.rawData,
      Labels.TEAM_RANDOM_MAP_RATING
    );
    percentileTrees[Labels.RANDOM_MAP_COMBO_RATING] = new PercentileTree(
      this.rawData,
      Labels.RANDOM_MAP_COMBO_RATING,
      true
    );
    percentileTrees[Labels.DEATHMATCH_RATING] = new PercentileTree(
      this.rawData,
      Labels.DEATHMATCH_RATING
    );
    percentileTrees[Labels.TEAM_DEATHMATCH_RATING] = new PercentileTree(
      this.rawData,
      Labels.TEAM_DEATHMATCH_RATING
    );
    percentileTrees[Labels.DEATHMATCH_COMBO_RATING] = new PercentileTree(
      this.rawData,
      Labels.DEATHMATCH_COMBO_RATING,
      true
    );
    percentileTrees[Labels.UNRANKED_RATING] = new PercentileTree(
      this.rawData,
      Labels.UNRANKED_RATING,
      true
    );
    percentileTrees[Labels.EMPIRE_WARS_RATING] = new PercentileTree(
      this.rawData,
      Labels.EMPIRE_WARS_RATING
    );
    percentileTrees[Labels.EMPIRE_WARS_TEAM_RATING] = new PercentileTree(
      this.rawData,
      Labels.EMPIRE_WARS_TEAM_RATING
    );
    percentileTrees[Labels.EMPIRE_WARS_COMBO_RATING] = new PercentileTree(
      this.rawData,
      Labels.EMPIRE_WARS_COMBO_RATING,
      true
    );
    this.percentileTrees = percentileTrees;

    // But, we could support arbitrary fields with something like this:
    /*
    for (const profileId in this.rawData) {
      for (const label in this.rawData[profileId]) {
        percentileTrees[label] = "placeholder";
      }
    }
    */

    // Pre-produce data for ReactSelect
    this.selectData = [];
    for (const profileId in this.rawData) {
      this.selectData.push({
        value: profileId,
        label: this.rawData[profileId][Labels.NAME],
      });
    }

    // Pre-produce a list of all player names
    this.names = [];
    for (const profileId in this.rawData) {
      this.names.push(this.rawData[profileId][Labels.NAME]);
    }
  }

  exists(profileId) {
    return Boolean(this.rawData[profileId]);
  }

  getName(profileId) {
    return this.rawData[profileId][Labels.NAME];
  }

  getAllNames() {
    return this.names;
  }

  getSelectData() {
    return this.selectData;
  }

  getPlayerRating(type, profileId) {
    return this.rawData[profileId][type];
  }

  getPlayerPercentile(type, profileId) {
    let rating = this.getPlayerRating(type, profileId);
    return this.getPercentileForRating(type, rating);
  }

  getRatingsArray(type) {
    return this.percentileTrees[type].getAllNumbers();
  }

  getPercentileForRating(type, value) {
    if (value === undefined) {
      return undefined;
    }
    return this.percentileTrees[type].getPercentile(value);
  }

  formatPercentage(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return "-";
    }
    if (value == 1) {
      return "100%";
    }
    let percentile = value * 100;

    let stringPercentile = percentile.toString();
    stringPercentile = stringPercentile.slice(
      0,
      stringPercentile.indexOf(".") + 2
    );
    return stringPercentile + "%";
  }
}

export default Data;
