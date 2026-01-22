
import wizardImg from "../Assets/wizard.png";

import { useNavigate} from "react-router-dom";

export default function menu() {
      const nav = useNavigate();
  return (
    <div name="menu">
      <div id="header">Wizard Duel</div>

      <div id="homeWizard">
        <img name="menu" src={wizardImg} alt="wizard" />
      </div>

      <div id="menuContainer">
        <div id="buttons">
          <div> <button name="menu"  onClick={() => nav("/sessions")}>Join Lobby</button> </div>
          <div><button name="menu"  >Spectate</button></div>
          <div><button name="menu"  >Customize</button></div>
          <div><button name="menu" onClick={() => nav("/Guide")} >Guide</button></div>
        </div>
      </div>

      <canvas id="canvas"></canvas>
    </div>
  );
}

