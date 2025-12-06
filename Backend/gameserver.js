const express = require('express');
const http = require('http');
const { connect } = require('http2');
const { disconnect } = require('process');
const socketIO = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const tmx = require('tmx-parser');
const mapCreation = require('./map.js');
const path = require('path');
app.use(express.static('Backend'));
app.use(express.static(path.join(__dirname, '../Frontend/game')));



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
            speed: 100
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

        socket.on("keydown", (key) => {
            if (!playerInput[socket.id]) return;
            if (key == 'KeyW') playerInput[socket.id].dy = -1;
            if (key == 'KeyS') playerInput[socket.id].dy = 1;
            if (key == 'KeyA') playerInput[socket.id].dx = -1;
            if (key == 'KeyD') playerInput[socket.id].dx = 1;
        });

        socket.on("keyup", (key) => {
            if (!playerInput[socket.id]) return;
            if (key == 'KeyW' || key == 'KeyS') playerInput[socket.id].dy = 0;
            if (key == 'KeyA' || key == 'KeyD') playerInput[socket.id].dx = 0;
        });
    })

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

        player.x += dx * player.speed * 0.016;
        player.y += dy * player.speed * 0.016;
    }
    io.emit('updatePlayers', players);
}, 16);

startServer().catch(console.error);
server.listen(3000, () => {
    console.log("server start")
})

