/*##########################################################################################
Joystick fungerar: 
för ny joystick: 


let x = new joystick(x, y, r)
Tänk att yttre cirkeln är r*2


sedan i sin update måste man ha:
x.draw(context)
x.Eventen(x)


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
        this.canvas = null;
        this.touchId = null;  // Track which touch/finger is controlling this joystick
    }

    attachEvents(canvasElement) {
        this.canvas = canvasElement;
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.eventsAttached) return;
        this.eventsAttached = true;
        
        if (!this.canvas) return;
        
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    handleTouchStart(e) {
        if (!e.touches || e.touches.length === 0) return;
        
        // Find touch that is within this joystick's area
        for (let touch of e.touches) {
            const rect = this.canvas.getBoundingClientRect();
            const px = touch.clientX - rect.left;
            const py = touch.clientY - rect.top;
            
            if (this.isTouchInArea(px, py)) {
                this.touchId = touch.identifier;
                this.isPressed = true;
                this.x = px;
                this.y = py;
                console.log("Joystick touch started at center", this.X, this.Y);
                break;
            }
        }
    }

    handleTouchMove(e) {
        if (!e.touches || e.touches.length === 0) return;
        if (this.touchId === null) return;  // Not active
        
        e.preventDefault();
        
        // Find the touch with our touchId
        let touch = null;
        for (let t of e.touches) {
            if (t.identifier === this.touchId) {
                touch = t;
                break;
            }
        }
        
        if (!touch) return;  // Our touch ended
        
        const rect = this.canvas.getBoundingClientRect();
        const px = touch.clientX - rect.left;
        const py = touch.clientY - rect.top;
        
        // Don't process if far outside joystick area, but allow movement beyond radius
        const dx_to_center = px - this.X;
        const dy_to_center = py - this.Y;
        const distance_to_center = Math.sqrt(dx_to_center * dx_to_center + dy_to_center * dy_to_center);
        
        // Allow movement up to 2x the radius
        if (distance_to_center > this.R * 2) {
            return;
        }

        this.isPressed = true;
        this.x = px;
        this.y = py;

        let ax = this.x - this.X;
        let ay = this.y - this.Y;
        let mag = Math.sqrt(ax * ax + ay * ay);

        this.dx = mag > 0 ? ax / mag : 0;
        this.dy = mag > 0 ? ay / mag : 0;

        // Clamp to radius
        if (mag > this.R) {
            this.x = this.X + this.dx * this.R;
            this.y = this.Y + this.dy * this.R;
        }
    }

    handleTouchEnd(e) {
        if (this.touchId === null) return;  // Not active
        
        // Check if our touchId ended
        let touchExists = false;
        for (let touch of e.touches) {
            if (touch.identifier === this.touchId) {
                touchExists = true;
                break;
            }
        }
        
        if (!touchExists) {
            console.log("Joystick touch ended at", this.X, this.Y);
            this.x = this.X;
            this.y = this.Y;
            this.dx = 0;
            this.dy = 0;
            this.isPressed = false;
            this.touchId = null;
        }
    }

    isTouchInArea(x, y) {
        let dx = x - this.X;
        let dy = y - this.Y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        return this.R >= distance;
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

}