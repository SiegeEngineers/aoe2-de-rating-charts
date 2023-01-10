const NAME = "N";
const UNRANKED_RATING = "0";
const DEATHMATCH_RATING = "1";
const TEAM_DEATHMATCH_RATING = "2";
const RANDOM_MAP_RATING = "3";
const TEAM_RANDOM_MAP_RATING = "4";
const RANDOM_MAP_COMBO_RATING = "5";
const DEATHMATCH_COMBO_RATING = "6";
const EMPIRE_WARS_RATING = "7";
const EMPIRE_WARS_TEAM_RATING = "8";
const EMPIRE_WARS_COMBO_RATING = "9";

// Also contains constants
class Utils {
  /**
   * Swaps keys and values on a json object
   */
  static invert(json) {
    let ret = {};
    for (let key in json) {
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
      13: EMPIRE_WARS_RATING,
      14: EMPIRE_WARS_TEAM_RATING,
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
      EMPIRE_WARS_RATING: EMPIRE_WARS_RATING,
      EMPIRE_WARS_TEAM_RATING: EMPIRE_WARS_TEAM_RATING,
      EMPIRE_WARS_COMBO_RATING: EMPIRE_WARS_COMBO_RATING,
    });
  }

  static linearRegression(y, x) {
    var lr = {};
    var n = y.length;
    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_xx = 0;
    var sum_yy = 0;

    for (var i = 0; i < y.length; i++) {
      sum_x += x[i];
      sum_y += y[i];
      sum_xy += x[i] * y[i];
      sum_xx += x[i] * x[i];
      sum_yy += y[i] * y[i];
    }
    console.log(sum_x, sum_y, sum_xy, sum_xx, sum_yy);

    lr["slope"] = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
    lr["intercept"] = (sum_y - lr.slope * sum_x) / n;
    lr["r2"] = Math.pow(
      (n * sum_xy - sum_x * sum_y) /
        Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y)),
      2
    );

    return lr;
  }

  /**
   * Math.min and Math.max can result in call stack overflows with large arrays.
   *
   * Also, when we need to calculate max and min at the same this saves us a trip through the array.
   */
  static getMinAndMax(arrayInput) {
    if (arrayInput.length === 0) {
      return {
        max: 0,
        min: 0,
      };
    } else {
      let min = Number.MAX_SAFE_INTEGER;
      let max = Number.MIN_SAFE_INTEGER;
      for (let i = 0; i < arrayInput.length; i++) {
        let value = arrayInput[i];
        if (min > value) {
          min = value;
        }
        if (max < value) {
          max = value;
        }
      }
      return {
        max,
        min,
      };
    }
  }
}

export default Utils;
