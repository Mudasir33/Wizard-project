
import wizardImg from "../Assets/wizard.png";

import { useNavigate} from "react-router-dom";
import Guide from "./Guide";
import Session from "./sessions";
import { useState } from "react";

export default function menu() {
      const nav = useNavigate();

     const [showGuide, setGuide] = useState(false);
     const [showsession, setSessions] = useState(false);


    if(showGuide){
      return(
            <Guide guideclose={() => setGuide(false)}/>
         
        )
    }

    if(showsession){
      return(<Session closesession={()=> setSessions(false)}></Session>)
    }


  return (
    <div name="main">
      <div id="header">Wizard Duel</div>

      <div id="homeWizard">
        <img name="menu" src={wizardImg} alt="wizard" />
      </div>

      <div id="menuContainer">
        <div id="buttons">
          <div> <button name="menu"  onClick={() => nav("/sessions")}>Join Lobby</button> </div>
          <div><button name="menu"  >Spectate</button></div>
          <div><button name="menu"  >Customize</button></div>

          <div><button name="menu" onClick={()=> setGuide(true)} >Guide</button></div>
         
         
        </div>
      </div>

    </div>
  );
}

