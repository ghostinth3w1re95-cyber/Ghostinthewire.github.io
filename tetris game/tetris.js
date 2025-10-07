// 📱 Salli äänet heti ensimmäisestä kosketuksesta
document.addEventListener('touchstart', () => {}, { once: true });

const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

// 🔧 Skaalaa pienemmällä arvolla mobiilissa
if (window.innerWidth < 768) {
  context.scale(20, 20);
} else {
  context.scale(30, 30);
}

const nextPieceCanvas = document.getElementById('next-piece');
const nextPieceContext = nextPieceCanvas?.getContext('2d');
if (nextPieceContext) nextPieceContext.scale(30, 30);

const holdPieceCanvas = document.getElementById('hold-piece');
const holdPieceContext = holdPieceCanvas?.getContext('2d');
if (holdPieceContext) holdPieceContext.scale(30, 30);

const ROWS = 20;
const COLUMNS = 10;
let score = 0;
let gameRunning = false;
let gamePaused = false;

const colors = [null, 'purple', 'yellow', 'orange', 'blue', 'cyan', 'green', 'red'];

function playSound(id) {
  const sound = document.getElementById(id);
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }
}

function updateScore() {
  document.getElementById('score').innerText = score;
}

function createMatrix(w, h) {
  return Array.from({ length: h }, () => new Array(w).fill(0));
}

function collide(arena, player) {
  return player.matrix.some((row, y) =>
    row.some((value, x) =>
      value !== 0 && (arena[y + player.pos.y]?.[x + player.pos.x] ?? 1) !== 0
    )
  );
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function rotate(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

function movePlayer(offset) {
  player.pos.x += offset.x;
  player.pos.y += offset.y;
  if (collide(arena, player)) {
    player.pos.x -= offset.x;
    player.pos.y -= offset.y;
  }
}

function playerRotate() {
  playSound("rotate-sound");
  const pos = player.pos.x;
  let offset = 1;
  player.matrix = rotate(player.matrix);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) return;
  }
}

function clearLines() {
  let rowCount = 0;
  for (let y = arena.length - 1; y >= 0; y--) {
    if (arena[y].every(v => v !== 0)) {
      arena.splice(y, 1);
      arena.unshift(new Array(COLUMNS).fill(0));
      rowCount++;
      y++;
    }
  }
  if (rowCount > 0) playSound("clear-sound");
  const scores = [0, 100, 300, 500, 800];
  score += scores[rowCount];
  updateScore();
}

function createPiece(type) {
  const pieces = {
    'T': [[0,1,0],[1,1,1],[0,0,0]],
    'O': [[2,2],[2,2]],
    'L': [[0,0,3],[3,3,3],[0,0,0]],
    'J': [[4,0,0],[4,4,4],[0,0,0]],
    'I': [[0,0,0,0],[5,5,5,5],[0,0,0,0],[0,0,0,0]],
    'S': [[0,6,6],[6,6,0],[0,0,0]],
    'Z': [[7,7,0],[0,7,7],[0,0,0]]
  };
  return pieces[type];
}

function drawMatrix(matrix, offset, ctx) {
  matrix.forEach((row, y) => {
    row.forEach((v, x) => {
      if (v !== 0) {
        ctx.fillStyle = colors[v];
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 0.1;
        ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 }, context);
  drawMatrix(player.matrix, player.pos, context);
}

function drawNextPiece() {
  if (!nextPieceContext) return;
  nextPieceContext.fillStyle = '#000';
  nextPieceContext.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
  const nextPiece = createPiece(player.nextPiece);
  drawMatrix(nextPiece, { x: 0, y: 0 }, nextPieceContext);
}

function drawHeldPiece() {
  if (!holdPieceContext) return;
  holdPieceContext.fillStyle = '#000';
  holdPieceContext.fillRect(0, 0, holdPieceCanvas.width, holdPieceCanvas.height);
  if (player.heldPiece) {
    const held = createPiece(player.heldPiece);
    drawMatrix(held, { x: 0, y: 0 }, holdPieceContext);
  }
}

function drop() {
  playSound("drop-sound");
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    clearLines();
    playerReset();
  }
  dropCounter = 0;
}

function playerReset() {
  const pieces = 'ILJOTSZ';
  player.matrix = createPiece(player.nextPiece);
  player.pos.y = 0;
  player.pos.x = Math.floor(COLUMNS / 2) - Math.floor(player.matrix[0].length / 2);
  player.nextPiece = pieces[Math.floor(Math.random() * pieces.length)];
  drawNextPiece();
  drawHeldPiece();

  if (collide(arena, player)) {
    playSound("gameover-sound");
    gameRunning = false;
    setTimeout(() => {
      arena.forEach(r => r.fill(0));
      alert("Game Over! Final Score: " + score);
      score = 0;
      updateScore();
      document.getElementById('pause-button').disabled = true;
    }, 300);
  }
}

let dropCounter = 0;
let lastTime = 0;

function update(time = 0) {
  if (!gameRunning || gamePaused) return;
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;
  if (dropCounter > 1000) drop();
  draw();
  requestAnimationFrame(update);
}

function startGame() {
  arena.forEach(r => r.fill(0));
  gameRunning = true;
  gamePaused = false;
  score = 0;
  updateScore();
  playerReset();
  update();
  document.getElementById('pause-button').disabled = false;
}

function pauseGame() {
  gamePaused = !gamePaused;
  document.getElementById('pause-button').innerText = gamePaused ? "Resume" : "Pause";
  if (!gamePaused) update();
}

document.addEventListener('keydown', e => {
  if (!gameRunning || gamePaused) return;
  if (e.key === 'ArrowLeft' || e.key === 'a') {
    movePlayer({ x: -1, y: 0 }); playSound("move-sound");
  } else if (e.key === 'ArrowRight' || e.key === 'd') {
    movePlayer({ x: 1, y: 0 }); playSound("move-sound");
  } else if (e.key === 'ArrowDown' || e.key === 's') {
    drop();
  } else if (e.key === 'ArrowUp' || e.key === 'w') {
    playerRotate();
  } else if (e.key === 'c') {
    if (!player.heldPiece) {
      player.heldPiece = player.matrix;
      playerReset();
    } else {
      const temp = player.heldPiece;
      player.heldPiece = player.matrix;
      player.matrix = temp;
      player.pos.y = 0;
      player.pos.x = Math.floor(COLUMNS / 2) - Math.floor(player.matrix[0].length / 2);
    }
    drawHeldPiece();
  }
});

const arena = createMatrix(COLUMNS, ROWS);
const player = { pos: { x: 0, y: 0 }, matrix: null, nextPiece: 'I', heldPiece: null };

['left','right','rotate','drop'].forEach(id => {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('touchstart', e => {
    e.preventDefault();
    if (!gameRunning || gamePaused) return;
    switch(id){
      case 'left': movePlayer({ x:-1,y:0 }); playSound("move-sound"); break;
      case 'right': movePlayer({ x:1,y:0 }); playSound("move-sound"); break;
      case 'rotate': playerRotate(); break;
      case 'drop': drop(); break;
    }
  });
});

document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('pause-button').addEventListener('click', pauseGame);
