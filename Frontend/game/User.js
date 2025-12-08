import { Player} from "./Player";




const player =  new Player(0,0);




 export const user = {
    setusername,
    setcolor,
    setready,
    setx,
    sety,
    sethealth,
    setalive,
    setimage,
    setspeed,
    getplayer



 }



function getplayer(){
    return player;
 }

 function setusername(username){
                player.username = username;
 }

function setcolor(color){
            player.color = color  
 }



 function setready(ready){
            player.ready =  ready 
 }
function setx(x){
     player.x =  x 
 }

function sety(y){
            player.y =   y
 }

function sethealth(health){
            player.health =   health
 }

function setalive(alive){
            player.alive =  alive
 }

 function setimage(image){
            player.image.src =   image
 }
function setspeed(speed){
            player.speed =  speed 
 }

 export default user;