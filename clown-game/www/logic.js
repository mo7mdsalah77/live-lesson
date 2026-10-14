// Pure rules for the seesaw clown game. Browser: window.ClownLogic. Tests: require().
(function (root) {
  var W = 360, H = 640, G = 900, BOARD_Y = 568, PLANE_Y = BOARD_Y - 24, END = 50, HALF = 66, CATCH_R = 34;
  var ROWS = [{ y: 96, pts: 30 }, { y: 128, pts: 20 }, { y: 160, pts: 10 }], PER_ROW = 11, BALLOON_R = 13;
  var COLORS = ['#ff5a6e', '#ffd23f', '#4ecdc4', '#7b6cff', '#ff9f43', '#5ee27a'];

  function endX(seesawX, side) { return seesawX + (side === 'L' ? -END : END); }
  // The falling clown must land on the end OPPOSITE to the one the standing clown is on.
  function landing(clownX, seesawX, standSide) {
    var target = endX(seesawX, standSide === 'L' ? 'R' : 'L'), off = Math.abs(clownX - target);
    if (off <= CATCH_R) return { result: 'good', target: target, accuracy: 1 - off / CATCH_R };
    if (Math.abs(clownX - seesawX) <= HALF + 10) return { result: 'wrong', target: target, accuracy: 0 };
    return { result: 'miss', target: target, accuracy: 0 };
  }
  // Launch the standing clown: always high enough to reach the balloons, higher for a precise catch. Moves inward + seesaw momentum.
  function launch(standSide, accuracy, seesawVel) {
    return { vy: -(900 + 110 * accuracy), vx: (standSide === 'L' ? 1 : -1) * 70 + (seesawVel || 0) * 0.35 };
  }
  function apexY(startY, vy) { return startY - vy * vy / (2 * G); }

  function newWave(n, rand) {
    var balloons = [], gold = Math.floor(rand() * ROWS.length * PER_ROW);
    ROWS.forEach(function (r, ri) {
      for (var i = 0; i < PER_ROW; i++) balloons.push({ x: 24 + i * ((W - 48) / (PER_ROW - 1)), y: r.y, row: ri, pts: r.pts, color: COLORS[(i + ri * 2) % COLORS.length], alive: true, gold: false });
    });
    balloons[gold].gold = true; balloons[gold].pts = 100; balloons[gold].color = '#ffc400';
    return { balloons: balloons, speeds: ROWS.map(function (r, ri) { return (ri % 2 ? -1 : 1) * (14 + 9 * n + ri * 4); }) };
  }
  function moveBalloons(wave, dt) {
    wave.balloons.forEach(function (b) { b.x += wave.speeds[b.row] * dt; if (b.x > W + 16) b.x -= W + 32; if (b.x < -16) b.x += W + 32; });
  }
  function popAt(wave, x, y, r) {
    var hits = [];
    wave.balloons.forEach(function (b) { if (b.alive && (b.x - x) * (b.x - x) + (b.y - y) * (b.y - y) <= (BALLOON_R + r) * (BALLOON_R + r)) { b.alive = false; hits.push(b); } });
    return hits;
  }
  function cleared(wave) { return wave.balloons.every(function (b) { return !b.alive; }); }
  function waveBonus(n) { return 100 + 50 * n; }

  var api = { W: W, H: H, G: G, BOARD_Y: BOARD_Y, PLANE_Y: PLANE_Y, END: END, HALF: HALF, CATCH_R: CATCH_R, ROWS: ROWS, PER_ROW: PER_ROW, BALLOON_R: BALLOON_R,
    endX: endX, landing: landing, launch: launch, apexY: apexY, newWave: newWave, moveBalloons: moveBalloons, popAt: popAt, cleared: cleared, waveBonus: waveBonus };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ClownLogic = api;
})(this);
