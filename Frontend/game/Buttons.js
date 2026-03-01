export class Button{
    constructor(x, y, r, text, name, onclick){
        this.name = name;
        this.x = x; 
        this.y = y; 
        this.r = r; 
        this.text = text;
        this.name = name;
        this.onclick = onclick;
        this.isPressed = false;
        this.canvas = null;
        this.touchId = null;
        this.holdStartTime = 0;
        this.holdThreshold = 300;
    }

    isHolding() {
        if (!this.isPressed) return false;
        return (Date.now() - this.holdStartTime) >= this.holdThreshold;
    }

    draw(context) {
           // yttre cireln
           context.save();
           context.beginPath();
           context.arc(this.x,this.y,this.r, 0, Math.PI *2);   
           context.lineWidth = 3;
           context.stroke();        
           if (this.isPressed) {
               context.fillStyle = "yellow";
               context.fill();
           }
            context.font = "15px Arial";
            context.fillStyle = "black";
           context.fillText(this.text, this.x - 5, this.y+5)
           context.restore();
           
    }

    setCanvas(canvasElement) {
        this.canvas = canvasElement;
    }

    Eventen(){
        if (!this.canvas || this.eventsAttached) return;
        this.eventsAttached = true;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!e.touches || e.touches.length === 0) return;
            // Find touch that is within this button's area
            for (let touch of e.touches) {
                const rect = this.canvas.getBoundingClientRect();
                const px = touch.clientX - rect.left;
                const py = touch.clientY - rect.top;
                if (this.isTouchInArea(px, py)) {
                    this.touchId = touch.identifier;
                    this.isPressed = true;
                    this.holdStartTime = Date.now();
                    // Don't call onclick here - wait for touchend to distinguish tap vs hold
                    console.log("button: ", this.name, "pressed");
                    break;
                }
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            // Check if our touchId ended
            let touchExists = false;
            for (let touch of e.touches) {
                if (touch.identifier === this.touchId) {
                    touchExists = true;
                    break;
                }
            }
            if (!touchExists && this.touchId !== null) {
                const holdDuration = Date.now() - this.holdStartTime;
                if (holdDuration < this.holdThreshold && this.onclick) {
                    this.onclick();
                    console.log("button: ", this.name, "activated (quick tap)");
                }
                this.isPressed = false;
                this.touchId = null;
            }
        }, { passive: false });
    }

    isTouchInArea(x, y) {
        let dx = x - this.x;
        let dy = y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        return this.r * 2 >= distance;
    }
}