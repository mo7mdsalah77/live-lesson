const test = require('node:test');
const assert = require('node:assert');
const C = require('../www/logic.js');

test('landing: good on the opposite end, wrong on the standing end, miss outside', () => {
  // clown stands on the left end -> must land on the right end (x = seesaw + 50)
  assert.strictEqual(C.landing(180 + C.END, 180, 'L').result, 'good');
  assert.strictEqual(C.landing(180 - C.END, 180, 'L').result, 'wrong');
  assert.strictEqual(C.landing(30, 180, 'L').result, 'miss');
  assert.strictEqual(C.landing(180 - C.END, 180, 'R').result, 'good');
  assert.ok(C.landing(180 + C.END, 180, 'L').accuracy > C.landing(180 + C.END + 25, 180, 'L').accuracy);
});

test('launch always reaches the balloon rows and flings inward', () => {
  const l = C.launch('L', 0, 0), top = C.ROWS[0].y;
  assert.ok(C.apexY(C.PLANE_Y, l.vy) < C.ROWS[2].y);            // reaches at least the bottom balloon row
  assert.ok(C.apexY(C.PLANE_Y, C.launch('L', 1, 0).vy) < top);   // a perfect catch reaches the top row
  assert.ok(C.launch('L', 0.5, 0).vx > 0 && C.launch('R', 0.5, 0).vx < 0);
  assert.ok(C.launch('L', 0, 400).vx > C.launch('L', 0, 0).vx);  // seesaw momentum carries over
});

test('waves: 3 rows, exactly one gold balloon, speeds grow with the wave', () => {
  const w1 = C.newWave(1, Math.random), w5 = C.newWave(5, Math.random);
  assert.strictEqual(w1.balloons.length, 3 * C.PER_ROW);
  assert.strictEqual(w1.balloons.filter(b => b.gold).length, 1);
  assert.ok(Math.abs(w5.speeds[0]) > Math.abs(w1.speeds[0]));
  assert.ok(w1.speeds[0] * w1.speeds[1] < 0);                    // neighbouring rows drift in opposite directions
});

test('balloons wrap around, pop on contact, wave clears', () => {
  const w = C.newWave(1, Math.random);
  for (let i = 0; i < 2000; i++) C.moveBalloons(w, 0.05);
  assert.ok(w.balloons.every(b => b.x > -20 && b.x < C.W + 20));
  const b = w.balloons[5], hits = C.popAt(w, b.x, b.y, 16);
  assert.ok(hits.includes(b) && !b.alive);
  assert.strictEqual(C.popAt(w, b.x, b.y, 16).includes(b), false);   // already popped
  assert.ok(!C.cleared(w)); w.balloons.forEach(x => x.alive = false); assert.ok(C.cleared(w));
  assert.ok(C.waveBonus(3) > C.waveBonus(1));
});
