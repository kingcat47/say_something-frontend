import styles from './styles.module.scss';
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

export default function FillterPort() {
    const [readPort, setReadPort] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    useEffect(() => {
        const newSoket = io("https://saysome.thnos.app",)
        setSocket(newSoket);

        return () =>{
            newSoket.disconnect();
        };
    }, []);

    useEffect(() => {
        if(socket){
            socket.emit("setReadPort", {readPort});
        }
    }, [readPort, socket]);

    const readingPort = (e: React.ChangeEvent<HTMLInputElement>) => {
        setReadPort(e.target.value);
    };
    return(
        <div className={styles.container}>
            <input value={readPort} onChange={readingPort} className={styles.input} type="text" placeholder="read_port" />
        </div>
    )
}