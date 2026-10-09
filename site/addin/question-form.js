// A single-question editor for the PowerPoint side panel.
export function questionForm(L, draft, update, save, cancel, busy) {
  const {h} = L, sl = draft.slide, key = draft.key, type = L.TYPES[sl.type];
  const field = (label, property, object = sl, rows = 2) => h("label", {class:"f"}, label, h("textarea", {rows,value:object[property] || "",oninput:e=>object[property]=e.target.value}));
  const nodes = [h("button",{class:"btn sm",onclick:cancel},"← Back"), h("label",{class:"f"},"Interaction type",h("select",{value:sl.type,onchange:e=>{
    const next=L.newSlide(e.target.value);next.id=sl.id;next.title=sl.title;next.body=sl.body||"";next.resultsMode=sl.resultsMode;next.timerSeconds=sl.timerSeconds;next.picture=sl.picture;
    if(!next.picture)delete next.picture;if(!next.resultsMode)delete next.resultsMode;if(next.timerSeconds==null)delete next.timerSeconds;
    draft.slide=next;draft.key={notes:key.notes||""};if(next.type==="multi")draft.key.correct=[];update();
  }},Object.entries(L.TYPES).filter(([id])=>!["join","multi"].includes(id)).map(([id,t])=>h("option",{value:id,text:t.label,selected:sl.type===id})),sl.type==="multi"?h("option",{value:"multi",text:"Select all",selected:true}):null)), field(sl.type === "task" ? "Task heading" : "Your question", "title")];
  nodes.push(h("label",{class:"btn sm"},draft.uploading ? "Uploading picture…" : sl.picture ? "Replace picture" : "Upload picture",h("input",{type:"file",accept:"image/png,image/jpeg,image/webp",hidden:true,disabled:busy||draft.uploading,"aria-label":"Upload question picture",onchange:async e=>{
    const file=e.target.files[0];if(!file)return;draft.uploading=true;update();
    try{await L.uploadPicture(sl,file);}catch(error){L.toast(error.message||"Could not upload the picture.");}
    finally{draft.uploading=false;update();}
  }})));
  if(sl.picture)nodes.push(L.pictureEl(sl),h("button",{class:"btn sm",onclick:()=>{delete sl.picture;update();}},"Remove picture"));
  if(["mcq","multi"].includes(sl.type))nodes.push(h("label",{class:"row"},h("input",{type:"checkbox",checked:sl.type==="multi",onchange:e=>{
    if(e.target.checked){sl.type="multi";key.correct=key.correct==null?[]:[key.correct];}
    else{sl.type="mcq";key.correct=(key.correct||[])[0];}update();
  }}),"Allow multiple answers"));
  if(sl.type==="poll")nodes.push(h("label",{class:"f"},"Participants on result bars",h("select",{value:sl.pollIdentity||"initials",onchange:e=>sl.pollIdentity=e.target.value},h("option",{value:"initials",text:"Initials"}),h("option",{value:"names",text:"Full names"}),h("option",{value:"hidden",text:"Hide participants"}))));
  if (sl.options) {
    nodes.push(h("p", {class:"muted",text:type.graded ? "Write the choices and select the correct answer." : "Write the choices students can vote for."}));
    sl.options.forEach((option,i) => nodes.push(h("div", {class:"optrow"},
      type.graded ? h("input", {type:sl.type==="multi"?"checkbox":"radio",name:"correct",checked:sl.type==="multi"?(key.correct||[]).includes(i):key.correct===i,"aria-label":"Correct choice "+(i+1),onchange:e=>{if(sl.type==="multi")key.correct=e.target.checked?[...new Set([...(key.correct||[]),i])]:(key.correct||[]).filter(v=>v!==i);else key.correct=i;}}):null,
      h("input",{type:"text",value:option,placeholder:"Choice "+(i+1),"aria-label":"Choice "+(i+1),oninput:e=>sl.options[i]=e.target.value}),
      h("button",{class:"btn sm",disabled:sl.options.length<=2,"aria-label":"Remove choice "+(i+1),onclick:()=>{sl.options.splice(i,1);if(Array.isArray(key.correct))key.correct=key.correct.filter(v=>v!==i).map(v=>v>i?v-1:v);else if(key.correct===i)delete key.correct;else if(key.correct>i)key.correct--;update();}},"×"))));
    if(sl.options.length<8)nodes.push(h("button",{class:"btn sm",onclick:()=>{sl.options.push("");update();}},"+ Add choice"));
  }
  if(sl.type==="tf")nodes.push(h("div",{class:"row"},[true,false].map(v=>h("label",{class:"row"},h("input",{type:"radio",name:"tf",checked:key.correct===v,onchange:()=>key.correct=v}),v?"True":"False"))));
  if(sl.type==="number")nodes.push(h("label",{class:"f"},"Correct number",h("input",{type:"number",step:"any",value:key.correct??"",oninput:e=>key.correct=e.target.value===""?undefined:Number(e.target.value)})),h("label",{class:"f"},"Allow ±",h("input",{type:"number",step:"any",min:0,value:key.tol||0,oninput:e=>key.tol=Math.max(0,Number(e.target.value)||0)})));
  if(sl.type==="short")nodes.push(h("label",{class:"row"},h("input",{type:"checkbox",checked:sl.graded===true,onchange:e=>{sl.graded=e.target.checked;if(!sl.graded)delete key.accept;update();}}),"Mark against accepted answers (optional)"));
  if(sl.type==="short" && sl.graded===true)nodes.push(h("label",{class:"f"},"Accepted answers (one per line)",h("textarea",{rows:3,value:(key.accept||[]).join("\n"),oninput:e=>key.accept=e.target.value.split("\n").map(v=>v.trim()).filter(Boolean)})));
  if(sl.type==="scale")nodes.push(field("Label for 1","low"),field("Label for 5","high"));
  if(sl.type==="task")for(let i=0;i<3;i++)nodes.push(h("label",{class:"f"},"Task for "+L.S.live.tierNames[i],h("textarea",{rows:3,value:sl.tasks[i],oninput:e=>sl.tasks[i]=e.target.value})));
  nodes.push(h("label",{class:"f"},"Show class results on the slide",h("select",{value:sl.resultsMode||"click",onchange:e=>sl.resultsMode=e.target.value},
    h("option",{value:"click",text:"On click"}),h("option",{value:"immediate",text:"Immediately"}),h("option",{value:"hidden",text:"Keep hidden"}))),
    h("label",{class:"f"},"Answer timer (seconds · 0 = no timer)",h("input",{type:"number",min:0,max:3600,step:1,value:sl.timerSeconds||0,oninput:e=>sl.timerSeconds=Math.max(0,Math.min(3600,Math.floor(Number(e.target.value)||0)))})));
  if(type.graded && sl.graded!==false)nodes.push(h("label",{class:"row"},h("input",{type:"checkbox",checked:sl.showLeaderboard!==false,onchange:e=>sl.showLeaderboard=e.target.checked}),"Show leaderboard after revealing the answer"));
  const advanced=h("details",{class:"lladvanced"},h("summary",{text:"Teaching options"}),field("Supporting text","body"),field("Code (optional)","code",sl,3),field("Private teacher notes","notes",key,3));
  if(type.graded && sl.graded!==false)advanced.append(field("Explanation after revealing the answer","explain",key),h("label",{class:"f"},"Points",h("input",{type:"number",min:1,max:10,value:sl.points||1,oninput:e=>sl.points=Math.max(1,Math.min(10,Number(e.target.value)||1))})),
    h("label",{class:"row"},h("input",{type:"checkbox",checked:sl.group!==false,onchange:e=>sl.group=e.target.checked}),"Counts towards groups"),h("label",{class:"row"},h("input",{type:"checkbox",checked:!!sl.hinge,onchange:e=>sl.hinge=e.target.checked}),"Hinge: wrong answer → support group"));
  nodes.push(advanced,h("div",{class:"row"},h("button",{class:"btn primary",disabled:busy||draft.uploading,onclick:save},busy?"Adding…":draft.isNew?"Add to presentation":"Save question"),h("button",{class:"btn",disabled:busy,onclick:cancel},"Cancel")));
  return nodes;
}
export function validateQuestion(draft) {
  const {slide:sl,key}=draft;
  if(!sl.title.trim())return "Write your question first.";
  if(sl.options?.some(v=>!v.trim()))return "Write every choice or remove the empty ones.";
  if(["mcq","tf"].includes(sl.type)&&key.correct==null)return "Select the correct answer.";
  if(sl.type==="multi"&&!(key.correct||[]).length)return "Select at least one correct answer.";
  if(sl.type==="number"&&(key.correct==null||!Number.isFinite(key.correct)))return "Enter the correct number.";
  if(sl.type==="short"&&sl.graded===true&&!(key.accept||[]).length)return "Enter at least one accepted answer.";
  if(sl.type==="task"&&sl.tasks.some(v=>!v.trim()))return "Write a task for each group.";
  return "";
}
