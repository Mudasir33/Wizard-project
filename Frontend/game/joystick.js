/*##########################################################################################
Joystick fungerar: 
för ny joystick: 

let x = new Joystick(x, y, r)
Tänk att yttre cirkeln är r*2

sedan i sin update måste man ha:
x.draw(context)
x.attachEvents(canvas)

x= postion i x led i canvas
y = postion i y led i canvas
r = radius för själva joysticken inre
yttre cirkeln är R = r*2
*/

export class Joystick{
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
        context.strokeStyle = "rgba(200, 200, 200, 0.8)";
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
    drawtext(context, joystick){  // visar vad x och y ligger i joysticken
                                  // x led: vänster:-1, centrum: 0, höger: 1
                                  // y led: top: -1, centrum: 0, nere: 1
        context.font ="20px Arial";
        context.fillText("x:" + joystick.dx.toFixed(4)+ "y:"+ joystick.dy.toFixed(4), joystick.X - joystick.R -20 , joystick.Y - joystick.R -20 ) ;
    }
    attachEvents(canvas){
        canvas.addEventListener('touchstart', e => {
        const rect = canvas.getBoundingClientRect();
        const px = e.touches[0].clientX -rect.left;
        const py = e.touches[0].clientY -rect.top;
        this.isPressed = true;
        this.x = px;
        this.y = py;
        })
    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const px = e.touches[0].clientX - rect.left;
        const py = e.touches[0].clientY - rect.top;
        // Accept touch input from anywhere on canvas
        this.isPressed = true;
        this.x = px;
        this.y = py;
         
        let ax = this.x - this.X;
        let ay = this.y - this.Y;

        let mag = Math.sqrt(ax*ax + ay*ay);

        // Calculate unit direction
        if (mag > 0) {
            this.dx = ax / mag;
            this.dy = ay / mag;
        } else {
            this.dx = 0;
            this.dy = 0;
        }

        // Clamp to radius for visual representation
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
    let dx = x - joystick.X;
    let dy = y - joystick.Y;
    let distance = Math.sqrt(dx*dx + dy*dy);
    
    if(joystick.R >= distance){
        return true;
    }
    else{
        return false;
    }
}
