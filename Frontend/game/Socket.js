import io from "socket.io-client";
const host = window.location.hostname;   // localhost ip for phone
export const socket = io(`http://${host}:3000`);