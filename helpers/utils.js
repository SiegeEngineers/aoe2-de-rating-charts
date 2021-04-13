const NAME = "N";
const UNRANKED_RATING = "0";
const DEATHMATCH_RATING = "1";
const TEAM_DEATHMATCH_RATING = "2";
const RANDOM_MAP_RATING = "3";
const TEAM_RANDOM_MAP_RATING = "4";
const RANDOM_MAP_COMBO_RATING = "5";
const DEATHMATCH_COMBO_RATING = "6";

// Also contains constants
class Utils {
  /**
   * Swaps keys and values on a json object
   */
  static invert(json) {
    var ret = {};
    for (var key in json) {
      ret[json[key]] = key;
    }
    return ret;
  }

  static getLeaderboardLabels() {
    return Object.freeze({
      0: UNRANKED_RATING,
      1: DEATHMATCH_RATING,
      2: TEAM_DEATHMATCH_RATING,
      3: RANDOM_MAP_RATING,
      4: TEAM_RANDOM_MAP_RATING,
    });
  }

  static getAllLabels() {
    return Object.freeze({
      NAME: NAME,
      UNRANKED_RATING: UNRANKED_RATING,
      DEATHMATCH_RATING: DEATHMATCH_RATING,
      TEAM_DEATHMATCH_RATING: TEAM_DEATHMATCH_RATING,
      RANDOM_MAP_RATING: RANDOM_MAP_RATING,
      TEAM_RANDOM_MAP_RATING: TEAM_RANDOM_MAP_RATING,
      RANDOM_MAP_COMBO_RATING: RANDOM_MAP_COMBO_RATING,
      DEATHMATCH_COMBO_RATING: DEATHMATCH_COMBO_RATING,
    });
  }
}

export default Utils;
