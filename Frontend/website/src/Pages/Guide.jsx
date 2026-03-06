import { useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";
//import section from "./section";
import beartrap from "../assets/beartrap.gif"
import movement from "../assets/Movement.gif"
import shoot from "../assets/Shooting.gif"
import pickup from "../assets/pickup.gif"
import fireball from "../assets/fireball.gif"
import boune from "../assets/Bounce.gif"
import haste from "../assets/haste.gif"
import spidernet from "../assets/spidernet.gif"
import wind from "../assets/wind.gif"
import zone from "../assets/zone.gif"
import health from "../assets/Health.gif"


//import flametrap from "../assets/flametrap.gif"

export default function Guide({guideclose}){
     const nav = useNavigate();


    
    



return(
<div  name = "main_guide">
 

<h1 name = "guide">Wizzard Royale Game Guide</h1>

<p name = "guide" >
Wizard Royale is a 2-10 player battle royale.<br />
Where your goal is to win by beginning with the last person standing.
</p>

        <h2 name = "guide">Movement: </h2>
        <img name="guide" src={movement} alt="movement"/>
        <li name = "guide"></li>


        <h2 name = "guide">Spells: </h2>
        <img name="guide" src={shoot} alt="movement"/>       
        <li name = "guide">The right joystick is used to shoot spells. 
            You shoot by aim the joystick in a direction and with the release of it 
            shoots with magic missile as the standard spell with infinite shoots</li>
        

        <h2 name = "guide">Pickup items:: </h2>
        <img name="guide" src={pickup} alt="movement"/>
        <li name = "guide"> Pickup items spawn randomly on the game field. To pick up the items you get close to the item icon and it automatically pops up around your shooting joystick to get used. 
Each pick is one use only.
</li>


        <h2 name = "guide">Fireball: </h2>
        <img name="guide" src={fireball} alt="movement"/>
        <li name = "guide">Magic missile is spell with more damage. As it hits the spell hits a wall creates an explosion</li>
        
        <h2 name = "guide">Bounce spell:: </h2>
        <img name="guide" src={boune} alt="movement"/>
        <li name = "guide">It is a spell that bounces on the walls and changes direction. </li>



        
        <h2 name = "guide">Pickup utility: </h2>
        <li name = "guide">Pickup ability is state changing ability for your player</li>
        
        <h2 name = "guide">Haste: </h2>
        <img name="guide" src={haste} alt="movement"/>
        <li name = "guide"> Haste is speed ability that changes the speed of a player for a certain amount of time</li>

         <h2 name = "guide">Health:  </h2>
        <img name="guide" src={health} alt="movement"/>
        <li name = "guide">Is an instance use ability that recover health for the player</li>




         <h2 name = "guide">Pickup traps: </h2>
      
        <li name = "guide">traps is put down ability</li>

         <h2 name = "guide"> Bear trap:</h2>
        <img name="guide" src={beartrap} alt="movement"/>
        <li name = "guide">bear trap is put down as an opposite player walks into it they get stuck for couple of seconds</li>

         <h2 name = "guide"> flame trap:</h2>
        <img name="guide" src={beartrap} alt="movement"/>
        <li name = "guide">It is a trap that randomly couple seconds puts up a flame attack that damages players on top of it the player takes damage.
        </li>




         <h2 name = "guide">Environmental effect: </h2>
        <li name = "guide">These affect the player's ability on the playing field.</li>


         <h2 name = "guide">Spider nets: </h2>
        <img name="guide" src={spidernet} alt="movement"/>
        <li name = "guide">spider nets spawn around on the game field where walking on to the speed of the player slows down.</li>

         <h2 name = "guide">Wind:</h2>
        <img name="guide" src={wind} alt="movement"/>
        <li name = "guide">The wind effect is on the whole playing field that wants the player to move with the direction of the wind.</li>


         <h2 name = "guide">Zone:  </h2>
        <img name="guide" src={zone} alt="movement"/>
        <li name = "guide">The zone gets smaller for the time that gets played. In the zone the player takes damage.</li>









<button onClick={guideclose} name="guide">BACK</button>
</div>

)
  

}