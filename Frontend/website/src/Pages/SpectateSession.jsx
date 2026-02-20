import { useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";
import { socket } from "../../../game/Socket";





function joinroom(room){
    console.log("CLIENT: TRY TO JOIN ", room)
    console.log("Room ID:", room?.id)
   

    socket.emit("joinSpectator", room?.id );

}

function ongoing(room){
    if (room.ongoing == false){
       return(<h3 >No</h3>)
    }
    if(room.ongoing == true){
         return(<h3>Yes</h3>)
    }
}






export default function Session() {
    const nav = useNavigate();
    const [sessions, setSessions] = useState({})


    useEffect(()=> {
        socket.emit("update_sessions", null)
        
        const onSessions = (data) =>{
                console.log("Session: sessions received", data)
                setSessions(data);}

        const onJoined = (room)=>{
             console.log("Spectator joined event received, room:", room)
             nav("/spectator-room", {state: room})};

        const onJoinerror = (msg)=>{
            console.log("CLIENT: JOINERROR:", msg)
            alert(msg);}
        
        socket.on("sessions", onSessions);
        socket.on("joined", onJoined);
        socket.on("joinerror", onJoinerror)




     return () => {
        socket.off("sessions", onSessions);
        socket.off("joined", onJoined);
        socket.off("joinerror", onJoinerror)
    };
       
    }, [nav])


    

return(
<div name="main">
    <h2 name= "SpectateSessions">Spectate Sessions</h2>
<br></br>
    <table>
        <thead>
        <tr>
            <th>ROOM</th>
            <th>Players</th>
            <th>Ongoing</th>
            <th>JOIN</th>
        </tr>
        </thead>


        <tbody>
            {Object.values(sessions).map((room, i) =>(
                <tr key ={i}>
                <td>{room.id}</td>
                <td>{Object.keys(room.players).length}</td>
                <td>{ongoing(room)}</td>
                <td><button  name = "sessions" onClick={() => joinroom(room) } >JOIN</button></td>
                </tr>
            ))}
        </tbody>
    </table>

<button onClick={()=> nav("/")} >Back</button>




</div>
    );
}