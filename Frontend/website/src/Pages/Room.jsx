
import { useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";

import { useLocation } from "react-router-dom";
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
    socket.emit("room_leave", roomkey)
     

}




function startGame(roomkey) {
    
    console.log("Game is starting for room:", roomkey);
    socket.emit("Game", roomkey)

   
    
    
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

        const sessions = (data) =>{
            console.log("room recaived")
            // Defensive: only update if data[roomkey] exists
            if (data[roomkey]) setRoomdata(data[roomkey]);
            setSessions(data);
            };


    const leftroom = (data)=>{
        console.log("LEFTROOM", data)
         nav("/sessions") }


    const players_ready = (data)=>{
        console.log("reacived players ready")
        startGame(roomkey)}

    
    const gameroom = (data)=>{
        console.log("Game room", data)
        //nav("/game", {state: data})
        //window.location.href = `http://localhost:3000?room=${data}`
        
         nav("/game", {state: data})
    };   




    socket.on("sessions", sessions);
    socket.on("leftroom", leftroom)
    socket.on("players_ready",players_ready)
    socket.on("gameRoom", gameroom)


      return () => {
        socket.off("sessions", sessions);
        socket.off("leftroom", leftroom)
        socket.off("players_ready",players_ready)
        socket.off("gameRoom", gameroom)
      
    };
          
       }, [])
   

    
    



return(
<div name="main">
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
          
            {Object.values(roomData.players).map((player, i) => (
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