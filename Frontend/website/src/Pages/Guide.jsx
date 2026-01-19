import { useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";
//import section from "./section";


export default function Guide(){
     const nav = useNavigate();
    
   

    
    



return(
<main style={ {maxWidth: "25rem", margin:"auto"
}}>

<h1>Wizzard Royale Game Guide</h1>
<p>
Wizard Royale is a 2-10 player battle royale.<br />
Where your goal is to win by beginning with the last person standing.
</p>
<div>
        <h2>Movement: </h2>
        <h3>"gif should be here"</h3>
        <li>The left Joystick is for movement of your character.</li>
 </div>

<div >
        <h2>Abilities: </h2>
        <h3> Abilities gif</h3>
        <li>Use the right joystick to shoot</li>
        <li> Aiming the shooting joystick the way you want to shoot and with relase of the you stick it shoots</li>


        <h3> 2 kind of Abilites:</h3>
        <h3>Normal Ablility</h3>
        <li>The normal/standrd ability</li>

        <h3>Special abilites</h3>
        <li>need to have an item so you could use that ability</li>
        <li>store max 3 special attacks for each one.</li>
        <h3>How Specal abilites works:</h3>
        <h3>gif example</h3>
        <p>1. pick up special ability item <br />
        2. press the dedicated special ability item<br />
            3. shoot with the shooting joystick <br />
        4. after shooting the ability tune back to the normal abilities</p>





 </div>

<div >

        <h2>Items: </h2>
        <p>item work by picking up certain items that get stored in the left most button. And can be used when it is necessary.
if you already have an item, then you need to use it before you can pick  the other one up.
there are different kind of items:
</p>
    <h3>Health</h3>
        <h3> “picture of health</h3>
    <li> Restores X amount of health to yourself.   </li>
 
    <h3>Speed</h3>
        <h3> “picture of speed</h3>
    <li> make it so that you move x percent faster for y seconds:</li>

    <h3>traps</h3>
    <h3> “picture of trap”</h3>
    <li>A realse item do X damage and make opponents stay stuck for y amount of seconds.</li>
     <li>do X damage and make opponents stay stuck for y amount of seconds
</li>


</div>


<button onClick={() => nav("/")} >BACK</button>
</main>

)
  

}