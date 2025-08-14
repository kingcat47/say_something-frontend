import styles from './styles.module.scss';
import { useState } from "react";
import { socket } from "../../socket";

interface InputBoxProps {
    port: string;
}

export default function InputBox({ port }: InputBoxProps) {
    const [text, setText] = useState('');

    const handleChangeText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };
    const handleSubmit = () => {
        if (!text.trim()) {
            // alert("Please input text");
            return;
        }

        socket.emit("sendMessage", {
            port: port.trim() || '', // 빈 문자열도 허용
            text: text.trim()
        });

        setText('');
    };

    return (
        <div className={styles.container}>
            <span className={styles.title}>Message</span>
            <textarea
                value={text}
                onChange={handleChangeText}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                    }
                }}
                className={styles.input}
                placeholder="메시지를 입력하세요..."
            />
            <button onClick={handleSubmit} className={styles.button}>
                Send Message
            </button>
        </div>
    );
}