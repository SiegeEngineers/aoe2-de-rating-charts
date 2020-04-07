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
    // Indexes in the raw data are different than the ones on the processed data
    const RAW_PROFILE_ID = 0;
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

    // Sort decending order by soloRating so we can determine rankings and a few other metrics
    arrayData.sort(function(a, b) {
      if (a[RAW_SOLO_RATING] === b[RAW_SOLO_RATING]) {
        return 0;
      } else if (!a[RAW_SOLO_RATING]) {
        return 1;
      } else if (!b[RAW_SOLO_RATING]) {
        return -1;
      }
      return a[RAW_SOLO_RATING] < b[RAW_SOLO_RATING] ? 1 : -1;
    });

    for (let i = 0; i < arrayData.length; i++) {
      console.log(
        arrayData[i][RAW_PROFILE_ID],
        arrayData[i][RAW_SOLO_RATING],
        arrayData[i][RAW_NAME]
      );
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

      if (soloRating && teamRating) {
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
      const profileId = arrayData[i][RAW_PROFILE_ID];
      this.data[profileId] = arrayData[i].slice(1, arrayData[i].length);
    }

    let profileIds = Object.keys(this.data);

    // Precalculate solo data
    this.soloData = [];
    for (let i = 0; i < profileIds.length; i++) {
      this.soloData.push(this.getSoloRating(profileIds[i]));
    }

    // Precalculate team data
    this.teamData = [];
    for (let i = 0; i < profileIds.length; i++) {
      this.teamData.push(this.getTeamRating(profileIds[i]));
    }

    // Precalculate names
    this.names = [];
    for (let i = 0; i < profileIds.length; i++) {
      this.names.push(this.getName(profileIds[i]));
    }

    // Precalculate Select data
    this.selectData = [];
    for (let i = 0; i < profileIds.length; i++) {
      let profileId = profileIds[i];
      this.selectData.push({
        value: profileId,
        label: this.data[profileId][NAME]
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

  getAllNames() {
    return this.names;
  }

  exists(profileId) {
    return Boolean(this.data[profileId]);
  }

  getName(profileId) {
    return this.data[profileId][NAME];
  }

  getSoloRating(profileId) {
    return this.data[profileId][SOLO_RATING];
  }

  getSoloRank(profileId) {
    return this.data[profileId][SOLO_RANK];
  }

  getSoloPercentile(profileId) {
    let soloRank = this.getSoloRank(profileId);
    if (!soloRank) {
      return null;
    }
    return (this.totalSoloPlayers - (soloRank - 1)) / this.totalSoloPlayers;
  }

  getTeamRank(profileId) {
    return this.data[profileId][TEAM_RANK];
  }

  getTeamRating(profileId) {
    return this.data[profileId][TEAM_RATING];
  }

  getTeamPercentile(profileId) {
    let teamRank = this.getTeamRank(profileId);
    if (!teamRank) {
      return null;
    }
    return (this.totalTeamPlayers - (teamRank - 1)) / this.totalTeamPlayers;
  }

  getComboRating(profileId) {
    return this.data[profileId][COMBO_RATING];
  }

  getComboRank(profileId) {
    return this.data[profileId][COMBO_RANK];
  }

  getComboPercentile(profileId) {
    let comboRank = this.getComboRank(profileId);
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
