const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 const node=(tag,attrs,...kids)=>({tag,attrs:attrs||{},kids:kids.flat(Infinity),append(...more){this.kids.push(...more)}});
 const S={role:'teacher',tab:'live',live:{code:'ABC12',open:true},deck:{title:'Lesson',slides:[{id:'old',type:'poll',title:'Existing',options:['A','B']}]},keys:{old:{notes:'private'}}};
 const notices=[],store={},inserted=[],writes=[];let settingsFail=false;
 S.db={doc:path=>({set:async data=>writes.push({path,data})})};
 const L={S,h:node,slides:()=>S.deck.slides,TYPES:{poll:{label:'Poll'},mcq:{label:'Quiz',graded:true}},newSlide:type=>({id:'new',type,title:'',options:['','','']}),render(){},toast:msg=>notices.push(msg),classTab:()=>[],groupsTab:()=>[],liveTab:()=>[]};
 const c={window:{__lesson:L},document:{querySelector:()=>({})},location:{},Office:{context:{document:{settings:{get:k=>store[k],set:(k,v)=>store[k]=v,saveAsync:cb=>cb({status:settingsFail?'failed':'succeeded'})}}}},insertInteraction:async question=>{inserted.push(question);return 'native'+inserted.length},questionForm:()=>[]};
 vm.createContext(c);
 vm.runInContext(fs.readFileSync('site/addin/question-form.js','utf8').replace(/export /g,''),c);
 vm.runInContext(fs.readFileSync('site/addin/taskpane.js','utf8').replace(/^import .*;$/gm,'').replace(/^export \{ signIn \};$/m,'').replace(/export /g,''),c);
 return{c,S,notices,store,inserted,writes,run:s=>vm.runInContext(s,c),failSettings:v=>settingsFail=v};
}
test('single-question editor has no deck import or second slide list',()=>{const f=fixture();f.run('create("poll")');const nodes=f.run('questionForm(window.__lesson,draft,()=>{},()=>{},()=>{},false)');const text=JSON.stringify(nodes);assert(!text.includes('Import slides'));assert(!text.includes('Lesson title'));assert(text.includes('Add to presentation'));assert.equal(f.run('keepEditor()'),true)});
test('add saves one question then inserts a new live PowerPoint slide',async()=>{const f=fixture();f.run('create("poll"); draft.slide.title="Vote";draft.slide.options=["A","B"]');await f.run('saveQuestion()');assert.equal(f.S.deck.slides.length,2);assert.equal(f.inserted.length,1);assert.equal(f.store.liveLessonInteractions.native1,'new');assert.equal(f.S.keys.old.notes,'private');assert.deepEqual(f.writes.map(w=>w.path),['keys/main','deck/main'])});
test('editing updates question without inserting another slide',async()=>{const f=fixture();f.run('edit(window.__lesson.S.deck.slides[0]);draft.slide.title="Changed"');await f.run('saveQuestion()');assert.equal(f.S.deck.slides[0].title,'Changed');assert.equal(f.inserted.length,0)});
test('invalid quiz never saves or inserts a slide',async()=>{const f=fixture();f.run('create("mcq");draft.slide.title="Question";draft.slide.options=["A","B"]');await f.run('saveQuestion()');assert.equal(f.inserted.length,0);assert.equal(f.writes.length,0);assert(f.notices[0].includes('correct answer'))});
test('retry after settings failure reuses the already inserted slide',async()=>{const f=fixture();f.failSettings(true);f.run('create("poll");draft.slide.title="Question";draft.slide.options=["A","B"]');await f.run('saveQuestion()');assert.equal(f.inserted.length,1);f.failSettings(false);await f.run('saveQuestion()');assert.equal(f.inserted.length,1);assert.equal(f.S.deck.slides.length,2)});
