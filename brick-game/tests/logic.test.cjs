const test = require('node:test');
const assert = require('node:assert');
const B = require('../www/logic.js');

test('ruler bounce: centre goes straight up, edges angle outward, speed is preserved', () => {
  const c = B.paddleBounce(180, 180, 80, 400), r = B.paddleBounce(220, 180, 80, 400), l = B.paddleBounce(140, 180, 80, 400);
  assert.ok(Math.abs(c.vx) < 1e-9 && c.vy < 0);
  assert.ok(r.vx > 0 && l.vx < 0 && r.vy < 0);
  assert.ok(Math.abs(Math.hypot(r.vx, r.vy) - 400) < 1e-6);
  assert.ok(B.paddleBounce(900, 180, 80, 400).vx < 400 * 0.9 + 1);     // clamped at the edge angle
});

test('circle vs brick: side and top hits pick the right axis, near misses do not hit', () => {
  const k = { x: 100, y: 100 };
  assert.strictEqual(B.circleRect(120, 94, 7, k), 'y');           // from above
  assert.strictEqual(B.circleRect(94, 109, 7, k), 'x');           // from the left
  assert.strictEqual(B.circleRect(300, 300, 7, k), null);
  assert.strictEqual(B.circleRect(94, 94, 7, k), null);      // diagonal corner gap
});

test('every level builds in bounds with something breakable', () => {
  for (let n = 1; n <= 24; n++) {
    const bs = B.buildLevel(n);
    assert.ok(B.remaining(bs) > 0);
    bs.forEach(b => assert.ok(b.x >= 0 && b.x + B.BW <= B.W && b.y >= B.TOP && b.y < 300));
  }
  assert.ok(B.buildLevel(9).some(b => b.max > 1) && B.speedFor(5) > B.speedFor(1) && B.speedFor(100) === 560);
});

test('bricks take hits; unbreakable ones never break', () => {
  const b = { hp: 2, max: 2, solid: false };
  assert.strictEqual(B.hitBrick(b), 10); assert.strictEqual(B.hitBrick(b), 70); assert.ok(b.hp <= 0);
  const s = { hp: 99, max: 99, solid: true }; assert.strictEqual(B.hitBrick(s), 0); assert.strictEqual(s.hp, 99);
});

test('power-up drops are occasional and valid', () => {
  let n = 0; for (let i = 0; i < 2000; i++) { const p = B.maybeDrop(Math.random); if (p) { n++; assert.ok(B.POWER.includes(p)); } }
  assert.ok(n > 200 && n < 700);
});
