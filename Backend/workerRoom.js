const { wallCollison, ProjectilePlayerCollision } = require('./gameShared');
const { parentPort, workerData } = require('worker_threads');

let { roomName, initialState } = workerData;
let players = JSON.parse(JSON.stringify(initialState.players));
let playerInput = JSON.parse(JSON.stringify(initialState.move));
let backendProjectiles = JSON.parse(JSON.stringify(initialState.backendProjectiles));
let items = initialState.items ? JSON.parse(JSON.stringify(initialState.items)) : [];
let map = initialState.map ? JSON.parse(JSON.stringify(initialState.map)) : null;
let numready = initialState.numready || 0;
let ongoing = initialState.ongoing || false;

const colors = ['blue', 'red', 'green', 'yellow', 'brown', 'white', 'black', 'purple', 'gray', 'rainbow'];
let spawn_x = 50;

const spell_cd = 500;
let spawn_y = 125;
let projectileId = 0;

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
            const index = Object.keys(players).length;
            players[msg.socketId] = {
                username: msg.username,
                color: colors[index],
                ready: false,
                x: spawn_x,
                y: spawn_y,
                health: 100,
                alive: true,
                id: index + 1,
                speed: 100,
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
            if(Object.keys(players).length === 0){
            console.log("restart game", Object.keys(players).length )

            playerInput = {}
            backendProjectiles = {};
            map = null;
            ongoing = false;
            numready = 0;
            items = [];
            }
          
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
            } else {
                ongoing = false;
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
        case 'spellCast': {
            const player = players[msg.socketId];
            if (!player || player.alive === false) return;
            const now = Date.now();
            if (now - (player.lastSpellCast || 0) < spell_cd) {
                return;
            }
            player.lastSpellCast = now;
            projectileId += 1;
            backendProjectiles[projectileId] = {
                spellName: msg.spellName,
                spellDirection: msg.spellDirection,
                x: msg.x,
                y: msg.y,
                roomkey: roomName,
                playerId: msg.socketId,
                speed: 100
            };
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
            
            if (players[msg.socketId]) {
                console.log("delete user")
                players[msg.socketId].ready = false;
                delete players[msg.socketId];
                delete playerInput[msg.socketId];
              
            }
            break;
        }
        default:
            break;
    }
    
    parentPort.postMessage({ type: 'update', state: {
        id: roomName,
        players,
        move: playerInput,
        backendProjectiles,
        map,
        items,
        numready,
        ongoing
    }});
}





function gameloop() {
    // Defensive: Only run if map is set and valid
    if (!map || !map.obj) return;
    for (const id in players) {
        const player = players[id];
        const input = playerInput[id];
        if (!input) continue;
        let dx = input.dx;
        let dy = input.dy;
        if (dx !== 0 && dy !== 0) {
            const inv = 1 / Math.sqrt(2);
            dx *= inv;
            dy *= inv;
        }
        player.x += (dx * player.speed * 0.015);
        player.y += (dy * player.speed * 0.015);
        if (!wallCollison({ objectLayers: [map] }, player)) {
            player.x += (dx * player.speed * 0.015);
            player.y += (dy * player.speed * 0.015);
        } else {
            if (player.alive === false) continue;
            if ((0.1 <= dx && dx <= 1) || (0.1 <= dy && dy <= 1) || (-1 <= dx && dx <= -0.1) || (-1 <= dy && dy <= -0.1)) {
                player.x += (-dx * player.speed * 0.015);
                player.y += (-dy * player.speed * 0.015);
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
                if (!player.abilities) player.abilities = [];
                player.abilities.push(item.type);
            }
        }
    }
    for (const id in backendProjectiles) {
        const projectile = backendProjectiles[id];
        const direction = projectile.spellDirection;
        let dx = direction.x;
        let dy = direction.y;
        projectile.x += dx * projectile.speed * 0.015;
        projectile.y += dy * projectile.speed * 0.015;
        if (wallCollison({ objectLayers: [map] }, projectile)) {
            delete backendProjectiles[id];
            continue;
        }
        for (const pid in players) {
            if (ProjectilePlayerCollision(projectile, players[pid])) {
                if (pid === projectile.playerId || players[pid].alive === false) break;
                players[pid].health -= 10;
                delete backendProjectiles[id];
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
                break;
            }
        }
    }
}

// Game logic runs at 15ms
setInterval(() => {
    gameloop();
}, 15);

// Network updates throttled to every 30ms
let lastState = null;
setInterval(() => {
    const currentState = {
        players,
        move: playerInput,
        backendProjectiles,
        map,
        items,
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
        parentPort.postMessage({ type: 'update', state: {
            id: roomName,
            players,
            move: playerInput,
            backendProjectiles,
            map,
            items,
            numready,
            ongoing
        }});
        lastState = { ...currentState };
    }
}, 150);

parentPort.on('message', (msg) => {
    if (msg.type === 'input') {
        handleInput(msg);
    } else if (msg.type === 'set_map') {
        map = msg.map;
    } else if (msg.type === 'shutdown') {
        process.exit(0);
    }
});
