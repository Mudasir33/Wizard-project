import { useNavigate } from "react-router-dom"
import { useLocation} from "react-router-dom";
import { socket } from "../../../game/Socket";




function restartgame(){
    // when the only one player is left
}

function endgame(){
    //when finsihed with game
}

function spectate(){
    //wanna spectate the game.
}



export default function Game_death(room){
    const nav = useNavigate();
    const { state: roomkey } = useLocation();



    return(

    <div className="death-overlay">


        <h1>Dead</h1>
        <br></br>

        <button onClick={()=> nav("/")}>Back</button>
    
    
    
    </div>


    )




}