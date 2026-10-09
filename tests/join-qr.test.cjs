const test = require("node:test");
const assert = require("node:assert/strict");

test("join links point at the student site with the code filled in", async () => {
  const { joinUrl, shortSite } = await import("../site/join-qr.js");
  const addin = { origin: "https://mo7mdsalah77.github.io", pathname: "/live-lesson/" };
  assert.equal(joinUrl("K7M2Q", addin), "https://mo7mdsalah77.github.io/live-lesson/?code=K7M2Q");
  assert.equal(joinUrl("K7M2Q", { ...addin, pathname: "/live-lesson/index.html" }), "https://mo7mdsalah77.github.io/live-lesson/?code=K7M2Q");
  assert.equal(shortSite(addin), "mo7mdsalah77.github.io/live-lesson");
});
