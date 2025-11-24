

const tmx = require('tmx-parser');

function loadTMX(){
    return  new Promise((resolve, reject) => {
        tmx.parseFile("./Assets/maps/map1.tmx", function(err, map) {
        if (err) return reject(err); 
        resolve(map);  
        });
    });
}

async function mapCreation(){
    const map = await  loadTMX();
    console.log("Map loaded!");
    console.log("Map size:", map.width, map.height);
    console.log("Tile size:", map.tileWidth, map.tileHeight);
    //console.log("first gid:", map.layers[1].tiles);
    console.log ("total layer", map.layers.length)
    console.log("first gid:", map.tileSets[1].firstGid);
    console.log("tileset image:", map.tileSets[0].image.source);
  
    
    map.layers.forEach((layer, i) => {
    //console.log(i, layer.type, layer.name);
    });
    
    const width = map.width;    // 50
    const height = map.height;  // 100
    const grid = [];  
    for (let y = 0; y<height;y++){
        grid[y]=[];
        
       
        for (let x =0 ; x < width; x++){
            grid[y][x]= map.layers[0].tiles[y * width + x];
        }
        
    }
    
    console.log(grid);
     return { grid };
}




module.exports= mapCreation;
