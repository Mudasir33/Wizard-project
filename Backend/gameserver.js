



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
app.use(express.static('Backend'));
 


///------------------- MAP LOADING --------------------


///------------------- GAME SERVER --------------------


app.use(express.static('Public'));

const players = {};



function wallCollision(map2d,player_x,player_y,player_width,player_height) {
    const obj = Map2d.objectLayers[0].obj;
    
    for (let i = 0; i < obj.objects.length; i++) {
        const x = obj.obj.object[i].x;
        const y = obj.obj.object[i].y;
        const width =obj.obj.object[i].width;
        const height = obj.obj.object[i].height;

        if(player_x < x + width &&
            player_x + player_width > x &&
            player_y < y + height &&
            player_y + player_height > y)
            {
                console.log("Collision Detected");
            }
        
        
    }
    
}


async function startServer() {
    const Map2d = await mapCreation();
    obj=Map2d.objectLayers[0]
    console.log("TEST OBJECT:",obj.obj.objects[1]);
    
        
    io.on("connection", socket =>{
        console.log("connected:", socket.id);
        io.emit("map", Map2d); 

        const number = Object.values(players).includes(1) ? 2 : 1;   

        players[socket.id] = number;
        console.log("server your player nyumber:", number);
        socket.emit("playerNumber", number);
        
        socket.on("uppos", data =>{
            socket.broadcast.emit("playermoved", data);
        });

        socket.on("disconnect", ()=>{
        number-1;      
        delete players[socket.id];
        console.log("player disconneted", socket.id)
        });
    })

}
startServer().catch(console.error);
server.listen(3000, () =>{
    console.log("server start")
})

