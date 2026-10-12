// Pure rules for Mafia and Imposter. Used by the browser (window.MafiaLogic) and the tests.
(function (root) {
  function shuffle(arr, rand) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // Mafia: 1 per 4 players (min 1), doctor from 5 players, detective from 6.
  // Players may choose a bigger mafia from 6 players: up to 1 mafia per 3 players.
  function maxMafia(n) { return Math.max(1, Math.floor(n / 3)); }
  function roleCounts(n, chosen) {
    var mafia = Math.max(1, Math.floor(n / 4));
    if (chosen) mafia = Math.max(1, Math.min(maxMafia(n), Math.floor(chosen)));
    return { mafia: mafia, doctor: n >= 5 ? 1 : 0, detective: n >= 6 ? 1 : 0, citizen: n - mafia - (n >= 5 ? 1 : 0) - (n >= 6 ? 1 : 0) };
  }

  function assignRoles(names, rand, mafiaCount) {
    var c = roleCounts(names.length, mafiaCount), roles = [], k;
    for (k in c) for (var i = 0; i < c[k]; i++) roles.push(k);
    roles = shuffle(roles, rand);
    return names.map(function (name, i) { return { id: i, name: name, role: roles[i], alive: true }; });
  }

  // Night: the mafia target dies unless the doctor protected them. Returns { killed: id|null, saved: bool }.
  function resolveNight(mafiaTarget, doctorTarget) {
    if (mafiaTarget == null) return { killed: null, saved: false };
    if (mafiaTarget === doctorTarget) return { killed: null, saved: true };
    return { killed: mafiaTarget, saved: false };
  }

  function kill(players, id) { players.forEach(function (p) { if (p.id === id) p.alive = false; }); }

  function winner(players) {
    var alive = players.filter(function (p) { return p.alive; });
    var mafia = alive.filter(function (p) { return p.role === 'mafia'; }).length;
    if (mafia === 0) return 'citizens';
    if (mafia >= alive.length - mafia) return 'mafia';
    return null;
  }

  function isMafia(p) { return p.role === 'mafia'; }

  // Imposter: 1 imposter, 2 from 8 players.
  function imposterCount(n) { return n >= 8 ? 2 : 1; }
  function pickImposters(n, rand) { return shuffle(Array.from({ length: n }, function (_, i) { return i; }), rand).slice(0, imposterCount(n)).sort(function (a, b) { return a - b; }); }
  function pickWord(words, rand) { return words[Math.floor(rand() * words.length)]; }
  // Clueless variant: a pair of similar words; the crew gets one, the imposter the other.
  function pickPair(pairs, rand) { var p = pairs[Math.floor(rand() * pairs.length)]; return rand() < 0.5 ? { crew: p[0], imposter: p[1] } : { crew: p[1], imposter: p[0] }; }
  // Hint shown to a classic imposter: 'none' | 'cat' | 'letter'.
  function firstLetter(word) { return Array.from(word.trim())[0] || ''; }

  var api = { shuffle: shuffle, maxMafia: maxMafia, pickPair: pickPair, firstLetter: firstLetter, roleCounts: roleCounts, assignRoles: assignRoles, resolveNight: resolveNight, kill: kill,
    winner: winner, isMafia: isMafia, imposterCount: imposterCount, pickImposters: pickImposters, pickWord: pickWord };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MafiaLogic = api;
})(this);
