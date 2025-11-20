export class Spell {
    constructor(x, y, type, direction) {
        this.x = x;
        this.y = y;

        this.speed = type.speed;
        this.damage = type.damage;

        const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        this.dx = direction.x / len;
        this.dy = direction.y / len;

        this.size = type.size || 40;

        this.sprite = new Image();
        this.sprite.src = type.texture;
    }

    update() {
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
    }

    draw(context) {
        context.drawImage(
            this.sprite,
            this.x - this.size / 2,
            this.y - this.size / 2,
            this.size,
            this.size
        );
    }
}

export const spell_list = {
    fireball: {
        texture: "./fireball.gif",
        speed: 6,
        damage: 12,
        size: 40
    }
};