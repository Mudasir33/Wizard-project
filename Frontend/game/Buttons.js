

/*button exempel:
//const b1 = 
          new button(
          (game_width-225)*canvas.scale,        (x)
          (game_height-425) *canvas.scale,      (y)
          50*canvas.scale                       (r)
          , "1",                                (text)
          "test",                               (name)
          ()=> changespell(1)  );               (onclick funktion)


          */
export class button{
    constructor(x, y, r, text, name, onclick){
        this.name = name;
        this.x = x; 
        this.y = y; 
        this.r = r; 
        this.text = text;
        this.name = name;
        this.onclick = onclick;
        this.isPressed = false;
    }

    draw(context) {
           // yttre cireln
           context.save();
           context.beginPath();
           context.arc(this.x,this.y,this.r, 0, Math.PI *2);   
           context.lineWidth = 3;
           context.stroke();        
            // context.fillStyle ="lightgray";
            //context.fill();
            context.font=("15px arial")
           context.fillText(this.text, this.x - 5, this.y+5)
           context.restore();
           
    }





     Eventen(){
        canvas.addEventListener('touchstart', e => {
        const rect = canvas.getBoundingClientRect();
        const px = e.touches[0].clientX -rect.left;
        const py = e.touches[0].clientY -rect.top;
       
        if (!toucharea(px, py, this)) {      
              return;
        }
        this.isPressed = true;
        this.onclick();

         console.log("button: ", this.name, "pressed")
    
    });
     }

}







function toucharea(x,y, button){ 
        let dx = x - button.x;
        let dy = y - button.y;
        let distance = Math.sqrt(dx*dx + dy*dy);


        if(button.r >= distance){
            return true;
        }
        else{
            return false;
        }

    }