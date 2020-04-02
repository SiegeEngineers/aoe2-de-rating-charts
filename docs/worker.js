// worker.js
self.addEventListener(
  "message",
  function(message) {
    let data = message.data;
    let needle = data.query;
    let haystack = data.data;
    let maxCandidates = data.limit;
    let blacklist = data.blacklist ? data.blacklist : [];
    let t0 = performance.now();

    if (needle == null || needle == undefined) {
      self.postMessage([]);
      return;
    }

    let candidates = [];
    needle = simplifyString(needle);
    for (let i = 0; i < haystack.length; i++) {
      let candidateString = simplifyString(haystack[i].label);
      if (
        candidateString.includes(needle) &&
        !blacklist.includes(haystack[i].value)
      ) {
        candidates.push(haystack[i]);
      }
      if (candidates.length >= maxCandidates) {
        break;
      }
    }
    var t1 = performance.now();
    console.log("Webworker query took " + (t1 - t0) + " milliseconds.");
    self.postMessage(candidates);
  },
  false
);

function simplifyString(input) {
  // To lower case
  input = input.toLowerCase();

  // Remove accents
  // https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
  input = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return input;
}
