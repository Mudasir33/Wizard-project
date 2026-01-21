export class Spell {
    constructor(x, y, type, direction) {
        this.x = x;
        this.y = y;

        this.speed  = type.speed;
        this.damage = type.damage;
        this.size   = type.size;

        const len = Math.hypot(direction.x, direction.y);
        if (len > 0) {
            this.dx = direction.x / len;
            this.dy = direction.y / len;
        } else {
            console.warn("Spell created with zero direction, using default");
            this.dx = 1;
            this.dy = 0;
        }

        this.sprite = new Image();
        this.sprite.src = type.texture;
        this.sprite.loaded = false;
        this.sprite.onload = () => {
            this.sprite.loaded = true;
            console.log("Spell image loaded:", type.texture);
        };
        this.sprite.onerror = (err) => {
            console.error("Failed to load spell image:", type.texture, err);
        };
        console.log("Spell constructor - x:", x, "y:", y, "dx:", this.dx, "dy:", this.dy, "speed:", this.speed);
    }
    update() {
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
    }
    draw(context, camX, camY) {
        if (!this.sprite.loaded) {
            return; // Don't try to draw if image hasn't loaded yet
        }
        try {
            context.drawImage(
                this.sprite,
                this.x - this.size / 2 - camX , 
                this.y - this.size / 2  - camY,
                this.size,
                this.size
            );
        } catch (e) {
            console.error("Error drawing spell:", e);
        }
    }
}

export const spell_list = {
    fireball: {
        texture: "../../Assets/Spells/fireball.gif",
        speed: 6,
        damage: 12,
        size: 40
    },
        test: {
        texture: "../Assets/Images/Wizard.png", //just a test for button
        speed: 30,
        damage: 12,
        size: 40
    }
};
