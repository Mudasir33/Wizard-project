
const express = require('express');
const http = require('http');
const { connect } = require('http2');
const { disconnect } = require('process');
const socketIO = require('socket.io');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
// const io = socketIO(server);

const tmx = require('tmx-parser');
const mapCreation = require('./map.js');
const path = require('path');
const { log } = require('console');

app.use(express.static('Backend'));
app.use(express.static(path.join(__dirname, '../Frontend/game')));
app.use("/Assets", express.static(path.join(__dirname, "../Assets")));

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

const x_kordinater = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; //temporay
const y_kordinater = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const colors = ['blue', 'red', 'green', 'yellow', 'brown', 'white', 'black', 'purple', 'gray', 'rainbow'];


let sessions = {
    'Room 1': { id: 'Room 1',  players: {}, move:{}, backendProjectiles:{},  ongoing: false},
    'Room 2': { id: 'Room 2',  players: {}, move:{},  backendProjectiles:{},ongoing: false} ,
    'Room 3': { id: 'Room 3',  players: {}, move:{},backendProjectiles:{},  ongoing: false},
    'Room 4': { id: 'Room 4',  players: {}, move:{},  backendProjectiles:{},ongoing: false},
    'Room 5': { id: 'Room 5',  players: {}, move:{},  backendProjectiles:{},ongoing: false},
};


function updateSessions() {
    io.emit('sessions', sessions);
}

///------------------- MAP LOADING --------------------

///------------------- GAME SERVER --------------------

app.use(express.static('Public'));

const players = {};
const playerInput = {};
const backendProjectiles = {};
let projectileId = 0; ///?


function wallCollision(map2d, player_x, player_y, player_width, player_height) {
    const obj = Map2d.objectLayers[0].obj;

    for (let i = 0; i < obj.objects.length; i++) {
        const x = obj.obj.object[i].x;
        const y = obj.obj.object[i].y;
        const width = obj.obj.object[i].width;
        const height = obj.obj.object[i].height;

        if (
            player_x < x + width &&
            player_x + player_width > x &&
            player_y < y + height &&
            player_y + player_height > y
        ) {
            console.log('Collision Detected');
        }
    }
}

const MAX_ROOM = 5;

async function startServer() {
    const Map2d = await mapCreation();
    obj = Map2d.objectLayers[0];
    console.log('TEST OBJECT:', Map2d);

    io.on('connection', (socket) => {
        console.log('connected:', socket.id);
        socket.on('Game', (room) => {
        
        const test_room = room;   
        socket.join(room);         
        console.log("Game starting:", room);
        //console.log("GAME PLAYERS", sessions[room].players[socket.id]);
        
        //io.emit('updatePlayers', sessions[room].players);
        socket.emit('gameRoom', room);
       
        });


        socket.on('gameStart', (room) => {  
            io.emit('map', Map2d); 
            io.to(room).emit('updatePlayers', sessions[room].players[socket.id]);
            
        });


        const number = Object.values(players).length + 1;
        /*
        players[socket.id] = {
            x: 500 * Math.random(), // random spawn
            y: 500 * Math.random(), // random spawn
            health: 100,
            alive: true,
            id: number,
            speed: 100,
            sequenceNumber: 0,
        };

        playerInput[socket.id] = { dx: 0, dy: 0 };
        console.log(players);
        */

        socket.on('disconnect', (reason) => {
            console.log(reason);

            delete players[socket.id];
            delete playerInput[socket.id];
            console.log('player disconneted', socket.id);
            const number = Object.values(players).length + 1;

            io.emit('updatePlayers', players);
        });

        socket.on('keyup', (key,room) => {
            //console.log(room);
            if (!sessions[room].move[socket.id]) return;
            if (key == 'KeyW' || key == 'KeyS') sessions[room].move[socket.id].dy = 0;
            if (key == 'KeyA' || key == 'KeyD') sessions[room].move[socket.id].dx = 0;
        });

        socket.on('movement', ({ dx, dy, sequenceNumber,roomkey }) => {
            
            
            //console.log("MOVEMENT ROOM", roomkey);
           sessions[roomkey].players[socket.id].sequenceNumber = sequenceNumber;
            if (! sessions[roomkey].move[socket.id]) return;
            sessions[roomkey].move[socket.id].dx = dx;
            sessions[roomkey].move[socket.id].dy = dy;
        });
        //###############Projectiles##########################
        socket.on('spellCast', ({ spellName, spellDirection, x, y, roomkey }) => {
            projectileId += 1;
            console.log("SPELL", roomkey);
            
            sessions[roomkey].backendProjectiles[projectileId] = {
                spellName: spellName,
                spellDirection: spellDirection,
                x: x,
                y: y,
                roomkey,
                playerId: socket.id,
                speed: 100
            };
            //console.log(backendProjectiles);
        });

        // ###################SESSION##################################
        socket.on('join', (p, room) => {
            console.log('join recavied');
            let username_taken = false;

            if (sessions[room].ongoing == true) {
                console.log('SERVER: room ongoing')
                socket.emit('joinerror', 'ROOM already ongoing');
                return
            }

            if (p.username == "") {
                console.log('SERVER: Username empty');
                socket.emit('joinerror', 'Put in username');
                return


            }
            if (sessions[room].players.length >= 10) {
                // is room full
                console.log('SERVER: try to join full room ');
                socket.emit('joinerror', 'ROOM FULL');
                return;
            }

            for (let i = 0; i < sessions[room].players.length; i++) {
                if (p.username == sessions[room].players[i].username) {
                    console.log('JOIN USERNAME JOIN ERROR');
                    username_taken = true;
                }
            }

            if (username_taken == true) {
                socket.emit('joinerror', 'USERNAMNE ALREADY TAKEN');
                return;
            }

            const index = sessions[room].players.length;

            sessions[room].players[socket.id] = {
                username: p.username,
                color: colors[index],
                ready: false,
                x: 500 * Math.random(), // random spawn
                y: 500 * Math.random(), // random spawn
                health: 100,
                alive: true,
                id: number,
                speed: 100,
                sequenceNumber: 0,
                
            };
            sessions[room].move[socket.id] = { dx: 0, dy: 0 };
            io.emit('sessions', sessions);
            socket.emit('joined', room);
        });

        socket.on('update_sessions', (room) => {
            socket.emit('sessions', sessions);
        });

        // ##############ROOM##################
        socket.on('ready', (room, p) => {
            // console.log('Server:', p.username, 'changing ready');
            const players = sessions[room].players;
            const numplayers = sessions[room].players.length;
            let numready = 0;



            for (let i = 0; i < players.length; i++) {
                if (players[i].username === p.username) {
                    players[i].ready = p.ready;
                }
                if (players[i].ready === true) {
                    numready = numready + 1;
                }

            }

            if (numready / numplayers >= 0.51 && numplayers >= 2) {
                sessions[room].ongoing = true;
            }
            else {
                sessions[room].ongoing = false;
            }


            io.emit('sessions', sessions);
        });

        socket.on('room_leave', (room, p) => {
            const exroom = sessions[room];
            console.log('player:', p.username, 'leaving room', exroom.id);
            for (let i = 0; i < exroom.players.length; i++) {
                if (p.username == exroom.players[i].username) {
                    sessions[room].players.splice(i, 1);
                    if (sessions[room].players.length == 1) {
                        sessions[room].ongoing = false;
                    }
                    socket.emit('leftroom', sessions);
                    io.emit('sessions', sessions);

                    return;
                }
            }
        });
    }); // CONNECTION SOCKET
}

setInterval(() => {
    // Update all player positions based on input
    for (const [roomName, roomInfo] of Object.entries(sessions)) {
        const players = roomInfo.players;
        const playerInput = roomInfo.move;
        const backendProjectiles = roomInfo.backendProjectiles;

        //console.log(playerInput);
        
        for (const id in players) {
            const player = players[id];
            const input = playerInput[id];
            //console.log("input:", players);
            if (!input) continue;

            let dx = input.dx;
            let dy = input.dy;

            if (dx !== 0 && dy !== 0) {
                const inv = 1 / Math.sqrt(2);
                dx *= inv;
                dy *= inv;
            }

            player.x += dx * player.speed * 0.015;
            player.y += dy * player.speed * 0.015;
        }

            // Update all projectile positions
        for (const id in backendProjectiles) {
            const projectile = backendProjectiles[id];
            const direction = projectile.spellDirection;
            let dx = direction.x;
            let dy = direction.y;

            projectile.x += dx * projectile.speed * 0.015;
            projectile.y += dy * projectile.speed * 0.015;
            
        }
     //console.log(players);
     io.to(roomName).emit('updatePlayers', players);
     io.to(roomName).emit('updateProjectiles', backendProjectiles);
    }
   
    
   
}, 15);

startServer().catch(console.error);

server.listen(3000, '0.0.0.0', () => {
    console.log('server start on all interfaces');
});


