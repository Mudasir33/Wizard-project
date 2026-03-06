import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { socket } from "../../../game/Socket";


function ready_state(player) {
    if (player.ready == false) {
        return (<h3>NOT Ready</h3>)
    }
    if (player.ready == true) {
        return (<h3>Ready</h3>)
    }
}


function leaveroom(roomkey) {
    console.log("leave spectator room")
    socket.emit("room_leave", roomkey)
}


export default function SpectatorRoom() {
    const nav = useNavigate();
    const location = useLocation();
    const roomkey = location.state;
    const [roomData, setRoomdata] = useState({ players: [] });

    useEffect(() => {
        const sessions = (data) => {
            console.log("spectator room received", data[roomkey])
            if (data[roomkey]) setRoomdata(data[roomkey]);
        };

        const leftroom = (data) => {
            console.log("LEFTROOM", data)
            nav("/SpectateSession")
        }

        const gameroom = (roomName) => {
            console.log("Game room", roomName)
            nav("/game", { state: roomName })
        };

        socket.on("sessions", sessions);
        socket.on("leftroom", leftroom)
        socket.on("gameRoom", gameroom)

        return () => {
            socket.off("sessions", sessions);
            socket.off("leftroom", leftroom)
            socket.off("gameRoom", gameroom)
        };

    }, [roomkey, nav])


    return (
        <div name="main">
            <h2>{roomData.id} (Spectating)</h2>
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
                        <tr key={i}>
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
        </div>
    )
}
