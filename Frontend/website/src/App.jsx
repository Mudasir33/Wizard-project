import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Sessions from './Pages/sessions'
import SpectateSession from './Pages/SpectateSession'
import SpectatorRoom from './Pages/SpectatorRoom'
import Room from "./Pages/Room";
import Guide from "./Pages/Guide";
import Game from "./Pages/game";
import Menu from "./Pages/menu"
export default function App() {


  return(
    <BrowserRouter>
      <Routes>
        <Route path ="/" element={<Menu></Menu>}></Route>
        <Route path ="/Sessions" element={<Sessions></Sessions>}></Route>
        <Route path ="/SpectateSession" element={<SpectateSession></SpectateSession>}></Route>
        <Route path="/spectator-room" element={<SpectatorRoom></SpectatorRoom>}></Route>
        <Route path="/room" element={<Room></Room>}></Route>
          <Route path="/Guide" element={<Guide></Guide>}></Route>
           <Route path="/game" element={<Game></Game>}></Route>
           
      </Routes>
    </BrowserRouter>

  );
}