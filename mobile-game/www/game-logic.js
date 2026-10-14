// Pure game rules, shared by the browser (window.StarLogic) and the tests (module.exports).
(function (root) {
  var W = 360, H = 640;
  var PLAYER_Y = H - 90, PLAYER_R = 18;

  function difficulty(score) {
    // Speed and spawn rate ramp up smoothly with score.
    var level = Math.min(score / 10, 12);
    return { fallSpeed: 150 + level * 22, spawnEvery: Math.max(0.35, 0.9 - level * 0.045) };
  }

  function hit(player, item) {
    var dx = player.x - item.x, dy = PLAYER_Y - item.y;
    var r = PLAYER_R + item.r;
    return dx * dx + dy * dy <= r * r;
  }

  function clampX(x) { return Math.max(PLAYER_R, Math.min(W - PLAYER_R, x)); }

  function spawn(rand) {
    var star = rand() < 0.35;
    var r = star ? 12 : 14 + rand() * 14;
    return { x: r + rand() * (W - 2 * r), y: -r, r: r, star: star, spin: rand() * 6.28 };
  }

  var api = { W: W, H: H, PLAYER_Y: PLAYER_Y, PLAYER_R: PLAYER_R, difficulty: difficulty, hit: hit, clampX: clampX, spawn: spawn };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StarLogic = api;
})(this);
