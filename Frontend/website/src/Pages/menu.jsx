import wizardImg from "../Assets/wizard.png";
import menuMusic from "../../../../Assets/Sound/song.mp3";

import { useNavigate } from "react-router-dom";
import Guide from "./Guide";
import Session from "./sessions";
import { useState, useEffect, useRef } from "react";

export default function menu() {
      const nav = useNavigate();

     const [showGuide, setGuide] = useState(false);
     const [showsession, setSessions] = useState(false);

     const audioRef = useRef(null);
     const [autoplayBlocked, setAutoplayBlocked] = useState(false);
     const [isPlaying, setIsPlaying] = useState(false);

     useEffect(() => {
       audioRef.current = new Audio(menuMusic);
       audioRef.current.loop = true;
       audioRef.current.volume = 0.6;
       audioRef.current.play().then(() => {
         setIsPlaying(true);
       }).catch((err) => {
         console.log("Autoplay prevented or audio error:", err);
         setAutoplayBlocked(true);
       });

       return () => {
         try { audioRef.current.pause(); audioRef.current.currentTime = 0; } catch (e) {}
       };
     }, []);


    if(showGuide){
      return(
            <Guide guideclose={() => setGuide(false)}/>
         
        )
    }

    if(showsession){
      return(<Session closesession={()=> setSessions(false)}></Session>)
    }


  return (
    <div name="main" content= "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
      <div id="header">Wizard Duel</div>

      <div id="homeWizard">
        <img name="menu" src={wizardImg} alt="wizard" />
      </div>

      <div id="menuContainer">
        <div id="buttons">
          <div> <button name="menu"  onClick={() => nav("/sessions")}>Join Lobby</button> </div>
          <div><button name="menu"  onClick={() => nav("/SpectateSession")}>Spectate</button></div>
          <div><button name="menu"  >Customize</button></div>
          <div><button name="menu" onClick={()=> setGuide(true)} >Guide</button></div>

          {isPlaying && (
            <div style={{ marginTop: 10 }}>
              <button name="menu" onClick={() => {
                try { audioRef.current.pause(); audioRef.current.currentTime = 0; } catch (e) {}
                setIsPlaying(false);
              }}>Stop Music</button>
            </div>
          )}
         
         
        </div>
      </div>

    </div>
  );
}

