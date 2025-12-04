




export function resize(){
    let mobliesize_width = window.innerWidth;
    let mobliesize_height = window.innerHeight;

    let scale = Math.min(
         mobliesize_height/game_height,
          mobliesize_width /game_width
    );
    canvas.width = (game_width * scale) ;
    canvas.height = (game_height * scale) ;

    canvas.scale = scale;
    console.log(canvas.scale)
    console.log("canvas_width:",canvas.width )
    console.log("canvas_height", canvas.height) // remakes it so that is be put everywhere where the scale. 
              // so for x cordinates takes x coridnates 
}