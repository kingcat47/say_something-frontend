import { socket } from '../../socket';
import styles from './styles.module.scss';
import { useState, useEffect } from 'react';
import InputBox from '../InputBox';
import InputBoxImage from '../InputBoxImage';
import GifSearch from '../GifSearch';
import ModeToggleButtons from './ModeToggleButtons';
import { useIsMobile } from '../../hooks/useIsMobile';
import SendIcon from '../../assets/svg/icons/send.svg';

type ModeType = 'image' | 'gif';

const KLIPY_API_KEY = import.meta.env.VITE_KLIPY_API_KEY as string;

export default function SideContainer() {
    const [sendPort, setSendPort] = useState('');
    const [mode, setMode] = useState<ModeType>('image');
    const [showRoomInput, setShowRoomInput] = useState(false);
    const [mobileText, setMobileText] = useState('');
    const isMobile = useIsMobile();

    useEffect(() => {
        socket.emit('setReadPort', { read_port: sendPort });
    }, [sendPort]);

    const handleMobileSend = () => {
        if (!mobileText.trim()) return;
        socket.emit('sendMessage', { port: sendPort.trim() || '', text: mobileText.trim() });
        setMobileText('');
    };

    // ── 모바일 레이아웃 ──────────────────────────────────────
    if (isMobile) {
        return (
            <div className={styles.mobileContainer}>
                {showRoomInput && (
                    <div className={styles.roomPopover}>
                        <span className={styles.roomPopoverLabel}>Room</span>
                        <input
                            value={sendPort}
                            onChange={(e) => setSendPort(e.target.value.trim())}
                            className={styles.roomPopoverInput}
                            placeholder="Room 이름 입력..."
                            autoFocus
                        />
                        <button
                            className={styles.roomPopoverClose}
                            onClick={() => setShowRoomInput(false)}
                        >
                            확인
                        </button>
                    </div>
                )}
                <div className={styles.mobileBar}>
                    <button
                        className={`${styles.roomBtn} ${sendPort ? styles.roomBtnActive : ''}`}
                        onClick={() => setShowRoomInput(p => !p)}
                        title={sendPort || 'Room 설정'}
                    >
                        #
                        {sendPort && <span className={styles.roomDot} />}
                    </button>
                    <textarea
                        value={mobileText}
                        onChange={(e) => setMobileText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleMobileSend();
                            }
                        }}
                        className={styles.mobileInput}
                        placeholder="메시지를 입력하세요..."
                        rows={1}
                    />
                    <button
                        className={`${styles.mobileSendBtn} ${mobileText.trim() ? styles.mobileSendBtnActive : ''}`}
                        onClick={handleMobileSend}
                    >
                        <img
                            src={SendIcon}
                            alt="send"
                            className={styles.mobileSendIcon}
                            style={{ filter: mobileText.trim() ? 'brightness(0) invert(1)' : 'brightness(0) invert(0.45)' }}
                        />
                    </button>
                </div>
            </div>
        );
    }

    // ── 데스크탑 레이아웃 ────────────────────────────────────
    return (
        <div className={styles.container}>
            <div className={styles.inpuscontainer}>
                <div className={styles.portInputs}>
                    <div className={styles.portContainer}>
                        <span className={styles.portTitle}>Room</span>
                        <input
                            value={sendPort}
                            onChange={(e) => setSendPort(e.target.value.trim())}
                            className={styles.portInput}
                            type="text"
                            placeholder="Room (valgfritt)"
                        />
                    </div>
                </div>
                <InputBox port={sendPort} />
                <ModeToggleButtons value={mode} onChange={setMode} />
                {mode === 'image' && <InputBoxImage port={sendPort} />}
                {mode === 'gif' && (
                    <GifSearch
                        apiKey={KLIPY_API_KEY}
                        onSelectGif={(gifUrl) => socket.emit('sendGif', { port: sendPort, gifUrl })}
                    />
                )}
            </div>
        </div>
    );
}
