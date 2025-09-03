import { socket } from "../../socket";
import styles from './styles.module.scss';
import { useState, useEffect } from 'react';
import InputBox from "../InputBox";
import InputBoxImage from "../InputBoxImage";
import KlipyGifSearch from "../GifBox";

type ModeType = 'image' | 'gif';

function ModeToggleButtons({
                               value,
                               onChange,
                           }: {
    value: ModeType;
    onChange: (mode: ModeType) => void;
}) {
    const isMobile = window.innerWidth <= 768;
    
    // 모바일에서는 텍스트 전송만 지원
    if (isMobile) {
        return null;
    }

    return (
        <div className={styles.modeToggleContainer}>
            <button
                type="button"
                className={`${styles.modeToggleButton} ${value === 'image' ? styles.active : ''}`}
                onClick={() => onChange('image')}
            >
                IMAGE
            </button>
            <button
                type="button"
                className={`${styles.modeToggleButton} ${value === 'gif' ? styles.active : ''}`}
                onClick={() => onChange('gif')}
            >
                GIF
            </button>
        </div>
    );
}

export default function SideContainer() {
    const [sendPort, setSendPort] = useState('');
    const [mode, setMode] = useState<ModeType>('image');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [ifadmin, setAdmin] = useState<boolean>(false);
    const isMobile = window.innerWidth <= 768;

    // sendPort가 변경될 때마다 소켓으로 readPort 설정 이벤트 전송
    useEffect(() => {
        socket.emit("setReadPort", { read_port: sendPort });
    }, [sendPort]);

    return (
        <div className={styles.container}>
            <div className={styles.inpuscontainer}>
                <div className={styles.portInputs}>
                    {/* FillterPort 없이 sendPort 입력만 */}
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
                {/* 모바일에서는 텍스트 전송만 지원 */}
                {!isMobile && mode === 'image' && <InputBoxImage port={sendPort} />}
                {!isMobile && mode === 'gif' && (
                    <KlipyGifSearch
                        apiKey={'HLPp8ACogMkxky20eYOQ8xZMYz3xVb8IVs5i8yMhX117WVXZaUj1pMcJg0M4Lyfo'}
                        onSelectGif={(gifUrl) => {
                            console.log('선택한 GIF URL:', gifUrl);
                            socket.emit('sendGif', { port: sendPort, gifUrl });
                        }}
                    />
                )}
            </div>
        </div>
    );
}
