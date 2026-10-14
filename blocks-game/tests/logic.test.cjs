const test = require('node:test');
const assert = require('node:assert');
const T = require('../www/logic.js');

test('every piece has 4 cells and 4 rotations return to the start', () => {
  T.TYPES.forEach(t => {
    for (let r = 0; r < 4; r++) assert.strictEqual(T.cells({ type: t, rot: r, x: 3, y: 3 }).length, 4);
    assert.deepStrictEqual(T.shapeOf(t, 4), T.shapeOf(t, 0));
  });
  assert.deepStrictEqual(T.shapeOf('O', 1), T.shapeOf('O', 0));
  assert.notDeepStrictEqual(T.shapeOf('T', 1), T.shapeOf('T', 0));
});

test('walls and floor collide; spawn is free on an empty board', () => {
  const b = T.newBoard();
  T.TYPES.forEach(t => assert.ok(!T.collides(b, T.spawn(t))));
  assert.ok(T.collides(b, { type: 'O', rot: 0, x: -1, y: 0 }));
  assert.ok(T.collides(b, { type: 'O', rot: 0, x: 9, y: 0 }));
  assert.ok(T.collides(b, { type: 'O', rot: 0, x: 4, y: 19 }));
  assert.ok(!T.collides(b, { type: 'O', rot: 0, x: 4, y: 18 }));
});

test('wall kick lets a vertical I rotate against the wall', () => {
  const b = T.newBoard(); let p = { type: 'I', rot: 1, x: 7, y: 5 };          // vertical I touching the right side after rotate
  const n = T.rotate(b, { type: 'I', rot: 0, x: 6, y: 5 }, 1);
  assert.ok(n && !T.collides(b, n));
  const edge = T.rotate(b, { type: 'I', rot: 1, x: 8, y: 5 }, 1);             // would stick out of the right wall without a kick
  assert.ok(edge && !T.collides(b, edge));
});

test('hard drop distance and locking', () => {
  const b = T.newBoard(), p = T.spawn('O');
  assert.strictEqual(T.dropDistance(b, p), 18);
  T.lock(b, { ...p, y: 18 }); assert.strictEqual(b[19][4], 'O');
  assert.ok(T.dropDistance(b, T.spawn('O')) < 18);                             // stack is in the way
});

test('clearing rows: four at once with correct collapse', () => {
  const b = T.newBoard();
  for (let r = 16; r < 20; r++) for (let c = 0; c < 9; c++) b[r][c] = 'T';
  b[15][0] = 'S';                                                              // a block resting above the stack
  T.lock(b, { type: 'I', rot: 1, x: 7, y: 16 });                               // vertical I in column 9 (shape col 2 -> x+2)
  const rows = T.fullRows(b); assert.deepStrictEqual(rows, [16, 17, 18, 19]);
  T.removeRows(b, rows);
  assert.strictEqual(T.fullRows(b).length, 0);
  assert.strictEqual(b[19][0], 'S');                                           // the loose block fell to the bottom
  assert.strictEqual(b.length, 20);
});

test('bag has all 7 pieces; scoring and speed curves', () => {
  assert.deepStrictEqual(T.makeBag(Math.random).slice().sort(), T.TYPES.slice().sort());
  assert.strictEqual(T.lineScore(4, 2), 1600); assert.strictEqual(T.lineScore(0, 5), 0);
  assert.strictEqual(T.levelFor(0), 1); assert.strictEqual(T.levelFor(25), 3);
  assert.ok(T.gravityMs(5) < T.gravityMs(1) && T.gravityMs(99) === 70);
});
