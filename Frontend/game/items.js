// Handles item rendering, pickup, and ability switching
import { socket } from "./Socket.js";
import { spell_list } from "./spells.js";
import { utility_list } from "./utility.js";
import { user } from "./User.js";

const items = [];
let abilities = [];
let selectedAbility = 0;

// Listen for item spawns from server
socket.on("spawnItems", (serverItems) => {
    items.length = 0;
    for (const item of serverItems) items.push(item);
});

// Remove item when picked up
socket.on("removeItem", (itemId) => {
    const idx = items.findIndex(i => i.id === itemId);
    if (idx !== -1) items.splice(idx, 1);
});

// Gain ability
socket.on("abilityGained", (type) => {
    abilities.push(type);
    // Optionally show UI feedback
});

export function drawItems(ctx, scale) {
    for (const item of items) {
        // For now, only fireball
        if (item.type === "fireball") {
            // Use fireball sprite from spell_list
            const img = new window.Image();
            img.src = spell_list.fireball.texture;
            ctx.drawImage(img, item.x * scale, item.y * scale, 32, 32);
        }
        if(item.type === "haste"){
            const img = new window.Image()
            img.src = utility_list.haste.texture
             ctx.drawImage(img, item.x * scale, item.y * scale, 32, 32);
        }
    }
}

export function checkItemPickup(player) {
    for (const item of items) {
        if (
            player.x < item.x + 20 &&
            player.x + 11 > item.x &&
            player.y < item.y + 20 &&
            player.y + 15 > item.y
        ) {
            socket.emit("pickupItem", { room: player.room, itemId: item.id });
            break;
        }
    }
}

export function getAbilities() {
    return abilities;
}

export function getSelectedAbility() {
    return abilities[selectedAbility] || null;
}

export function switchAbility(idx) {
    if (idx >= 0 && idx < abilities.length) {
        selectedAbility = idx;
    }
}
