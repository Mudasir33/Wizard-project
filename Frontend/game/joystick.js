


/*##########################################################################################
Joystick fungerar: 
för ny joystick: 

let x = new joystick(x, y, r) när man har impoterat in den som joystick i ett atnnat program
Tänk att yttre cirkeln är r*2


sedan i sin update måste man ha:
x.draw(context)
x.Eventen(x)


x= postion i x led i canvas
y = postion i y led i canvas
r = radius för själva joysticken inre
yttre cirkeln är r*2



*/



export class joystick{
    constructor(x,y,r){
        //intre
        this.x = x;
        this.y = y; 
        this.r = r; 

        //yttre
        this.X = x;  
        this.Y = y; 
        this.R = r*2 

        this.dx = 0;
        this.dy = 0;
    


    }
       
        draw(context) {




            
           // yttre cireln
           context.save();
           context.beginPath();
           context.arc(this.X,this.Y,this.R, 0, Math.PI *2);   
           context.lineWidth = 3; // bara linje runt färg
           context.stroke();        
            // context.fillStyle ="lightgray";  hel cirkel färg
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


        
        drawtext(context, joystick){  // visar vad x och y ligger i joysticken
                                        // x led: vänster:-1, centrum: 0, höger: 1
                                        // y led: top: -1, centrum: 0, nere: 1
            context.font ="20px Arial";
            context.fillText("x:" + joystick.dx.toFixed(4)+ "y:"+ joystick.dy.toFixed(4), joystick.X - joystick.R -20 , joystick.Y - joystick.R -20 ) ;
       
        }




        Eventen(analog){
        canvas.addEventListener('touchstart', e => {
        const rect = canvas.getBoundingClientRect();
        const px = e.touches[0].clientX -rect.left;
        const py = e.touches[0].clientY -rect.top;
        if (!toucharea(px, py, analog)) {      
       
                analog.dx = 0;
                analog.dy = 0;


              return;
        }
           
        analog.x = px;
        analog.y = py;
        })


      canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const px = e.touches[0].clientX - rect.left;
        const py = e.touches[0].clientY - rect.top;
        if (!toucharea(px, py, analog)) {
                analog.dx = 0;
                analog.dy = 0;
                analog.x = analog.X;
                analog.y = analog.Y;
              return;
        }
           
         


        analog.x = px;
        analog.y = py;
         
        let ax = analog.x - analog.X;
        let ay = analog.y - analog.Y;


        let mag = Math.sqrt(ax*ax + ay*ay);


        analog.dx = ax / mag;
        analog.dy = ay / mag;


        // Clamp to radius
        if (mag > analog.R) {
            analog.x = analog.X + analog.dx * analog.R;
            analog.y = analog.Y + analog.dy * analog.R;
        }
     
    }
        )


       
        // sluta röra oå sig går till bak in i centrum
        canvas.addEventListener('touchend', e=>{
            analog.x = analog.X;
            analog.y = analog.Y;
            analog.dx = 0;
            analog.dy = 0;
        }
        )


    }



   //######################################################################################
   // kollar så att inte man rör den utan för själva joystickes area annars så rör den sig över hela canvasen

   




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
       


    
