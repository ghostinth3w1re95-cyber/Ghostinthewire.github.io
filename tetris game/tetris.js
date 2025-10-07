const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(30, 30);  // Scale the main game canvas

const nextPieceCanvas = document.getElementById('next-piece');
const nextPieceContext = nextPieceCanvas.getContext('2d');
nextPieceContext.scale(30, 30);

const holdPieceCanvas = document.getElementById('hold-piece');
const holdPieceContext = holdPieceCanvas.getContext('2d');
holdPieceContext.scale(30, 30);

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
        sound.play().catch(err => {
            console.log('Error playing sound:', err);
        });
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
    outer: for (let y = arena.length - 1; y >= 0; y--) {
        if (arena[y].every(value => value !== 0)) {
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
        'T': [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
        'O': [[2, 2], [2, 2]],
        'L': [[0, 0, 3], [3, 3, 3], [0, 0, 0]],
        'J': [[4, 0, 0], [4, 4, 4], [0, 0, 0]],
        'I': [[0, 0, 0, 0], [5, 5, 5, 5], [0, 0, 0, 0], [0, 0, 0, 0]],
        'S': [[0, 6, 6], [6, 6, 0], [0, 0, 0]],
        'Z': [[7, 7, 0], [0, 7, 7], [0, 0, 0]]
    };
    return pieces[type];
}

function drawMatrix(matrix, offset, context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                context.strokeStyle = 'white';
                context.lineWidth = 0.1;
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
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
    nextPieceContext.fillStyle = '#000';
    nextPieceContext.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    const nextPiece = createPiece(player.nextPiece);
    drawMatrix(nextPiece, { x: 0, y: 0 }, nextPieceContext);
}

function drawHeldPiece() {
    holdPieceContext.fillStyle = '#000';
    holdPieceContext.fillRect(0, 0, holdPieceCanvas.width, holdPieceCanvas.height);
    if (player.heldPiece) {
        const heldPieceMatrix = createPiece(player.heldPiece);
        drawMatrix(heldPieceMatrix, { x: 0, y: 0 }, holdPieceContext);
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
            arena.forEach(row => row.fill(0));
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
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > 1000) drop();
    draw();
    drawNextPiece();
    drawHeldPiece();
    requestAnimationFrame(update);
}

function startGame() {
    arena.forEach(row => row.fill(0));
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

document.addEventListener('keydown', event => {
    if (!gameRunning || gamePaused) return;
    if (event.key === 'ArrowLeft' || event.key === 'a') {
        movePlayer({ x: -1, y: 0 });
        playSound("move-sound");
    } else if (event.key === 'ArrowRight' || event.key === 'd') {
        movePlayer({ x: 1, y: 0 });
        playSound("move-sound");
    } else if (event.key === 'ArrowDown' || event.key === 's') {
        drop();
    } else if (event.key === 'ArrowUp' || event.key === 'w') {
        playerRotate();
    } else if (event.key === 'c' || event.key === 'C') {
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
const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    nextPiece: 'I',
    heldPiece: null
};
// Mobiilipainikkeiden toiminnot
document.getElementById('left').addEventListener('click', () => {
    movePlayer({ x: -1, y: 0 });
    playSound("move-sound");
});

document.getElementById('right').addEventListener('click', () => {
    movePlayer({ x: 1, y: 0 });
    playSound("move-sound");
});

document.getElementById('rotate').addEventListener('click', () => {
    playerRotate();
});

document.getElementById('drop').addEventListener('click', () => {
    drop();
});

document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('pause-button').addEventListener('click', pauseGame);
