// InputBox.tsx
import styles from './styles.module.scss';
import { useState } from "react";
import { socket } from "../../socket"; // 전역 socket 불러오기

export default function InputBox() {
    const [text, setText] = useState('');
    const [port, setPort] = useState('');

    const handleChangeText = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
    };

    const handleChangePort = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPort(e.target.value);
    };

    const handleSubmit = () => {
        if (!text.trim()) {
            alert("please input text");
            return;
        }
        if (!port.trim()) {
            alert("please input port");
            return;
        }

        socket.emit("sendMessage", { port, text });
        setText('');
    };

    return (
        <div className={styles.container}>
            <input
                value={port}
                onChange={handleChangePort}
                className={styles.input}
                type="text"
                placeholder="port..."
            />
            <input
                value={text}
                onChange={handleChangeText}
                className={styles.input}
                type="text"
                placeholder="text here..."
            />
            <button onClick={handleSubmit} className={styles.button}>
                Submit
            </button>
        </div>
    );
}
