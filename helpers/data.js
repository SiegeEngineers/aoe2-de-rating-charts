/**
 * This class is responsible for holding API data, calculating derived stats, and formating such data for ui component consumption.
 *
 * In several cases here we are assuming nobody will ever have a 0 rating.
 */
const NAME = 0;
const SOLO_RATING = 1;
const TEAM_RATING = 2;
const COMBO_RATING = 3;
const SOLO_RANK = 4;
const TEAM_RANK = 5;
const COMBO_RANK = 6;

class Data {
  constructor(rawData) {
    // Indexes in the raw data are fifferent than the ones on the processed data
    const RAW_STEAM_ID = 0;
    const RAW_NAME = 1;
    const RAW_SOLO_RATING = 2;
    const RAW_TEAM_RATING = 3;
    const RAW_COMBO_RATING = 4;
    const RAW_SOLO_RANK = 5;
    const RAW_TEAM_RANK = 6;
    const RAW_COMBO_RANK = 7;

    let arrayData = JSON.parse(rawData);
    this.totalPlayers = arrayData.length;
    this.totalSoloPlayers = 0;
    this.totalTeamPlayers = 0;
    this.totalBothPlayers = 0;

    // Assumes rawData is in decending order by soloRating
    for (let i = 0; i < arrayData.length; i++) {
      const soloRating = arrayData[i][RAW_SOLO_RATING];
      const teamRating = arrayData[i][RAW_TEAM_RATING];

      const soloRank = soloRating ? i + 1 : null;
      arrayData[i][RAW_SOLO_RANK] = soloRank;

      const comboRanking =
        soloRating && teamRating
          ? Math.round(
              Math.sqrt(Math.pow(soloRating, 2) + Math.pow(teamRating, 2))
            )
          : null;

      arrayData[i][RAW_COMBO_RATING] = comboRanking;

      if (soloRating) {
        this.totalSoloPlayers++;
      }

      if (teamRating) {
        this.totalTeamPlayers++;
      }

      if (soloRating && soloRating) {
        this.totalBothPlayers++;
      }
    }

    // Calculate team rankings
    let copy = arrayData.slice(0);
    copy.sort(function(a, b) {
      if (a[RAW_TEAM_RATING] === b[RAW_TEAM_RATING]) {
        return 0;
      } else if (!a[RAW_TEAM_RATING]) {
        return 1;
      } else if (!b[RAW_TEAM_RATING]) {
        return -1;
      }
      return a[RAW_TEAM_RATING] < b[RAW_TEAM_RATING] ? 1 : -1;
    });

    for (let i = 0; i < copy.length; i++) {
      const teamRating = copy[i][RAW_TEAM_RATING];
      if (!copy[i][RAW_TEAM_RATING]) {
        break;
      }
      const teamRank = teamRating ? i + 1 : null;
      copy[i][RAW_TEAM_RANK] = teamRank;
    }

    // Calculate combo rankings
    copy.sort(function(a, b) {
      if (a[RAW_COMBO_RATING] === b[RAW_COMBO_RATING]) {
        return 0;
      } else if (!a[RAW_COMBO_RATING]) {
        return 1;
      } else if (!b[RAW_COMBO_RATING]) {
        return -1;
      }
      return a[RAW_COMBO_RATING] < b[RAW_COMBO_RATING] ? 1 : -1;
    });

    for (let i = 0; i < copy.length; i++) {
      const comboRating = copy[i][RAW_COMBO_RATING];
      if (!copy[i][RAW_COMBO_RATING]) {
        break;
      }
      const comboRank = comboRating ? i + 1 : null;
      copy[i][RAW_COMBO_RANK] = comboRank;
    }

    // Format the data as an object internally for quick lookup
    this.data = {};
    for (let i = 0; i < arrayData.length; i++) {
      const steamId = arrayData[i][RAW_STEAM_ID];
      this.data[steamId] = arrayData[i].slice(1, arrayData[i].length);
    }

    let steamIds = Object.keys(this.data);

    // Precalculate solo data
    this.soloData = [];
    for (let i = 0; i < steamIds.length; i++) {
      this.soloData.push(this.getSoloRating(steamIds[i]));
    }

    // Precalculate team data
    this.teamData = [];
    for (let i = 0; i < steamIds.length; i++) {
      this.teamData.push(this.getTeamRating(steamIds[i]));
    }

    // Precalculate Select data
    this.selectData = [];
    for (let i = 0; i < steamIds.length; i++) {
      let steamId = steamIds[i];
      this.selectData.push({
        value: steamId,
        label: this.data[steamId][NAME]
      });
    }
  }

  getSelectData() {
    return this.selectData;
  }

  getAllTeamRatings() {
    return this.teamData;
  }

  getAllSoloRatings() {
    return this.soloData;
  }

  getName(steamId) {
    return this.data[steamId][NAME];
  }

  getSoloRating(steamId) {
    return this.data[steamId][SOLO_RATING];
  }

  getSoloRank(steamId) {
    return this.data[steamId][SOLO_RANK];
  }

  getSoloPercentile(steamId) {
    let soloRank = this.getSoloRank(steamId);
    if (!soloRank) {
      return null;
    }
    return (this.totalSoloPlayers - (soloRank - 1)) / this.totalSoloPlayers;
  }

  getTeamRank(steamId) {
    return this.data[steamId][TEAM_RANK];
  }

  getTeamRating(steamId) {
    return this.data[steamId][TEAM_RATING];
  }

  getTeamPercentile(steamId) {
    let teamRank = this.getTeamRank(steamId);
    if (!teamRank) {
      return null;
    }
    return (this.totalTeamPlayers - (teamRank - 1)) / this.totalTeamPlayers;
  }

  getComboRating(steamId) {
    return this.data[steamId][COMBO_RATING];
  }

  getComboRank(steamId) {
    return this.data[steamId][COMBO_RANK];
  }

  getComboPercentile(steamId) {
    let comboRank = this.getComboRank(steamId);
    if (!comboRank) {
      return comboRank;
    }
    return (this.totalSoloPlayers - (comboRank - 1)) / this.totalSoloPlayers;
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
