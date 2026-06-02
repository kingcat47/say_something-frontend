import styles from './styles.module.scss';
import { useState, useRef } from 'react';
import { socket } from '../../socket';
import apiClient from '../../api';

interface InputBoxImageProps {
    port: string;
}

export default function InputBoxImage({ port }: InputBoxImageProps) {
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] ?? null);
    };

    const sendImage = async (fileToSend: File) => {
        try {
            if (!socket.id) {
                alert('소켓 연결이 아직 완료되지 않았습니다!');
                return;
            }
            const formData = new FormData();
            formData.append('port', port.trim() || '');
            formData.append('file', fileToSend);
            formData.append('socketId', socket.id);
            await apiClient.post('/image/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        } catch (err) {
            console.error('이미지 전송 실패:', err);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;
        const fileToSend = file;
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await sendImage(fileToSend);
    };

    return (
        <div className={styles.container}>
            <span className={styles.title}>Image</span>
            <div className={styles.input_hover}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                    className={styles.input}
                />
            </div>
            <button onClick={handleSubmit} className={styles.button}>
                Send Image
            </button>
        </div>
    );
}
