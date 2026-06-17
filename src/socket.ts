import { io } from "socket.io-client";

const SERVER_URL = "https://strewn-dander-fidgeting.ngrok-free.dev";
export const socket = io(SERVER_URL, {
    extraHeaders: {
        "ngrok-skip-browser-warning": "true",
    },
});
