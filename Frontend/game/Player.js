export class Player{
    constructor(x, y) {
        this.username = "";
        this.color = "";
        this.ready = false;

        this.x = x;
        this.y = y;
        this.health = 100;
        this.alive = true;
        this.image = new Image();
        this.image.src = 'PixelCharacter.png';
        this.speed = 100;
    }
    draw(){
        canvas.drawImage(this.image,this.x, this.y);
    }
}
