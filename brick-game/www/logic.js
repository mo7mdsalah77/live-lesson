// Pure rules for the ruler-and-bricks game. Browser: window.BrickLogic. Tests: require().
(function (root) {
  var W = 360, H = 640, PADDLE_Y = 495, PADDLE_H = 14, BALL_R = 7, COLS = 8, BW = 40, BH = 18, TOP = 90, LEFT = (W - COLS * BW) / 2;
  var COLORS = ['#ff5a6e', '#ff9f43', '#ffd23f', '#5ee27a', '#4ecdc4', '#6bb7ff', '#a58bff'];

  function speedFor(level) { return Math.min(560, 330 + 20 * level); }
  // Where the ball hits the ruler decides the angle: centre = straight up, edges = up to 62 degrees.
  function paddleBounce(ballX, paddleX, paddleW, speed) {
    var off = Math.max(-1, Math.min(1, (ballX - paddleX) / (paddleW / 2))), a = off * 62 * Math.PI / 180;
    return { vx: Math.sin(a) * speed, vy: -Math.cos(a) * speed };
  }
  // Circle against a brick rectangle. Returns which axis to reflect, or null.
  function circleRect(bx, by, r, k) {
    var cx = k.x + BW / 2, cy = k.y + BH / 2, dx = bx - cx, dy = by - cy, ox = BW / 2 + r - Math.abs(dx), oy = BH / 2 + r - Math.abs(dy);
    if (ox <= 0 || oy <= 0) return null;
    var nx = Math.max(k.x, Math.min(bx, k.x + BW)) - bx, ny = Math.max(k.y, Math.min(by, k.y + BH)) - by;
    if (nx * nx + ny * ny > r * r) return null;                       // corner miss
    return ox < oy ? 'x' : 'y';
  }

  // Level patterns: '.' empty, digit = hit points, '#' unbreakable.
  var PATTERNS = [
    ['11111111', '22222222', '11111111', '22222222'],
    ['..1111..', '.222222.', '11111111', '.222222.', '..1111..'],
    ['1.1.1.1.', '.1.1.1.1', '1.1.1.1.', '.1.1.1.1', '2.2.2.2.'],
    ['11111111', '#......#', '22222222', '#......#', '11111111'],
    ['2222222.', '.2222222', '2222222.', '.2222222', '3333333.', '.3333333'],
    ['########', '11111111', '22222222', '33333333', '22222222', '11111111'],
    ['3.3.3.3.', '.2.2.2.2', '1#1#1#1#', '.2.2.2.2', '3.3.3.3.'],
    ['33333333', '3......3', '3.2222.3', '3.2##2.3', '3.2222.3', '3......3', '33333333']
  ];
  function buildLevel(n) {
    var pat = PATTERNS[(n - 1) % PATTERNS.length], boost = Math.floor((n - 1) / PATTERNS.length), bricks = [];
    pat.forEach(function (row, r) {
      for (var c = 0; c < COLS; c++) {
        var ch = row.charAt(c); if (ch === '.') continue;
        var solid = ch === '#', hp = solid ? 99 : Math.min(4, +ch + boost);
        bricks.push({ x: LEFT + c * BW, y: TOP + r * BH, hp: hp, max: hp, solid: solid, color: solid ? '#7a7f8c' : COLORS[(r + c) % COLORS.length] });
      }
    });
    return bricks;
  }
  function remaining(bricks) { return bricks.filter(function (b) { return !b.solid && b.hp > 0; }).length; }
  function hitBrick(b) { if (b.solid) return 0; b.hp--; return b.hp <= 0 ? 50 + 10 * b.max : 10; }

  var POWER = ['wide', 'multi', 'slow', 'life'];
  function maybeDrop(rand) { return rand() < 0.2 ? POWER[Math.floor(rand() * POWER.length)] : null; }

  var api = { W: W, H: H, PADDLE_Y: PADDLE_Y, PADDLE_H: PADDLE_H, BALL_R: BALL_R, COLS: COLS, BW: BW, BH: BH, TOP: TOP, LEFT: LEFT, speedFor: speedFor, paddleBounce: paddleBounce,
    circleRect: circleRect, buildLevel: buildLevel, remaining: remaining, hitBrick: hitBrick, maybeDrop: maybeDrop, POWER: POWER, PATTERNS: PATTERNS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BrickLogic = api;
})(this);
