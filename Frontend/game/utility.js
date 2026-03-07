
import yellow_potion from "./../website/src/assets/potion.png"
import health_potion from "./../website/src/assets/health_potion.png"
import { socket } from "./Socket";

export class Utility {
    constructor(player, type, room) {
        this.player = player;
        this.duration = type.duration;
        this.amount = type.amount;
        this.type = type;
        this.room = room;
        
        this.active = true;
        this.timer = 0;
        
        if (type.instant) {
            this.applyInstant(room);
            this.active = false;
        } 
        else {
            this.applyStart();
            
        }
    }
    applyStart() {
        if (this.type.name === "haste") {
           socket.emit("Use_utility", ({util: this.type.name, amount: this.amount, room: this.room}));   
        }
    }

    applyInstant(){
          if (this.type.name === "health") {
               socket.emit("Use_utility", ({util: this.type.name, amount: this.amount, room: this.room}));   
            }
         this.active = false;
    }

    remove(){
        if (this.type.name === "haste") {
                console.log("remove haste, speed:", this.player?.speed)
                socket.emit("remove_util", ({util: this.type.name, amount: this.amount, room: this.room}));   
        }
        this.active = false;
    }
    update(dt) {
        if (!this.active) return;
        this.timer += dt;
        if (this.timer >= this.duration) {
            console.log("remove haste")
            this.remove();
        }
    }
}

export const utility_list = {
    haste: {
        name: "haste",
        displayName: "Haste",
        description: "double movement speed for 5 seconds",
        duration: 5,
        amount: 2,
        instant: false,
        texture: yellow_potion,
        pickupTexture: yellow_potion
    },
    health:{
        name: "health",
        displayName: "Heal",
        description: "Restores 10 health per charge",
        duration: 1,
        amount: 10,
        instant: true,
        texture: health_potion,
        pickupTexture: health_potion
    }

};