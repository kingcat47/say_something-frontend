import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.DEV ? "http://localhost:3000" : "https://strewn-dander-fidgeting.ngrok-free.dev";
export const socket = io(SERVER_URL, {
    extraHeaders: {
        "ngrok-skip-browser-warning": "true",
    },
});
