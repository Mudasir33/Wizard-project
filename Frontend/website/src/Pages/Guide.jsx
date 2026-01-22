import { useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";
//import section from "./section";
 import movegif from '../assets/move.gif';
 import normalgif from '../assets/shooting_normal_temp.gif';
 import specialgif from '../assets/speclial_temp.gif';

export default function Guide(){
     const nav = useNavigate();
    
   

    
    



return(
<div  name = "main_guide">
 

<h1 name = "guide">Wizzard Royale Game Guide</h1>

<p name = "guide" >
Wizard Royale is a 2-10 player battle royale.<br />
Where your goal is to win by beginning with the last person standing.
</p>

        <h2 name = "guide">Movement: </h2>
        <img name="guide" src={movegif} alt="movement"/>
        <li name = "guide">The left Joystick is for movement of your character.</li>



        <h2 name = "guide">Abilities: </h2>
        <li name = "guide">Use the right joystick to shoot</li>
        <li name = "guide"> Aiming the shooting joystick the way you want to shoot and with relase of the you stick it shoots</li>


        <h2 name = "guide" > 2 kind of Abilites:</h2>
         <img name="guide" src={normalgif} alt="normal attack"/>
        <li name = "guide">Normal/standard ability</li>

        <h3 name = "guide">Special abilites</h3>
        <li name = "guide">need to have an item so you could use that ability</li>
        <li name = "guide">store max 3 special attacks for each one.</li>
        <h3 name = "guide">How Specal abilites works:</h3>
       <img name="guide" src={specialgif} alt="special gifvement"/>
        <p name = "guide" >1. pick up special ability item <br />
        2. press the dedicated special ability item<br />
            3. shoot with the shooting joystick <br />
        4. after shooting the ability tune back to the normal abilities</p>








        <h2 name = "guide">Items: </h2>
        <p name = "guide">item work by picking up certain items that get stored in the left most button. And can be used when it is necessary.
if you already have an item, then you need to use it before you can pick  the other one up.
there are different kind of items:
</p>
    <h3 name = "guide">Health</h3>
        <h3 name = "guide"> “picture of health</h3>
    <li name = "guide"> Restores X amount of health to yourself.   </li>
 
    <h3 name = "guide" >Speed</h3>
        <h3 name = "guide"> “picture of speed</h3>
    <li name = "guide" > make it so that you move x percent faster for y seconds:</li>

    <h3 name = "guide">traps</h3>
    <h3 name = "guide" > “picture of trap”</h3>
    <li name = "guide">A realse item do X damage and make opponents stay stuck for y amount of seconds.</li>
     <li name = "guide">do X damage and make opponents stay stuck for y amount of seconds
</li>





<button onClick={() => nav("/")} name="guide">BACK</button>
</div>

)
  

}