import { useEffect, useRef, useState } from "react";
import { data, useLocation, useNavigate } from "react-router-dom";
import { socket } from "../../../game/Socket";
import { Player } from "../../../game/Player.js";
import { Joystick } from "../../../game/joystick.js";
import { Button } from "../../../game/Buttons.js";
import { Spell, spell_list } from "../../../game/spells.js";
import { ExplosionManager } from "../../../game/spell_effects.js";
import wallsFloor from "../../../../Assets/maps/walls_floor.png";
import fireballPickup from "../../../../Assets/Spells/fireball_pickup.png";
import haste_potion from "../assets/potion.png";
import { Socket } from "socket.io-client";
import Game_death from "./Game_Death.jsx";
import { Utility, utility_list } from "../../../game/utility.js";
import { use } from "react";


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
  const button3IconRef = useRef(null)
  const startTimeRef = useRef(null);
  const frontendPlayersRef = useRef({});
  const canvasRef = useRef(null);
  const startedRef = false;
  const keysRef = useRef({});
  const playerInputsRef = useRef([]);
  const frontEndProjectilesRef = useRef({})
  const explosionManagerRef = useRef(new ExplosionManager());
  let gameLoopActive = false;
  const gameStartedRef = useRef(false);
  const isSpectatingRef = useRef(false);
  const activeUtilitiesRef = useRef([]);




  const joystickRef = useRef(null);
  const spellJoystickRef = useRef(null);
  const buttonsRef = useRef({ b1: null, b2: null, b3: null });



  console.log("ROOM", roomkey);

  const [showdeath, setdeath] = useState(false);
  const [isSpectating, setIsSpectating] = useState(false);
  const [isJoinedAsSpectator] = useState(false);
  const spectatorListRef = useRef({});

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
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
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
    let scaleup_constant = Math.max(1, canvas.width / (DESIRED_TILES_ACROSS * TILE_SIZE));

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
      buttonsRef.current.b3 = new Button(b3X, b3Y, BUTTON_RADIUS, "3", "Utility", ()=> changehaste(3));
      
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
      
      
      canvas.width = Math.floor(vw * scale);
      canvas.height = Math.floor(vh * scale);
      console.log("scala", canvas.height);
      
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
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
    

    // Spawn item every 10 seconds
    // Only spawn spell_list pickups (not magic_missile)



  


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
          frontendPlayers[id] = new Player(backendPlayer.x, backendPlayer.y, backendPlayer.color);
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

            // Replay inputs with wall sliding collision
            const obj = map;
            playerInputs.forEach((input) => {
              const player = frontendPlayers[id];
              
              // Try X movement
              const oldX = player.x;
              player.x += input.dx;
              if (obj && wallCollison(obj, player)) {
                player.x = oldX;
              }
              
              // Try Y movement
              const oldY = player.y;
              player.y += input.dy;
              if (obj && wallCollison(obj, player)) {
                player.y = oldY;
              }
            });
          } else {
            frontendPlayers[id].x = backendPlayer.x;
            frontendPlayers[id].y = backendPlayer.y;
          }
        }
        

        for (const id in frontendPlayers) {
          if (!backendPlayers[id]) delete frontendPlayers[id];
        }
        // Auto-enable spectate mode if user is a spectator (not a player and in spectator list)
        if (!backendPlayers[socket.id] && spectatorListRef.current[socket.id] && !isSpectatingRef.current) {
          setIsSpectating(true);
        }
        // console.log(frontendPlayers);
      }

    }

    socket.on("updatePlayers", OnupdatePlayer);
    
    socket.on("spectatorList", (spectators) => {
      spectatorListRef.current = spectators;
      // Enable spectate if this user is in the spectator list
      if (spectators[socket.id] && !isSpectatingRef.current) {
        setIsSpectating(true);
      }
    });


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
        const player_width =  11;
        const player_height =  15;
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
    
    // Handle new projectile spawned (only receive spawn data, calculate movement locally)
    function OnProjectileSpawned(projectileId, projectile) {
      if (!frontEndProjectiles[projectileId]) {
        frontEndProjectiles[projectileId] = new Spell(
          projectile.x,
          projectile.y,
          spell_list[projectile.spellName],
          projectile.spellDirection
        );
        frontEndProjectiles[projectileId].spellName = projectile.spellName;
      }
    }
    socket.on('projectileSpawned', OnProjectileSpawned);
    
    // Handle projectile deleted (hit wall/player)
    function OnProjectileDeleted(projectileId, x, y, spellName) {
      if (frontEndProjectiles[projectileId]) {
        // Spawn explosion at server-reported position if fireball
        if (spellName === 'fireball') {
          explosionManagerRef.current.spawn(x, y);
        }
        delete frontEndProjectiles[projectileId];
      }
    }
    socket.on('projectileDeleted', OnProjectileDeleted);

    // Handle projectile bounced (update position and direction)
    function OnProjectileBounced(projectileId, x, y, newDirection) {
      if (frontEndProjectiles[projectileId]) {
        frontEndProjectiles[projectileId].x = x;
        frontEndProjectiles[projectileId].y = y;
        const len = Math.hypot(newDirection.x, newDirection.y);
        if (len > 0) {
          frontEndProjectiles[projectileId].dx = newDirection.x / len;
          frontEndProjectiles[projectileId].dy = newDirection.y / len;
        }
      }
    }
    socket.on('projectileBounced', OnProjectileBounced);

      function create_image(src){
        const img = new Image();
        img.src = src;
        return img;
    }
    const spawnitems = (spawnItems)=> {
      console.log("item spawned:", spawnItems.key)
      itemRef.current.push({
        ...spawnItems,
        active: true,
        image: create_image(spawnItems.type==="spell"
          ?spell_list[spawnItems.key].pickupTexture : utility_list[spawnItems.key].pickupTexture
        ),
        image_pickup: create_image(spawnItems.type==="spell"
           ?spell_list[spawnItems.key].pickupTexture : utility_list[spawnItems.key].pickupTexture
        )
        
      })
    }





    socket.on("spawnItems", spawnitems)

    const removeitem =(removed_item)=>
    {
      console.log("remove item frontend", removed_item)
      // need to make it so it get pickuped
       //console.log("item frontend befor remove :", itemRef.current)
      let current_item = itemRef.current.find(item => item.id === removed_item.id);
      //console.log(current_item);
      
      itemRef.current = itemRef.current.filter(item => item.id !== removed_item.id)
          // console.log("item frontend after remove :", itemRef.current)
       // need to make it so it get pickuped
             if(current_item.type === "spell"){
                    // Un-equip any existing spell when picking up new one
                    equippedSpellRef.current = null;
                    button1IconRef.current = { key: current_item.key, image: current_item.image_pickup };
          
                  }
                  if(current_item.type ==="utility"){
          
                      button3IconRef.current = { key: current_item.key, image: current_item.image_pickup };
                      console.log("button3IconRef:", button3IconRef)
                      

                  }
                 
                
    }



    
    
    socket.on("removeItem", removeitem)


  
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

    function updatePlayer() {
            /*
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
                  if(item.type === "spell"){
                    // Un-equip any existing spell when picking up new one
                    equippedSpellRef.current = null;
                    button1IconRef.current = { key: item.key, image: item.image_pickup };
          
                  }
                  if(item.type ==="utility"){
          
                      button3IconRef.current = { key: item.key, image: item.image_pickup };
                      console.log("button3IconRef:", button3IconRef)
                      

                  }
                    itemRef.current.splice(i, 1);
                }
              }
            }
              */
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
      // Update player position with wall sliding (match server logic)
      if (frontendPlayers[socket.id]) {
        const player = frontendPlayers[socket.id];
        const speed = player.speed;
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
    }

    //####CHANGE SPELL#############################################################################################
    function changeSpell(button) {
      // Button 1: equip spell_list
      if (button === 1 && button1IconRef.current) {
        equippedSpellRef.current = button1IconRef.current.key;
        console.log("Equipped spell:", equippedSpellRef.current);
      }
    }

    function changehaste(button){
       if (button === 3 && button3IconRef.current) {
      equippedSpellRef.current = button3IconRef.current.key;
      console.log("haste pressed:", button3IconRef.current.key);
      const key = button3IconRef.current.key
      const utility1 = utility_list[key]
    
        equippedSpellRef.current = button3IconRef.current.key;
       const util = new  Utility(frontendPlayers[socket.id], utility1 )
        activeUtilitiesRef.current.push(util);
        button3IconRef.current = null;
        equippedSpellRef.current = null;

      }
    }


    //####MAIN GAME LOOP#############################################################################################
    
    let zone = null;
    socket.on('zoneUpdate', (z) => {
      zone = z;
   
    });
    let lastTime = 0;
    function loop(timestamp) {
      if (!gameLoopActive || !map) return;
      
      // If spectating but player not found, still allow rendering other players
      if (!isSpectatingRef.current && !frontendPlayers[socket.id]) return;

      try {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = "white";
        ctx.fillRect(-10, -10, canvas.width * scaleup_constant, canvas.height * scaleup_constant);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Center camera on player (same behavior on mobile and desktop)
        const cameraOffsetX = canvas.width / 2;
        const cameraOffsetY = canvas.height / 2;

        // Recompute scale dynamically to keep consistent view across resolutions
        scaleup_constant = Math.max(1, canvas.width / (DESIRED_TILES_ACROSS * TILE_SIZE));

        // If spectating (dead), center camera on map and show full map
        if (isSpectatingRef.current) {
          const mapCenterX = (map.layers[0]?.grid?.[0]?.length || 1) * TILE_SIZE / 2;
          const mapCenterY = (map.layers[0]?.grid?.length || 1) * TILE_SIZE / 2;
          scaleup_constant = Math.min(
            canvas.width / ((map.layers[0]?.grid?.[0]?.length || 1) * TILE_SIZE),
            canvas.height / ((map.layers[0]?.grid?.length || 1) * TILE_SIZE)
          );
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

        // Update animations
        const deltaTime = (timestamp - lastTime) / 1000; // in seconds
        lastTime = timestamp;
        Object.values(frontendPlayers).forEach(player => {
          player.update(deltaTime); 
          
        });
        activeUtilitiesRef.current = (activeUtilitiesRef.current || []).filter(util =>{
          //console.log("update time haste")
          util.update(deltaTime);
          return util.active;
        })



        for (const id in frontendPlayers) {
          const player = frontendPlayers[id];
          player.draw(ctx, scaleup_constant);
        }

        // Update projectiles locally (position calculated client-side)
        for (const id in frontEndProjectiles) {
          const projectile = frontEndProjectiles[id];
          projectile.update(deltaTime);
          projectile.draw(ctx, scaleup_constant);
        }

                //checks if player is hit by zone 
        function isBlue(player, centerW, centerH, smallRadius){
           //ctx.rect((frontendPlayers[socket.id].x+(frontendPlayers[socket.id].width/2)  )*scaleup_constant,(frontendPlayers[socket.id].y )*scaleup_constant,50,50);
            const px = (player.x +(player.width/2)) *scaleup_constant ;
            const py = (player.y +(player.height/2)) * scaleup_constant;

            const dx = px - centerW;
            const dy = py - centerH;
            //console.log("HIT: ",  dx * dx + dy * dy <= smallRadius * smallRadius);
            
            return dx * dx + dy * dy <= smallRadius * smallRadius;

        }
        if (zone.active) {

        const elapsed = Date.now() - zone.startTime;
        const progress = Math.min(elapsed / zone.duration, 1);   
        ctx.fillStyle = "rgba(0, 0, 255, 0.5)";

        const mapW = width * TILE_SIZE * scaleup_constant;
        const mapH = height * TILE_SIZE * scaleup_constant;
        const centerW = (width * TILE_SIZE * scaleup_constant)/2;
        const centerH = (height * TILE_SIZE * scaleup_constant)/2;
        const zoneRadiusWorld = (width * TILE_SIZE) ;
        const r = zoneRadiusWorld * scaleup_constant;

        ctx.beginPath();

        // Whole map rectangle
        ctx.rect(0, 0, mapW, mapH);
        
        
        //Shrinks the zone to end
        smallRadius = r * (1 - progress);
        if (smallRadius > 0) {
        // Circle (safe zone)
        ctx.arc(centerW, centerH, smallRadius, 0, Math.PI * 2);

 
        } 
        ctx.fill("evenodd");
        const state = isBlue(frontendPlayers[socket.id],centerW, centerH, smallRadius);
        socket.emit('zone', {state, roomkey});  

        

      }
    

        // Update and draw explosions (pass canvas, camera focus position for screen positioning)
        let cameraFocusX, cameraFocusY;
        if (isSpectatingRef.current) {
          // When spectating, camera is centered on map
          const mapCenterX = (map.layers[0]?.grid?.[0]?.length || 1) * TILE_SIZE / 2;
          const mapCenterY = (map.layers[0]?.grid?.length || 1) * TILE_SIZE / 2;
          cameraFocusX = mapCenterX;
          cameraFocusY = mapCenterY;
        } else {
        const currentPlayer = frontendPlayers[socket.id];
          cameraFocusX = currentPlayer?.x || 0;
          cameraFocusY = currentPlayer?.y || 0;
        }
        explosionManagerRef.current.update(deltaTime, canvas, cameraFocusX, cameraFocusY, scaleup_constant);

        // Draw items if active, scale to wizard size (11x15)
        itemRef.current.forEach(item => {
          if (item.active && item.image && item.image.complete) {
            ctx.save();
           
            ctx.drawImage(
              item.image_pickup,
              (item.x - 11 / 2) * scaleup_constant,
              (item.y - 15 / 2) * scaleup_constant,
              11 * scaleup_constant,
              15 * scaleup_constant
            );
            ctx.restore();
          }
        });

        // Reset canvas transformation to draw UI (joystick) in screen coordinates
        ctx.setTransform(scale, 0, 0, scale, 0, 0);

        // Only draw controls if not spectating
        if (!isSpectatingRef.current) {
          // Draw joystick (fixed to screen, not affected by camera)
          const joystick = joystickRef.current;
          joystick.draw(ctx);

          // Draw spell joystick and buttons (fixed to screen, not affected by camera)
          spellJoystickRef.current.draw(ctx);
          if (button1IconRef.current && button1IconRef.current.image) {
            const btn = buttonsRef.current.b1;
            const iconSize = btn.r * 2;
            ctx.save();
            ctx.drawImage(
              button1IconRef.current.image,
              btn.x - btn.r,
              btn.y - btn.r,
              iconSize,
              iconSize
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
          
          // Draw exit spectator button (-20 padding)
          const buttonWidth = 150;
          const buttonHeight = 50;
          const buttonX = (canvas.width / scale) - buttonWidth - 20;
          const buttonY = 20;
          
          ctx.fillStyle = 'rgb(0, 0, 0)';
          ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
          
          ctx.fillStyle = '#ffffff';
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

    setInterval(() => {
      requestAnimationFrame(loop);
      
      // console.log("inputs:", playerInputs);
    }, 15);

    // Handle spectate exit button click
    const handleCanvasClick = (e) => {
      if (isSpectatingRef.current && canvasRef.current.exitSpectateButton) {
        const button = canvasRef.current.exitSpectateButton;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;  //scaled
        const y = e.clientY - rect.top;
        
        if (x >= button.x && x <= button.x + button.width && 
            y >= button.y && y <= button.y + button.height) {
          socket.emit("delete_user", roomkey);
          socket.emit("restart_game", roomkey);
          nav("/");
        }
      }
    };
    
    canvas.addEventListener('pointerdown', handleCanvasClick);

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

    return () => {
      socket.off('map', mapOn);
      socket.off('projectileSpawned', OnProjectileSpawned);
      socket.off('projectileDeleted', OnProjectileDeleted);
      socket.off('projectileBounced', OnProjectileBounced);
      socket.off("updatePlayers", OnupdatePlayer);
      socket.off("spectatorList");
      socket.off("death",death)
      socket.off("winner", winner)
      canvas.removeEventListener('click', handleCanvasClick);
      
    socket.off("spawnItems", spawnitems)
    socket.off("removeItem", removeitem)
      explosionManagerRef.current.clear(); // Clean up DOM elements
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