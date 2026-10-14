const test = require('node:test');
const assert = require('node:assert');
const K = require('../www/logic.js');
const T0 = 1_000_000;

test('upgrade costs and times grow, level capped by hall', () => {
  assert.ok(K.upgradeCost('farm', 3).wood > K.upgradeCost('farm', 2).wood);
  assert.ok(K.upgradeTime('farm', 4) > K.upgradeTime('farm', 1));
  const s = K.newGame(T0);
  assert.strictEqual(K.upgradeBlock(s, 'farm'), 'needHall');   // farm 1 == hall 1
  assert.strictEqual(K.upgradeBlock(s, 'barracks'), 'locked'); // needs hall 2
  assert.strictEqual(K.upgradeBlock(s, 'hall'), null);
});

test('upgrade flow: pay, wait, complete, production rises', () => {
  const s = K.newGame(T0), before = K.rates(s).food;
  assert.ok(K.startUpgrade(s, 'hall', T0));
  assert.ok(s.res.wood < 450 && s.q);
  assert.strictEqual(K.upgradeBlock(s, 'hall'), 'busy');
  const ev = K.advance(s, T0 + 60_000);
  assert.deepStrictEqual(ev, [{ type: 'built', key: 'hall', level: 2 }]);
  assert.strictEqual(s.b.hall, 2);
  assert.ok(K.startUpgrade(s, 'farm', T0 + 60_000));
  K.advance(s, T0 + 200_000);
  assert.ok(K.rates(s).food > before);
});

test('production is capped by the warehouse and offline time is capped', () => {
  const s = K.newGame(T0);
  K.advance(s, T0 + 100 * 3600 * 1000);
  assert.ok(s.res.food <= K.cap(s) && s.res.food > 300);
  const s2 = K.newGame(T0); s2.res.food = 0;
  K.advance(s2, T0 + 100 * 3600 * 1000);                       // only 8h counted
  assert.ok(s2.res.food <= 0.5 * 8 * 3600 + 1);
});

test('training needs barracks, a free queue and resources', () => {
  const s = K.newGame(T0);
  assert.strictEqual(K.trainBlock(s, 'inf', 5), 'noBarracks');
  s.b.hall = 2; s.b.barracks = 1; s.res.food = s.res.wood = 1000;
  assert.strictEqual(K.trainBlock(s, 'inf', 5), null);
  assert.strictEqual(K.trainBlock(s, 'inf', 99), 'batch');
  assert.ok(K.startTrain(s, 'inf', 5, T0));
  assert.strictEqual(K.trainBlock(s, 'inf', 1), 'busy');
  K.advance(s, T0 + 60_000);
  assert.strictEqual(s.troops.inf, 5);
});

test('rush completes a job for gold', () => {
  const s = K.newGame(T0); K.startUpgrade(s, 'hall', T0);
  assert.ok(K.rush(s, T0)); K.advance(s, T0);
  assert.strictEqual(s.b.hall, 2);
});

test('battle: bigger army wins, counters beat equal numbers', () => {
  assert.ok(K.battle({ inf: 100, arc: 0, cav: 0 }, { inf: 30, arc: 0, cav: 0 }).win);
  assert.ok(!K.battle({ inf: 30, arc: 0, cav: 0 }, { inf: 100, arc: 0, cav: 0 }).win);
  assert.ok(K.battle({ inf: 50, arc: 0, cav: 0 }, { inf: 0, arc: 0, cav: 50 }).win);   // infantry beats cavalry
  assert.ok(K.battle({ inf: 0, arc: 0, cav: 50 }, { inf: 0, arc: 50, cav: 0 }).win);   // cavalry beats archers
  assert.ok(K.battle({ inf: 0, arc: 50, cav: 0 }, { inf: 50, arc: 0, cav: 0 }).win);   // archers beat infantry
  const a = K.battle({ inf: 40, arc: 20, cav: 10 }, K.camp(3)), b = K.battle({ inf: 40, arc: 20, cav: 10 }, K.camp(3));
  assert.deepStrictEqual(a, b);                                                          // deterministic
});

test('hero bonuses make armies stronger', () => {
  const s = K.newGame(T0); s.b.hall = 5; s.res.gold = 5000;
  const base = K.battle({ inf: 40, arc: 0, cav: 0 }, { inf: 45, arc: 0, cav: 0 });
  for (let i = 0; i < 5; i++) assert.ok(K.upgradeHero(s, 'knight'));
  const buffed = K.battle({ inf: 40, arc: 0, cav: 0 }, { inf: 45, arc: 0, cav: 0 }, K.heroBonus(s));
  assert.ok(!base.win && buffed.win);
  const locked = K.newGame(T0); locked.res.gold = 999;
  assert.ok(!K.upgradeHero(locked, 'ranger'));
});

test('attacking camps: order, rewards, losses and healing', () => {
  const s = K.newGame(T0);
  assert.strictEqual(K.attack(s, 1), null);                  // no troops
  s.troops = { inf: 100, arc: 60, cav: 40 };
  assert.strictEqual(K.attack(s, 2), null);                  // camp 2 locked
  const r = K.attack(s, 1);
  assert.ok(r.win && s.cleared === 1 && r.reward.food > 0);
  const again = K.attack(s, 1);                               // replay gives smaller reward
  assert.ok(again.reward.food < r.reward.food);
  const huge = K.newGame(T0); huge.cleared = 29; huge.troops = { inf: 5, arc: 0, cav: 0 };
  const lose = K.attack(huge, 30);
  assert.ok(!lose.win && lose.reward === null && huge.cleared === 29);
  assert.ok(huge.troops.inf >= 0 && huge.troops.inf <= 5);
});

test('camps scale with level', () => {
  const t = n => { const c = K.camp(n); return c.inf + c.arc + c.cav; };
  for (let n = 2; n <= K.CAMPS; n++) assert.ok(t(n) > t(n - 1));
});

test('rush can target the builder or the barracks', () => {
  const s = K.newGame(T0); s.b.hall = 2; s.b.barracks = 1; s.res.gold = 500; s.res.food = s.res.wood = 999;
  K.startUpgrade(s, 'farm', T0); K.startTrain(s, 'inf', 10, T0);
  assert.ok(K.rush(s, T0, 'train')); K.advance(s, T0);
  assert.strictEqual(s.troops.inf, 10); assert.ok(s.q);
});
