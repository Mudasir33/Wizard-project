const express = require('express');
const http = require('http');
const { connect } = require('http2');
const { disconnect } = require('process');
const socketIO = require('socket.io');
const {Server} = require('socket.io');
const app = express();
const server = http.createServer(app);
//const io = socketIO(server);
const tmx = require('tmx-parser');
const mapCreation = require('./map.js');
const path = require('path');
app.use(express.static('Backend'));
app.use(express.static(path.join(__dirname, '../Frontend/game')));


const io =  new Server(server, {
cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
    }
}
);

let x_kordinater = [0, 1, 2,3,4,5,6,7,8,9]
let y_kordinater = [0, 1, 2,3,4,5,6,7,8,9]
const colors = ["blue", "red", "green", "yellow", "brown", "white", "black", "purple", "gray", "rainbow"];

let sessions = {
    "Room 1": {
        id: "Room 1",
        players: [],},

    "Room 2": {
        id: "Room 2",
        players: [],},

    "Room 3": {
        id: "Room 3",
        players: [],},

    "Room 4": {
        id: "Room 4",
        players: [],},

    "Room 5": {
        id: "Room 5",
        players: [],},
        


};


function updateSessions(){
    io.emit("sessions", sessions);
}
///------------------- MAP LOADING --------------------


///------------------- GAME SERVER --------------------


app.use(express.static('Public'));

const players = {};
const playerInput = {};



function wallCollision(map2d, player_x, player_y, player_width, player_height) {
    const obj = Map2d.objectLayers[0].obj;

    for (let i = 0; i < obj.objects.length; i++) {
        const x = obj.obj.object[i].x;
        const y = obj.obj.object[i].y;
        const width = obj.obj.object[i].width;
        const height = obj.obj.object[i].height;

        if (player_x < x + width &&
            player_x + player_width > x &&
            player_y < y + height &&
            player_y + player_height > y) {
            console.log("Collision Detected");
        }


    }

}

const MAX_ROOM = 5;
async function startServer() {


    const Map2d = await mapCreation();
    obj = Map2d.objectLayers[0]
    console.log("TEST OBJECT:", Map2d);


    io.on("connection", socket => {
        console.log("connected:", socket.id);
        io.emit("map", Map2d);


        const number = Object.values(players).length + 1;

        players[socket.id] = {
            x: 500 * Math.random(), //random spawn
            y: 500 * Math.random(), //random spawn
            health: 100,
            alive: true,
            id: number,
            speed: 100,
            sequenceNumber: 0
        };
        playerInput[socket.id] = { dx: 0, dy: 0 };
        console.log(players);

        io.emit('updatePlayers', players);

        console.log("server your player nyumber:", number);
        socket.emit("playerNumber", number);


        socket.on("uppos", data => {
            socket.broadcast.emit("playermoved", data);
        });

        socket.on("disconnect", (reason) => {
            console.log(reason);

            delete players[socket.id];
            delete playerInput[socket.id];
            console.log("player disconneted", socket.id)
            const number = Object.values(players).length + 1;

            io.emit('updatePlayers', players);

        });

        socket.on("keydown", ({keycode, sequenceNumber}) => {
            players[socket.id].sequenceNumber = sequenceNumber;
            if (!playerInput[socket.id]) return;
            if (keycode == 'KeyW') playerInput[socket.id].dy = -1;
            if (keycode == 'KeyS') playerInput[socket.id].dy = 1;
            if (keycode == 'KeyA') playerInput[socket.id].dx = -1;
            if (keycode == 'KeyD') playerInput[socket.id].dx = 1;
        });

        socket.on("keyup", (key) => {
            if (!playerInput[socket.id]) return;
            if (key == 'KeyW' || key == 'KeyS') playerInput[socket.id].dy = 0;
            if (key == 'KeyA' || key == 'KeyD') playerInput[socket.id].dx = 0;
        });


//###################SESSION AND ROOM##################################
socket.on("join", (p, room )=>{
    console.log("join recavied");
    let username_taken = false;
  
    if( sessions[room].players.length >= 10){ //is room full
        console.log("SERVER: try to join full room ")
        socket.emit("joinerror", "ROOM FULL")
        return;
        }

    for ( let i = 0; i < sessions[room].players.length; i++){
        if(p.username == sessions[room].players[i].username){
            console.log("JOIN USERNAME JOIN ERROR")
            username_taken = true; }
    };
    
    if(username_taken == true){
        socket.emit("joinerror", "USERNAMNE ALREADY TAKEN")
        return
    }

    const index =sessions[room].players.length;

    const player ={
    username: p.username,
    color: colors[index],
    ready: false,
    x: x_kordinater[index],
    y: y_kordinater[index],
    health: 100,
    alive: true,
      //  this.image = new Image();
        //this.image.src = 'PixelCharacter.png';
    speed : 100 }

    
    sessions[room].players.push(player);
    socket.emit("joined", room)
    socket.broadcast.emit("sessions", sessions);
         });


 socket.on("update_sessions", ( room)=>{
        socket.emit("sessions", sessions);
            });


//###############ROOM##################################
socket.on("ready", (room, p) => {
    console.log("Server:", p.username, "changing ready")
    let players = sessions[room].players;

     for ( let i = 0; i < players.length; i++){
        if(players[i].username === p.username){
            players[i].ready = p.ready
            }
      };
    io.emit("sessions", sessions);
});

socket.on("room_leave",(room, p)=>{
    const exroom = sessions[room]
    console.log("player:",p.username, "leaving room", exroom)
    for(let i = 0; i < exroom.players.length; i++){
        if(p.username == exroom.players[i].username ){
            console.log()
            sessions[room].players.splice(i, 1);
            socket.emit("leftroom", sessions)
            io.emit("sessions", sessions)
            return;
            
        }
    }
   
    

})





}); //CONNECTION SOCKET




}

















  

setInterval(() => {
    // Update all player positions based on input
    for (const id in players) {
        const player = players[id];
        const input = playerInput[id];
        if (!input) continue;

        let dx = input.dx;
        let dy = input.dy;

        if (dx !== 0 && dy !== 0) {
            const inv = 1 / Math.sqrt(2);
            dx *= inv; dy *= inv;
        }

        player.x += dx * player.speed * 0.015
        player.y += dy * player.speed * 0.015;
    }
    io.emit('updatePlayers', players);
}, 15);

startServer().catch(console.error);
server.listen(3000, () => {
    console.log("server start")
})



