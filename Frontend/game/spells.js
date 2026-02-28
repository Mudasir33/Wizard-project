import fire from "../../Assets/Spells/fireball.gif";
import fireballPickup from "../../Assets/Spells/fireball_pickup.png";
import missile from "../../Assets/Spells/missile.png";
import bouncingShot from "../../Assets/Spells/bouncing_shot.png";
import bouncingIcon from "../../Assets/Spells/bouncing_icon.png";
export class Spell {
    constructor(x, y, type, direction) {
        this.x = x;
        this.y = y;

        this.speed  = type.speed;
        this.damage = type.damage;
        this.size   = type.size;
        this.spinSpeed = type.spinSpeed || 0;
        this.rotation = 0;

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
        };
        this.sprite.onerror = (err) => {
            console.error("Failed to load spell image:", type.texture, err);
        };
    }
    update(deltaTime) {
        // Match backend: speed units per second
        this.x += this.dx * this.speed * deltaTime;
        this.y += this.dy * this.speed * deltaTime;
        this.rotation += this.spinSpeed * deltaTime;
    }
    draw(context, scaleup_constant) {
        if (!this.sprite.loaded) {
            return;
        }
        try {
            const angle = this.spinSpeed > 0 ? this.rotation : Math.atan2(this.dy, this.dx);
            const drawX = this.x * scaleup_constant;
            const drawY = this.y * scaleup_constant;
            const size = this.size * scaleup_constant;
            context.save();
            context.translate(drawX + size / 2, drawY + size / 2);
            context.rotate(angle);
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
        pickupTexture: fireballPickup,
        speed: 200,
        damage: 25,
        size: 18,
        aoeRadius: 50,
        name: "Fireball",
        description: "Explodes on impact dealing AoE damage"
    },
    magic_missile: {
        texture: missile,
        pickupTexture: missile,
        speed: 100,
        damage: 12,
        size: 12,
        name: "Magic Missile",
        description: "Basic projectile spell"
    },
    bouncing_shot: {
        texture: bouncingShot,
        pickupTexture: bouncingIcon,
        speed: 150,
        damage: 15,
        size: 14,
        maxBounces: 3,
        spinSpeed: 10,
        name: "Bouncing Shot",
        description: "Bounces off walls and enemies up to 3 times"
    }
};
