import Character_animation_sheet_blue from "../../Assets/character/SpritesheetWalkingCombinedBlue.png";
import Character_animation_sheet_black from "../../Assets/character/SpritesheetWalkingCombinedBlack.png";
import Character_animation_sheet_brown from "../../Assets/character/SpritesheetWalkingCombinedBrown.png";
import Character_animation_sheet_gray from "../../Assets/character/SpritesheetWalkingCombinedGray.png";
import Character_animation_sheet_green from "../../Assets/character/SpritesheetWalkingCombinedGreen.png";
import Character_animation_sheet_pink from "../../Assets/character/SpritesheetWalkingCombinedPink.png";
import Character_animation_sheet_purple from "../../Assets/character/SpritesheetWalkingCombinedPurple.png";
import Character_animation_sheet_red from "../../Assets/character/SpritesheetWalkingCombinedRed.png";
import Character_animation_sheet_white from "../../Assets/character/SpritesheetWalkingCombinedWhite.png";
import Character_animation_sheet_yellow from "../../Assets/character/SpritesheetWalkingCombinedYellow.png";


export class Player {
  constructor(x, y, color) {
    this.username = '';
    this.color = color;
    this.ready = false;

    this.x = x;
    this.y = y;
    this.health = 100;
    this.maxHealth = 100;
    this.alive = true;
    this.image = new Image();
    this.image.src =  this.setImage(color);
    this.speed = 100;
    this.dx = 0;
    this.dy = 0;
    this.direction = 'idle'; // idle, up, down, left, right

    // Hitbox dimensions (adjust as needed)
    this.width = 16;
    this.height = 16;

    //animation properties
    this.framewidth = 16;
    this.frameheight = 16;
    this.currentFrame = 0;
    this.currentFrameY = 0;
    this.totalFrames = 4;
    this.frameDuration = 0.25; // seconds
    this.frameTime = 0;

    this.imageLoaded = false;
    this.image.onload = () => {
      this.imageLoaded = true;
    };
  }

  setImage(color) {
    console.log("Setting image for color:", color);
    switch (color) {
      case 'blue':
        return Character_animation_sheet_blue;
      case 'black':
        return Character_animation_sheet_black;
      case 'brown':
        return Character_animation_sheet_brown;
      case 'gray':
        return Character_animation_sheet_gray;
      case 'green':
        return Character_animation_sheet_green;
      case 'pink':
        return Character_animation_sheet_pink;
      case 'purple':
        return Character_animation_sheet_purple;
      case 'red':
        return Character_animation_sheet_red;
      case 'white':
        return Character_animation_sheet_white;
      case 'yellow':
        return Character_animation_sheet_yellow;
    }
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
      this.currentFrameY = 4;
      this.totalFrames = 1;
      this.currentFrame = 0;
    } else if (this.direction === 'right') {
      this.currentFrameY = 2;
      this.totalFrames = 4;
    } else if (this.direction === 'left') {
      this.currentFrameY = 3;
      this.totalFrames = 4;
    } else if (this.direction === 'up') {
      this.currentFrameY = 1;
      this.totalFrames = 4;
    } else if (this.direction === 'down') {
      this.currentFrameY = 0;
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
    // Force nearest-neighbor rendering and draw on integer pixels to avoid blurring
    try { ctx.imageSmoothingEnabled = false; } catch (e) {}
    const dx = Math.round(this.x * scaleup_constant);
    const dy = Math.round(this.y * scaleup_constant);
    const dw = Math.round(this.framewidth * scaleup_constant);
    const dh = Math.round(this.frameheight * scaleup_constant);
    ctx.drawImage(
      this.image,
      this.currentFrame * this.framewidth,
      this.currentFrameY * this.frameheight,
      this.framewidth,
      this.frameheight,
      dx,
      dy,
      dw, // width
      dh  // height
    );
    this.drawHealthBar(ctx, this.x * scaleup_constant + (16 * scaleup_constant) / 2, this.y * scaleup_constant, scaleup_constant);
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