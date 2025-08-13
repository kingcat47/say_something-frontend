import styles from './styles.module.scss';
import { useState, useEffect } from "react";
import { socket } from "../../socket"; // 전역 소켓 import

export default function FillterPort() {
    const [readPort, setReadPort] = useState('');

    useEffect(() => {
        socket.emit("setReadPort", { read_port: readPort });
    }, [readPort]);

    const readingPort = (e: React.ChangeEvent<HTMLInputElement>) => {
        setReadPort(e.target.value.trim()); // 공백 제거
    };

    return (
        <div className={styles.container}>
            <input
                value={readPort}
                onChange={readingPort}
                className={styles.input}
                type="text"
                placeholder="read_port"
            />
        </div>
    );
}
