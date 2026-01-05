export class Player {
  constructor(x, y) {
    this.username = '';
    this.color = '';
    this.ready = false;

    this.x = x;
    this.y = y;
    this.health = 100;
    this.maxHealth = 100;
    this.alive = true;
    this.image = new Image();
    this.image.src = 'PixelCharacter.png';
    this.speed = 100;

    // Hitbox dimensions (adjust as needed)
    this.width = 11;
    this.height = 15;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
    }
  }

  heal(amount) {
    this.health += amount;
    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }
  }

  drawHealthBar(ctx, x, y, scaleup_constant) {
    const barWidth = 32;
    const barHeight = 4;
    const healthRatio = this.health / this.maxHealth;

    // Background (red)
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(x - barWidth / 2, y - 20, barWidth, barHeight);

    // Foreground (green)
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(x - barWidth / 2, y - 20, barWidth * healthRatio, barHeight);
  }

  draw(ctx, scaleup_constant) {
    if (this.alive) {
      ctx.drawImage(
        this.image,
        this.x * scaleup_constant,
        this.y * scaleup_constant,
        11 * scaleup_constant, // width
        15 * scaleup_constant  // height
      );
      this.drawHealthBar(ctx, this.x * scaleup_constant + (11 * scaleup_constant) / 2, this.y * scaleup_constant, scaleup_constant);
    }
  }

  // Hitbox collision check
  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  checkCollision(other) {
    const hitbox = this.getHitbox();
    const otherHitbox = other.getHitbox ? other.getHitbox() : other;

    return (
      hitbox.x < otherHitbox.x + otherHitbox.width &&
      hitbox.x + hitbox.width > otherHitbox.x &&
      hitbox.y < otherHitbox.y + otherHitbox.height &&
      hitbox.y + hitbox.height > otherHitbox.y
    );
  }
}
