const test = require('node:test');
const assert = require('node:assert');
const L = require('../www/logic.js');

test('speed ramps with distance and caps', () => {
  assert.strictEqual(L.speedAt(0), 70);
  assert.ok(L.speedAt(3) > L.speedAt(1));
  assert.strictEqual(L.speedAt(500), 190);
  assert.ok(L.spawnGap(190) < L.spawnGap(70) && L.spawnGap(190) >= 0.28);
});

test('spawn never fills every lane with solid traffic', () => {
  for (let i = 0; i < 3000; i++) {
    const row = L.spawnRow(Math.random, []);
    const solid = row.filter(o => !L.TYPES[o.type].pickup && !L.TYPES[o.type].bump);
    assert.ok(row.length >= 1 && row.length <= 2);
    assert.ok(solid.length <= 2);
    assert.strictEqual(new Set(row.map(o => o.lane)).size, row.length);
    row.forEach(o => assert.ok(o.d === L.MAXD && o.lane >= 0 && o.lane <= 2));
  }
  assert.strictEqual(L.spawnRow(Math.random, [0, 1, 2]).length, 0);   // nothing to place when every lane is blocked
});

test('type distribution includes every type', () => {
  const seen = new Set(); for (let i = 0; i < 2000; i++) seen.add(L.pickType(Math.random));
  assert.deepStrictEqual([...seen].sort(), Object.keys(L.TYPES).sort());
});

test('collision needs depth and lateral overlap', () => {
  const car = { type: 'car', u: 0, d: L.PLAYER_D, w: 0.3 };
  assert.ok(L.hit(0.1, car));
  assert.ok(!L.hit(0.62, car));
  assert.ok(!L.hit(0, { ...car, d: L.PLAYER_D + 5 }));
  assert.ok(L.hit(0.2, { type: 'rider', u: 0, d: L.PLAYER_D, w: 0 }));
});

test('honk moves slower cars out of the player lane only', () => {
  const objs = [
    { type: 'car', u: 0, d: 20, w: 0.3 }, { type: 'car', u: 0.62, d: 20, w: 0.3 },
    { type: 'bump', u: 0, d: 15, w: 0.6 }, { type: 'car', u: 0, d: 90, w: 0.3 }
  ];
  const moved = L.honk(0, objs);
  assert.strictEqual(moved.length, 1);
  assert.strictEqual(moved[0], objs[0]);
  assert.strictEqual(L.laneOf(moved[0].target), 0);   // the right lane is occupied, so it goes left (lane 0)
  assert.strictEqual(objs[1].target, undefined);
});
