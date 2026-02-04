import { useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";
import { socket } from "../../../game/Socket";





function joinroom(room){
    console.log("CLIENT: TRY TO JOIN ", room)
    let username = document.getElementById("username").value;
   


    socket.emit("join", username, room );

    //console.log("username: ",username);

}

function ongoing(room){
    if (room.ongoing == false){
       return(<h3 >No</h3>)
    }
    if(room.ongoing == true){
         return(<h3>Yes</h3>)
    }
}






export default function Session({closesession}) {
    const nav = useNavigate();
    const [sessions, setSessions] = useState({})
    const HELLO = {};

    useEffect(()=> {
        socket.emit("update_sessions", null)
        
        const sessions = (data) =>{
                console.log("sessions recaived")
                setSessions(data);}

        const joined = (room)=>{
             nav("/room", {state: room})};

        const joinerror = (msg)=>{
            console.log("CLIENT: JOINERROR")
            alert(msg);}
        
        socket.on("sessions", sessions);
        socket.on("joined", joined);
        socket.on("joinerror", joinerror)




     return () => {
        socket.off("sessions", sessions);
        socket.off("joined", joined);
        socket.off("joinerror", joinerror)
    };
       
    }, [])


    

return(
<div name="main">
    <h2 name= "sessions">Session</h2>

<label name = "sessions" htmlFor="username">Username: </label>
<input name = "username" type="text" id="username" placeholder="Enter Username"></input>
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
                <td><button  name = "sessions" onClick={() => joinroom(room.id) } >JOIN</button></td>
                </tr>
            ))}
        </tbody>


    </table>

<button onClick={()=> nav("/")} >Back</button>




</div>
    );
}
