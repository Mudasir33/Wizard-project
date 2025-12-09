
import { useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";

import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { socket } from "../../../game/Socket";
import user from "../../../game/User";


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



function leaveroom(roomkey){
    console.log("leave room")
    const player = user.getplayer()
    socket.emit("room_leave", roomkey, player)

}














export default function Room(){
    
    const nav = useNavigate();
    const location = useLocation();
    const roomkey = location.state;
    const[roomData, setRoomdata] = useState({players: []});
    const[sessions, setSessions] = useState({});
    //console.log("roomkey", roomkey)

useEffect(()=> {
    socket.emit("update_sessions")

    socket.on("sessions", (data) =>{
            console.log("room recaived")
            setRoomdata(data[roomkey]);
            setSessions(data);
            });
    socket.on("leftroom", (data)=>{
        console.log("LEFTROOM", data)
         nav("/", {state: data})

    }
)

       
          
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
    <button onClick={() => leaveroom(roomkey)}> Leave room</button>
    <button onClick={() => pressed_ready(roomkey)}> Ready</button>
    
</div>

)

}