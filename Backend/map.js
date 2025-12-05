

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
    console.log("first gid:", map.tileSets[0].firstGid);
    console.log("tileset image:", map.tileSets[3].image.source);
  
    
    map.layers.forEach((layer, i) => {
    console.log(i, layer.type, layer.name);
    });


    const width = map.width;    // 50
    const height = map.height;  // 100
    const tileLayers = map.layers.filter(l => l.type === "tile");
    const ObjectLayers = map.layers.filter(l => l.type === "object");
    const objectData =[]
    const layerData = [];

 


    //loop layers 
    for (let i = 0; i < tileLayers.length; i++) {
        const layer = tileLayers[i];
        const grid = []; 
        for (let y = 0; y<height;y++){
            grid[y]=[];
            
    
            for (let x =0 ; x < width; x++){
                const tile = layer.tileAt(x, y);
                grid[y][x] = tile ? tile : null;
            }   
        } 
        layerData.push({
            name: layer.name,
            grid: grid
        });       
    }

    
    for (let i = 0; i <  ObjectLayers.length; i++) {
        const layer = ObjectLayers[i];      
        objectData.push({
            name:ObjectLayers[i].name,
            obj: ObjectLayers[i]
        }); 
    }
    console.log("obj :",objectData[0].name);
    return {layers: layerData, objectLayers: objectData }
    //console.log(layerData[1]);
    
    
     
}




module.exports= mapCreation;
