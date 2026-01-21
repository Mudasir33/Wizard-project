import { Player } from './Player.js';
import { Joystick } from './joystick.js';
import { Button } from './Buttons.js';
import { Spell, spell_list } from './spells.js';

const tilesetImage = new Image();
tilesetImage.src = '/walls_floor.png';

const canvas = document.getElementById('canvas');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext('2d');

ctx.imageSmoothingEnabled = false;

let map = null;
let grid = null;
// Adjust zoom so the same world area is visible across devices
const isMobile = window.innerWidth < 768;
const TILE_SIZE = 16; // tile width/height in source image
const DESIRED_TILES_ACROSS = 20; // aim to show ~this many tiles across the screen
let scaleup_constant = Math.max(1, canvas.width / (DESIRED_TILES_ACROSS * TILE_SIZE));

const socket = io('http://95.155.245.165:3000');

socket.on('connect', () => {
  console.log(`you connected with id: ${socket.id}`);
});

socket.on('map', (loadmap) => {
  map = loadmap;
  // console.log('tesst', map.layers[3].length);
  // Start the game loop once
  gameLoopActive = true;
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
let gameLoopActive = false;

//####SPELLS#############################################################################################
let direction = {
  x: 0,
  y: 0
};

let lastValidDirection = { x: 1, y: 0 }; // Remember last direction swiped
let choosen_spell = "fireball";
let spelllist = [];
let previous_state = false;

// Initialize joystick
const joystickRadius = Math.min(canvas.width, canvas.height) * 0.08;
const joystickX = canvas.width * 0.2;
const joystickY = canvas.height * 0.75;
const joystick = new Joystick(joystickX, joystickY, joystickRadius);
joystick.attachEvents(canvas);

//####JOYSTICK FOR SPELLS (RIGHT SIDE)#############################################################################################
const spellJoystickRadius = Math.min(canvas.width, canvas.height) * 0.08;
const spellJoystickX = canvas.width * 0.8;
const spellJoystickY = canvas.height * 0.75;
const spellJoystick = new Joystick(spellJoystickX, spellJoystickY, spellJoystickRadius);
spellJoystick.attachEvents(canvas);

//####BUTTONS FOR SPELLS (NEAR RIGHT JOYSTICK)#############################################################################################
const buttonRadius = Math.min(canvas.width, canvas.height) * 0.04;
const b1 = new Button((canvas.width - canvas.width * 0.20), (canvas.height * 0.50), buttonRadius, "1", "test", () => changeSpell(1));
const b2 = new Button((canvas.width - canvas.width * 0.255), (canvas.height * 0.575), buttonRadius, "2", "Health", null);
const b3 = new Button((canvas.width - canvas.width * 0.29), (canvas.height * 0.72), buttonRadius, "3", "Utility", null);

function updatePlayer() {
  let dx = 0,
    dy = 0;

  // Check keyboard input
  if (keys['ArrowUp'] || keys['w'] || keys['W']) {
    dy = -1;
  }
  if (keys['ArrowDown'] || keys['s'] || keys['S']) {
    dy = 1;
  }
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
    dx = -1;
  }
  if (keys['ArrowRight'] || keys['d'] || keys['D']) {
    dx = 1;
  }

  // Check joystick input (mobile)
  if (joystick.isPressed) {
    dx = joystick.dx;
    dy = joystick.dy;
  }

  // Normalize diagonal movement
  if (dx !== 0 && dy !== 0) {
    const inv = 1 / Math.sqrt(2);
    dx *= inv;
    dy *= inv;
  }

  // Update player position
  if (frontendPlayers[socket.id]) {
    const player = frontendPlayers[socket.id];
    const speed = player.speed || 100;
    player.x += dx * speed * 0.015;
    player.y += dy * speed * 0.015;

    // Send combined movement input to server (always, even when 0, to stop movement)
    socket.emit('movement', { dx, dy, sequenceNumber });
  }

  // Update spell direction from right joystick FIRST
  direction.x = spellJoystick.dx;
  direction.y = spellJoystick.dy;

  // Save last valid direction (for when joystick is released and resets to 0)
  if (spellJoystick.dx !== 0 || spellJoystick.dy !== 0) {
    lastValidDirection.x = spellJoystick.dx;
    lastValidDirection.y = spellJoystick.dy;
  }

  // Log right joystick state for debugging
  if (spellJoystick.isPressed) {
    console.log("Right joystick active - Direction:", direction, "isPressed:", spellJoystick.isPressed);
  }

  // SAVE direction BEFORE state change happens
  if (previous_state == true && spellJoystick.isPressed == false) {
    // Joystick was released - use LAST VALID direction, not current (which is now 0)
    console.log("SHOOT TRIGGERED! Direction:", lastValidDirection);
    spellCreate(choosen_spell, lastValidDirection);

    if (choosen_spell != "fireball") {
      console.log("changeback to fireball");
      choosen_spell = "fireball";
    }
  }

  // Update state AFTER we process the release
  previous_state = spellJoystick.isPressed;
}

//####SPELL CREATION#############################################################################################
function spellCreate(spellName, spellDirection) {
  if (frontendPlayers[socket.id]) {
    console.log("Creating spell:", spellName, "Direction:", spellDirection, "Spell list length before:", spelllist.length);
    spelllist.push(
      new Spell(
        frontendPlayers[socket.id].x,
        frontendPlayers[socket.id].y,
        spell_list[spellName],
        spellDirection
      )
    );
    console.log("Spell created! Total spells:", spelllist.length);
  } else {
    console.warn("Cannot create spell - no player");
  }
}

//####CHANGE SPELL#############################################################################################
function changeSpell(button) {
  if (button === 1) {
    console.log("change spell");
    choosen_spell = "test";
  }
}

function loop(t) {
  if (!gameLoopActive || !map || !frontendPlayers[socket.id]) return;
  
  try {
    updatePlayer();
    
    ctx.fillStyle = "white";
    ctx.fillRect(-10, -10, screen.width * scaleup_constant, screen.height * scaleup_constant);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Center camera on player (same behavior on mobile and desktop)
    const cameraOffsetX = canvas.width / 2;
    const cameraOffsetY = canvas.height / 2;

    // Recompute scale dynamically to keep consistent view across resolutions
    scaleup_constant = Math.max(1, canvas.width / (DESIRED_TILES_ACROSS * TILE_SIZE));

    ctx.translate(
      cameraOffsetX - (frontendPlayers[socket.id]?.x || 0) * scaleup_constant,
      cameraOffsetY - (frontendPlayers[socket.id]?.y || 0) * scaleup_constant
    );


  const height = map.layers[0]?.grid?.length || 0;
  const width = map.layers[0]?.grid?.[0]?.length || 0;
  if (height === 0 || width === 0) return;
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
        ctx.drawImage(
          tilesetImage,
          sx,
          sy,
          tileWH,
          tileWH,
          x * tileWH * scaleup_constant,
          y * tileWH * scaleup_constant,
          tileWH * scaleup_constant,
          tileWH * scaleup_constant
        );
      }
    }
  }

  // tiny red debug square on top (optional, you can remove this)
  //ctx.fillStyle = '#ff0000';
  //ctx.fillRect(0, 0, 10 * scaleup_constant, 10 * scaleup_constant);

  for (const id in frontendPlayers) {
    const player = frontendPlayers[id];
    player.draw(ctx, scaleup_constant);
  }

  // Draw and update spells with proper camera offset (still in world transform)
  const camX = cameraOffsetX - (frontendPlayers[socket.id]?.x || 0) * scaleup_constant;
  const camY = cameraOffsetY - (frontendPlayers[socket.id]?.y || 0) * scaleup_constant;
  
  for (let i = 0; i < spelllist.length; i++) {
    try {
      const s = spelllist[i];
      if (s) {
        s.draw(ctx, camX / scaleup_constant, camY / scaleup_constant);
        s.update();
      }
    } catch (error) {
      console.error("Error with spell:", error);
    }
  }

  // Reset canvas transformation to draw UI (joystick) in screen coordinates
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  
  // Draw joystick (fixed to screen, not affected by camera)
  joystick.draw(ctx);

  // Draw spell joystick and buttons (fixed to screen, not affected by camera)
  spellJoystick.draw(ctx);
  b1.draw(ctx);
  b2.draw(ctx);
  b3.draw(ctx);

  // Check for collisions between players
  const playerIds = Object.keys(frontendPlayers);
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const player1 = frontendPlayers[playerIds[i]];
      const player2 = frontendPlayers[playerIds[j]];
      if (player1.checkCollision(player2)) {
        // Simple collision damage
        player1.takeDamage(1);
        player2.takeDamage(1);
      }
    }
  }


  // canvas.drawImage(player.image, player.x, player.y);
  // player.draw();
  // console.log(player);
  } catch (error) {
    console.error("Error in loop:", error);
  }
  
  requestAnimationFrame(loop);
}

//####EVENT HANDLERS FOR BUTTONS AND JOYSTICKS#############################################################################################
// Setup button event handlers
b1.setCanvas(canvas);
b2.setCanvas(canvas);
b3.setCanvas(canvas);
b1.Eventen();
b2.Eventen();
b3.Eventen();

// Game loop starts when map is loaded (see socket.on('map'))