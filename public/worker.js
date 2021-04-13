self.addEventListener(
  "message",
  function (message) {
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
        haystack[i].levenstein = levenstein(candidateString, needle);
      }
    }
    candidates.sort((a, b) => (a.levenstein > b.levenstein ? 1 : -1));
    candidates.forEach((v) => delete v.levenstein);
    self.postMessage(candidates.slice(0, maxCandidates));
    var t1 = performance.now();
    console.log("Webworker query took " + (t1 - t0) + " milliseconds.");
  },
  false
);

function simplifyString(input) {
  input = input.toLowerCase();

  // Remove accents
  // https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
  input = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return input;
}

function levenstein(sA, sB) {
  var a = sA,
    b = sB + "",
    m = [],
    i,
    j,
    min = Math.min;

  if (!(a && b)) return (b || a).length;

  for (i = 0; i <= b.length; m[i] = [i++]);
  for (j = 0; j <= a.length; m[0][j] = j++);

  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      m[i][j] =
        b.charAt(i - 1) == a.charAt(j - 1)
          ? m[i - 1][j - 1]
          : (m[i][j] = min(
              m[i - 1][j - 1] + 1,
              min(m[i][j - 1] + 1, m[i - 1][j] + 1)
            ));
    }
  }

  return m[b.length][a.length];
}
