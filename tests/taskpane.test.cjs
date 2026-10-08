const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function fixture() {
 const node=(tag,attrs,...kids)=>({tag,attrs:attrs||{},kids:kids.flat(Infinity),append(...more){this.kids.push(...more)}});
 const S={role:'teacher',tab:'live',live:{code:'ABC12',open:true},deck:{title:'Lesson'}};
 const slides=[{id:'q1',type:'poll',title:'Your choice?',options:['A','B']}];
 const notices=[],store={},deleted=[],created=[];
 let chosen=[{id:'slide1',shapes:{load(){},items:[{name:'Unrelated text',delete(){deleted.push('unrelated')}},{name:'Live Lesson interaction',delete(){deleted.push('interaction')}}],addTextBox(text,opts){const card={text,opts};created.push(card);return card}}}];
 const L={S,h:node,slides:()=>slides,TYPES:{poll:{label:'Poll'}},startEdit(){S.edit={deck:{slides:[...slides]},keys:{}}},newSlide(type){return{id:'new',type}},render(){},toast:msg=>notices.push(msg),editTab:()=>[],classTab:()=>[],groupsTab:()=>[],liveTab:()=>[],goTo(i){S.live.slide=i}};
 const c={window:{__lesson:L},document:{querySelector:()=>({})},location:{host:'example.com',pathname:'/lesson/'},Office:{context:{requirements:{isSetSupported:()=>true},document:{settings:{get:k=>store[k],set:(k,v)=>store[k]=v,saveAsync:cb=>cb({status:'succeeded'})}}}},PowerPoint:{run:async fn=>fn({presentation:{getSelectedSlides:()=>({items:chosen,load(){}})},sync:async()=>{}})}};
 vm.createContext(c);vm.runInContext(fs.readFileSync('site/addin/taskpane.js','utf8').replace(/^import .*;$/m,'').replace(/^export \{ signIn \};$/m,'').replace(/export /g,''),c);
 return{c,S,slides,notices,store,deleted,created,run:s=>vm.runInContext(s,c),setChosen:v=>chosen=v};
}
test('chooser adds a draft and preserves it during live updates',()=>{const f=fixture();f.run('create("poll")');assert.equal(f.S.edit.deck.slides.length,2);assert.equal(f.S.editIdx,1);assert.equal(f.run('keepEditor()'),true);f.run('navigate("list")');assert.equal(f.run('keepEditor()'),false)});
test('card insertion replaces only the named interaction and saves the slide link',async()=>{const f=fixture();f.c.slide=f.slides[0];await f.run('attach(slide)');assert.deepEqual(f.deleted,['interaction']);assert.equal(f.created.length,1);assert(f.created[0].text.includes('ABC12'));assert.equal(f.store.liveLessonInteractions.slide1,'q1')});
test('selection failure does not add or link a card',async()=>{const f=fixture();f.setChosen([]);f.c.slide=f.slides[0];await f.run('attach(slide)');assert.equal(f.created.length,0);assert.equal(f.store.liveLessonInteractions,undefined);assert(f.notices[0].includes('Select one'))});
test('unsupported PowerPoint does not attempt insertion',async()=>{const f=fixture();f.c.Office.context.requirements.isSetSupported=()=>false;f.c.slide=f.slides[0];await f.run('attach(slide)');assert.equal(f.created.length,0);assert(f.notices[0].includes('newer PowerPoint'))});
