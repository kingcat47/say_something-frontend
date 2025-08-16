import styles from './styles.module.scss';
import { useState, useEffect } from 'react';
import { socket } from '../../socket.ts';

interface BaseMessage {
    id: number;
    port: string;
    left: number;
    type: 'text' | 'image';
}

interface TextMessage extends BaseMessage {
    type: 'text';
    text: string;
}

interface ImageMessage extends BaseMessage {
    type: 'image';
    url: string;
    show: boolean; // 애니메이션 시작 플래그
}

type Message = TextMessage | ImageMessage;

let nextId = 0;

export default function UpGround() {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        socket.on("message", (msg: { port: string; text: string }) => {
            const newMsg: TextMessage = {
                id: nextId++,
                port: msg.port || "ALL",
                type: "text",
                text: msg.text,
                left: Math.random() * 80
            };
            setMessages(prev => [...prev, newMsg]);
            setTimeout(() => {
                setMessages(prev => prev.filter(m => m.id !== newMsg.id));
            }, 4000);
        });

        socket.on("image", (data: { port: string; url: string }) => {
            const newMsg: ImageMessage = {
                id: nextId++,
                port: data.port || "ALL",
                type: "image",
                url: data.url,
                left: Math.random() * 80,
                show: false
            };
            setMessages(prev => [...prev, newMsg]);
            // 1초 후 show: true로 바꿔 floatUp 애니메이션 시작
            setTimeout(() => {
                setMessages(prev =>
                    prev.map(m =>
                        m.id === newMsg.id && m.type === 'image'
                            ? { ...m, show: true }
                            : m
                    )
                );
                // 4초 뒤 삭제 (1초 숨김 + 4초 floatUp = 5초 유지)
                setTimeout(() => {
                    setMessages(prev => prev.filter(m => m.id !== newMsg.id));
                }, 4000);
            }, 1000);
        });

        return () => {
            socket.off("message");
            socket.off("image");
        };
    }, []);

    return (
        <div className={styles.container}>
            {messages.map(msg => (
                <div
                    key={msg.id}
                    className={styles.bubble}
                    style={{ left: `${msg.left}vw`, display: msg.type === 'image' && !(msg as ImageMessage).show ? 'none' : 'flex' }}
                >
                    <span className={styles.port}>[{msg.port}]</span>
                    {msg.type === 'text' ? (
                        msg.text
                    ) : (
                        <img
                            src={msg.url}
                            alt={`port ${msg.port} image`}
                            className={styles.image}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
