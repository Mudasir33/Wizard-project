class enviormentEffects {
    static SPIDER_WEB_RADIUS = 56;
    static SPIDER_WEB_SLOW_MULTIPLIER = 0.5;

    constructor(x, y, effect, radius = 0) {
        this.x = x; // Position of the effect in the game world
        this.y = y; // Position of the effect in the game world
        this.effect = effect; // Type of effect (e.g., "wind", "spiderweb", "poison")
        this.radius = radius;

    }

    static getRandomWorldPosition(mapwidth, mapheight, tileSize = 16) {
        if (!mapheight || !mapwidth) return { x: tileSize * 5, y: tileSize * 5 };
        const tileX = Math.floor(Math.random() * mapwidth);
        const tileY = Math.floor(Math.random() * mapheight);
        return {
            x: tileX * tileSize + tileSize / 2,
            y: tileY * tileSize + tileSize / 2
        };
    }

    static upsertSpiderWeb(activeeffects, mapwidth, mapheight, tileSize = 16, effectId = 1) {
        const pos = enviormentEffects.getRandomWorldPosition(mapwidth, mapheight, tileSize);
        if (!activeeffects[effectId]) {
            activeeffects[effectId] = new enviormentEffects(
                pos.x,
                pos.y,
                "spiderweb",
                enviormentEffects.SPIDER_WEB_RADIUS
            );
            return;
        }
        activeeffects[effectId].x = pos.x;
        activeeffects[effectId].y = pos.y;
        activeeffects[effectId].radius = enviormentEffects.SPIDER_WEB_RADIUS;
    }

    
    applyeffect(players, effectType, collisionContext, collisionFn) {

        if (effectType === "wind") {
            // Apply wind effect logic (e.g., push players in a certain direction)
            for (const id in players) {
                const player = players[id];
                if (!player || player.alive === false) continue;

                if (player.immobilizedUntil && Date.now() < player.immobilizedUntil) continue;

                let windX = 0;
                let windY = 0;

                if (this.x > 0) {
                    windX = 0.1 * Math.random();
                } else if (this.x < 0) {
                    windX = -0.1 * Math.random();
                }

                if (this.y > 0) {
                    windY = 0.3 * Math.random();
                } else if (this.y < 0) {
                    windY = -0.3 * Math.random();
                }

                const oldX = player.x;
                player.x += windX;
                if (collisionFn && collisionFn(collisionContext, player)) {
                    player.x = oldX;
                }

                const oldY = player.y;
                player.y += windY;
                if (collisionFn && collisionFn(collisionContext, player)) {
                    player.y = oldY;
                }
            }
        }
        else if (effectType === "spiderweb") {
            for (const id in players) {
                const player = players[id];
                if (!player || player.alive === false) continue;

                const playerCenterX = player.x + 8;
                const playerCenterY = player.y + 8;
                const radius = this.radius || enviormentEffects.SPIDER_WEB_RADIUS;
                const distX = playerCenterX - this.x;
                const distY = playerCenterY - this.y;

                if (distX * distX + distY * distY <= radius * radius) {
                    const currentMultiplier = player.effectSpeedMultiplier ?? 1;
                    player.effectSpeedMultiplier = Math.min(
                        currentMultiplier,
                        enviormentEffects.SPIDER_WEB_SLOW_MULTIPLIER
                    );
                }
            }
        }
        else if (effectType === "poison") {
            // Apply poison effect logic
        }
    }


}
module.exports = { enviormentEffects };