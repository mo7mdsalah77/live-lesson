const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),vm=require('node:vm');const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('site/quiz-ranking.js','utf8').replace(/export /g,''),c);
const grade=(q,k,a)=>a===k.correct?1:0;const slides=[{id:'q',points:1}],keys={q:{correct:1}},rounds={q:{id:'r',seconds:30}};
function rank(students){c.slides=slides;c.students=students;c.keys=keys;c.rounds=rounds;c.grade=grade;return vm.runInContext('rankQuiz(slides,students,keys,rounds,grade)',c)}
function student(id,a,elapsed,round='r'){return{id,name:id,ans:{q:a},answerTimes:{q:{round,elapsedMs:elapsed}}}}
test('correct and faster answers rank above slower correct answers',()=>{const rows=rank([student('Slow',1,20000),student('Fast',1,5000)]);assert.equal(rows[0].name,'Fast');assert(rows[0].points>rows[1].points)});
test('wrong answers never get speed points',()=>{const rows=rank([student('Wrong',0,0),student('Correct',1,30000)]);assert.equal(rows[0].name,'Correct');assert.equal(rows[1].points,0)});
test('an earlier round cannot receive a new speed score',()=>assert.equal(rank([student('Old',1,1,'old')]).length,0));
test('ties share a rank and initials support non-English names',()=>{const rows=rank([student('A',1,1000),student('B',1,1000)]);assert.equal(rows[0].rank,rows[1].rank);assert.equal(vm.runInContext('initials("Mohamed Salah")',c),'MS');assert.equal(vm.runInContext('initials("محمد صلاح")',c),'مص')});
