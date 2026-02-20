import fireballExplosionGif from "../../Assets/Spells/fireball_explosion.gif";

// Explosion effect class using DOM img element for proper GIF animation
export class Explosion {
    constructor(x, y, duration = 2.4) {
        this.x = x;
        this.y = y;
        this.duration = duration;
        this.elapsed = 0;
        this.size = 200; // Display size in world units
        this.active = true;
        
        // Create DOM element for GIF animation
        this.element = document.createElement('img');
        this.element.src = fireballExplosionGif + '?t=' + Date.now();
        this.element.style.position = 'absolute';
        this.element.style.pointerEvents = 'none';
        this.element.style.zIndex = '1000';
        this.element.style.imageRendering = 'pixelated';
        document.body.appendChild(this.element);
    }

    update(deltaTime, canvas, playerX, playerY, scaleup_constant) {
        this.elapsed += deltaTime;
        if (this.elapsed >= this.duration) {
            this.active = false;
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            return;
        }

        // Convert world position to screen position
        if (canvas && this.element) {
            const canvasRect = canvas.getBoundingClientRect();
            const cameraOffsetX = canvas.width / 2;
            const cameraOffsetY = canvas.height / 2;
            
            // Calculate screen position relative to player (camera center)
            const screenX = cameraOffsetX + (this.x - playerX) * scaleup_constant;
            const screenY = cameraOffsetY + (this.y - playerY) * scaleup_constant;
            
            // Get actual pixel size on screen
            const displaySize = this.size;
            
            // Account for devicePixelRatio
            const scale = window.devicePixelRatio || 1;
            const cssX = (screenX / scale) - (displaySize / 2);
            const cssY = (screenY / scale) - (displaySize / 2);
            
            this.element.style.left = (canvasRect.left + cssX) + 'px';
            this.element.style.top = (canvasRect.top + cssY) + 'px';
            this.element.style.width = displaySize + 'px';
            this.element.style.height = displaySize + 'px';
        }
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// Manager class to handle multiple explosions
export class ExplosionManager {
    constructor() {
        this.explosions = [];
    }

    spawn(x, y, duration = 2.4) {
        this.explosions.push(new Explosion(x, y, duration));
    }

    update(deltaTime, canvas, playerX, playerY, scaleup_constant) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].update(deltaTime, canvas, playerX, playerY, scaleup_constant);
            if (!this.explosions[i].active) {
                this.explosions.splice(i, 1);
            }
        }
    }

    // draw() is no longer needed since we use DOM elements
    draw(ctx, scaleup_constant) {
        // Kept for compatibility but does nothing now
    }

    clear() {
        for (const exp of this.explosions) {
            exp.destroy();
        }
        this.explosions = [];
    }
}
