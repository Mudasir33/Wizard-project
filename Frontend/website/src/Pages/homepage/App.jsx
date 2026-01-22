import "./App.css";
import wizardImg from "../Assets/wizard.png";


function App() {
  return (
    <div className="app">
      <div id="header">Wizard Duel</div>

      <div id="homeWizard">
        <img src={wizardImg} alt="wizard" />
      </div>

      <div id="menuContainer">
        <div id="buttons">
          <div><button>Join Lobby</button></div>
          <div><button>Spectate</button></div>
          <div><button>Customize</button></div>
          <div><button>Guide</button></div>
        </div>
      </div>

      <canvas id="canvas"></canvas>
    </div>
  );
}

export default App;