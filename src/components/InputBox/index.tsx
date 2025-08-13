import styles from './styles.module.scss';
import {io, Socket} from "socket.io-client";
import {useEffect, useState} from "react";


export default function InputBox(){
    const [text, setText] = useState('');
    const [port, setPort] = useState('');
    const [socket, setSocket] = useState<Socket>();

    useEffect(() => {
        const newSocket = io("https://saysome.thnos.app", );
        setSocket(newSocket);

        return () => {
            newSocket.close();
        }
    }, []);

    const handleChange_text = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
    };
    const handleChange_port = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPort(e.target.value);
    };

    const handleSubmit = () => {
        if(!socket) return;
        if(!text.trim()) return alert("please input text");

        socket.emit("sendMessage", {port,text})

        setText('');
    }
    return(
        <div className={styles.container}> <input value={port} onChange={handleChange_port} className={styles.input} type="text" placeholder="port..." />
            <input value={text} onChange={handleChange_text} className={styles.input} type="text" placeholder="text here..." />
            <button onClick={handleSubmit} className={styles.button}>Submit</button>
        </div>
    )
}





