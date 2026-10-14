// Pure rules for "Yalla Osta" (يلا يا أسطى). Browser: window.OstaLogic. Tests: require().
(function (root) {
  var LANES = [-0.62, 0, 0.62];          // lane centres across the road (-1 .. 1)
  var MAXD = 110;                        // how far ahead things appear
  var PLAYER_D = 6;                      // depth of the player's van
  var HIT_DEPTH = 1.6;                   // depth tolerance for a collision
  var TYPES = {
    car:     { w: 0.30, speed: [38, 78], weight: 55 },
    bus:     { w: 0.36, speed: [30, 60], weight: 12 },
    tuktuk:  { w: 0.22, speed: [20, 40], weight: 9 },
    rider:   { w: 0.0,  speed: [0, 0],   weight: 14, pickup: true },   // passenger waiting on the road
    bump:    { w: 0.60, speed: [0, 0],   weight: 10, bump: true }
  };
  var PLAYER_W = 0.30;

  function speedAt(km) { return Math.min(190, 70 + km * 14); }          // km/h as a function of distance travelled
  function spawnGap(speed) { return Math.max(0.28, 1.15 - speed / 190 * 0.8); }   // seconds between spawns
  function approach(playerSpeed, objSpeed) { return Math.max(0, playerSpeed - objSpeed) * 0.22; }   // depth units per second

  function pickType(rand) {
    var total = 0, k; for (k in TYPES) total += TYPES[k].weight;
    var r = rand() * total; for (k in TYPES) { r -= TYPES[k].weight; if (r <= 0) return k; } return 'car';
  }
  // Create 1 (sometimes 2) objects at the far end. Never blocks all three lanes with solid obstacles.
  function spawnRow(rand, blockedLanes) {
    var out = [], free = [0, 1, 2].filter(function (l) { return !(blockedLanes || []).includes(l); });
    var n = rand() < 0.3 ? 2 : 1, used = [];
    for (var i = 0; i < n && free.length; i++) {
      var lane = free.splice(Math.floor(rand() * free.length), 1)[0], type = pickType(rand), T = TYPES[type];
      var solid = !T.pickup && !T.bump;
      if (solid && used.filter(function (u) { return u.solid; }).length >= 1 && free.length < 1) break;   // keep one lane clear
      used.push({ lane: lane, solid: solid });
      out.push({ type: type, lane: lane, u: LANES[lane], d: MAXD, speed: T.speed[0] + rand() * (T.speed[1] - T.speed[0]), w: T.w, shift: 0 });
    }
    return out;
  }
  function laneOf(u) { var b = 0; LANES.forEach(function (l, i) { if (Math.abs(u - l) < Math.abs(u - LANES[b])) b = i; }); return b; }

  // Collision with the player's van at lateral position pu.
  function hit(pu, o) {
    if (Math.abs(o.d - PLAYER_D) > HIT_DEPTH) return false;
    var half = o.pickup || o.type === 'rider' ? 0.26 : (o.w + PLAYER_W) / 2;
    return Math.abs(o.u - pu) < half;
  }
  // Horn: slower cars ahead in the player's lane (and close) move to the freest neighbouring lane. Returns moved objects.
  function honk(pu, objs) {
    var moved = [], lane = laneOf(pu);
    objs.forEach(function (o) {
      var T = TYPES[o.type]; if (!T || T.pickup || T.bump || o.d < PLAYER_D + 2 || o.d > 55) return;
      if (laneOf(o.u) !== lane) return;
      var options = [lane - 1, lane + 1].filter(function (l) { return l >= 0 && l <= 2; });
      var best = options.sort(function (a, b) { return clearance(objs, o, a) - clearance(objs, o, b); }).pop();
      if (best != null) { o.target = LANES[best]; moved.push(o); }
    });
    return moved;
  }
  function clearance(objs, self, lane) {
    var c = 0; objs.forEach(function (o) { if (o !== self && laneOf(o.u) === lane && Math.abs(o.d - self.d) < 14) c -= 1; }); return c;
  }

  var api = { LANES: LANES, MAXD: MAXD, PLAYER_D: PLAYER_D, PLAYER_W: PLAYER_W, TYPES: TYPES, speedAt: speedAt, spawnGap: spawnGap, approach: approach,
    pickType: pickType, spawnRow: spawnRow, laneOf: laneOf, hit: hit, honk: honk };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.OstaLogic = api;
})(this);
