
//check if it is mobile phone
function isMobile(){
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera/i.test(navigator.userAgent)
}



//kollar om det är landscape(aka horizontellt) 
function islandscape(){
    return window.matchMedia("(orientation: landscape)").matches;
}






function goLandscape(){ // för om man inte är i landscape 
    if(isMobile){
        if(!islandscape()){
            // innan vi går till den sidan.
        }
        else{
            // gå till queue eller session
        }

    }


}
