import { useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";
import user from "../../../game/User";
import { socket } from "../../../game/Socket";
import Room from "./Room";




function joinroom(room){
    console.log("CLIENT: TRY TO JOIN ", room)
    let username = document.getElementById("username").value;
   
    user.setusername(username) ;

    socket.emit("join", user.getplayer(), room );

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
        socket.on("sessions", (data) =>{
                console.log("sessions recaived")
                setSessions(data);
            });

         socket.on("joined", (room)=>{
             nav("/room", {state: room})
    })
         
         socket.on("joinerror", (msg)=>{
            console.log("CLIENT: JOINERROR")
            alert(msg);
         })
    
       
    }, [])


    

return(
<div name="main_session">
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

<button onClick={closesession} >Back</button>




</div>
    );
}
