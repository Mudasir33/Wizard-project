import bearTrapIcon from "../../Assets/Spells/bear_trap_icon.png";
import bearTrapStatic from "../../Assets/Spells/bear_trap_static.png";
import bearTrapTriggered from "../../Assets/Spells/bear_trap.gif";

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
        this.triggeredSprite = new Image();
        this.blobUrl = null;

        this.isActive = true;
        this.isTriggered = false;
        this.triggeredTime = 0;
        this.triggerAnimationDuration = 1500;
    }

    trigger() {
        if (!this.isActive) return;
        this.isTriggered = true;
        this.triggeredTime = Date.now();

        fetch(this.triggeredTextureUrl)
            .then(response => response.blob())
            .then(blob => {
                if (this.blobUrl) {
                    URL.revokeObjectURL(this.blobUrl);
                }
                this.blobUrl = URL.createObjectURL(blob);
                this.triggeredSprite.src = this.blobUrl;
            })
            .catch(err => {
                console.error("Failed to load trap GIF:", err);
                this.triggeredSprite.src = this.triggeredTextureUrl;
            });
    }

    update(deltaTime) {
        if (this.isTriggered) {
            if (Date.now() - this.triggeredTime > this.triggerAnimationDuration) {
                this.isActive = false;
                if (this.blobUrl) {
                    URL.revokeObjectURL(this.blobUrl);
                    this.blobUrl = null;
                }
            }
        }
    }

    draw(context, scaleup_constant) {
        if (!this.isActive) return;

        const drawX = this.x * scaleup_constant;
        const drawY = this.y * scaleup_constant;
        const size = this.size * scaleup_constant;

        const spriteToUse = (this.isTriggered && this.blobUrl) ? this.triggeredSprite : this.sprite;
        
        context.drawImage(
            spriteToUse,
            drawX - size / 2,
            drawY - size / 2,
            size,
            size
        );
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
        name: "Bear Trap",
        description: "Damages and immobilizes enemies who step on it"
    }
};