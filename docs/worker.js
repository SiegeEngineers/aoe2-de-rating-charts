// worker.js
self.addEventListener(
  "message",
  function(e) {
    let data = e.data;
    let needle = data.query;
    let haystack = data.data;
    let maxCandidates = data.limit;
    let t0 = performance.now();

    let candidates = [];
    needle = simplifyString(needle);
    for (let i = 0; i < haystack.length; i++) {
      let candidateString = simplifyString(haystack[i][0]);
      if (candidateString.includes(needle)) {
        candidates.push({
          value: haystack[i],
          label: haystack[i][0]
        });
      }
      if (candidates.length >= maxCandidates) {
        break;
      }
    }
    var t1 = performance.now();
    console.log(
      "Webworker query took " + (t1 - t0) + " milliseconds.",
      haystack.length
    );
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
