import { useEffect, useRef, useState } from "react";
import { data, useLocation, useNavigate } from "react-router-dom";
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
  const nav = useNavigate();


  var [playercount , setPlayercount] = useState(0)
  var [won, setwon] = useState(false);
  // Pickup state
  const itemRef = useRef([]);
  const itemSpriteRef = useRef(null);

  // Equipped spell (null = default magic_missile)
  const equippedSpellRef = useRef(null);
 
  const button1IconRef = useRef(null);
  const startTimeRef = useRef(null);
  const frontendPlayersRef = useRef({});
  const canvasRef = useRef(null);
  const startedRef = false;
  const keysRef = useRef({});
  const playerInputsRef = useRef([]);
  const frontEndProjectilesRef = useRef({})
  let gameLoopActive = false;
  const gameStartedRef = useRef(false);
  const isSpectatingRef = useRef(false);


  const joystickRef = useRef(null);
  const spellJoystickRef = useRef(null);
  const buttonsRef = useRef({ b1: null, b2: null, b3: null });



  console.log("ROOM", roomkey);

  const [showdeath, setdeath] = useState(false);
  const [isSpectating, setIsSpectating] = useState(false);

  // Keep ref in sync with state
  useEffect(() => {
    isSpectatingRef.current = isSpectating;
  }, [isSpectating]);


  useEffect(() => {
    if (!gameStartedRef.current) {
      socket.emit("gameStart", roomkey);
      gameStartedRef.current = true;
    }

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';
    const tilesetImage = new Image();
    tilesetImage.src = wallsFloor;
    
    //// draw zone on offscreen canvas
    var c = document.createElement("canvas");
    c.width = canvas.width;
    c.height = canvas.height;
    const cctx = c.getContext("2d", { willReadFrequently: true });

    // Item sprite
    itemSpriteRef.current = new window.Image();
    itemSpriteRef.current.src = fireballPickup;

    let map = null;
    let grid = null;

    const isMobile = window.innerWidth < 768;
    const TILE_SIZE = 16; // tile width/height in source image
    const DESIRED_TILES_ACROSS = 20; // aim to show ~this many tiles across the screen
    //let scaleup_constant = Math.max(1, canvas.width / (DESIRED_TILES_ACROSS * TILE_SIZE));
    let scaleup_constant = Math.max(1, Math.floor(canvas.width / (DESIRED_TILES_ACROSS * TILE_SIZE)))







///////////////////////////CANVAS/interface RESIZE/////////////////
    let test_h=10;
    console.log(test_h);

    function layoutUI() {
      const cssW = window.visualViewport?.width ?? window.innerWidth;
      const cssH = window.visualViewport?.height ?? window.innerHeight;

     // Sizes (in px, scaled)
      const JOYSTICK_RADIUS = cssW * 0.03;
      const BUTTON_RADIUS   = cssW * 0.025;

      // Padding as % of width/height
      const EDGE_PADDING_X  = cssW * 0.15;
      const EDGE_PADDING_Y  = cssH * 0.3;

      // Joystick positions
      const joystickX = EDGE_PADDING_X + JOYSTICK_RADIUS;
      const joystickY = cssH - EDGE_PADDING_Y - JOYSTICK_RADIUS;

      const spellJoystickX = cssW - EDGE_PADDING_X - JOYSTICK_RADIUS;
      const spellJoystickY = cssH - EDGE_PADDING_Y - JOYSTICK_RADIUS;
      
      // Buttons: diagonal/vertical stack to the left and above the right joystick
      const buttonSpacing = BUTTON_RADIUS * 1.3;
      const b1X = spellJoystickX;
      const b1Y = spellJoystickY - JOYSTICK_RADIUS - buttonSpacing * 2.2;
      const b2X = spellJoystickX - buttonSpacing * 2.2;
      const b2Y = spellJoystickY - JOYSTICK_RADIUS - buttonSpacing * 1.15;
      const b3X = spellJoystickX - buttonSpacing * 3.2;
      const b3Y = spellJoystickY;

      // Create UI
      joystickRef.current = new Joystick(joystickX, joystickY, JOYSTICK_RADIUS);
      joystickRef.current.attachEvents(canvas);
      spellJoystickRef.current = new Joystick(spellJoystickX, spellJoystickY, JOYSTICK_RADIUS);
      spellJoystickRef.current.attachEvents(canvas);

      buttonsRef.current.b1 = new Button(b1X, b1Y, BUTTON_RADIUS, "1", "test", () => changeSpell(1));
      buttonsRef.current.b2 = new Button(b2X, b2Y, BUTTON_RADIUS, "2", "Health", null);
      buttonsRef.current.b3 = new Button(b3X, b3Y, BUTTON_RADIUS, "3", "Utility", null);
      
      buttonsRef.current.b1.setCanvas(canvas);
      buttonsRef.current.b2.setCanvas(canvas);
      buttonsRef.current.b3.setCanvas(canvas);
      buttonsRef.current.b1.Eventen();
      buttonsRef.current.b2.Eventen();
      buttonsRef.current.b3.Eventen();
    }
    const scale = window.devicePixelRatio;// Change to 1 on retina screens to see 
      
    function pixelRatio(params) {

      const vw =  window.innerWidth;
      const vh =   window.innerHeight;
      
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      
      ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.imageSmoothingQuality = 'low';

      
      canvas.width = Math.floor(vw * scale);
      canvas.height = Math.floor(vh * scale);
      console.log("scala", canvas.height);
      //ctx.setTransform(scale, 0, 0, scale, 0, 0);
      layoutUI();
    }
    


    let remove = null;
    function watchScale(params) {
        remove?.();
        const mq = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
        const onChange = () => { pixelRatio(); watchScale(); };
        mq.addEventListener("change", onChange);
        remove = () => mq.removeEventListener("change", onChange);
    }
    pixelRatio();
    watchScale();
    console.log("efter",canvas.height);
    window.addEventListener("resize", pixelRatio);
    window.visualViewport.addEventListener("resize", pixelRatio); //to change the size of safari











    //zone radius and time
    let radius =   canvas.width*2 ;
    let smallRadius = radius;
    const startRadius = radius;
    const duration = 60000;
    let startTime = startTimeRef.current;

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
          frontendPlayers[id].dx = backendPlayer.dx;
          frontendPlayers[id].dy = backendPlayer.dy;


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

    //############ WALL COLLISION #######################
    function wallCollison(object, player) {
    if (object==null) return; 
      const obj = object.objectLayers[0].obj; 
        const player_x =  player.x;
        const player_y = player.y;
        const player_width =  16;
        const player_height =  16;
        for (let j = 0; j < obj.objects.length; j++) {
            const wallX = obj.objects[j].x;  

            const wallY = obj.objects[j].y;
            const wallWidth = obj.objects[j].width;
            const wallHeight = obj.objects[j].height;

            if (
                player_x < wallX + wallWidth &&
                player_x + player_width > wallX &&
                player_y < wallY + wallHeight &&
                player_y + player_height > wallY
            ) {                
                return true;
            }
        }

        return false;
    }
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
/*
    // Create UI
    joystickRef.current = new Joystick(joystickX, joystickY, JOYSTICK_RADIUS);
    joystickRef.current.attachEvents(canvas);
    spellJoystickRef.current = new Joystick(spellJoystickX, spellJoystickY, JOYSTICK_RADIUS);
    spellJoystickRef.current.attachEvents(canvas);

    buttonsRef.current.b1 = new Button(b1X, b1Y, BUTTON_RADIUS, "1", "test", () => changeSpell(1));
    buttonsRef.current.b2 = new Button(b2X, b2Y, BUTTON_RADIUS, "2", "Health", null);
    buttonsRef.current.b3 = new Button(b3X, b3Y, BUTTON_RADIUS, "3", "Utility", null);
    */
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
      const joystick = joystickRef.current;
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
      const obj = map;
      // Update player position
      if (frontendPlayers[socket.id]) {
        //if statement om x och y 
        
        const player = frontendPlayers[socket.id];
        const speed = player.speed || 100;
        player.x += dx * speed * 0.015;
        player.y += dy * speed * 0.015;
        if (wallCollison(obj, player) == false || wallCollison(obj, player) == undefined){
                player.x += (dx * player.speed * 0.015) ;
                player.y += (dy * player.speed * 0.015);


            }else{
                //if collision is true from input the characters will move away from the wall
                if (0.1 <= dx && dx <= 1|| 0.1 <= dy && dy<= 1 || -1 <= dx && dx <= -0.1|| -1 <= dy && dy <= -0.1) {
                   player.x += (-dx * player.speed * 0.015); // reverse the input in x coordinate x
                   player.y += (-dy * player.speed * 0.015); // reverse the input in x coordinate y

                }
              }

        // Send combined movement input to server (always, even when 0, to stop movement)
        player.dx = dx;
        player.dy = dy;
        socket.emit('movement', { dx, dy, sequenceNumber, roomkey });
      }


      // Update spell direction from right joystick FIRST
      direction.x = spellJoystickRef.current.dx;
      direction.y = spellJoystickRef.current.dy;

      // Save last valid direction (for when joystick is released and resets to 0)
      if (spellJoystickRef.current.dx !== 0 || spellJoystickRef.current.dy !== 0) {
        lastValidDirection.x = spellJoystickRef.current.dx;
        lastValidDirection.y = spellJoystickRef.current.dy;
      }

      // Log right joystick state for debugging
    

      // SAVE direction BEFORE state change happens
      if (previous_state == true && spellJoystickRef.current.isPressed == false) {
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
      previous_state = spellJoystickRef.current.isPressed;
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
    //####MAIN GAME LOOP#############################################################################################
    let lastTime = 0;
    function loop(timestamp) {
      if (!gameLoopActive || !map) return;
      
      // If spectating but player not found, still allow rendering other players
      if (!isSpectatingRef.current && !frontendPlayers[socket.id]) return;

      try {
        // Use CSS pixels for layout (canvas.width/height are device pixels)
        const cssWidth = canvas.width / scale;
        const cssHeight = canvas.height / scale;

        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = "white";
        // Ensure the drawing transform maps CSS pixels to device pixels
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.fillRect(-10, -10, cssWidth + 20, cssHeight + 20);

        // Center camera on player (CSS pixel coordinates)
        const cameraOffsetX = cssWidth / 2;
        const cameraOffsetY = cssHeight / 2;

        // Recompute scale dynamically to keep consistent view across resolutions
        // Use CSS pixels (canvas.width is device pixels) to avoid double-scaling
        scaleup_constant = Math.max(1, Math.floor((canvas.width / scale) / (DESIRED_TILES_ACROSS * TILE_SIZE)));

        // If spectating (dead), center camera on map and show full map
        if (isSpectatingRef.current) {
          const mapCenterX = (map.layers[0]?.grid?.[0]?.length || 1) * TILE_SIZE / 2;
          const mapCenterY = (map.layers[0]?.grid?.length || 1) * TILE_SIZE / 2;
          // compute scale in CSS pixels and ensure at least 1 to avoid zero-scale
          scaleup_constant = Math.max(1, Math.floor(Math.min(
            (canvas.width / scale) / ((map.layers[0]?.grid?.[0]?.length || 1) * TILE_SIZE),
            (canvas.height / scale) / ((map.layers[0]?.grid?.length || 1) * TILE_SIZE)
          )));
          ctx.translate(
            cameraOffsetX - mapCenterX * scaleup_constant,
            cameraOffsetY - mapCenterY * scaleup_constant
          );
        } else {
          if (!frontendPlayers[socket.id]) return;
          ctx.translate(
            cameraOffsetX - (frontendPlayers[socket.id]?.x || 0) * scaleup_constant,
            cameraOffsetY - (frontendPlayers[socket.id]?.y || 0) * scaleup_constant
          );
          updatePlayer();
        }


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
        
        //set the overlay canvas for the zone 
        const zoneWorldX = (TILE_SIZE ) / 100;
        const zoneWorldY = (TILE_SIZE ) / 100;
        const player = isSpectatingRef.current ? null : frontendPlayers[socket.id];
        const cx = !isSpectatingRef.current ? (cameraOffsetX + (zoneWorldX-player.x) * scaleup_constant) : cameraOffsetX;
        const cy = !isSpectatingRef.current ? (cameraOffsetY + (zoneWorldY-player.y) * scaleup_constant) : cameraOffsetY;
        const circleX= (width * TILE_SIZE* scaleup_constant);
        const circleY= (height * TILE_SIZE * scaleup_constant);
        const playerX = !isSpectatingRef.current ? (player.x * scaleup_constant) : 0;
        const playerY = !isSpectatingRef.current ? (player.y * scaleup_constant) : 0;
        
        //set the time for the game play
        if (startTime === null) {
          startTime = timestamp;
        }
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Blue background zone
        cctx.globalCompositeOperation = 'source-over';
        cctx.clearRect(0, 0, c.width, c.height);
        cctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        cctx.fillRect(cx, cy , width * TILE_SIZE* scaleup_constant, height * TILE_SIZE * scaleup_constant);
        cctx.fill();

        //Shrinks the zone to end
        smallRadius = startRadius * (1 - progress);
        if (smallRadius > 0) {
          cctx.globalCompositeOperation = 'destination-out';
          cctx.fillStyle = 'rgba(0,0,0,1)';
          cctx.beginPath();
          cctx.arc(cx+(circleX/2), cy+(circleY/2), smallRadius, 0, Math.PI * 2);
          cctx.fill();   
          
        }
/*
        //checks if player is outside zone
        function isBlue() {
          const postion = cctx.getImageData(cx+playerX, cy+playerY , 50, 80).data;
          const [r, g, b, a] = postion;          
           if( r === 0 && g === 0 && b === 255 && a === 128){
            
            
            return true;
           }
          return false;
        }

        if (!isSpectatingRef.current) {
          const state = isBlue();
          socket.emit('zone', {state, roomkey});
        }

      
          */
 
        // tiny red debug square on top (optional, you can remove this)
        //ctx.fillStyle = '#ff0000';
        //ctx.fillRect(0, 0, 10 * scaleup_constant, 10 * scaleup_constant);

        // Update animations
        const deltaTime = (timestamp - lastTime) / 1000; // in seconds
        lastTime = timestamp;
        Object.values(frontendPlayers).forEach(player => {
          player.update(deltaTime); 
          
        });

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
        ctx.setTransform(scale, 0, 0, scale, 0, 0);

        // Only draw controls if not spectating
        if (!isSpectatingRef.current) {
          // Draw joystick (fixed to screen, not affected by camera)
          const joystick = joystickRef.current;
          joystick.draw(ctx);

          // Draw spell joystick and buttons (fixed to screen, not affected by camera)
          spellJoystickRef.current.draw(ctx);
          buttonsRef.current.b1.draw(ctx);
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
          buttonsRef.current.b2.draw(ctx);
          buttonsRef.current.b3.draw(ctx);
        }

        ctx.drawImage(c,0,0);
        
        // Draw spectator indicator
        if (isSpectatingRef.current) {
          ctx.setTransform(scale, 0, 0, scale, 0, 0);
          ctx.fillStyle = 'rgb(0, 0, 0)';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'left';
          ctx.fillText('SPECTATING', 20, 40);
          
          // Draw exit spectator button
          const buttonWidth = 150;
          const buttonHeight = 50;
          const buttonX = canvas.width - buttonWidth - 20;
          const buttonY = 20;
          
          ctx.fillStyle = 'rgb(0, 0, 0)';
          ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
          
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Home', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
          
          // Store button bounds for click detection
          canvasRef.current.exitSpectateButton = { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight };
        }

        //requestAnimationFrame(loop)
        
      } catch (error) {
        console.error("Error in loop:", error);
      }
    }

    //requestAnimationFrame(loop);// if it's inside the interval the game will get slower


      /* TA EJ BORT FÖRSÖKER FIXA BÄTTRE SERVER 
    let accumulator = 0;
    const TICK_RATE = 30; // 30 ms per tick = ~33 ticks per second
    const TICK_MS = 1000 / TICK_RATE;
    let lastTimestamp = 0;
    let currentTick = 0;

    function render(timestamp) {
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      accumulator += deltaTime;

      while (accumulator >= TICK_MS) {
        loop();
        accumulator -= TICK_MS;
        currentTick++;
      }

      requestAnimationFrame(render);
    }*/
    
      
    setInterval(() => {
      requestAnimationFrame(loop);
      
      // console.log("inputs:", playerInputs);
    }, 15);
    


  

    //####EVENT HANDLERS FOR BUTTONS AND JOYSTICKS#############################################################################################
    // Setup button event handlers
/*
    buttonsRef.current.b1.setCanvas(canvas);
    buttonsRef.current.b2.setCanvas(canvas);
    buttonsRef.current.b3.setCanvas(canvas);
    buttonsRef.current.b1.Eventen();
    buttonsRef.current.b2.Eventen();
    buttonsRef.current.b3.Eventen();
*/

    // Handle spectate exit button click
    const handleCanvasClick = (e) => {
      if (isSpectatingRef.current && canvasRef.current.exitSpectateButton) {
        const button = canvasRef.current.exitSpectateButton;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (x >= button.x && x <= button.x + button.width && 
            y >= button.y && y <= button.y + button.height) {
          socket.emit("delete_user", roomkey);
          socket.emit("restart_game", roomkey);
          nav("/");
        }
      }
    };
    
    canvas.addEventListener('click', handleCanvasClick);

    const death = (data)=>{
       console.log("you died")
      setPlayercount(data)
      console.log("death playercount", playercount)
      setdeath(true);
      setwon(false);
      const won = false;
      console.log(showdeath);
    }
    
    const winner = (data) =>{
       console.log("you won")
      setPlayercount(data)
      console.log(data)
        setwon(true);
       setdeath(true);
    }




    socket.on("death", death);
    socket.on("winner", winner)


//requestAnimationFrame(render);

    return () => {
      socket.off('map', mapOn);
      socket.off('updateProjectiles', OnupdateProjectiles);
      socket.off("updatePlayers", OnupdatePlayer);
      socket.off("death",death)
      socket.off("winner", winner)
      clearInterval(itemSpawnInterval);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [])

  

  return (
    <div >
      <canvas className="gamecanvas" ref={canvasRef}></canvas>
      {showdeath && !isSpectating &&(
        <Game_death placement= {playercount} won ={won} onSpectate={() => setIsSpectating(true)}></Game_death>
      )}
    </div>
  );
}