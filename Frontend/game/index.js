import { Player } from './Player.js';

const tilesetImage = new Image();
tilesetImage.src = '/walls_floor.png';

const gameCanvas = document.getElementById('canvas');
gameCanvas.width = window.innerWidth;
gameCanvas.height = window.innerHeight;

const canvas = gameCanvas.getContext('2d');

canvas.imageSmoothingEnabled = false;
let map = null;
let grid = null;

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log(`you connected with id: ${socket.id}`);
});

socket.on('map', (loadmap) => {
  map = loadmap;
  // console.log('tesst', map.layers[3].length);
  requestAnimationFrame(loop);
});

const frontendPlayers = {};

socket.on('updatePlayers', (backendPlayers) => {
  for (const id in backendPlayers) {
    const backendPlayer = backendPlayers[id];

    if (!frontendPlayers[id]) {
      frontendPlayers[id] = new Player(backendPlayer.x, backendPlayer.y);
    } else {
      frontendPlayers[id].x = backendPlayer.x;
      frontendPlayers[id].y = backendPlayer.y;

      if (id === socket.id) {
        // Update existing player position
        const lastBackendInputIndex = playerInputs.findIndex((input) => {
          return backendPlayer.sequenceNumber === input.sequenceNumber;
        });

        if (lastBackendInputIndex > -1) playerInputs.splice(0, lastBackendInputIndex + 1);

        playerInputs.forEach((input) => {
          frontendPlayers[id].x += input.dx;
          frontendPlayers[id].y += input.dy;
        });
      } else {
        frontendPlayers[id].x = backendPlayer.x;
        frontendPlayers[id].y = backendPlayer.y;
        /*
        gsap.to(frontendPlayers[id], {
          x: backendPlayer.x,
          y: backendPlayer.y,
          duration: 0.015,
          ease: 'linear'
        }); */
      }
    }

    for (const id in frontendPlayers) {
      if (!backendPlayers[id]) delete frontendPlayers[id];
    }
    // console.log(frontendPlayers);
  }
});

const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
  socket.emit('keyup', e.code);
});

const playerInputs = [];
let sequenceNumber = 0;

function updatePlayer() {
  let dx = 0,
    dy = 0;
  // console.log("keys:", keys);
  if (keys['ArrowUp'] || keys['w'] || keys['W']) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: 0, dy: -1 });
    dy = -1;
    socket.emit('keydown', { keycode: 'KeyW', sequenceNumber });
  }
  if (keys['ArrowDown'] || keys['s'] || keys['S']) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: 0, dy: 1 });
    dy = 1;
    socket.emit('keydown', { keycode: 'KeyS', sequenceNumber });
  }
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: -1, dy: 0 });
    dx = -1;
    socket.emit('keydown', { keycode: 'KeyA', sequenceNumber });
  }
  if (keys['ArrowRight'] || keys['d'] || keys['D']) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: 1, dy: 0 });
    dx = 1;
    socket.emit('keydown', { keycode: 'KeyD', sequenceNumber });
  }

  // Normalize diagonal movement
  if (dx !== 0 && dy !== 0) {
    const inv = 1 / Math.sqrt(2);
    dx *= inv;
    dy *= inv;
  }

  frontendPlayers[socket.id].x += dx * frontendPlayers[socket.id].speed * 0.015;
  frontendPlayers[socket.id].y += dy * frontendPlayers[socket.id].speed * 0.015;
}

function loop(t) {
  canvas.fillRect(0, 0, canvas.width, canvas.height);

  const height = map.layers[0].grid.length;
  const width = map.layers[0].grid[0].length;
  const tileWH = 16;
  const tilesPerRow = tilesetImage.width / 16;

  // console.log("grid test sx:",  (36 % tilesPerRow)*16); //y
  // console.log("grid test sy:",  Math.floor(36/tilesPerRow)*16);
  // console.log("tiledRow: ",tilesetImage.width/16 );
  for (let i = 0; i < map.layers.length; i++) {
    grid = map.layers[i].grid;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x] == null) continue;

        const { id } = grid[y][x];

        // console.log("id test;", id);  tar ut rätt id (måste va placeringen)
        const sx = (id % tilesPerRow) * 16;
        const sy = Math.floor(id / tilesPerRow) * 16;

        // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        canvas.drawImage(
          tilesetImage,
          sx,
          sy,
          tileWH,
          tileWH,
          x * tileWH,
          y * tileWH,
          tileWH,
          tileWH
        );
      }
    }
  }

  // tiny red debug square on top (optional, you can remove this)
  canvas.fillStyle = '#ff0000';
  canvas.fillRect(0, 0, 10, 10);

  for (const id in frontendPlayers) {
    const player = frontendPlayers[id];
    canvas.drawImage(player.image, player.x, player.y);
  }

  // canvas.drawImage(player.image, player.x, player.y);
  // player.draw();
  // console.log(player);
}

setInterval(() => {
  updatePlayer();
  requestAnimationFrame(loop);
  // console.log("inputs:", playerInputs);
}, 15);