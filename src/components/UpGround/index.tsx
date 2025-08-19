import styles from './styles.module.scss';
import { useState, useEffect, useRef } from 'react';
import { socket } from '../../socket.ts';
import { useTabStore } from '../../store/useTabStore.ts';
import Picker from "../Picker";
import ChatIcon from "../../assets/svg/on/message.svg";
import SendIcon from "../../assets/svg/on/send.svg";
import SendModeNumber from "../SendModeNumber";

interface BaseMessage {
    id: number;
    port: string;
    left: number;
    type: 'text' | 'image';
    time: number;
    senderName?: string;
    top?: number;
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
    const [sendModeType, setSendModeType] = useState<1 | 2 | 3>(1);
    const { selectedTab, setSelectedTab } = useTabStore();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function generateCoordinates(mode: 1 | 2 | 3) {
            if (mode === 1) {
                // y = 완전 바닥 (window.innerHeight) - 메시지 높이(예: 36px)
                return { left: Math.random() * 80, top: window.innerHeight - 36 };
            }
            if (mode === 2) {
                // x=0, y 랜덤 (뷰포트 상단 36px 제외한 영역)
                return { left: 0, top: 36 + Math.random() * (window.innerHeight - 100 - 36) };
            }
            // mode 3: x,y 랜덤 (x는 vw, y는 px)
            return { left: Math.random() * 80, top: Math.random() * (window.innerHeight - 100) };
        }

        socket.on("message", (msg: { port: string; text: string; senderName?: string }) => {
            const coords = generateCoordinates(sendModeType);
            const newMsg: TextMessage = {
                id: nextId++,
                port: msg.port || "",
                type: "text",
                text: msg.text,
                senderName: msg.senderName,
                left: coords.left,
                top: coords.top,
                time: Date.now(),
            };
            setMessages(prev => [...prev, newMsg]);
            if (selectedTab === 'send') {
                setTimeout(() => setMessages(prev => prev.filter(m => m.id !== newMsg.id)), 10000);
            }
        });

        socket.on("image", (data: { port: string; url: string; senderName?: string }) => {
            const coords = generateCoordinates(sendModeType);
            const newMsg: ImageMessage = {
                id: nextId++,
                port: data.port || "",
                type: "image",
                url: data.url,
                senderName: data.senderName,
                left: coords.left,
                top: coords.top,
                time: Date.now(),
            };
            setMessages(prev => [...prev, newMsg]);
            if (selectedTab === 'send') {
                setTimeout(() => setMessages(prev => prev.filter(m => m.id !== newMsg.id)), 10000);
            }
        });

        return () => {
            socket.off("message");
            socket.off("image");
        };
    }, [selectedTab, sendModeType]);

    useEffect(() => {
        setMessages([]);
    }, [selectedTab]);

    useEffect(() => {
        setMessages([]);
    }, [sendModeType]);

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

    const getSendModeClass = () => {
        switch (sendModeType) {
            case 1: return styles.sendMode1;
            case 2: return styles.sendMode2;
            case 3: return styles.sendMode3;
            default: return '';
        }
    };

    return (
        <div className={`${styles.container} ${selectedTab === 'chat' ? styles.chatBackground : styles.defaultBackground}`}>
            <div className={styles.topbuttonContainer}>
                <Picker tabs={tabs} selectedTab={selectedTab} onTabChange={setSelectedTab} />

                {selectedTab === 'send' && (
                    <SendModeNumber value={sendModeType} onChange={setSendModeType} />
                )}
            </div>

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
                        className={`${styles.bubble} ${msg.type === 'image' ? styles.imageBubble : ''} ${selectedTab === 'send' ? getSendModeClass() : ''}`}
                        style={{ left: `${msg.left}vw`, top: `${msg.top}px`, position: 'absolute' }}
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
