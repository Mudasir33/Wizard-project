

export let camX =  0;
export let camY = 0;

function clamp(v,a,b){
                return Math.max(a, Math.min(b,v));
      }
export function updatecamera(player, canvas){
        const viewH = canvas.height;
        const viewW = canvas.width;
          
        camX = player.x - viewW/2;
        camY = player.y - viewH/2;
        camX = clamp(camX, 0, world_width-viewW)
        camY = clamp(camY, 0,world_height-viewH );
}

