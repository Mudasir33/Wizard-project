const { wallCollison, ProjectilePlayerCollision } = require('./gameShared');
const { parentPort, workerData } = require('worker_threads');
const { enviormentEffects } = require('./enviormentEffects.js');

let { roomName, initialState } = workerData;
let players = JSON.parse(JSON.stringify(initialState.players));
let playerInput = JSON.parse(JSON.stringify(initialState.move));
let backendProjectiles = JSON.parse(JSON.stringify(initialState.backendProjectiles));
let items = initialState.items ? JSON.parse(JSON.stringify(initialState.items)) : [];
let map = initialState.map ? JSON.parse(JSON.stringify(initialState.map)) : null;
let numready = initialState.numready || 0;
let ongoing = initialState.ongoing || false;
const playerbase_speed = 100;
let itemSpawninterval = null;
const colors = ['blue', 'red', 'green', 'yellow', 'brown', 'white', 'black', 'purple', 'gray', 'rainbow'];
const spellkeys = ["fireball", "bouncing_shot"]
const utilitykeys = ["haste", "health"]
const trapkeys = ["bear_trap", "fire_trap"]
const TILE_SIZE = 16;
let spawn_x = 50;
const basespeed = 200;
let mapwidth = null;
let mapheight = null;
const spell_cd = 500;
let spawn_y = 125;
let projectileId = 0;
let itemIDcounter = 0;
let trapIdCounter = 0;
let traps = [];
let activeeffects = {};
let windscounter = 0;
let num = 0;

const trapStats = {
    bear_trap: { damage: 20, immobilizeDuration: 3000, triggerRadius: 8, type: 'immobilize' },
    fire_trap: { damage: 5, triggerRadius: 16, type: 'dot', dotInterval: 500, burnDuration: 3000, activeDuration: 4500}
};

const ZONE_DURATION = 240000;
let zone = {
    active: false,
    startTime: 0,
    duration: ZONE_DURATION,
};

function serializeEffects() {
    const effects = [];
    for (const effectid in activeeffects) {
        const effect = activeeffects[effectid];
        if (!effect) continue;
        effects.push({
            id: Number(effectid),
            effect: effect.effect,
            x: effect.x,
            y: effect.y,
            radius: effect.radius || 0
        });
    }
    return effects;
}

function handleInput(msg) {
    switch (msg.action) {
        case 'join': {
            if (ongoing === true) {
                parentPort.postMessage({ type: 'error', socketId: msg.socketId, error: 'ROOM already ongoing' });
                return;
            }
            if (!msg.username || msg.username === "") {
                parentPort.postMessage({ type: 'error', socketId: msg.socketId, error: 'Put in username' });
                return;
            }
            if (Object.keys(players).length >= 10) {
                parentPort.postMessage({ type: 'error', socketId: msg.socketId, error: 'ROOM FULL' });
                return;
            }
            for (const player of Object.values(players)) {
                if (msg.username === player.username) {
                    parentPort.postMessage({ type: 'error', socketId: msg.socketId, error: 'USERNAME ALREADY TAKEN' });
                    return;
                }
            }
            //
            let xPos = Math.floor(Math.random() * 50);
            let yPos = Math.floor(Math.random() * 50);
            let tile = msg.Map2d.layers[0].grid[yPos][xPos];

            //loops until they have an player postion is within within tile id 138 (light gray tile)
            while (!tile || tile.id !== 138) {


                xPos = Math.floor(Math.random() * 50);
                yPos = Math.floor(Math.random() * 50);
                tile = msg.Map2d.layers[0].grid[yPos][xPos];
            }
            const index = Object.keys(players).length;
            players[msg.socketId] = {
                username: msg.username,
                color: colors[index],
                ready: false,
                x: xPos * 16,
                y: yPos * 16,
                health: 100,
                alive: true,
                id: index + 1,
                speed: 200,
                sequenceNumber: 0,
                dx: 0,
                dy: 0,
                lastSpellCast: 0,
            };
            spawn_x += 30;
            playerInput[msg.socketId] = { dx: 0, dy: 0 };
            parentPort.postMessage({ type: 'joined', socketId: msg.socketId, room: roomName });
            break;
        }

        case 'restart_game': {
            console.log("restart game - resetting room state");

            backendProjectiles = {};
            ongoing = false;
            numready = 0;
            items = [];
            traps = [];
            projectileId = 0;
            itemIDcounter = 0;
            trapIdCounter = 0;

            zone.active = false;
            zone.startTime = 0;
            zone.duration = ZONE_DURATION;

            for (const effectId in activeeffects) {
                delete activeeffects[effectId];
            }
            windscounter = 0;
            num = 0;

            for (const id in players) {
                const player = players[id];
                player.health = 100;
                player.alive = true;
                player.ready = false;
                player.speed = basespeed;
                player.abilities = [];
                player.lastSpellCast = 0;
                player.effectSpeedMultiplier = 1;
                player.sequenceNumber = 0;
                player.dx = 0;
                player.dy = 0;
                player.immobilizedUntil = 0;
                delete player.burning;

                if (playerInput[id]) {
                    playerInput[id].dx = 0;
                    playerInput[id].dy = 0;
                }

            }

            if (itemSpawninterval) {
                clearInterval(itemSpawninterval);
                itemSpawninterval = null;
            }
            players = {};
            console.log("restart game players:", players);
            
            break;
        }

        case 'ready': {
            if (players[msg.socketId]) {
                if (players[msg.socketId].ready == false) {
                    players[msg.socketId].ready = true;
                    numready = numready + 1;
                } else {
                    players[msg.socketId].ready = false;
                    numready = numready - 1;
                }
            }
            const numplayers = Object.keys(players).length;
            if (numready / numplayers >= 0.51 && numplayers >= 2) {
                ongoing = true;
                if (ongoing && !itemSpawninterval) {
                    itemSpawninterval = setInterval(() => {
                        spawnItems();
                    }, 3000);

                }
            }
            else {
                ongoing = false;


                if (!ongoing && itemSpawninterval) {
                    clearInterval(itemSpawninterval);
                    itemSpawninterval = null;
                }
            }
            //checks to see if zone should start or not
            if (ongoing) {
                zone.active = true;
                zone.startTime = Date.now();
                zone.duration = ZONE_DURATION;
                console.log("ZONE STARTED");
            }
            if (!ongoing) {
                zone.active = false;
                console.log("ZONE STOPPED");
            }
            break;
        }

        case 'movement': {
            if (!playerInput[msg.socketId] || !players[msg.socketId]) return;
            players[msg.socketId].sequenceNumber = msg.sequenceNumber;
            playerInput[msg.socketId].dx = msg.dx;
            playerInput[msg.socketId].dy = msg.dy;
            players[msg.socketId].dx = msg.dx;
            players[msg.socketId].dy = msg.dy;
            break;
        }

        case 'pickupItem': {
            const idx = items.findIndex(item => item.id === msg.itemId);
            if (idx !== -1) {
                const item = items[idx];
                items.splice(idx, 1);
                if (players[msg.socketId]) {
                    if (!players[msg.socketId].abilities) players[msg.socketId].abilities = [];
                    players[msg.socketId].abilities.push(item.type);
                }
            }
            break;
        }
        case 'zone': {
            const player = players[msg.socketId];
            if (!player || !player.alive) return;

            // Only damage if client says they are inside the zone
            if (msg.state === false && ongoing === true) {


                if (player.health <= 0 && player.alive) {
                    player.alive = false;

                    const aliveplayers = Object.keys(players).filter(id => players[id].alive);
                    parentPort.postMessage({ type: 'death', socketId: msg.socketId, placement: aliveplayers.length + 1 });

                    if (aliveplayers.length === 1) {
                        const winner = aliveplayers[0];
                        players[winner].alive = false;
                        parentPort.postMessage({ type: 'winner', socketId: winner, placement: 1 });
                    }

                }
                player.health -= 0.2;
            }
            break;
        }
        case 'spellCast': {
            const player = players[msg.socketId];
            if (!player || player.alive === false) return;
            const now = Date.now();
            if (now - (player.lastSpellCast || 0) < spell_cd) {
                return;
            }
            player.lastSpellCast = now;
            projectileId += 1;

            // Spell stats defined server-side
            const spellStats = {
                fireball: { speed: 200, damage: 25, aoeRadius: 50, maxBounces: 0 },
                magic_missile: { speed: 100, damage: 12, aoeRadius: 0, maxBounces: 0 },
                bouncing_shot: { speed: 150, damage: 15, aoeRadius: 0, maxBounces: 3 }
            };
            const stats = spellStats[msg.spellName] || spellStats.magic_missile;

            backendProjectiles[projectileId] = {
                spellName: msg.spellName,
                spellDirection: msg.spellDirection,
                x: msg.x,
                y: msg.y,
                roomkey: roomName,
                playerId: msg.socketId,
                speed: stats.speed,
                damage: stats.damage,
                aoeRadius: stats.aoeRadius,
                bouncesRemaining: stats.maxBounces
            };
            // Notify clients about new projectile
            parentPort.postMessage({
                type: 'projectileSpawned',
                projectileId,
                projectile: backendProjectiles[projectileId]
            });
            break;
        }

        case 'util_use': {
            const player = players[msg.socketId];
            if (!player) return;
            console.log("player speed:", player.speed)
            if (msg.util === "health") {
                console.log("before:", player.health)
                player.health += msg.amount;
                if (player.health > 100) {
                    player.health = 100;
                }
                console.log("after:", player.health)
            }
            if (msg.util == "haste") {
                player.speed = player.speed * 3;
            }
            break;
        }

        case 'remove_util': {
            const player = players[msg.socketId];
            if (!player) return;
            if (msg.util == "haste") {
                player.speed = basespeed;
            }
            break;
        }

        case 'placeTrap': {
            const player = players[msg.socketId];
            if (!player || !player.alive) return;
            if (!player.abilities || player.abilities.length === 0) return;

            const trapIndex = player.abilities.findIndex(a => a === msg.trapKey);
            if (trapIndex === -1) return;

            player.abilities.splice(trapIndex, 1);

            const stats = trapStats[msg.trapKey] || trapStats.bear_trap;
            const trap = {
                id: trapIdCounter++,
                x: player.x,
                y: player.y,
                key: msg.trapKey,
                ownerId: msg.socketId,
                damage: stats.damage,
                immobilizeDuration: stats.immobilizeDuration,
                triggerRadius: stats.triggerRadius,
                active: true,
                triggered: false
            };

            traps.push(trap);
            parentPort.postMessage({ type: 'trapPlaced', trap });
            break;
        }

        case 'keyup': {
            if (!playerInput[msg.socketId]) return;
            if (msg.key == 'KeyW' || msg.key == 'KeyS') playerInput[msg.socketId].dy = 0;
            if (msg.key == 'KeyA' || msg.key == 'KeyD') playerInput[msg.socketId].dx = 0;
            break;
        }
        case 'room_leave': {
            if (players[msg.socketId]) {
                players[msg.socketId].ready = false;
                delete players[msg.socketId];
                delete playerInput[msg.socketId];

            }
            break;
        }
        case 'delete_user': {
            console.log("delete user")
            const aliveplayers = Object.keys(players).filter(id => players[id].alive);
            if (players[msg.socketId]) {
                console.log("Alive players:", aliveplayers)
                console.log("Socket ID:", msg.socketId)
                console.log("delete user")
                players[msg.socketId].ready = false;
                delete players[msg.socketId];
                delete playerInput[msg.socketId];



                if (aliveplayers.length === 1) {
                    const winner = aliveplayers[0];
                    console.log("winner disoconnet:", winner)
                    players[winner].alive = false;
                    parentPort.postMessage({ type: 'winner', socketId: winner, placement: 1 });

                }
                if (aliveplayers.length === 0) {
                    console.log("alicve player = 0, restart game")
                    handleInput({ type: 'input', action: 'restart_game' })
                }

            }
            break;
        }
        default:
            break;
    }

    parentPort.postMessage({
        type: 'update', state: {
            id: roomName,
            players,
            move: playerInput,
            backendProjectiles,
            map,
            effects: serializeEffects(),
            items,
            traps,
            numready,
            ongoing,
            zone: {
                active: zone.active,
                startTime: zone.startTime,
                duration: zone.duration
            }
        }
    });
}

function gameloop() {
    // Defensive: Only run if map is set and valid
    if (!map || !map.obj) return;

    for (const id in players) {
        const player = players[id];
        if (!player) continue;
        player.effectSpeedMultiplier = 1;
    }

    for (const effectid in activeeffects) {
        const effect = activeeffects[effectid];
        if (!effect || effect.effect !== "spiderweb") continue;
        effect.applyeffect(players, effect.effect, { objectLayers: [map] }, wallCollison);
    }

    for (const id in players) {
        const player = players[id];
        const input = playerInput[id];
        if (!input) continue;
        if (player.alive === false) continue;

        if (player.immobilizedUntil && Date.now() < player.immobilizedUntil) {
            continue;
        }

        let dx = input.dx;
        let dy = input.dy;
        if (dx !== 0 && dy !== 0) {
            const inv = 1 / Math.sqrt(2);
            dx *= inv;
            dy *= inv;
        }

        const speedMultiplier = player.effectSpeedMultiplier ?? 1;
        const effectiveSpeed = player.speed * speedMultiplier;
        const moveX = dx * effectiveSpeed * 0.015;
        const moveY = dy * effectiveSpeed * 0.015;

        // Try X movement first
        const oldX = player.x;
        player.x += moveX;
        if (wallCollison({ objectLayers: [map] }, player)) {
            player.x = oldX; // Revert X if collision
        }

        // Try Y movement separately
        const oldY = player.y;
        player.y += moveY;
        if (wallCollison({ objectLayers: [map] }, player)) {
            player.y = oldY; // Revert Y if collision
        }
    }

    for (const pid in players) {
        const player = players[pid];
        if (!player.alive || !player.burning) continue;
        const now = Date.now();

        if (now > player.burning.expiresAt) {
            delete player.burning;
            continue;
        }

        if (now - player.burning.lastTick >= player.burning.interval) {
            player.burning.lastTick = now;
            player.health -= player.burning.damage;
            
            if (player.health <= 0 && player.alive) {
                player.alive = false;
                const aliveplayers = Object.keys(players).filter(id => players[id].alive);
                parentPort.postMessage({ type: 'death', socketId: pid, placement: aliveplayers.length + 1 });
                if (aliveplayers.length === 1) {
                    const winner = aliveplayers[0];
                    players[winner].alive = false;
                    parentPort.postMessage({ type: 'winner', socketId: winner, placement: 1 });
                }
            }
        }
    }
    
    for (const pid in players) {
        const player = players[pid];
        if (!player.alive) continue;
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            if (
                player.x < item.x + 20 &&
                player.x + 11 > item.x &&
                player.y < item.y + 20 &&
                player.y + 15 > item.y
            ) {
                items.splice(i, 1);
                console.log("remove item pickup worker:", item, "player pick up", pid)
                parentPort.postMessage({
                    type: "removeItem",
                    pid: pid,
                    item: item
                })
                if (!player.abilities) player.abilities = [];
                player.abilities.push(item.key);
            }
        }
    }

    for (let i = traps.length - 1; i >= 0; i--) {
        const trap = traps[i];
        const stats = trapStats[trap.key] || trapStats.bear_trap;

        if (stats.type === 'dot') {
            if (trap.triggered && Date.now() - trap.triggeredTime > stats.activeDuration) {
                traps.splice(i, 1);
                continue;
            }
            
            for (const pid in players) {
                const player = players[pid];
                if (!player.alive) continue;
                if (pid === trap.ownerId) continue;
                
                const dx = player.x - trap.x;
                const dy = player.y - trap.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < trap.triggerRadius + 8) {
                    if (!trap.triggered) {
                        trap.triggered = true;
                        trap.triggeredTime = Date.now();
                        trap.active = true;
                        parentPort.postMessage({ type: 'trapTriggered', trapId: trap.id, victimId: pid });
                    }

                    if (!player.burning) {
                        player.burning = {
                            damage: stats.damage,
                            interval: stats.dotInterval,
                            lastTick: 0,
                            expiresAt: Date.now() + stats.burnDuration
                        };
                    } else {
                        player.burning.expiresAt = Date.now() + stats.burnDuration;
                    }
                }
            }
            continue;
        }

        if (!trap.active || trap.triggered) continue;

        for (const pid in players) {
            const player = players[pid];
            if (!player.alive) continue;
            if (pid === trap.ownerId) continue;

            const dx = player.x - trap.x;
            const dy = player.y - trap.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < trap.triggerRadius + 8) {
                trap.triggered = true;
                trap.active = false;

                player.health -= trap.damage;
                if (trap.immobilizeDuration > 0) {
                    player.immobilizedUntil = Date.now() + trap.immobilizeDuration;
                }

                if (player.health <= 0 && player.alive) {
                    player.alive = false;
                    const aliveplayers = Object.keys(players).filter(id => players[id].alive);
                    parentPort.postMessage({ type: 'death', socketId: pid, placement: aliveplayers.length + 1 });
                    if (aliveplayers.length === 1) {
                        const winner = aliveplayers[0];
                        players[winner].alive = false;
                        parentPort.postMessage({ type: 'winner', socketId: winner, placement: 1 });
                    }
                }

                parentPort.postMessage({ type: 'trapTriggered', trapId: trap.id, victimId: pid });

                traps.splice(i, 1);
                break;
            }
        }
    }

    for (const id in backendProjectiles) {
        const projectile = backendProjectiles[id];
        const direction = projectile.spellDirection;
        let dx = direction.x;
        let dy = direction.y;

        const oldX = projectile.x;
        const oldY = projectile.y;

        projectile.x += dx * projectile.speed * 0.015;
        projectile.y += dy * projectile.speed * 0.015;

        let wallHit = false;
        let playerHit = false;
        let hitPlayerId = null;

        if (wallCollison({ objectLayers: [map] }, projectile)) {
            wallHit = true;

            projectile.x = oldX;
            projectile.y = oldY;

            projectile.x += dx * projectile.speed * 0.015;
            const hitX = wallCollison({ objectLayers: [map] }, projectile);
            projectile.x = oldX;

            projectile.y += dy * projectile.speed * 0.015;
            const hitY = wallCollison({ objectLayers: [map] }, projectile);
            projectile.y = oldY;

            if (hitX) projectile.spellDirection.x = -dx;
            if (hitY) projectile.spellDirection.y = -dy;
            if (!hitX && !hitY) {
                projectile.spellDirection.x = -dx;
                projectile.spellDirection.y = -dy;
            }
        }

        for (const pid in players) {
            if (ProjectilePlayerCollision(projectile, players[pid])) {
                if (pid === projectile.playerId || players[pid].alive === false) continue;
                playerHit = true;
                hitPlayerId = pid;
                break;
            }
        }

        if (playerHit && hitPlayerId) {
            const aoeRadius = projectile.aoeRadius || 0;
            const damage = projectile.damage || 10;

            for (const pid in players) {
                if (pid === projectile.playerId || players[pid].alive === false) continue;

                const player = players[pid];
                const distX = player.x - projectile.x;
                const distY = player.y - projectile.y;
                const distance = Math.sqrt(distX * distX + distY * distY);

                if (distance <= aoeRadius || ProjectilePlayerCollision(projectile, player)) {
                    const damageMult = aoeRadius > 0 ? Math.max(0.5, 1 - (distance / aoeRadius) * 0.5) : 1;
                    const finalDamage = Math.round(damage * damageMult);

                    players[pid].health -= finalDamage;

                    if (players[pid].health <= 0 && players[pid].alive === true) {
                        players[pid].alive = false;
                        const aliveplayers = Object.keys(players).filter(id => players[id].alive);
                        parentPort.postMessage({ type: 'death', socketId: pid, placement: aliveplayers.length + 1 });
                        if (aliveplayers.length === 1) {
                            const winner = aliveplayers[0];
                            players[winner].alive = false;
                            parentPort.postMessage({ type: 'winner', socketId: winner, placement: 1 });
                        }
                    }

                }
            }



            if (projectile.bouncesRemaining > 0) {
                const player = players[hitPlayerId];
                const reflectDx = projectile.x - player.x;
                const reflectDy = projectile.y - player.y;
                const len = Math.hypot(reflectDx, reflectDy);
                if (len > 0) {
                    projectile.spellDirection.x = reflectDx / len;
                    projectile.spellDirection.y = reflectDy / len;
                }
            }
        }



        if (wallHit || playerHit) {
            if (projectile.bouncesRemaining > 0) {
                projectile.bouncesRemaining--;

                projectile.x += projectile.spellDirection.x * 2;
                projectile.y += projectile.spellDirection.y * 2;

                parentPort.postMessage({
                    type: 'projectileBounced',
                    projectileId: id,
                    x: projectile.x,
                    y: projectile.y,
                    newDirection: projectile.spellDirection
                });
            } else {
                parentPort.postMessage({
                    type: 'projectileDeleted',
                    projectileId: id,
                    x: projectile.x,
                    y: projectile.y,
                    spellName: projectile.spellName
                });
                delete backendProjectiles[id];
            }
            continue;
        }

    }
    for (const effectid in activeeffects) {
        const effect = activeeffects[effectid];
        if (!effect || effect.effect === "spiderweb") continue;
        effect.applyeffect(players, effect.effect, { objectLayers: [map] }, wallCollison);
    }
}

// loop for creating wind effect every 10 sec

setInterval(() => {
    if (windscounter == 0) {
        activeeffects[num] = new enviormentEffects(Math.random() < 0.5 ? -1 : 1, Math.random() < 0.5 ? -1 : 1, "wind");
        windscounter++;
        console.log("created wind");
    } else if (windscounter == 1 && activeeffects[0]) {
        activeeffects[0].x = Math.random() < 0.5 ? -1 : 1;
        activeeffects[0].y = Math.random() < 0.5 ? -1 : 1;
    }
    num++;
    //console.log(activeeffects);
}, 10000);

setInterval(() => {
    if (!map || !mapwidth || !mapheight) return;
    enviormentEffects.upsertSpiderWeb(activeeffects, mapwidth, mapheight, TILE_SIZE);
}, 12000);

function getRandomWalkableTile() {
   
      if (!mapheight || !mapwidth) return { x: 5, y: 5 };
        const x = Math.floor(Math.random() * mapwidth)
        const y = Math.floor(Math.random() * mapheight)
      return { x, y };
    }


function spawnItems(){
    if(!map) return;
    let xPos = Math.floor(  Math.random() * 50);
    let yPos = Math.floor(  Math.random() * 50);
    let tile = msg.Map2d.layers[0].grid[yPos][xPos];

    //loops until they have an player postion is within within tile id 138 (light gray tile)
    while (!tile || tile.id !== 138) {
        xPos = Math.floor(  Math.random() * 50);
        yPos =Math.floor(  Math.random() * 50);
        tile = msg.Map2d.layers[0].grid[yPos][xPos];
    }
    //console.log("items spawned backend")
    const pos = getRandomWalkableTile();
    //console.log("position item spawn:", pos)

    const rand = Math.random();
    let type, key;
    if (rand < 0.4) {
        type = "spell";
        key = spellkeys[Math.floor(Math.random() * spellkeys.length)];
    } else if (rand < 0.8) {
        type = "utility";
        key = utilitykeys[Math.floor(Math.random() * utilitykeys.length)];
    } else {
        type = "trap";
        key = trapkeys[Math.floor(Math.random() * trapkeys.length)];
    }

    const item = {
        id : itemIDcounter++,
        x: ypos*16,
        y: xPos*16,
        type,
        key
    }
    //console.log("workerroom item spawn:", item)
    items.push(item)
    parentPort.postMessage({ type: "spawnItems", item })
}

setInterval(() => {
    gameloop();
}, 15);

// Network updates throttled to every 150ms (projectiles handled separately)
let lastState = null;
setInterval(() => {
    const currentState = {
        players,
        move: playerInput,
        map,
        items,
        traps,
        numready,
        ongoing
    };
    let changed = false;
    if (!lastState) {
        changed = true;
    } else {
        for (let key of Object.keys(currentState)) {
            if (currentState[key] !== lastState[key]) {
                changed = true;
                break;
            }
        }
    }
    if (changed) {
        parentPort.postMessage({
            type: 'update', state: {
                id: roomName,
                players,
                move: playerInput,
                backendProjectiles,
                map,
                effects: serializeEffects(),
                items,
                traps,
                numready,
                ongoing,
                zone: {
                    active: zone.active,
                    startTime: zone.startTime,
                    duration: zone.duration
                }
            }
        });
        lastState = { ...currentState };
    }
}, 150);

parentPort.on('message', (msg) => {
    if (msg.type === 'input') {
        handleInput(msg);
    } else if (msg.type === 'set_map') {
        map = msg.map;
        //console.log("map width:", msg.mapwidth)
        mapwidth = msg.mapwidth;
        mapheight = msg.mapheight;
    } else if (msg.type === 'shutdown') {
        process.exit(0);
    }
});
