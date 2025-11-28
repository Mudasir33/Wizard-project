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
            this.player.vel += this.amount;
        }
    }
    remove() {
        if (this.type.name === "haste") {
            this.player.vel -= this.amount;
        }
        this.active = false;
    }
    update(dt) {
        if (!this.active || this.duration <= 0) return;

        this.timer += dt;
        if (this.timer >= this.duration) {
            this.remove();
        }
    }
}

export const utility_list = {
    haste: {
        name: "haste",
        duration: 10000,
        amount: 2,
        instant: false
    }
};
