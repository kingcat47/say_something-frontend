import styles from './styles.module.scss';
import { useState, useEffect } from 'react';
import { socket } from '../../socket.ts'; // 전역 socket import

interface Message {
    port: string;
    text: string;
}

export default function UpGround() {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        // 서버로부터 'message' 이벤트 받기
        socket.on("message", (msg: Message) => {
            setMessages(prev => [...prev, msg]); // 이전 메시지에 추가
        });

        // 컴포넌트 언마운트 시 이벤트 해제
        return () => {
            socket.off("message");
        };
    }, []);

    return (
        <div className={styles.container}>
            {messages.map((msg, idx) => (
                <div key={idx} className={styles.bubble}>
                    <span className={styles.port}>[{msg.port || 'ALL'}]</span> {msg.text}
                </div>
            ))}
        </div>
    );
}
