
import yellow_potion from "./../website/src/assets/potion.png"


export class Utility {
    constructor(player, type) {
        this.player = player;
        this.duration = type.duration;
        this.amount = type.amount;
        this.type = type;

        this.active = true;
        this.timer = 0;
        

        if (type.instant) {
            this.applyInstant();
            this.active = false;
        } 
        else {
            this.applyStart();
            
        }
    }
    applyStart() {
        if (this.type.name === "haste") {
            console.log("before:", this.player.speed)
            this.player.speed = (this.player.speed || 100) + this.amount;
             console.log("after:", this.player.speed)
        }
    }
    remove() {
        if (this.type.name === "haste") {
            this.player.speed = (this.player.speed || 100) -this.amount;
            console.log("Speed changed to", this.player.speed)
        }
        this.active = false;
    }
    update(dt) {
        if (!this.active) return;
        console.log(this.timer)
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
        duration: 1,
        amount: 300,
        instant: false,
        texture: yellow_potion
    }
};
