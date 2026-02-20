// This file is for sharing logic between gameserver.js and workerRoom.js

function wallCollison(object, player) {
    if (!object || !object.objectLayers || !object.objectLayers[0] || !object.objectLayers[0].obj) return false;
    const obj = object.objectLayers[0].obj;
    const player_x = player.x;
    const player_y = player.y;
    const player_width = 16;
    const player_height = 16;
    for (let j = 0; j < obj.objects.length; j++) {
        const wallX = obj.objects[j].x;

        const wallY = obj.objects[j].y;
        const wallWidth = obj.objects[j].width;
        const wallHeight = obj.objects[j].height;

        if (
            player_x < wallX + wallWidth &&
            player_x + player_width > wallX &&
            player_y < wallY + wallHeight &&
            player_y + player_height > wallY
        ) {
            return true;
        }
    }

    return false;
}

function ProjectilePlayerCollision(projectile, player) {
    const projectile_x = projectile.x;
    const projectile_y = projectile.y;
    const projectile_size = 5;
    const player_x = player.x;
    const player_y = player.y;
    const player_width = 16;
    const player_height = 16;
    if (
        projectile_x < player_x + player_width &&
        projectile_x + projectile_size > player_x &&
        projectile_y < player_y + player_height &&
        projectile_y + projectile_size > player_y
    ) {
        return true;
    }
    return false;
}

module.exports = {
    wallCollison,
    ProjectilePlayerCollision
};
