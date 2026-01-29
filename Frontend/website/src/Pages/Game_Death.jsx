import { useNavigate } from "react-router-dom"
import { useLocation } from "react-router-dom";
import { socket } from "../../../game/Socket";
import { useEffect, useState } from "react";
import { Player } from "../../../game/Player";



export default function Game_death(){
    const nav = useNavigate();
    const [playercount , setPlayercount] = useState(0)
      const { state: roomkey } = useLocation(); 

    
     
      console.log("deathroomkey: " ,roomkey)
      if(playercount ==1){
        socket.on("winning player is:", socket.id)
        socket.emit("get_winnigplayer")
      }

    useEffect(() => {
    console.log("death: send player count")
      socket.emit("SPC", roomkey) // send me player count

      console.log("death: leaverom")
      socket.emit("delete_user", roomkey)

      socket.on("RPC",(playercount)=>{ //recive playercount
        console.log("death: recive playe count", playercount)
       setPlayercount( playercount +1 );
      })
    




    return () => {
      socket.off('RPC');
      socket.off('delete_user', (roomkey));
  
      
    };
  }, [])


    return(

    <div className="death-overlay">


        <h1>Dead</h1>
        <h2>Place: {playercount}</h2>


        <button onClick={()=> nav("/")}>Back</button>
    
    
    
    </div>


    )




}