import { useNavigate } from "react-router-dom"
import { useLocation } from "react-router-dom";
import { socket } from "../../../game/Socket";






export default function Game_death({placement, won}){
    const nav = useNavigate();
      const { state: roomkey } = useLocation(); 
      
    
function back(){
  socket.emit("delete_user", roomkey)
  socket.emit("restart_game",(roomkey))
    
  nav("/")
}
     
      console.log("deathroomkey: " ,roomkey)
      console.log("placement:", placement);
    

 


    return(

    <div className="death-overlay">


        <h1>{won ? "Victory!   " : "Dead   "}</h1>
        <h2>Place: {placement}</h2>


        <button onClick={back}>Back</button>
    
    
    
    </div>


    )




}