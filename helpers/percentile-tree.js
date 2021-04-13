/*
 * Not the best lib for our purpose because we don't need the 'functional' aspect.
 * In fact, it probably slows us down and bloats the memory. But it is a key-value,
 * popular module that had the methods we need and I didn't see an obvious alternative
 * when I added it.
 */
const Tree = require("functional-red-black-tree");

/**
 * Data structure for calculating percentiles of a series of numbers.
 *
 * Using a tree here allows calculation of percentiles for numbers that are not in
 * the input data set.
 *
 * Note: This class's constructor is tailored to accept the data object we have for
 * this project. This class would be more intuitive and re-usable if it accepted an
 * array of numbers instead.
 */
class PercentileTree {
  constructor(dataObject, field, suppressArrayGeneration) {
    this.tree = Tree();
    this.values = []; // We'll keep track of all the values too (unless suppressed by constructor argument p preserve memory)

    // First, add entries to the tree for each value, counting the duplicates
    let totalEntries = 0;
    for (const profileId in dataObject) {
      let number = dataObject[profileId][field];

      if (!suppressArrayGeneration) {
        this.values.push(number);
      }

      if (number === undefined) {
        continue;
      }

      let iter = this.tree.find(number);
      if (iter === null || iter.node === null) {
        // New number - add it to the tree
        this.tree = this.tree.insert(number, 1);
      } else {
        // Existing number - update the value
        iter.node.value = iter.node.value + 1;
      }

      totalEntries++;
    }

    // Next, update the tree such that the values are percentiles
    let countOfNumbersPassed = 0;
    for (let iter = this.tree.begin; iter.hasNext; iter.next()) {
      // The count of numbers higher than this one (excluding this number) div total numbers (excluding this one)
      let percentile = countOfNumbersPassed / (totalEntries - 1);

      // Update the number we have passed
      countOfNumbersPassed = countOfNumbersPassed + iter.node.value;

      // Update the tree's value to reflect the calculated percentage
      iter.node.value = percentile;
    }
  }

  getPercentile(value) {
    return this.tree.le(value).value;
  }

  getAllNumbers() {
    return this.values;
  }
}

export default PercentileTree;
