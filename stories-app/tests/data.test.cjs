const test = require('node:test');
const assert = require('node:assert');
global.window = global; require('../www/art.js'); require('../www/stories.js'); const Scenes = require('../www/scenes.js'); const Art = global.Art;
const S = global.STORIES;

test('at least 12 stories with unique ids, both dialects for every title, moral and page', () => {
  assert.ok(S.length >= 20);
  assert.strictEqual(new Set(S.map(s => s.id)).size, S.length);
  S.forEach(s => {
    assert.ok(['nights', 'folk', 'world', 'wisdom'].includes(s.kind), s.id);
    ['eg', 'ar'].forEach(d => { assert.ok(s.title[d] && s.moral[d], s.id + ' ' + d); });
    assert.ok(s.pages.length >= 5 && s.pages.length <= 8, s.id);
    s.pages.forEach((p, i) => ['eg', 'ar'].forEach(d => {
      assert.ok(p[d] && p[d].length > 30 && p[d].length < 330, `${s.id} p${i + 1} ${d} length ${p[d] && p[d].length}`);
      assert.ok(/[؀-ۿ]/.test(p[d]), 'arabic text');
    }));
  });
});

test('Egyptian and MSA versions differ (real dialects, not copies)', () => {
  let same = 0, total = 0; S.forEach(s => s.pages.forEach(p => { total++; if (p.eg === p.ar) same++; }));
  assert.ok(same / total < 0.1, `${same}/${total} identical pages`);
});

test('every scene uses a known background and keeps characters inside the picture', () => {
  S.forEach(s => s.pages.forEach((p, i) => {
    assert.ok(Scenes.backgrounds.includes(p.s[0]), `${s.id} p${i + 1} bg ${p.s[0]}`);
    assert.ok(p.s[1].length >= 2 && p.s[1].length <= 6, `${s.id} p${i + 1} items`);
    p.s[1].forEach(it => { assert.ok(Art.names.includes(it[0]) || /\p{Extended_Pictographic}/u.test(it[0]), `${s.id} p${i + 1} unknown asset ${it[0]}`); assert.ok(it[1] >= 5 && it[1] <= 96 && it[2] >= 38 && it[2] <= 96 && it[3] >= 36 && it[3] <= 210, `${s.id} p${i + 1} ${it[0]} ${it.slice(1, 4)}`); });
    assert.ok(/^<svg/.test(Scenes.render('t', p.s[0], p.s[1])));
  }));
});
