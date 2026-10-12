// Pure rules for Realm Rush. Browser: window.KingLogic. Tests: require().
(function (root) {
  var RES = ['food', 'wood', 'stone', 'gold'];
  var BUILD = {
    hall:      { icon: '🏰', base: { wood: 80, stone: 50 },            time: 15, req: 1 },
    farm:      { icon: '🌾', base: { wood: 40, stone: 15 },            time: 8,  req: 1, rate: { food: 0.5 } },
    sawmill:   { icon: '🪵', base: { food: 30, stone: 15 },            time: 8,  req: 1, rate: { wood: 0.45 } },
    quarry:    { icon: '⛏️', base: { food: 40, wood: 40 },             time: 10, req: 1, rate: { stone: 0.35 } },
    mine:      { icon: '💰', base: { wood: 60, stone: 60 },            time: 12, req: 2, rate: { gold: 0.15 } },
    warehouse: { icon: '📦', base: { wood: 60, stone: 40 },            time: 10, req: 1 },
    barracks:  { icon: '⚔️', base: { wood: 100, stone: 80, food: 60 }, time: 14, req: 2 }
  };
  var ORDER = ['hall', 'farm', 'sawmill', 'quarry', 'mine', 'warehouse', 'barracks'];
  var HALL_MAX = 10;
  // Rock-paper-scissors: infantry > cavalry > archers > infantry (x1.5 damage).
  var TROOPS = {
    inf: { icon: '🛡️', cost: { food: 30, wood: 15 },           time: 4, atk: 10, hp: 100, beats: 'cav' },
    arc: { icon: '🏹', cost: { food: 25, wood: 30 },           time: 4, atk: 16, hp: 55,  beats: 'inf' },
    cav: { icon: '🐎', cost: { food: 40, wood: 20, gold: 2 },  time: 5, atk: 14, hp: 80,  beats: 'arc' }
  };
  var TYPES = ['inf', 'arc', 'cav'];
  var HEROES = { knight: { icon: '🤴', troop: 'inf', hall: 1 }, ranger: { icon: '🧝', troop: 'arc', hall: 3 }, rider: { icon: '🦸', troop: 'cav', hall: 5 } };
  var CAMPS = 30;

  function level(s, k) { return s.b[k] || 0; }
  function cap(s) { return 1000 + 1500 * level(s, 'warehouse'); }
  function upgradeCost(key, target) {
    var m = Math.pow(1.7, target - 1), c = {};
    for (var r in BUILD[key].base) c[r] = Math.ceil(BUILD[key].base[r] * m);
    return c;
  }
  function upgradeTime(key, target) { return Math.ceil(BUILD[key].time * Math.pow(1.55, target - 1)); }
  function maxLevel(s, key) { return key === 'hall' ? HALL_MAX : level(s, 'hall'); }
  function canAfford(s, cost) { return RES.every(function (r) { return (s.res[r] || 0) >= (cost[r] || 0); }); }
  function pay(s, cost) { RES.forEach(function (r) { s.res[r] -= cost[r] || 0; }); }
  function rates(s) {
    var o = { food: 0, wood: 0, stone: 0, gold: 0 };
    ORDER.forEach(function (k) { var b = BUILD[k]; if (b.rate) for (var r in b.rate) o[r] += b.rate[r] * level(s, k); });
    return o;
  }
  // Why can't I start this upgrade? null if ok.
  function upgradeBlock(s, key) {
    var lv = level(s, key), t = lv + 1;
    if (s.q) return 'busy';
    if (BUILD[key].req > level(s, 'hall')) return 'locked';
    if (t > maxLevel(s, key)) return key === 'hall' ? 'max' : 'needHall';
    if (!canAfford(s, upgradeCost(key, t))) return 'poor';
    return null;
  }
  function startUpgrade(s, key, now) {
    if (upgradeBlock(s, key)) return false;
    var t = level(s, key) + 1; pay(s, upgradeCost(key, t));
    s.q = { key: key, level: t, endsAt: now + upgradeTime(key, t) * 1000 }; return true;
  }
  function rushCost(msLeft) { return Math.ceil(msLeft / 1000 / 2); }   // 1 gold per 2 seconds
  function rush(s, now, which) {
    var job = which === 'train' ? s.train : which === 'q' ? s.q : (s.q || s.train); if (!job) return false;
    var c = rushCost(Math.max(0, job.endsAt - now)); if (s.res.gold < c) return false;
    s.res.gold -= c; job.endsAt = now; return true;
  }

  function maxBatch(s) { return 10 + 10 * level(s, 'barracks'); }
  function trainCost(type, n) { var c = {}; for (var r in TROOPS[type].cost) c[r] = TROOPS[type].cost[r] * n; return c; }
  function trainTime(s, type, n) { return Math.ceil(TROOPS[type].time * n / (1 + 0.25 * (level(s, 'barracks') - 1))); }
  function trainBlock(s, type, n) {
    if (!level(s, 'barracks')) return 'noBarracks';
    if (s.train) return 'busy';
    if (n < 1 || n > maxBatch(s)) return 'batch';
    if (!canAfford(s, trainCost(type, n))) return 'poor';
    return null;
  }
  function startTrain(s, type, n, now) {
    if (trainBlock(s, type, n)) return false;
    pay(s, trainCost(type, n)); s.train = { type: type, n: n, endsAt: now + trainTime(s, type, n) * 1000 }; return true;
  }

  // Advance time. Production runs between events so a finished building raises output from that moment.
  function advance(s, now, maxMs) {
    var events = [], from = Math.max(s.last || now, now - (maxMs || 8 * 3600 * 1000));
    while (true) {
      var next = now;
      if (s.q && s.q.endsAt < next) next = s.q.endsAt;
      if (s.train && s.train.endsAt < next) next = s.train.endsAt;
      produce(s, Math.max(0, (next - from) / 1000)); from = Math.max(from, next);
      if (s.q && s.q.endsAt <= next) { s.b[s.q.key] = s.q.level; events.push({ type: 'built', key: s.q.key, level: s.q.level }); s.q = null; continue; }
      if (s.train && s.train.endsAt <= next) { s.troops[s.train.type] += s.train.n; events.push({ type: 'trained', troop: s.train.type, n: s.train.n }); s.train = null; continue; }
      break;
    }
    s.last = now; return events;
  }
  function produce(s, sec) {
    var r = rates(s), c = cap(s);
    RES.forEach(function (k) { if (s.res[k] < c) s.res[k] = Math.min(c, s.res[k] + r[k] * sec); });
  }

  // ---- heroes
  function heroBonus(s) {
    var m = { inf: 1, arc: 1, cav: 1 };
    for (var h in HEROES) m[HEROES[h].troop] += 0.06 * (s.heroes[h] || 0);
    return m;
  }
  function heroCost(lv) { return Math.round(40 * Math.pow(1.8, lv)); }
  function heroUnlocked(s, h) { return level(s, 'hall') >= HEROES[h].hall; }
  function upgradeHero(s, h) {
    if (!heroUnlocked(s, h) || (s.heroes[h] || 0) >= 10) return false;
    var c = heroCost(s.heroes[h] || 0); if (s.res.gold < c) return false;
    s.res.gold -= c; s.heroes[h] = (s.heroes[h] || 0) + 1; return true;
  }

  // ---- battle (Lanchester-style rounds, deterministic)
  function total(a) { return a.inf + a.arc + a.cav; }
  function battle(a, b, aMul, bMul) {
    a = { inf: a.inf, arc: a.arc, cav: a.cav }; b = { inf: b.inf, arc: b.arc, cav: b.cav };
    aMul = aMul || { inf: 1, arc: 1, cav: 1 }; bMul = bMul || { inf: 1, arc: 1, cav: 1 };
    var startA = {inf: a.inf, arc: a.arc, cav: a.cav}, startB = {inf: b.inf, arc: b.arc, cav: b.cav}, rounds = 0;
    function dmg(att, def, mul) {
      var out = { inf: 0, arc: 0, cav: 0 }, td = total(def); if (td <= 0) return out;
      TYPES.forEach(function (i) {
        TYPES.forEach(function (j) {
          var share = def[j] / td, k = TROOPS[i].beats === j ? 1.5 : 1;
          out[j] += att[i] * TROOPS[i].atk * mul[i] * k * share * 0.25;
        });
      }); return out;
    }
    while (total(a) >= 0.5 && total(b) >= 0.5 && rounds < 200) {
      var da = dmg(b, a, bMul), db = dmg(a, b, aMul);
      TYPES.forEach(function (t) { a[t] = Math.max(0, a[t] - da[t] / TROOPS[t].hp); b[t] = Math.max(0, b[t] - db[t] / TROOPS[t].hp); });
      rounds++;
    }
    var win = total(a) >= 0.5;
    var surv = { inf: 0, arc: 0, cav: 0 };
    if (win) TYPES.forEach(function (t) { surv[t] = Math.min(startA[t], Math.round(a[t])); });
    return { win: win, rounds: rounds, survivors: surv, enemyLeft: win ? { inf: 0, arc: 0, cav: 0 } : { inf: Math.round(b.inf), arc: Math.round(b.arc), cav: Math.round(b.cav) } };
  }
  function power(t) { return Math.round(TYPES.reduce(function (p, k) { return p + (t[k] || 0) * TROOPS[k].atk * TROOPS[k].hp / 10; }, 0)); }

  function camp(n) {
    var tot = Math.round(12 * Math.pow(n, 1.35)), p = [[0.5, 0.3, 0.2], [0.3, 0.2, 0.5], [0.2, 0.5, 0.3]][n % 3];
    return { inf: Math.round(tot * p[0]), arc: Math.round(tot * p[1]), cav: Math.round(tot * p[2]) };
  }
  function reward(n, first) {
    var f = first ? 1 : 0.4;
    return { food: Math.round(60 * n * f), wood: Math.round(50 * n * f), stone: Math.round(30 * n * f), gold: Math.round(10 * n * f) };
  }
  // Fight camp n with all troops. Returns report; mutates state.
  function attack(s, n) {
    if (n < 1 || n > CAMPS || n > s.cleared + 1 || total(s.troops) < 1) return null;
    var sent = { inf: s.troops.inf, arc: s.troops.arc, cav: s.troops.cav };
    var res = battle(sent, camp(n), heroBonus(s));
    var lost = {}, healed = {}, first = n === s.cleared + 1;
    TYPES.forEach(function (t) {
      var dead = sent[t] - res.survivors[t]; healed[t] = Math.round(dead * 0.4);       // 40% of the fallen are healed
      lost[t] = dead - healed[t]; s.troops[t] = res.survivors[t] + healed[t];
    });
    var rew = null;
    if (res.win) { rew = reward(n, first); RES.forEach(function (k) { s.res[k] = Math.min(cap(s), s.res[k] + rew[k]); }); if (first) s.cleared = n; }
    return { win: res.win, camp: n, lost: lost, healed: healed, reward: rew, enemy: camp(n), rounds: res.rounds };
  }

  function newGame(now) {
    return { v: 1, res: { food: 400, wood: 450, stone: 250, gold: 60 }, b: { hall: 1, farm: 1, sawmill: 1 }, q: null, train: null,
      troops: { inf: 0, arc: 0, cav: 0 }, heroes: { knight: 0, ranger: 0, rider: 0 }, cleared: 0, last: now };
  }

  var api = { RES: RES, BUILD: BUILD, ORDER: ORDER, TROOPS: TROOPS, TYPES: TYPES, HEROES: HEROES, CAMPS: CAMPS, HALL_MAX: HALL_MAX,
    level: level, cap: cap, upgradeCost: upgradeCost, upgradeTime: upgradeTime, upgradeBlock: upgradeBlock, startUpgrade: startUpgrade, canAfford: canAfford,
    rates: rates, rushCost: rushCost, rush: rush, maxBatch: maxBatch, trainCost: trainCost, trainTime: trainTime, trainBlock: trainBlock, startTrain: startTrain,
    advance: advance, heroBonus: heroBonus, heroCost: heroCost, heroUnlocked: heroUnlocked, upgradeHero: upgradeHero, battle: battle, power: power,
    camp: camp, reward: reward, attack: attack, newGame: newGame };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.KingLogic = api;
})(this);
