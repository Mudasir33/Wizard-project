import { useNavigate } from "react-router-dom"



export default function Game_death(){
    const nav = useNavigate();



    return(

    <div className="death-overlay">


        <h1>Dead</h1>
        <br></br>

        <button onClick={()=> nav("/")}>Back</button>
    
    
    
    </div>


    )




}