import bearTrapIcon from "../../Assets/Spells/bear_trap_icon.png";
import bearTrapStatic from "../../Assets/Spells/bear_trap_static.png";
import bearTrapTriggered from "../../Assets/Spells/bear_trap.gif";
import fireTrapIcon from "../../Assets/Spells/fire_trap_icon.png";
import fireTrapStatic from "../../Assets/Spells/fire_trap_static.png";
import fireTrapTriggered from "../../Assets/Spells/fire_trap.gif";

export class Trap {
    constructor(x, y, type, id, ownerId) {
        this.id = id;
        this.ownerId = ownerId;
        this.x = x;
        this.y = y;

        this.size = type.size;
        this.damage = type.damage || 0;
        this.immobilizeDuration = type.immobilizeDuration || 0;

        this.sprite = new Image();
        this.sprite.src = type.texture;

        this.triggeredTextureUrl = type.triggeredTexture;
        this.gifElement = null; // DOM element for animated GIF

        this.isActive = true;
        this.isTriggered = false;
        this.triggeredTime = 0;
        this.triggerAnimationDuration = type.triggerAnimationDuration || 1500;
    }

    trigger() {
        if (!this.isActive) return;
        this.isTriggered = true;
        this.triggeredTime = Date.now();

        // Create DOM img element for GIF animation (canvas can't animate GIFs)
        this.gifElement = document.createElement('img');
        this.gifElement.src = this.triggeredTextureUrl;
        this.gifElement.style.position = 'absolute';
        this.gifElement.style.pointerEvents = 'none';
        this.gifElement.style.imageRendering = 'pixelated';
        this.gifElement.style.zIndex = '10';
        document.body.appendChild(this.gifElement);
    }

    update(deltaTime) {
        if (this.isTriggered) {
            if (Date.now() - this.triggeredTime > this.triggerAnimationDuration) {
                this.isActive = false;
                // Clean up DOM element
                if (this.gifElement) {
                    this.gifElement.remove();
                    this.gifElement = null;
                }
            }
        }
    }

    // Call this to update GIF position based on camera
    updateGifPosition(cameraOffsetX, cameraOffsetY, scaleup_constant, deviceScale = 1) {
        if (!this.gifElement || !this.isTriggered) return;
        
        const screenX = this.x * scaleup_constant + cameraOffsetX;
        const screenY = this.y * scaleup_constant + cameraOffsetY;
        const size = this.size * scaleup_constant;
        
        // Divide by deviceScale since canvas is scaled but CSS coordinates are not
        this.gifElement.style.left = ((screenX - size / 2) / deviceScale) + 'px';
        this.gifElement.style.top = ((screenY - size / 2) / deviceScale) + 'px';
        this.gifElement.style.width = (size / deviceScale) + 'px';
        this.gifElement.style.height = (size / deviceScale) + 'px';
    }

    draw(context, scaleup_constant) {
        if (!this.isActive) return;

        // Only draw static sprite on canvas when NOT triggered
        // When triggered, the GIF is shown via DOM element
        if (!this.isTriggered) {
            const drawX = this.x * scaleup_constant;
            const drawY = this.y * scaleup_constant;
            const size = this.size * scaleup_constant;

            if (this.sprite.complete && this.sprite.naturalWidth > 0) {
                context.drawImage(
                    this.sprite,
                    drawX - size / 2,
                    drawY - size / 2,
                    size,
                    size
                );
            }
        }
    }
    
    // Clean up when trap is removed
    destroy() {
        if (this.gifElement) {
            this.gifElement.remove();
            this.gifElement = null;
        }
    }
}

export const trap_list = {
    bear_trap: {
        texture: bearTrapStatic,
        triggeredTexture: bearTrapTriggered,
        pickupTexture: bearTrapIcon,
        size: 16,
        damage: 20,
        immobilizeDuration: 3000,
        triggerAnimationDuration: 1500,
        name: "Bear Trap",
        description: "Damages and immobilizes enemies who step on it"
    },
    fire_trap: {
        texture: fireTrapStatic,
        triggeredTexture: fireTrapTriggered,
        pickupTexture: fireTrapIcon,
        size: 32,
        damage: 5,
        immobilizeDuration: 0,
        triggerAnimationDuration: 4500,
        name: "Fire Trap",
        description: "Burns enemies standing on it and for 3s after"
    }
};