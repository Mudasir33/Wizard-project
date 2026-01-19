import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import './App.css'

import Sessions from './Pages/sessions'
import Room from "./Pages/Room";
import Guide from "./Pages/Guide";

export default function App() {


  return(
    <BrowserRouter>
      <Routes>
        <Route path ="/" element={<Sessions></Sessions>}></Route>
        <Route path="/room" element={<Room></Room>}></Route>
          <Route path="/Guide" element={<Guide></Guide>}></Route>
      </Routes>
    </BrowserRouter>

  );
}