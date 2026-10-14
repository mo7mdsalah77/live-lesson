const test = require('node:test');
const assert = require('node:assert');
const L = require('../www/game-logic.js');

test('difficulty ramps up and caps', () => {
  assert.ok(L.difficulty(100).fallSpeed > L.difficulty(0).fallSpeed);
  assert.deepStrictEqual(L.difficulty(1000), L.difficulty(5000));
  assert.ok(L.difficulty(1000).spawnEvery >= 0.35);
});

test('hit detects overlap only', () => {
  assert.ok(L.hit({ x: 100 }, { x: 100, y: L.PLAYER_Y, r: 10 }));
  assert.ok(!L.hit({ x: 100 }, { x: 300, y: L.PLAYER_Y, r: 10 }));
  assert.ok(!L.hit({ x: 100 }, { x: 100, y: 0, r: 10 }));
});

test('clampX keeps the ship on screen', () => {
  assert.strictEqual(L.clampX(-50), L.PLAYER_R);
  assert.strictEqual(L.clampX(9999), L.W - L.PLAYER_R);
  assert.strictEqual(L.clampX(180), 180);
});

test('spawn stays inside the field', () => {
  for (let i = 0; i < 500; i++) {
    const s = L.spawn(Math.random);
    assert.ok(s.x - s.r >= 0 && s.x + s.r <= L.W);
    assert.ok(s.y < 0);
  }
});
