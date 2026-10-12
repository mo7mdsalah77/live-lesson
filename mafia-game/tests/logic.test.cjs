const test = require('node:test');
const assert = require('node:assert');
const L = require('../www/logic.js');

test('role counts add up for every group size', () => {
  for (let n = 4; n <= 20; n++) {
    const c = L.roleCounts(n);
    assert.strictEqual(c.mafia + c.doctor + c.detective + c.citizen, n);
    assert.ok(c.mafia >= 1 && c.citizen >= 1 && c.mafia < n / 2);
  }
  assert.deepStrictEqual(L.roleCounts(4), { mafia: 1, doctor: 0, detective: 0, citizen: 3 });
  assert.deepStrictEqual(L.roleCounts(8), { mafia: 2, doctor: 1, detective: 1, citizen: 4 });
});

test('assignRoles gives everyone exactly one role', () => {
  const ps = L.assignRoles(['a', 'b', 'c', 'd', 'e', 'f'], Math.random);
  assert.strictEqual(ps.length, 6);
  assert.strictEqual(ps.filter(L.isMafia).length, 1);
  assert.ok(ps.every(p => p.alive && p.role));
});

test('night resolution: kill, save, or nothing', () => {
  assert.deepStrictEqual(L.resolveNight(2, 3), { killed: 2, saved: false });
  assert.deepStrictEqual(L.resolveNight(2, 2), { killed: null, saved: true });
  assert.deepStrictEqual(L.resolveNight(null, 2), { killed: null, saved: false });
});

test('winner detection', () => {
  const ps = L.assignRoles(['a', 'b', 'c', 'd', 'e', 'f'], Math.random);
  assert.strictEqual(L.winner(ps), null);
  const m = ps.find(L.isMafia);
  L.kill(ps, m.id);
  assert.strictEqual(L.winner(ps), 'citizens');
  const ps2 = L.assignRoles(['a', 'b', 'c', 'd'], Math.random);
  ps2.filter(p => !L.isMafia(p)).slice(0, 2).forEach(p => L.kill(ps2, p.id));
  assert.strictEqual(L.winner(ps2), 'mafia');
});

test('imposters are distinct and in range', () => {
  for (const n of [3, 5, 8, 12]) {
    const im = L.pickImposters(n, Math.random);
    assert.strictEqual(im.length, L.imposterCount(n));
    assert.strictEqual(new Set(im).size, im.length);
    assert.ok(im.every(i => i >= 0 && i < n));
  }
});

test('mafia count can be chosen from 6 players, within limits', () => {
  assert.strictEqual(L.roleCounts(6, 2).mafia, 2);
  assert.strictEqual(L.roleCounts(6, 5).mafia, 2);          // clamped to max (n/3)
  assert.strictEqual(L.roleCounts(4, 3).mafia, 1);          // too few players for more
  assert.strictEqual(L.maxMafia(9), 3);
  for (let n = 4; n <= 15; n++) for (let m = 1; m <= 6; m++) {
    const c = L.roleCounts(n, m);
    assert.strictEqual(c.mafia + c.doctor + c.detective + c.citizen, n);
    assert.ok(c.mafia < n - c.mafia);                         // citizens always outnumber mafia
  }
  const ps = L.assignRoles(['a', 'b', 'c', 'd', 'e', 'f'], Math.random, 2);
  assert.strictEqual(ps.filter(L.isMafia).length, 2);
});

test('word pair gives the two different words, hint is first letter', () => {
  const r = L.pickPair([['Tea', 'Coffee']], Math.random);
  assert.notStrictEqual(r.crew, r.imposter);
  assert.deepStrictEqual([r.crew, r.imposter].sort(), ['Coffee', 'Tea']);
  assert.strictEqual(L.firstLetter('Pizza'), 'P');
  assert.strictEqual(L.firstLetter('شاورما'), 'ش');
});
