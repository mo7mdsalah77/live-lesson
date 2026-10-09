// Join links and QR codes. A phone that scans the QR opens the student site with the lesson code filled in.
import qrcode from "./vendor/qrcode-generator-2.0.4.js";

// The student site is this page without its query or hash (the add-ins load it as ?addin=…).
export function siteUrl(loc = location) {
  return loc.origin + loc.pathname.replace(/index\.html$/, "");
}
export function joinUrl(code, loc = location) {
  return siteUrl(loc) + (code ? "?code=" + encodeURIComponent(code) : "");
}
// What to tell the class to type: the site without https:// or a trailing slash.
export function shortSite(loc = location) {
  return siteUrl(loc).replace(/^https?:\/\//, "").replace(/\/$/, "");
}
const NS = "http://www.w3.org/2000/svg";
// A crisp SVG QR (dark modules on a white quiet zone) that scales to its container.
export function qrSvg(text, { label = "QR code to join the lesson" } = {}) {
  const qr = qrcode(0, "M");
  qr.addData(text); qr.make();
  const n = qr.getModuleCount(), m = 2, size = n + m * 2;
  let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) d += "M" + (x + m) + " " + (y + m) + "h1v1h-1z";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 " + size + " " + size);
  svg.setAttribute("shape-rendering", "crispEdges");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", label);
  svg.setAttribute("class", "qr");
  const bg = document.createElementNS(NS, "rect");
  bg.setAttribute("width", size); bg.setAttribute("height", size); bg.setAttribute("fill", "#fff");
  const p = document.createElementNS(NS, "path");
  p.setAttribute("d", d); p.setAttribute("fill", "#111");
  svg.append(bg, p);
  return svg;
}
