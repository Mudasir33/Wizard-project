class enviormentEffects {
    constructor(x, y, effect) {
        this.x = x; // Position of the effect in the game world
        this.y = y; // Position of the effect in the game world
        this.effect = effect; // Type of effect (e.g., "wind", "spiderweb", "poison")

    }

    applyeffect(players, effectType) {

        if (effectType === "wind") {
            // Apply wind effect logic (e.g., push players in a certain direction)
            for (const id in players) {
                if (this.x > 0) {
                    players[id].x += 0.1 * Math.random(); // Example: Push player to the left by 10 units
                } else if (this.x < 0) {
                    players[id].x -= 0.1 *Math.random();
                }
                if (this.y > 0) {
                    players[id].y += 0.3* Math.random(); // Example: Push player to the left by 10 units
                } else if (this.y < 0) {
                    players[id].y -= 0.3* Math.random();
                }
            }
        }
        else if (effectType === "spiderweb") {
            // Apply spiderweb effect logic
        }
        else if (effectType === "poison") {
            // Apply poison effect logic
        }
    }


}
module.exports = { enviormentEffects };