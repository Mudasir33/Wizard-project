
const tilesetImage = new Image();
tilesetImage.src = "/walls_floor.png";


const gameCanvas = document.getElementById("canvas");
gameCanvas.width = window.innerWidth;
gameCanvas.height = window.innerHeight;
const canvas = gameCanvas.getContext("2d");

let map = null;  
let grid = null; 


const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log(`you connected with id: ${socket.id}`);
});

socket.on("map", (loadmap) => {


  map = loadmap;
  grid = loadmap.grid; 
  requestAnimationFrame(loop);
});


function loop() {

    

  canvas.fillRect(0, 0, canvas.width, canvas.height);

  const height = grid.length;
  const width  = grid[0].length;
  const tileWH = 16;
  const tilesPerRow = ( tilesetImage.width/ 16);

  console.log("grid test sx:",  (36 % tilesPerRow)*16); //y
  console.log("grid test sy:",  Math.floor(36/tilesPerRow)*16);
  console.log("tiledRow: ",tilesetImage.width/16 );
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const {id} = grid[y][x];
      //console.log("id test;", id);  tar ut rätt id (måste va placeringen)
      const sx=  (id % tilesPerRow)*16;
      const sy = Math.floor(id/tilesPerRow)*16;
      


      
    //drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      canvas.drawImage(
        tilesetImage,
        sx,
        sy,
        tileWH,tileWH,
        x*tileWH,
        y*tileWH,
        tileWH,tileWH

      );
    }
  }

  // tiny red debug square on top (optional, you can remove this)
  canvas.fillStyle = "#ff0000";
  canvas.fillRect(0, 0, 10, 10);

 
}

