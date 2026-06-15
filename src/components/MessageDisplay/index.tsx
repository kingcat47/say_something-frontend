import styles from './styles.module.scss';
import { useState, useEffect, useRef } from 'react';
import { useTabStore } from '../../store/useTabStore';
import Picker from '../Picker';
import ChatIcon from '../../assets/svg/icons/message.svg';
import SendIcon from '../../assets/svg/icons/send.svg';
import ModeSelector from '../ModeSelector';
import { useMessages } from '../../hooks/useMessages';

const tabs = [
    {
        id: 'chat',
        icon: <img src={ChatIcon} alt="chat" width={20} height={20} />,
    },
    {
        id: 'send',
        icon: <img src={SendIcon} alt="send" width={20} height={20} />,
    },
];

interface Props {
    algorithm?: 'poisson' | 'random';
}

export default function MessageDisplay({ algorithm = 'poisson' }: Props) {
    const [sendModeType, setSendModeType] = useState<1 | 2 | 3>(1);
    const { selectedTab, setSelectedTab } = useTabStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const { messages } = useMessages(selectedTab, sendModeType, algorithm);

    useEffect(() => {
        if (containerRef.current && selectedTab === 'chat') {
            containerRef.current.scrollTop = 0;
        }
    }, [messages, selectedTab]);

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
                    <ModeSelector value={sendModeType} onChange={setSendModeType} />
                )}
            </div>

            {selectedTab === 'chat' ? (
                <div className={styles.chatContainer} ref={containerRef}>
                    {[...messages]
                        .sort((a, b) => b.time - a.time)
                        .map(msg => (
                            <div
                                key={msg.id}
                                className={`${styles.chatBubble} ${msg.type === 'image' ? styles.chatImageBubble : msg.type === 'gif' ? styles.chatGifBubble : ''}`}
                            >
                                {msg.senderName && <span className={styles.senderName}>{msg.senderName}</span>}
                                {msg.type === 'text' && <span>{msg.text}</span>}
                                {msg.type === 'image' && (
                                    <img src={msg.url} alt={`port ${msg.port} image`} className={styles.chatImage} />
                                )}
                                {msg.type === 'gif' && (
                                    <img src={msg.gifUrl} alt={`port ${msg.port} gif`} className={styles.chatGif} />
                                )}
                            </div>
                        ))
                    }
                </div>
            ) : (
                messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`${styles.bubble} ${msg.type === 'image' ? styles.imageBubble : msg.type === 'gif' ? styles.gifBubble : ''} ${selectedTab === 'send' ? getSendModeClass() : ''}`}
                        style={{ left: `${msg.left}vw`, top: `${msg.top}px`, position: 'absolute' }}
                    >
                        {msg.senderName && <span className={styles.senderName}>{msg.senderName}</span>}
                        {msg.type === 'text' && msg.text}
                        {msg.type === 'image' && (
                            <img src={msg.url} alt={`port ${msg.port} image`} className={styles.image} />
                        )}
                        {msg.type === 'gif' && (
                            <img src={msg.gifUrl} alt={`port ${msg.port} gif`} className={styles.gif} />
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
