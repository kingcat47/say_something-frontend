import { socket } from '../../socket';
import styles from './styles.module.scss';
import { useState, useEffect } from 'react';
import InputBox from '../InputBox';
import InputBoxImage from '../InputBoxImage';
import GifSearch from '../GifSearch';
import ModeToggleButtons from './ModeToggleButtons';
import { useIsMobile } from '../../hooks/useIsMobile';

type ModeType = 'image' | 'gif';

const KLIPY_API_KEY = import.meta.env.VITE_KLIPY_API_KEY as string;

export default function SideContainer() {
    const [sendPort, setSendPort] = useState('');
    const [mode, setMode] = useState<ModeType>('image');
    const isMobile = useIsMobile();

    useEffect(() => {
        socket.emit('setReadPort', { read_port: sendPort });
    }, [sendPort]);

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
                {!isMobile && mode === 'image' && <InputBoxImage port={sendPort} />}
                {!isMobile && mode === 'gif' && (
                    <GifSearch
                        apiKey={KLIPY_API_KEY}
                        onSelectGif={(gifUrl) => socket.emit('sendGif', { port: sendPort, gifUrl })}
                    />
                )}
            </div>
        </div>
    );
}
