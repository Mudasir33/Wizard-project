
import { useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";

import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
const socket = io("http://localhost:3000");
import user from "../User";




function ready_state(player){
    
    if (player.ready == false){
       return(<h3 >NOT Ready</h3>)
    }

    if(player.ready == true){
         return(<h3>Ready</h3>)
    }
}

function pressed_ready(roomkey){
      const player = user.getplayer();
      const newReady = !player.ready;
      
      user.setready(newReady);

      socket.emit("ready", roomkey, player)
  
}

export default function Room(){
    const location = useLocation();
    const roomkey = location.state;
    
    const[roomData, setRoomdata] = useState({players: []});
    //console.log("roomkey", roomkey)

 
      useEffect(()=> {
        socket.emit("update_sessions")
           socket.on("sessions", (data) =>{
                   
                   console.log("room recaived")
                   setRoomdata(data[roomkey]);
                    const sessions = data;

               });
         
       
          
       }, [])
   

    
    



return(
<div>
    <h2>{roomData.id}</h2>
    


    <table>
        <thead>
        <tr>
            <th>Username</th>
            <th>Color</th>
            <th>Ready</th>
        </tr>
        </thead>


        <tbody>
          
            {roomData.players.map((player, i) =>(
                <tr key ={i}>
                <td>{player.username}</td>
                <td>{player.color}</td>
                <td>
                    {ready_state(player)}
                </td>
                </tr>
            ))}

        </tbody>
    </table>
    <button onClick={() => pressed_ready(roomkey)}> Ready</button>
</div>

)

}