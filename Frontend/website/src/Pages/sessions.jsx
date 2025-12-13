import { useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";
import user from "../../../game/User";
import { socket } from "../../../game/Socket";




function joinroom(room){
    console.log("CLIENT: TRY TO JOIN ", room)
    let username = document.getElementById("username").value;
    if(username == ""){
        return(alert("PUT IN USERNAME"))
    } 
    else{
    user.setusername(username) ;

    socket.emit("join", user.getplayer(), room );

    //console.log("username: ",username);
    }
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
<div>
    <h2>Session</h2>


    <table>
        <thead>
        <tr>
            <th>Room</th>
            <th>players</th>
            <th>Ongoing</th>
            <th>JOIN</th>
        </tr>
        </thead>


        <tbody>
            {Object.values(sessions).map((room, i) =>(
                <tr key ={i}>
                <td>{room.id}</td>
                <td>{room.players.length}</td>
                <td>{ongoing(room)}</td>
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
