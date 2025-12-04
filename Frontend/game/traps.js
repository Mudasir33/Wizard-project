export class Trap {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;

        this.size = type.size;
        this.visibleDist = type.visibleDist;
        this.triggerDist = type.triggerDist;

        this.sprite = new Image();
        this.sprite.src = type.texture;

        this.isActive = true;
        this.isVisible = true;
    }

    update(player) {
        if (!this.isActive) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.triggerDist) {
            this.isActive = false;
            return;
        }
        if (dist > this.visibleDist) {
            this.isVisible = false;
        }
        else {
            this.isVisible = true;
        }
    }

    draw(context) {
        if (!this.isActive || !this.isVisible) return;

        context.drawImage(
            this.sprite,
            this.x - this.size / 2,
            this.y - this.size / 2,
            this.size,
            this.size
        );
    }
}

export const trap_list = {
    fire_trap: {
        texture: "../Assets/Spells/fireball.gif",
        size: 40,
        visibleDist: 130,
        triggerDist: 25
    }
};