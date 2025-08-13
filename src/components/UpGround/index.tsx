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
    base64Src: string; // base64 이미지 src
}

type Message = TextMessage | ImageMessage;

let nextId = 0;

export default function UpGround() {
    const [messages, setMessages] = useState<Message[]>([]);
    const imageBuffers = new Map<string, string[]>(); // chunk 임시 저장

    useEffect(() => {
        // 텍스트 메시지
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

        // 이미지 메시지 (Chunk 방식)
        socket.on("imageChunk", (data: { port: string; fileChunk: string; chunkIndex: number; isLastChunk: boolean }) => {
            const chunkKey = data.port;

            if (!imageBuffers.has(chunkKey)) {
                imageBuffers.set(chunkKey, []);
            }

            const chunks = imageBuffers.get(chunkKey)!;
            chunks[data.chunkIndex] = data.fileChunk;

            if (data.isLastChunk) {
                const fullBase64 = chunks.join('');
                const newMsg: ImageMessage = {
                    id: nextId++,
                    port: data.port || "ALL",
                    type: "image",
                    base64Src: fullBase64,
                    left: Math.random() * 80
                };

                setMessages(prev => [...prev, newMsg]);

                setTimeout(() => {
                    setMessages(prev => prev.filter(m => m.id !== newMsg.id));
                }, 4000);

                // 임시 buffer 삭제
                imageBuffers.delete(chunkKey);
            }
        });

        return () => {
            socket.off("message");
            socket.off("imageChunk");
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
                    <span className={styles.port}>[{msg.port}]</span>
                    {msg.type === 'text' ? (
                        msg.text
                    ) : (
                        <img
                            src={msg.base64Src}
                            alt={`port ${msg.port} image`}
                            className={styles.image}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
