
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
const { log, Console } = require('console');
const { spawn } = require('child_process');

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
    'Room 1': { id: 'Room 1',  players: {}, move:{}, backendProjectiles:{}, map:null, ongoing: false, numready:0},
    'Room 2': { id: 'Room 2',  players: {}, move:{}, backendProjectiles:{}, map:null, ongoing: false, numready:0} ,
    'Room 3': { id: 'Room 3',  players: {}, move:{}, backendProjectiles:{}, map:null, ongoing: false,  numready:0},
    'Room 4': { id: 'Room 4',  players: {}, move:{}, backendProjectiles:{}, map:null, ongoing: false,  numready:0},
    'Room 5': { id: 'Room 5',  players: {}, move:{}, backendProjectiles:{}, map:null, ongoing: false,  numready:0},
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

let spawn_x = 50;
let spawn_y = 125;




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
            sessions[room].map = Map2d;
            console.log("Game starting:", room);
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

            if (sessions[roomkey].players[socket.id].alive === false) return; // dead players can't shoot
            projectileId += 1;
            //console.log("SPELL", roomkey);
            
            
            sessions[roomkey].backendProjectiles[projectileId] = {
                spellName: spellName,
                spellDirection: spellDirection,
                x: x,
                y: y,
                roomkey,
                playerId: socket.id,
                speed: 100
            };

            console.log(sessions[roomkey].backendProjectiles);
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
         
            if (Object.keys(sessions[room].players).length >= 10) {
                // is room full
                console.log('SERVER: try to join full room ');
                socket.emit('joinerror', 'ROOM FULL');
                return;
            }

            for (const player of Object.values(sessions[room].players)) {
                if (p.username == player.username) {
                    console.log('JOIN USERNAME JOIN ERROR');
                    socket.emit('joinerror', 'USERNAMNE ALREADY TAKEN');
                    return;
                }
            }

         
            const index = Object.keys(sessions[room].players).length;
            sessions[room].players[socket.id] = {
                username: p.username,
                color: colors[index],
                ready: false,
                x: spawn_x, 
                y: spawn_y,         
                health: 100,
                alive: true,
                id: number,
                speed: 100,
                sequenceNumber: 0,
            };
            spawn_x += 30;
            
            socket.join(room);
            console.log("ROOM MEMBERS:", io.sockets.adapter.rooms.get(room));
            sessions[room].move[socket.id] = { dx: 0, dy: 0 };
            io.emit('sessions', sessions);
            socket.emit('joined', room);
        });

        socket.on('update_sessions', (room) => {
            socket.emit('sessions', sessions);
        });

        // ##############ROOM##################
        socket.on('ready', (room, p) => {
            socket.join(room);
            // console.log('Server:', p.username, 'changing ready');
            const players = sessions[room].players;
            const numplayers = Object.keys(sessions[room].players).length;
            console.log("ready")
            if(players[socket.id]  ){
                if(players[socket.id].ready == false){
                    players[socket.id].ready = true;
                sessions[room].numready =  sessions[room].numready +1;}
                else{
                     players[socket.id].ready = false;
                      sessions[room].numready=   sessions[room].numready -1;
            }
        }
                console.log(sessions[room].numready / numplayers)
            if (sessions[room].numready / numplayers >= 0.51 && numplayers >= 2) {
                sessions[room].ongoing = true;
                console.log("emit players ready")
            io.to(room).emit("players_ready", room);
            }
            else {
                sessions[room].ongoing = false;
            }


            io.emit('sessions', sessions);
        });







        socket.on('room_leave', (room, p) => {
            const exroom = sessions[room];
            console.log(exroom)
            console.log('player:', socket.id ,'leaving room',  exroom.id);
            console.log(exroom.players[socket.id])
            if(exroom.players[socket.id]){
                exroom.players[socket.id].ready = false;
                delete exroom.players[socket.id]
                  console.log("leftroom")
                    socket.emit('leftroom', sessions);
                    io.emit('sessions', sessions);

                    return;

            }
             
            console.log("failed to leaveroom")
        });


    }); // CONNECTION SOCKET
}




// checks if character is hitting one of the walls 
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


    function ProjectilePlayerCollision(projectile, player) {
        const projectile_x = projectile.x;
        const projectile_y = projectile.y;
        const projectile_size = 5; // assuming projectile is a square of size 5x5
        const player_x = player.x;
        const player_y = player.y;
        const player_width = 11;
        const player_height = 15;
        if (
            projectile_x < player_x + player_width &&
            projectile_x + projectile_size > player_x &&
            projectile_y < player_y + player_height &&
            projectile_y + projectile_size > player_y
        ) {
            return true;
        }
        return false;
    }

setInterval(() => {
    // Update all player positions based on input
    for (const [roomName, roomInfo] of Object.entries(sessions)) {
        const players = roomInfo.players;
        const playerInput = roomInfo.move;
        const backendProjectiles = roomInfo.backendProjectiles;
        const obj = roomInfo.map

        //console.log("map", roomInfo.map.objectLayers[0].obj);

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
                            
                player.x += (dx * player.speed * 0.015); //this is more of a quick fix that may need changes in the future
                player.y += (dy * player.speed * 0.015); 
            if (wallCollison(obj, player) == false || wallCollison(obj, player) == undefined){
                player.x += (dx * player.speed * 0.015) ;
                player.y += (dy * player.speed * 0.015);

                
            }else{
                if (player.alive === false) break;
                //if collision is true from input the characters will move away from the wall
                if (0.1 <= dx && dx <= 1|| 0.1 <= dy && dy<= 1 || -1 <= dx && dx <= -0.1|| -1 <= dy && dy <= -0.1) {
                   player.x += (-dx * player.speed * 0.015); // reverse the input in x coordinate x
                   player.y += (-dy * player.speed * 0.015); // reverse the input in x coordinate y
                   
                }

                
                
                
            }

             

        }

            // Update all projectile positions
        for (const id in backendProjectiles) {
            const projectile = backendProjectiles[id];
            const direction = projectile.spellDirection;
            let dx = direction.x;
            let dy = direction.y;
            
            projectile.x += dx * projectile.speed * 0.015;
            projectile.y += dy * projectile.speed * 0.015;
            // Check for collision with walls
            if (wallCollison(obj, projectile) == true){
                delete backendProjectiles[id];
            }

            // Check for collision with players
            for (const pid in players) {
                if (ProjectilePlayerCollision(projectile, players[pid])) {
                    if (pid === projectile.playerId || players[pid].alive === false) break; // skip if the projectile hit the shooter or if the player is already dead
                    console.log("HIT PLAYER", pid);
                    players[pid].health -= 10; 
                    delete backendProjectiles[id];

                    console.log("Player health:", players[pid].health);
                    if (players[pid].health <= 0) {
                        players[pid].alive = false;
                        console.log("Player", pid, "has died.");
                        //delete players[pid];
                    }

                }
            }
        }

     io.to(roomName).emit('updatePlayers', players);
     io.to(roomName).emit('updateProjectiles', backendProjectiles);
    }
   
    
   
}, 15);

startServer().catch(console.error);

server.listen(3000, '0.0.0.0', () => {
    console.log('server start on all interfaces');
});


