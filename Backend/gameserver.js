const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Worker } = require('worker_threads');
const app = express();
const server = http.createServer(app);
const mapCreation = require('./map.js');
const path = require('path');

app.use(express.static(path.join(__dirname, '../Public')));
app.use(express.static('Backend'));
app.use(express.static(path.join(__dirname, '../Frontend/game')));
app.use("/Assets", express.static(path.join(__dirname, "../Assets")));

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    perMessageDeflate: {
        threshold: 512, // Only compress messages larger than 512 bytes
        zlibDeflateOptions: {
            level: 9, // Maximum compression
        },
        zlibInflateOptions: {},
    }
});

let sessions = {};
const roomWorkers = {};
const colors = ['blue', 'red', 'green', 'yellow', 'brown', 'white', 'black', 'purple', 'gray', 'rainbow'];

function startRoomWorker(roomName, initialState) {
    const worker = new Worker(path.join(__dirname, 'workerRoom.js'), {
        workerData: { roomName, initialState }
    });
    worker.on('message', (msg) => {
        if (msg.type === 'update') {
            if (!sessions[roomName]) sessions[roomName] = {};
            const clonedPlayers = JSON.parse(JSON.stringify(msg.state.players));
            const clonedMove = JSON.parse(JSON.stringify(msg.state.move));
            const clonedMap = msg.state.map ? JSON.parse(JSON.stringify(msg.state.map)) : null;
            const clonedEffects = msg.state.effects ? JSON.parse(JSON.stringify(msg.state.effects)) : [];
            const clonedItems = msg.state.items ? JSON.parse(JSON.stringify(msg.state.items)) : [];
            sessions[roomName].players = clonedPlayers;
            sessions[roomName].move = clonedMove;
            sessions[roomName].map = clonedMap;
            sessions[roomName].effects = clonedEffects;
            sessions[roomName].items = clonedItems;
            sessions[roomName].numready = msg.state.numready;
            let ongoing_change = ( sessions[roomName].ongoing !== msg.state.ongoing )
            sessions[roomName].ongoing = msg.state.ongoing;
            io.to(roomName).emit('updatePlayers', clonedPlayers, roomName);
            io.to(roomName).emit('effectsUpdate', clonedEffects, roomName);
            io.to(roomName).emit('spectatorList', sessions[roomName].spectators || {});
            //io.to(roomName).emit('spawnItems', clonedItems, roomName);
            io.to(roomName).emit('zoneUpdate', msg.state.zone, roomName);
            if(!msg.state.ongoing || ongoing_change){
                io.emit("sessions", sessions)
            }
       

         if (msg.state.ongoing) {
                io.to(roomName).emit('players_ready', roomName);
                
                
               
        }   
        } else if (msg.type === 'projectileSpawned') {
            io.to(roomName).emit('projectileSpawned', msg.projectileId, msg.projectile);
        } else if (msg.type === 'projectileDeleted') {
            io.to(roomName).emit('projectileDeleted', msg.projectileId, msg.x, msg.y, msg.spellName);
        } else if (msg.type === 'projectileBounced') {
            io.to(roomName).emit('projectileBounced', msg.projectileId, msg.x, msg.y, msg.newDirection);
        } else if (msg.type === 'joined') {
            io.sockets.sockets.get(msg.socketId)?.emit('joined', roomName);
        } else if (msg.type === 'error') {
            io.sockets.sockets.get(msg.socketId)?.emit('joinerror', msg.error);
        } else if (msg.type === 'death') {
            io.sockets.sockets.get(msg.socketId)?.emit('death', msg.placement);
        } else if (msg.type === 'winner') {
            io.sockets.sockets.get(msg.socketId)?.emit('winner', msg.placement);
        }
        else if (msg.type === 'spawnItems'){
            //console.log("parentport spawn item:", msg.item)
            io.to(roomName).emit("spawnItems", msg.item)
        }
          else if (msg.type === 'removeItem'){
            console.log("remove item gameserver:", msg.item)
            io.to(roomName).emit("removeItem", msg.item, msg.pid)
        }
        else if (msg.type === 'trapPlaced'){
            console.log("trap placed:", msg.trap)
            io.to(roomName).emit("trapPlaced", msg.trap)
        }
        else if (msg.type === 'trapTriggered'){
            console.log("trap triggered:", msg.trapId, "victim:", msg.victimId)
            io.to(roomName).emit("trapTriggered", msg.trapId, msg.victimId)
        }
     

    });
    worker.on('error', (err) => {
        console.error(`Worker error in ${roomName}:`, err);
    });
    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Worker for ${roomName} stopped with exit code ${code}`);
            console.log(`Restarting worker for ${roomName}...`);
            const freshState = { id: roomName, players: {}, spectators: {}, move: {}, backendProjectiles: {}, map: null, ongoing: false, numready: 0, items: [] };
            sessions[roomName] = freshState;
            startRoomWorker(roomName, freshState);
        }
    });
    roomWorkers[roomName] = worker;
}

['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5'].forEach(room => {
    const initialState = { id: room, players: {}, spectators: {}, move: {}, backendProjectiles: {}, map: null, ongoing: false, numready: 0, items: [] };
    sessions[room] = initialState;
    startRoomWorker(room, initialState);
});

async function startServer() {
    const Map2d = await mapCreation();
    io.on('connection', (socket) => {
        //console.log(Map2d.layers[0].grid[39][48]);
        

        socket.on('Game', (room) => {
            //socket.emit('spawnItems', sessions[room]?.items || []);
            socket.rooms.forEach(r => {
                if (r !== socket.id && r !== room) {
                    socket.leave(r);
                }
            });
            socket.join(room);
            const clonedMap = JSON.parse(JSON.stringify(Map2d));
            sessions[room].map = clonedMap
            if (roomWorkers[room]) {
                console.log(clonedMap.layers[0].height)
                roomWorkers[room].postMessage({ type: 'set_map', 
                        map: JSON.parse(JSON.stringify(clonedMap.objectLayers[0])),
                        mapwidth: clonedMap.layers[0].grid[0].length,
                        mapheight: clonedMap.layers[0].grid.length
                    });
           
            }
            // Send gameRoom to all players and spectators in the room
            io.to(room).emit('gameRoom', room);
        });
        socket.on('gameStart', (room) => {
            io.to(room).emit('map', Map2d);
//            io.to(room).emit('updatePlayers', sessions[room]?.players || {});
        });
        socket.on('disconnect', (reason) => {
            for (const room in sessions) {
                if (sessions[room].players[socket.id]) {
                    roomWorkers[room].postMessage({ type: 'input', action: 'delete_user', socketId: socket.id });
                }
            }
        });
        socket.on("restart_game",(room)=>{
          if (roomWorkers[room]) {
                roomWorkers[room].postMessage({ type: 'input', action: 'restart_game' });
        
          }
        })
    
        socket.on('keyup', (key, room) => {
            if (roomWorkers[room]) {
                roomWorkers[room].postMessage({ type: 'input', action: 'keyup', socketId: socket.id, key });
            }
        });
        socket.on('movement', ({ dx, dy, sequenceNumber, roomkey }) => {
            if (roomWorkers[roomkey]) {
                roomWorkers[roomkey].postMessage({ type: 'input', action: 'movement', socketId: socket.id, dx, dy, sequenceNumber });
            }
        });
        socket.on('zone', ({ state, roomkey }) => {
            if (roomWorkers[roomkey]) {
                    roomWorkers[roomkey].postMessage({type: 'input',action: 'zone',socketId: socket.id,state});
            }
        });        
        socket.on('pickupItem', ({ room, itemId }) => {
            if (roomWorkers[room]) {
                roomWorkers[room].postMessage({ type: 'input', action: 'pickupItem', socketId: socket.id, itemId });
            }
        });
        socket.on('spellCast', ({ spellName, spellDirection, x, y, roomkey }) => {
            if (roomWorkers[roomkey]) {
                roomWorkers[roomkey].postMessage({ type: 'input', action: 'spellCast', socketId: socket.id, spellName, spellDirection, x, y });
            }
        });

        socket.on('placeTrap', ({ trapKey, roomkey }) => {
            if (roomWorkers[roomkey]) {
                roomWorkers[roomkey].postMessage({ type: 'input', action: 'placeTrap', socketId: socket.id, trapKey });
            }
        });

        socket.on("update_vel", (vel)=>{
            
        }
                )


        const join = (username, room) => {
            console.log('JOIN EVENT:', { username, room });
            socket.rooms.forEach(r => {
                if (r !== socket.id && r !== room) {
                    socket.leave(r);
                }
            });
            socket.join(room);
        
            if (roomWorkers[room]) {
                roomWorkers[room].postMessage({ type: 'input', action: 'join', socketId: socket.id, username, Map2d });
            } else {
                console.log('No worker for room:', room);
            }
        };
        const update_sessios = () => {
            socket.emit('sessions', sessions);
        };
        const joinSpectator = (room) => {
            console.log('SPECTATOR JOIN EVENT:', { room });
            if (!room || !sessions[room]) {
                socket.emit('joinerror', 'Invalid room');
                return;
            }
            socket.rooms.forEach(r => {
                if (r !== socket.id && r !== room) {
                    socket.leave(r);
                }
            });
            socket.join(room);
            
            // Add to spectators list
            if (!sessions[room].spectators) {
                sessions[room].spectators = {};
            }
            sessions[room].spectators[socket.id] = { socketId: socket.id };
            
            console.log('Spectator joined room:', room, 'Total spectators:', Object.keys(sessions[room].spectators).length);
            socket.emit('joined', room);
            io.emit('sessions', sessions);
        };

        socket.on('join', join);
        socket.on('joinSpectator', joinSpectator);
        socket.on('update_sessions', update_sessios);
       
        const ready = (room) => {
            socket.join(room);
            if (roomWorkers[room]) {
                roomWorkers[room].postMessage({ type: 'input', action: 'ready', socketId: socket.id });
            }
        };

        const room_leave = (room) => {
            socket.leave(room);
            console.log("leave room ")
            
            // Remove from spectators if they're a spectator
            if (sessions[room] && sessions[room].spectators && sessions[room].spectators[socket.id]) {
                delete sessions[room].spectators[socket.id];
                console.log("Spectator left room");
            }
            
            if (roomWorkers[room]) {
                roomWorkers[room].postMessage({ type: 'input', action: 'room_leave', socketId: socket.id });
                socket.emit("leftroom", room)
                io.emit('sessions', sessions);
            }
        };

        const delete_user = (room) => {
            socket.leave(room);
            if (roomWorkers[room]) {
                roomWorkers[room].postMessage({ type: 'input', action: 'delete_user', socketId: socket.id });
            }
        };

      socket.on("Use_utility", ({util, amount, room})=>{

            if(roomWorkers[room]){
                roomWorkers[room].postMessage({ type: 'input', action: 'util_use', util: util, amount: amount, socketId: socket.id});
            }
      })
      
       socket.on("remove_util", ({util, amount, room})=>{

            if(roomWorkers[room]){
                roomWorkers[room].postMessage({ type: 'input', action: 'remove_util', util: util, amount: amount, socketId: socket.id});
            }
            
      })

        

        socket.on('ready', ready);
        socket.on('room_leave', room_leave);
        socket.on('delete_user', delete_user);
    });
}

startServer().catch();

server.listen(3000, '0.0.0.0', () => {
    //console.log('server start on all interfaces');
});


//gameloop_timer();