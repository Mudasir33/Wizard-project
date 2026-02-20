import fire from "../../Assets/Spells/fireball.gif";
import missile from "../../Assets/Spells/missile.png";
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
    draw(context, scaleup_constant) {
        if (!this.sprite.loaded) {
            return; // Don't try to draw if image hasn't loaded yet
        }
        try {
             // Calculate angle based on direction
            const angle = Math.atan2(this.dy, this.dx);
            const drawX = this.x * scaleup_constant;
            const drawY = this.y * scaleup_constant;
            const size = this.size;
            context.save();
            // Move to center of spell
            context.translate(drawX + size / 2, drawY + size / 2);
            context.rotate(angle);
            // Draw image centered
            context.drawImage(
                this.sprite,
                -size / 2,
                -size / 2,
                size,
                size
            );
            context.restore();
        } catch (e) {
            console.error("Error drawing spell:", e);
        }
    }
}

export const spell_list = {
    fireball: {
        texture: fire,
        speed: 4,
        damage: 25,
        size: 40,
        aoeRadius: 50
    },
    magic_missile: {
        texture: missile,
        speed: 2,
        damage: 12,
        size: 40
    }
};
