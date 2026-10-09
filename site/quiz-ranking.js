export function initials(name) {
  const words = String(name || "Student").trim().split(/\s+/).filter(Boolean);
  return (Array.from(words[0] || "S")[0] + (words.length > 1 ? Array.from(words[words.length - 1])[0] : "")).toLocaleUpperCase();
}
export function rankQuiz(slides, students, keys, rounds, grade) {
  const questions = slides.filter(s => s.quiz !== false && keys[s.id] && s.graded !== false);
  const rows = students.map(student => {
    let points = 0, credit = 0, answered = 0, elapsedTotal = 0, timed = 0;
    for (const question of questions) {
      const response = student.ans?.[question.id];
      const round = rounds?.[question.id], timing = student.answerTimes?.[question.id];
      if (response == null || response === "" || !round || !timing || timing.round !== round.id) continue;
      const value = grade(question, keys[question.id], response);
      if (value == null) continue;
      const correct = Math.max(0, Math.min(1, value));
      const elapsed = Math.max(0, Number(timing.elapsedMs) || 0);
      const windowMs = (Number(round.seconds) || 30) * 1000;
      const bonus = 500 * Math.max(0, 1 - elapsed / windowMs);
      points += Math.round(correct * (1000 + bonus) * (Number(question.points) || 1));
      credit += correct; answered++; elapsedTotal += elapsed; timed++;
    }
    return { id: student.id, name: student.name, initials: initials(student.name), points, answered,
      accuracy: answered ? Math.round(credit / answered * 100) : 0, averageMs: timed ? elapsedTotal / timed : null };
  }).filter(row => row.answered);
  rows.sort((a,b) => b.points-a.points || b.accuracy-a.accuracy || a.averageMs-b.averageMs || a.name.localeCompare(b.name));
  rows.forEach((row,i) => row.rank = i && row.points === rows[i-1].points && row.accuracy === rows[i-1].accuracy && row.averageMs === rows[i-1].averageMs ? rows[i-1].rank : i+1);
  return rows;
}
