const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Worker } = require('worker_threads');
const app = express();
const server = http.createServer(app);
const mapCreation = require('./map.js');
const path = require('path');

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
            const clonedBackendProjectiles = JSON.parse(JSON.stringify(msg.state.backendProjectiles));
            const clonedMap = msg.state.map ? JSON.parse(JSON.stringify(msg.state.map)) : null;
            const clonedItems = msg.state.items ? JSON.parse(JSON.stringify(msg.state.items)) : [];
            sessions[roomName].players = clonedPlayers;
            sessions[roomName].move = clonedMove;
            sessions[roomName].backendProjectiles = clonedBackendProjectiles;
            sessions[roomName].map = clonedMap;
            sessions[roomName].items = clonedItems;
            sessions[roomName].numready = msg.state.numready;
            sessions[roomName].ongoing = msg.state.ongoing;
            io.to(roomName).emit('updatePlayers', clonedPlayers, roomName);
            io.to(roomName).emit('updateProjectiles', clonedBackendProjectiles, roomName);
            io.to(roomName).emit('spawnItems', clonedItems, roomName);

            io.emit('sessions', sessions);
            if (msg.state.ongoing) {
                io.to(roomName).emit('players_ready', roomName);
            }
        } else if (msg.type === 'joined') {
            io.sockets.sockets.get(msg.socketId)?.emit('joined', roomName);
        } else if (msg.type === 'error') {
            io.sockets.sockets.get(msg.socketId)?.emit('joinerror', msg.error);
        } else if (msg.type === 'death') {
            io.sockets.sockets.get(msg.socketId)?.emit('death', msg.placement);
        } else if (msg.type === 'winner') {
            io.sockets.sockets.get(msg.socketId)?.emit('winner', msg.placement);
        }
    });
    worker.on('error', (err) => {
        console.error(`Worker error in ${roomName}:`, err);
    });
    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Worker for ${roomName} stopped with exit code ${code}`);
        }
    });
    roomWorkers[roomName] = worker;
}

['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5'].forEach(room => {
    const initialState = { id: room, players: {}, move: {}, backendProjectiles: {}, map: null, ongoing: false, numready: 0, items: [] };
    sessions[room] = initialState;
    startRoomWorker(room, initialState);
});

app.use(express.static('Public'));

async function startServer() {
    const Map2d = await mapCreation();
    io.on('connection', (socket) => {
        socket.on('Game', (room) => {
            socket.emit('spawnItems', sessions[room]?.items || []);
            socket.rooms.forEach(r => {
                if (r !== socket.id && r !== room) {
                    socket.leave(r);
                }
            });
            socket.join(room);
            const clonedMap = JSON.parse(JSON.stringify(Map2d));
            sessions[room].map = clonedMap;
            if (roomWorkers[room]) {
                roomWorkers[room].postMessage({ type: 'set_map', map: JSON.parse(JSON.stringify(clonedMap.objectLayers[0])) });
            }
            socket.emit('gameRoom', room);
        });
        socket.on('gameStart', (room) => {
            io.to(room).emit('map', Map2d);
            io.to(room).emit('updatePlayers', sessions[room]?.players[socket.id]);
        });
        socket.on('disconnect', (reason) => {
            for (const room in sessions) {
                if (sessions[room].players[socket.id]) {
                    roomWorkers[room].postMessage({ type: 'input', action: 'delete_user', socketId: socket.id });
                }
            }
        });
        socket.on("restart_game",(roomkey)=>{
            const room = sessions[roomkey];
            const players = Object.keys(room.players)
            //console.log("playes left in session: ", players.length)
            if(players.length === 0){
            //console.log("restetsession")
            room.backendProjectiles = {};
            room.players =  {};
            room.numready = 0;
            room.ongoing = false;
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
        socket.on('zone', ({ state, roomkey }) => {
            // Forward to worker if needed
        });
        const join = (username, room) => {
            console.log('JOIN EVENT:', { username, room });
            socket.rooms.forEach(r => {
                if (r !== socket.id && r !== room) {
                    socket.leave(r);
                }
            });
            socket.join(room);
            if (roomWorkers[room]) {
                roomWorkers[room].postMessage({ type: 'input', action: 'join', socketId: socket.id, username });
            } else {
                console.log('No worker for room:', room);
            }
        };
        const update_sessios = () => {
            socket.emit('sessions', sessions);
        };
        socket.on('join', join);
        socket.on('update_sessions', update_sessios);
        const ready = (room) => {
            socket.join(room);
            if (roomWorkers[room]) {
                roomWorkers[room].postMessage({ type: 'input', action: 'ready', socketId: socket.id });
            }
        };
        const room_leave = (room, p) => {
            socket.leave(room);
            if (roomWorkers[room]) {
                roomWorkers[room].postMessage({ type: 'input', action: 'room_leave', socketId: socket.id });
            }
        };
        const delete_user = (room) => {
            socket.leave(room);
            if (roomWorkers[room]) {
                roomWorkers[room].postMessage({ type: 'input', action: 'delete_user', socketId: socket.id });
            }
        };
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