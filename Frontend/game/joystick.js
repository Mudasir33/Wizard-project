

/*###################################################
Joystick exampel:
        const movment = new joystick(
        200*canvas.scale,                   (x)
        (game_height-200)*canvas.scale,     (y)
        75*canvas.scale);                   (r)


*/
export class joystick{
    constructor(x,y,r){
        //intre
        this.x = x; // intre cirkeln, kordinater o storlek
        this.y = y; 
        this.r = r; 

        //yttre
        this.X = x;   //yttre cirkeln, korinater o storlek
        this.Y = y; 
        this.R = r*2 

        this.dx = 0;
        this.dy = 0;
        this.isPressed = false;
    


    }
       
        draw(context) {
            
           // yttre cireln
           context.save();
           context.beginPath();
           context.arc(this.X,this.Y,this.R, 0, Math.PI *2);   
           context.lineWidth = 3;
           context.stroke();        
            // context.fillStyle ="lightgray";
            //context.fill();
           context.restore();

           //ritar inre cirkeln
           context.save();
           context.beginPath();
           context.arc(this.x,this.y,this.r, 0, Math.PI *2);
           context.fillStyle ="red";
           context.fill();
           context.restore();



        }


        drawtext(context){  // visar vad x och y ligger i joysticken
                                        // x led: vänster:-1, centrum: 0, höger: 1
                                        // y led: top: -1, centrum: 0, nere: 1
            context.font ="20px Arial";
            context.fillText("x:" + this.dx.toFixed(4)+ "y:"+ this.dy.toFixed(4), this.X - this.R -20 , this.Y - this.R -20 ) ;
       
        }


        isPressed(){

        }


        Eventen(){
        canvas.addEventListener('touchstart', e => {
        const rect = canvas.getBoundingClientRect();
        const px = e.touches[0].clientX -rect.left;
        const py = e.touches[0].clientY -rect.top;
        if (!toucharea(px, py, this)) {      
       
                this.dx = 0;
                this.dy = 0;


              return;
        }
           
        this.x = px;
        this.y = py;
        this.isPressed = true;
        })


      canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const px = e.touches[0].clientX - rect.left;
        const py = e.touches[0].clientY - rect.top;
        if (!toucharea(px, py, this)) {
                this.dx = 0;
                this.dy = 0;
                this.x = this.X;
                this.y = this.Y;

              return;
        }
           
        this.isPressed= true;
         
        // så inre cirkeln inte går utanför den yttre cirkeln

        this.x = px;
        this.y = py;
         
        let ax = this.x - this.X;
        let ay = this.y - this.Y;


        let mag = Math.sqrt(ax*ax + ay*ay);


        this.dx = ax / mag;
        this.dy = ay / mag;


        // Clamp to radius
        if (mag > this.R) {
            this.x = this.X + this.dx * this.R;
            this.y = this.Y + this.dy * this.R;
        }
     
    }
        )


       
        //sluta rör gå till grundpostion
        canvas.addEventListener('touchend', e=>{
            this.x = this.X;
            this.y = this.Y;
            this.dx = 0;
            this.dy = 0;
            this.isPressed = false;
        }
        )


    }




}


 function toucharea(x,y, joystick){ 
        let dx = x - joystick.x;
        let dy = y - joystick.y;
        let distance = Math.sqrt(dx*dx + dy*dy);


        if(joystick.R >= distance){
            return true;
        }
        else{
            return false;
        }

    }
       




 