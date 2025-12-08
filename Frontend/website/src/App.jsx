import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import './App.css'

import Sessions from './Pages/sessions'
import Room from "./Pages/Room";

export default function App() {


  return(
    <BrowserRouter>
      <Routes>
        <Route path ="/" element={<Sessions></Sessions>}></Route>
        <Route path="/room" element={<Room></Room>}></Route>
      </Routes>
    </BrowserRouter>

  );
}