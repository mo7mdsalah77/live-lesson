// Presentation state and privacy policy shared by the website and Office add-ins.
export function activationState(slide, index, now = Date.now()) {
  const seconds = Math.max(0, Math.min(3600, Number(slide.timerSeconds) || 0));
  return { slide: index, questionId: slide.id, presenting: true, open: true, reveal: false,
    resultsVisible: slide.resultsMode === "immediate", leaderboardVisible: null,
    startedAt: now, roundId: slide.id + ":" + now, endsAt: seconds ? now + seconds * 1000 : null,
    revealKey: null, summary: null, openBefore: null };
}
export function acceptingAnswers(live, now = Date.now()) {
  return live.presenting !== false && live.open === true && !live.reveal && (!live.endsAt || now < live.endsAt);
}
export function remainingSeconds(live, now = Date.now()) {
  return live.endsAt ? Math.max(0, Math.ceil((live.endsAt - now) / 1000)) : null;
}
export function showsResults(slide, live) {
  return live.presenting === true && slide.resultsMode !== "hidden" && live.resultsVisible === true;
}
export function publicLiveState(live) {
  // Projector results and answer keys are teacher-only. Phones get no class responses.
  return { ...live, revealKey: null, summary: null };
}
export function hasAnswerKey(slide, key) {
  if (!key || slide.graded === false || slide.type === "open") return false;
  if (slide.type === "short") return !!key.accept?.length;
  if (["mcq", "tf", "number"].includes(slide.type)) return key.correct != null;
  if (slide.type === "multi") return !!key.correct?.length;
  return false;
}
