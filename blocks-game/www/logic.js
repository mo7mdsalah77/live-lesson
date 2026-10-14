// Pure rules for the classic falling-blocks game. Browser: window.BlocksLogic. Tests: require().
(function (root) {
  var COLS = 10, ROWS = 20;
  var BASE = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]]
  };
  var TYPES = Object.keys(BASE);
  var COLORS = { I: '#4ecdf0', O: '#ffd23f', T: '#b66bff', S: '#5ee27a', Z: '#ff5a6e', J: '#5b7bff', L: '#ff9f43' };

  function rotateMatrix(m) { var n = m.length, o = []; for (var r = 0; r < n; r++) { o.push([]); for (var c = 0; c < n; c++) o[r].push(m[n - 1 - c][r]); } return o; }
  function shapeOf(type, rot) { var m = BASE[type]; for (var i = 0; i < ((rot % 4) + 4) % 4; i++) m = rotateMatrix(m); return m; }
  function newBoard() { var b = []; for (var r = 0; r < ROWS; r++) b.push(new Array(COLS).fill(0)); return b; }
  function spawn(type) { return { type: type, rot: 0, x: Math.floor((COLS - BASE[type].length) / 2), y: type === 'I' ? -1 : 0 }; }

  function cells(p) {
    var m = shapeOf(p.type, p.rot), out = [];
    for (var r = 0; r < m.length; r++) for (var c = 0; c < m.length; c++) if (m[r][c]) out.push({ x: p.x + c, y: p.y + r });
    return out;
  }
  function collides(board, p) {
    return cells(p).some(function (c) { return c.x < 0 || c.x >= COLS || c.y >= ROWS || (c.y >= 0 && board[c.y][c.x]); });
  }
  function moved(p, dx, dy) { return { type: p.type, rot: p.rot, x: p.x + dx, y: p.y + dy }; }
  function tryMove(board, p, dx, dy) { var n = moved(p, dx, dy); return collides(board, n) ? null : n; }
  // Rotate clockwise (dir=1) or counter-clockwise (-1) with simple wall kicks.
  function rotate(board, p, dir) {
    var rot = (p.rot + (dir || 1) + 4) % 4, kicks = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0]];
    for (var i = 0; i < kicks.length; i++) { var n = { type: p.type, rot: rot, x: p.x + kicks[i][0], y: p.y + kicks[i][1] }; if (!collides(board, n)) return n; }
    return null;
  }
  function dropDistance(board, p) { var d = 0; while (!collides(board, moved(p, 0, d + 1))) d++; return d; }
  function lock(board, p) { cells(p).forEach(function (c) { if (c.y >= 0) board[c.y][c.x] = p.type; }); }
  function fullRows(board) { var rows = []; board.forEach(function (row, r) { if (row.every(Boolean)) rows.push(r); }); return rows; }
  function removeRows(board, rows) {
    var keep = board.filter(function (_, r) { return rows.indexOf(r) < 0; });
    while (keep.length < ROWS) keep.unshift(new Array(COLS).fill(0));
    for (var r = 0; r < ROWS; r++) board[r] = keep[r];
    return board;
  }
  function makeBag(rand) { var a = TYPES.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function lineScore(n, level) { return ([0, 100, 300, 500, 800][n] || 0) * level; }
  function levelFor(lines) { return Math.floor(lines / 10) + 1; }
  function gravityMs(level) { return Math.max(70, 800 - (level - 1) * 70); }

  var api = { COLS: COLS, ROWS: ROWS, TYPES: TYPES, COLORS: COLORS, shapeOf: shapeOf, newBoard: newBoard, spawn: spawn, cells: cells, collides: collides, tryMove: tryMove, rotate: rotate,
    dropDistance: dropDistance, lock: lock, fullRows: fullRows, removeRows: removeRows, makeBag: makeBag, lineScore: lineScore, levelFor: levelFor, gravityMs: gravityMs };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BlocksLogic = api;
})(this);
