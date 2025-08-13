// UpGround.tsx
import styles from './styles.module.scss';
import { useState, useEffect } from 'react';
import { socket } from '../../socket.ts';

interface Message {
    id: number;
    port: string;
    text: string;
    left: number; // 화면에서의 x 좌표
}

let nextId = 0;

export default function UpGround() {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        socket.on("message", (msg: { port: string; text: string }) => {
            const newMsg: Message = {
                id: nextId++,
                port: msg.port || "ALL",
                text: msg.text,
                left: Math.random() * 80 // 0~80vw 안에서 랜덤 위치
            };

            setMessages(prev => [...prev, newMsg]);

            // 4초 후 메시지 삭제 (애니메이션 길이에 맞춰서)
            setTimeout(() => {
                setMessages(prev => prev.filter(m => m.id !== newMsg.id));
            }, 4000);
        });

        return () => {
            socket.off("message");
        };
    }, []);

    return (
        <div className={styles.container}>
            {messages.map(msg => (
                <div
                    key={msg.id}
                    className={styles.bubble}
                    style={{ left: `${msg.left}vw` }}
                >
                    <span className={styles.port}>[{msg.port}]</span> {msg.text}
                </div>
            ))}
        </div>
    );
}
