import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.DEV ? "http://localhost:3000" : "https://say.hana.edu.pl/";
export const socket = io(SERVER_URL);
