const test = require('node:test');
const assert = require('node:assert');
global.window = global; require('../www/art.js'); require('../www/stories.js'); const Scenes = require('../www/scenes.js'); const Art = global.Art;
const S = global.STORIES;
const MARKS = /[ً-ْ]/g, LETTERS = /[ء-ي]/g;

test('at least 20 stories, each with a title, a vocalised moral and 5-8 pages', () => {
  assert.ok(S.length >= 20);
  assert.strictEqual(new Set(S.map(s => s.id)).size, S.length);
  S.forEach(s => {
    assert.ok(['nights', 'folk', 'world', 'wisdom'].includes(s.kind), s.id);
    assert.ok(typeof s.title === 'string' && s.title.length > 3 && !MARKS.test(s.title), s.id + ' title');
    assert.ok((s.moral.match(MARKS) || []).length > 6, s.id + ' moral should be vocalised');
    assert.ok(s.pages.length >= 5 && s.pages.length <= 8, s.id);
  });
});

test('every page is simple, fully vocalised Arabic with short sentences', () => {
  S.forEach(s => s.pages.forEach((p, i) => {
    assert.ok(p.t && p.t.length > 30 && p.t.length < 520, `${s.id} p${i + 1} length ${p.t && p.t.length}`);
    assert.ok(/[؀-ۿ]/.test(p.t) && !/[A-Za-z]/.test(p.t), `${s.id} p${i + 1} arabic only`);
    const marks = (p.t.match(MARKS) || []).length, letters = (p.t.match(LETTERS) || []).length;
    assert.ok(marks / letters > 0.45, `${s.id} p${i + 1} should be fully vocalised (${marks}/${letters})`);
    p.t.split(/[.!؟?]/).forEach(x => assert.ok(x.trim().split(/\s+/).length <= 26, `${s.id} p${i + 1} has a very long sentence`));
    assert.ok(!('eg' in p) && !('ar' in p), 'no dialect fields left');
  }));
});

test('every scene uses a known background and known assets inside the picture', () => {
  S.forEach(s => s.pages.forEach((p, i) => {
    assert.ok(Scenes.backgrounds.includes(p.s[0]), `${s.id} p${i + 1} bg ${p.s[0]}`);
    assert.ok(p.s[1].length >= 2 && p.s[1].length <= 6, `${s.id} p${i + 1} items`);
    p.s[1].forEach(it => { assert.ok(Art.names.includes(it[0]) || /\p{Extended_Pictographic}/u.test(it[0]), `${s.id} p${i + 1} unknown asset ${it[0]}`); assert.ok(it[1] >= 5 && it[1] <= 96 && it[2] >= 38 && it[2] <= 96 && it[3] >= 36 && it[3] <= 210, `${s.id} p${i + 1} ${it[0]} ${it.slice(1, 4)}`); });
    assert.ok(/^<svg/.test(Scenes.render('t', p.s[0], p.s[1])));
  }));
});
