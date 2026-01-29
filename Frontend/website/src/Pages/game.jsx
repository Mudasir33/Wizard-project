import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { socket } from "../../../game/Socket";
import { Player } from "../../../game/Player.js";
import { Joystick } from "../../../game/joystick.js";
import { Button } from "../../../game/Buttons.js";
import { Spell, spell_list } from "../../../game/spells.js";
import wallsFloor from "../../../../Assets/maps/walls_floor.png";
import fireballPickup from "../../../../Assets/Spells/fireball_pickup.png";
import { Socket } from "socket.io-client";
import Game_death from "./Game_Death.jsx";

export default function Game() {
  //should help with 
  const { state: roomkey } = useLocation();

  // Pickup state
  const itemRef = useRef([]);
  const itemSpriteRef = useRef(null);

  // Equipped spell (null = default magic_missile)
  const equippedSpellRef = useRef(null);
 
  const button1IconRef = useRef(null);
  const frontendPlayersRef = useRef({});
  const canvasRef = useRef(null);
  const startedRef = false;
  const keysRef = useRef({});
  const playerInputsRef = useRef([]);
  const frontEndProjectilesRef = useRef({})
  let gameLoopActive = false;
  const gameStartedRef = useRef(false);

  console.log("ROOM", roomkey);
  const [showdeath, setdeath] = useState(false);

  useEffect(() => {
    if (!gameStartedRef.current) {
      socket.emit("gameStart", roomkey);
      gameStartedRef.current = true;
    }

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const tilesetImage = new Image();
    tilesetImage.src = wallsFloor;

    // Item sprite
    itemSpriteRef.current = new window.Image();
    itemSpriteRef.current.src = fireballPickup;

    let map = null;
    let grid = null;

    const isMobile = window.innerWidth < 768;
    const TILE_SIZE = 16; // tile width/height in source image
    const DESIRED_TILES_ACROSS = 20; // aim to show ~this many tiles across the screen
    let scaleup_constant = Math.max(1, canvas.width / (DESIRED_TILES_ACROSS * TILE_SIZE));

    // Helper: get random walkable tile
    function getRandomWalkableTile() {
      if (!map || !map.layers || !map.layers[0] || !map.layers[0].grid) return { x: 5, y: 5 };
      const grid = map.layers[0].grid;
      const height = grid.length;
      const width = grid[0].length;
      let tries = 0;
      while (tries < 100) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        // Assume walkable if id is not 0/null (customize as needed)
        if (grid[y][x] && grid[y][x].id !== 0) {
          return { x, y };
        }
        tries++;
      }
      return { x: 5, y: 5 };
    }

    // Spawn item every 10 seconds
    // Only spawn spell_list pickups (not magic_missile)
    function getRandomSpellPickup() {
      const keys = Object.keys(spell_list).filter(k => k !== "magic_missile");
      const key = keys[Math.floor(Math.random() * keys.length)] || "fireball";
      const texture = spell_list[key].texture;
      return { key, texture };
    }
    function spawnItem() {
      if (!map) return;
      const pos = getRandomWalkableTile();
      const pickup = getRandomSpellPickup();
      itemRef.current.push({
        x: pos.x * TILE_SIZE + TILE_SIZE / 2,
        y: pos.y * TILE_SIZE + TILE_SIZE / 2,
        active: true,
        spellKey: pickup.key,
        spellTexture: pickup.texture
      });
    }
    const itemSpawnInterval = setInterval(() => {
      if (map) {
        spawnItem();
      }
    }, 10000);




    /*
        socket.on('map', (loadmap) => {
          map = loadmap;
           console.log('tesst', map.layers[3].length);
           gameLoopActive = true;
          requestAnimationFrame(loop);
        });
       */
    function mapOn(loadmap) {
      map = loadmap;
      gameLoopActive = true;


      requestAnimationFrame(loop);


    }
    socket.on("map", mapOn);
    const frontendPlayers = frontendPlayersRef.current;
    const playerInputs = playerInputsRef.current;
    let sequenceNumber = 0;

    function OnupdatePlayer(backendPlayers, room) {


      for (const id in backendPlayers) {
        const backendPlayer = backendPlayers[id];
        //console.log(backendPlayer);


        if (!frontendPlayers[id]) {
          frontendPlayers[id] = new Player(backendPlayer.x, backendPlayer.y);
        } else {
          frontendPlayers[id].x = backendPlayer.x;
          frontendPlayers[id].y = backendPlayer.y;
          frontendPlayers[id].health = backendPlayer.health;
          frontendPlayers[id].alive = backendPlayer.alive;

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

    }

    socket.on("updatePlayers", OnupdatePlayer);


    const keys = keysRef.current;
    //maybe needs to be closed after a render?
    window.addEventListener('keydown', (e,) => {
      keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
      keys[e.key] = false;
      socket.emit('keyup', e.code, roomkey);
    });



    //##########Projectiles/spells##########################################################################################

    const frontEndProjectiles = frontEndProjectilesRef.current;
    function OnupdateProjectiles(backendProjectiles) {
      for (const id in backendProjectiles) {
        const backendProjectile = backendProjectiles[id];

        if (!frontEndProjectiles[id]) {
          frontEndProjectiles[id] = new Spell(
            backendProjectile.x,
            backendProjectile.y,
            spell_list[backendProjectile.spellName],
            backendProjectile.spellDirection
          );
        } else {
          frontEndProjectiles[id].x = backendProjectile.x;
          frontEndProjectiles[id].y = backendProjectile.y;
        }
      }
      for (const id in frontEndProjectiles) {
        if (!backendProjectiles[id]) delete frontEndProjectiles[id];
      }
    }
    socket.on('updateProjectiles', OnupdateProjectiles);

    
   


    //####SPELLS#############################################################################################
    let direction = {
      x: 0,
      y: 0
    };

    //kanske ändra 
    let lastValidDirection = { x: 1, y: 0 }; // Remember last direction swiped
    let choosen_spell = "magic_missile";
    let spelllist = [];
    let previous_state = false;

    // Sizes (in px, scaled)
    const JOYSTICK_RADIUS = canvas.width * 0.03;
    const BUTTON_RADIUS = canvas.width * 0.025;

    // Padding as % of width/height
    const EDGE_PADDING_X = canvas.width * 0.15;
    const EDGE_PADDING_Y = canvas.height * 0.3;

    // Joystick positions
    const joystickX = EDGE_PADDING_X + JOYSTICK_RADIUS;
    const joystickY = canvas.height - EDGE_PADDING_Y - JOYSTICK_RADIUS;
    const spellJoystickX = canvas.width - EDGE_PADDING_X - JOYSTICK_RADIUS;
    const spellJoystickY = canvas.height - EDGE_PADDING_Y - JOYSTICK_RADIUS;

    // Buttons: diagonal/vertical stack to the left and above the right joystick
    const buttonSpacing = BUTTON_RADIUS * 1.3;
    const b1X = spellJoystickX;
    const b1Y = spellJoystickY - JOYSTICK_RADIUS - buttonSpacing * 2.2;
    const b2X = spellJoystickX - buttonSpacing * 2.2;
    const b2Y = spellJoystickY - JOYSTICK_RADIUS - buttonSpacing * 1.15;
    const b3X = spellJoystickX - buttonSpacing * 3.2;
    const b3Y = spellJoystickY;

    // Create UI
    const joystick = new Joystick(joystickX, joystickY, JOYSTICK_RADIUS);
    joystick.attachEvents(canvas);
    const spellJoystick = new Joystick(spellJoystickX, spellJoystickY, JOYSTICK_RADIUS);
    spellJoystick.attachEvents(canvas);
    const b1 = new Button(b1X, b1Y, BUTTON_RADIUS, "1", "test", () => changeSpell(1));
    const b2 = new Button(b2X, b2Y, BUTTON_RADIUS, "2", "Health", null);
    const b3 = new Button(b3X, b3Y, BUTTON_RADIUS, "3", "Utility", null);


    function updatePlayer() {
            // Check for item pickup (collision)
            for (let i = itemRef.current.length - 1; i >= 0; i--) {
              const item = itemRef.current[i];
              if (item.active && frontendPlayers[socket.id]) {
                const player = frontendPlayers[socket.id];
                const dx = player.x - item.x;
                const dy = player.y - item.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 15) {
                  // Set button 1 icon to this spell
                  const img = new window.Image();
                  img.src = item.spellTexture;
                  button1IconRef.current = { key: item.spellKey, image: img };
                  itemRef.current.splice(i, 1); // Remove item
                }
              }
            }
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
        //if statement om x och y 

        const player = frontendPlayers[socket.id];
        const speed = player.speed || 100;
        player.x += dx * speed * 0.015;
        player.y += dy * speed * 0.015;

        // Send combined movement input to server (always, even when 0, to stop movement)


        socket.emit('movement', { dx, dy, sequenceNumber, roomkey });
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
        let spellToCast = "magic_missile";
        if (equippedSpellRef.current) {
          spellToCast = equippedSpellRef.current;
          // After casting equipped spell, revert to default and remove icon
          equippedSpellRef.current = null;
          button1IconRef.current = null;
        }
        console.log("SHOOT TRIGGERED! Direction:", lastValidDirection, "Spell:", spellToCast);
        spellCreate(spellToCast, lastValidDirection, roomkey);
      }
      // Update state AFTER we process the release
      previous_state = spellJoystick.isPressed;
    }

    //####SPELL CREATION#############################################################################################
    function spellCreate(spellName, spellDirection, roomkey) {
      socket.emit('spellCast', {
        spellName: spellName,
        spellDirection: spellDirection,
        x: frontendPlayers[socket.id].x,
        y: frontendPlayers[socket.id].y,
        roomkey

      })

      /*
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
        */
    }

    //####CHANGE SPELL#############################################################################################
    function changeSpell(button) {
      // Button 1: equip spell_list
      if (button === 1 && button1IconRef.current) {
        equippedSpellRef.current = button1IconRef.current.key;
        console.log("Equipped spell:", equippedSpellRef.current);
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

        for (const id in frontEndProjectiles) {
          const projectile = frontEndProjectiles[id];
          projectile.draw(ctx, scaleup_constant);
        }

        // Draw items if active, scale to wizard size (11x15)
        itemRef.current.forEach(item => {
          if (item.active && itemSpriteRef.current.complete) {
            ctx.save();
            ctx.drawImage(
              itemSpriteRef.current,
              (item.x - 11 / 2) * scaleup_constant,
              (item.y - 15 / 2) * scaleup_constant,
              11 * scaleup_constant,
              15 * scaleup_constant
            );
            ctx.restore();
          }
        });


        //Old local spell drawing code (now handled by server updates)
        /* Draw and update spells with proper camera offset (still in world transform)
        const camX = cameraOffsetX - (frontendPlayers[socket.id]?.x || 0) * scaleup_constant;
        const camY = cameraOffsetY - (frontendPlayers[socket.id]?.y || 0) * scaleup_constant;
        
      
         Old local spell drawing code (now handled by server updates)
        for (let i = spelllist.length - 1; i >= 0; i--) {
          try {
            const s = spelllist[i];
            if (s) {
              s.draw(ctx, scaleup_constant);
              s.update();
            }
          } catch (error) {
            console.error("Error with spell:", error);
          }
        }
        */

        // Reset canvas transformation to draw UI (joystick) in screen coordinates
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Draw joystick (fixed to screen, not affected by camera)
        joystick.draw(ctx);

        // Draw spell joystick and buttons (fixed to screen, not affected by camera)
        spellJoystick.draw(ctx);
        b1.draw(ctx);
        // Draw button 1 icon if available
        if (button1IconRef.current && button1IconRef.current.image && button1IconRef.current.image.complete && b1X && b1Y && BUTTON_RADIUS) {
          ctx.save();
          ctx.drawImage(
            button1IconRef.current.image,
            b1X - BUTTON_RADIUS,
            b1Y - BUTTON_RADIUS,
            BUTTON_RADIUS * 2,
            BUTTON_RADIUS * 2
          );
          ctx.restore();
        }
        b2.draw(ctx);
        b3.draw(ctx);

        // Check for collisions between players

        /*
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

        }*/

        //requestAnimationFrame(loop);
        // canvas.drawImage(player.image, player.x, player.y);
        // player.draw();
        // console.log(player);
      } catch (error) {
        console.error("Error in loop:", error);
      }
    }


    setInterval(() => {

      requestAnimationFrame(loop);
      // console.log("inputs:", playerInputs);
    }, 15);


    
  socket.on("death", (data)=>{
    console.log("you are dead")
    setdeath(true);
  }
  
  )

    //####EVENT HANDLERS FOR BUTTONS AND JOYSTICKS#############################################################################################
    // Setup button event handlers

    b1.setCanvas(canvas);
    b2.setCanvas(canvas);
    b3.setCanvas(canvas);
    b1.Eventen();
    b2.Eventen();
    b3.Eventen();

    return () => {
      socket.off('map', mapOn);
      socket.off('updateProjectiles', OnupdateProjectiles);
      socket.off("updatePlayers", OnupdatePlayer);
      socket.off("death");
      clearInterval(itemSpawnInterval);
    };
  }, [])


  return (
    <div className="gamecanvas">
      <canvas ref={canvasRef}></canvas>
      {showdeath &&(
        <Game_death ></Game_death>
      )}
    </div>
  );
}