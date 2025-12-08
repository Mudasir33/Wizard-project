import { useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import user from "../User";


  const socket = io("http://localhost:3000");






export default function Session() {
    const nav = useNavigate();
    const [sessions, setSessions] = useState({})


    useEffect(()=> {
        socket.emit("update_sessions", null)
        socket.on("sessions", (data) =>{
                console.log("sessions recaived")
                setSessions(data);
            });
      
    
       
    }, [])






    
function joinroom(room){
    //console.log("join room", room)
    //console.log("player:", user);
    
    let username = document.getElementById("username").value;

    for ( let i = 0; i < sessions[room].players.length; i++){
        if(username == sessions[room].players[i].username){
            return(alert("Username ALREADY EXISTS"))
    } };

    if(username == ""){
        return(alert("PUT IN USERNAME"))
    }
    else if(sessions[room].players.length >= 10){
        return(alert("ROOM FULL"))
    }

    else{
    user.setusername(username) ;

    socket.emit("join", user.getplayer(), room );

    //console.log("username: ",username);


    nav("/room", {state: room})
    }
}

   








return(
<div>
    <h2>Session</h2>


    <table>
        <thead>
        <tr>
            <th>Room</th>
            <th>players</th>
            <th>JOIN</th>
        </tr>
        </thead>


        <tbody>
            {Object.values(sessions).map((room, i) =>(
                <tr key ={i}>
                <td>{room.id}</td>
                <td>{room.players.length}</td>
                <td><button onClick={() => joinroom(room.id) } >JOIN</button></td>
                </tr>
            ))}
        </tbody>


    </table>
<label htmlFor="username">Username: </label> <br></br>
<input type="text" id="username" name="username" placeholder="Enter Username"></input>





</div>
    );
}
