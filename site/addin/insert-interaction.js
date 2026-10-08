// Insert a new slide containing the existing Live Lesson content add-in.
let zipReady;
async function zipLibrary() {
  if (globalThis.JSZip) return globalThis.JSZip;
  if (!zipReady) zipReady = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL("./jszip.min.js", import.meta.url).href;
    script.onload = () => resolve(globalThis.JSZip);
    script.onerror = () => { zipReady = null; reject(new Error("Could not load the slide builder. Try again.")); };
    document.head.append(script);
  });
  return zipReady;
}
export async function interactionPresentation(question) {
  const Zip = await zipLibrary();
  const response = await fetch(new URL("./interaction-template.pptx", import.meta.url));
  if (!response.ok) throw new Error("Could not load the interaction slide. Try again.");
  const zip = await Zip.loadAsync(await response.arrayBuffer());
  const path = "ppt/slides/udata/data.xml";
  const xml = new DOMParser().parseFromString(await zip.file(path).async("string"), "application/xml");
  const ns = "http://schemas.microsoft.com/office/webextensions/webextension/2010/11";
  xml.documentElement.setAttribute("id", "{" + crypto.randomUUID() + "}");
  const props = xml.getElementsByTagNameNS(ns, "properties")[0];
  const add = (name, value) => { const p = xml.createElementNS(ns, "we:property"); p.setAttribute("name", name); p.setAttribute("value", JSON.stringify(value)); props.appendChild(p); };
  add("liveLesson", { mode: "slide", id: question.id });
  add("liveLessonManaged", true);
  zip.file(path, new XMLSerializer().serializeToString(xml));
  // A readable preview for slide thumbnails and before the live add-in loads.
  const canvas = document.createElement("canvas"); canvas.width = 1280; canvas.height = 720;
  const paint = canvas.getContext("2d");
  paint.fillStyle = "#ffffff"; paint.fillRect(0, 0, 1280, 720);
  paint.fillStyle = "#0f766e"; paint.font = "bold 24px sans-serif"; paint.fillText("LIVE LESSON", 64, 68);
  paint.fillStyle = "#172b36"; paint.font = "bold 40px sans-serif";
  const wrap = (text, top, maxLines, lineHeight) => {
    let line = "", count = 0;
    for (const word of String(text).split(/\s+/)) {
      if (paint.measureText(line + word).width > 1140 && line) {
        paint.fillText(line, 64, top + count * lineHeight); line = "";
        if (++count >= maxLines) return;
      }
      line += word + " ";
    }
    if (count < maxLines) paint.fillText(line, 64, top + count * lineHeight);
  };
  wrap(question.title, 145, 3, 52);
  paint.font = "28px sans-serif";
  (question.options || []).slice(0, 8).forEach((choice, i) => wrap(`${i + 1}. ${choice}`, 330 + i * 35, 1, 35));
  paint.fillStyle = "#64748b"; paint.font = "22px sans-serif";
  paint.fillText("Live responses appear when the Live Lesson add-in loads.", 64, 675);
  zip.file("ppt/media/image.bin", canvas.toDataURL("image/png").split(",")[1], { base64: true });
  return zip.generateAsync({ type: "base64", compression: "DEFLATE" });
}
export async function insertInteraction(question) {
  if (!globalThis.PowerPoint || !Office.context.requirements.isSetSupported("PowerPointApi", "1.5")) throw new Error("Adding interaction slides needs a newer PowerPoint version.");
  const data = await interactionPresentation(question);
  return PowerPoint.run(async context => {
    const all = context.presentation.slides;
    const chosen = context.presentation.getSelectedSlides();
    all.load("items/id"); chosen.load("items/id"); await context.sync();
    const before = new Set(all.items.map(s => s.id));
    const options = { formatting: "KeepSourceFormatting" };
    if (chosen.items.length) options.targetSlideId = chosen.items[0].id;
    context.presentation.insertSlidesFromBase64(data, options); await context.sync();
    all.load("items/id"); await context.sync();
    const inserted = all.items.find(s => !before.has(s.id));
    if (!inserted) throw new Error("PowerPoint did not return the new slide. Check your slide list before trying again.");
    context.presentation.setSelectedSlides([inserted.id]); await context.sync();
    return inserted.id;
  });
}
