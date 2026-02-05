
import Character_idle from "../../Assets/character/PixelCharacter.png";
import Character_walk_left from "../../Assets/character/PixelCharacterSheet_walkleft.png";
import Character_walk_right from "../../Assets/character/PixelCharacterSheet_walkright.png";
import Character_walk_up from "../../Assets/character/PixelCharacterSheet_walkup.png";
import Character_walk_down from "../../Assets/character/PixelCharacterSheet_walkdown.png";
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
    this.image.src = Character_walk_right;
    this.speed = 100;
    this.dx = 0;
    this.dy = 0;
    this.direction = 'idle'; // idle, up, down, left, right

    // Hitbox dimensions (adjust as needed)
    this.width = 11;
    this.height = 15;

    //animation properties
    this.framewidth = 11;
    this.frameheight = 15;
    this.currentFrame = 0;
    this.totalFrames = 4;
    this.frameDuration = 0.25; // seconds
    this.frameTime = 0;

    this.imageLoaded = false;
    this.image.onload = () => {
      this.imageLoaded = true;
    };
  }


  // Update animation frame based on deltaTime
  update(deltaTime) {
    this.frameTime += deltaTime;

    if (this.frameTime >= this.frameDuration) {
      this.frameTime = 0;
      this.currentFrame =
        (this.currentFrame + 1) % this.totalFrames;
    }
    // Update direction based on dx and dy
    if (this.dx === 0 && this.dy === 0) {
      this.direction = 'idle';
    } else if (Math.abs(this.dx) > Math.abs(this.dy)) {
      this.direction = this.dx > 0 ? 'right' : 'left';
    } else {
      this.direction = this.dy > 0 ? 'down' : 'up';
    }
    
    //update image based on direction
    if (this.direction === 'idle') {
      this.image.src = Character_idle;
      this.totalFrames = 1;
      this.currentFrame = 0;
    } else if (this.direction === 'right') {
      this.image.src = Character_walk_right;
      this.totalFrames = 4;
    } else if (this.direction === 'left') {
      this.image.src = Character_walk_left;
      this.totalFrames = 4;
    } else if (this.direction === 'up') {
      this.image.src = Character_walk_up;
      this.totalFrames = 4;
    } else if (this.direction === 'down') {
      this.image.src = Character_walk_down;
      this.totalFrames = 4;
    }
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
    if (!this.alive || !this.imageLoaded) return;
    ctx.drawImage(
      this.image,
      this.currentFrame * this.framewidth,
      0,
      this.framewidth,
      this.frameheight,
      this.x * scaleup_constant,
      this.y * scaleup_constant,
      11 * scaleup_constant, // width
      15 * scaleup_constant  // height
    );
    this.drawHealthBar(ctx, this.x * scaleup_constant + (11 * scaleup_constant) / 2, this.y * scaleup_constant, scaleup_constant);
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
