// src/components/UpGround.tsx
import styles from './styles.module.scss';
import { useState, useEffect, useRef } from 'react';
import { socket } from '../../socket.ts';
import { useTabStore } from '../../store/useTabStore.ts';
import Picker from "../Picker";
import ChatIcon from "../../assets/svg/on/message.svg";
import SendIcon from "../../assets/svg/on/send.svg";

interface BaseMessage {
    id: number;
    port: string;
    left: number;
    type: 'text' | 'image';
    time: number;
    senderName?: string;
}

interface TextMessage extends BaseMessage {
    type: 'text';
    text: string;
}

interface ImageMessage extends BaseMessage {
    type: 'image';
    url: string;
}

type Message = TextMessage | ImageMessage;

let nextId = 0;

export default function UpGround() {
    const [messages, setMessages] = useState<Message[]>([]);
    const { selectedTab, setSelectedTab } = useTabStore();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        socket.on("message", (msg: { port: string; text: string; senderName?: string }) => {
            console.log("포트 로그: ", msg.port);
            const newMsg: TextMessage = {
                id: nextId++,
                port: msg.port || "",
                type: "text",
                text: msg.text,
                senderName: msg.senderName,
                left: Math.random() * 80,
                time: Date.now(),
            };
            setMessages(prev => [...prev, newMsg]);
            if (selectedTab === 'send') {
                setTimeout(() => setMessages(prev => prev.filter(m => m.id !== newMsg.id)), 4000);
            }
        });

        socket.on("image", (data: { port: string; url: string; senderName?: string }) => {
            console.log("포트 로그: ", data.port);
            const newMsg: ImageMessage = {
                id: nextId++,
                port: data.port || "",
                type: "image",
                url: data.url,
                senderName: data.senderName,
                left: Math.random() * 80,
                time: Date.now(),
            };
            console.log("누가보냈는가", data.senderName);
            setMessages(prev => [...prev, newMsg]);
            if (selectedTab === 'send') {
                setTimeout(() => setMessages(prev => prev.filter(m => m.id !== newMsg.id)), 5000);
            }
        });

        return () => {
            socket.off("message");
            socket.off("image");
        };
    }, [selectedTab]);

    useEffect(() => {
        setMessages([]);
    }, [selectedTab]);

    useEffect(() => {
        if (containerRef.current && selectedTab === 'chat') {
            containerRef.current.scrollTop = 0;
        }
    }, [messages, selectedTab]);
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyL') {
                setMessages([]);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    return (
        <div className={`${styles.container} ${selectedTab === 'chat' ? styles.chatBackground : styles.defaultBackground}`}>
            <Picker tabs={tabs} selectedTab={selectedTab} onTabChange={setSelectedTab} />
            {selectedTab === 'chat' ? (
                <div className={styles.chatContainer} ref={containerRef}>
                    {[...messages]
                        .sort((a, b) => b.time - a.time)
                        .map(msg => (
                            <div
                                key={msg.id}
                                className={`${styles.chatBubble} ${msg.type === 'image' ? styles.chatImageBubble : ''}`}
                            >
                                {msg.senderName && <span className={styles.senderName}>{msg.senderName}</span>}
                                {msg.type === 'text' ? (
                                    <span>{msg.text}</span>
                                ) : (
                                    <img
                                        src={msg.url}
                                        alt={`port ${msg.port} image`}
                                        className={styles.chatImage}
                                    />
                                )}
                            </div>
                        ))
                    }
                </div>
            ) : (
                messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`${styles.bubble} ${msg.type === 'image' ? styles.imageBubble : ''} ${selectedTab === 'send' ? styles.sendMode : ''}`}
                        style={{ left: `${msg.left}vw` }}
                    >
                        {msg.senderName && <span className={styles.senderName}>{msg.senderName}</span>}
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
                ))
            )}
        </div>
    );
}

const tabs = [
    {
        id: 'chat',
        icon: <img src={ChatIcon} alt="chat" width={20} height={20} />,
    },
    {
        id: 'send',
        icon: <img src={SendIcon} alt="send" width={20} height={20} />,
    }
];
