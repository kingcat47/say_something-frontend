import styles from './styles.module.scss';
import { useState } from "react";
import { socket } from "../../socket";

interface InputBoxImageProps {
    port: string;
}

export default function InputBoxImage({ port }: InputBoxImageProps) {
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        } else {
            setFile(null);
        }
    };

    const sendImage = (fileToSend: File) => {
        const chunkSize = 64 * 1024; // 64KB
        let offset = 0;
        const reader = new FileReader();

        const readNextChunk = () => {
            const slice = fileToSend.slice(offset, offset + chunkSize);
            reader.readAsArrayBuffer(slice);
        };

        reader.onload = () => {
            if (!(reader.result instanceof ArrayBuffer)) return;

            const chunk = reader.result;
            const isLastChunk = offset + chunkSize >= fileToSend.size;

            socket.emit("sendImage", {
                port: port.trim() || '',
                fileChunk: chunk,
                chunkIndex: Math.floor(offset / chunkSize),
                isLastChunk
            });

            offset += chunkSize;
            if (!isLastChunk) readNextChunk();
        };

        reader.onerror = (err) => console.error(err);

        readNextChunk();
    };

    const handleSubmit = () => {
        if (!file) {
            alert("Please select an image file.");
            return;
        }
        sendImage(file);
        setFile(null);
        const input = document.getElementById("image-file-input") as HTMLInputElement | null;
        if (input) input.value = "";
    };

    return (
        <div className={styles.container}>
            <span className={styles.title}>Image</span>
            <div className={styles.input_hover}>
                <input
                    id="image-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={styles.input}
                />
            </div>
            <button onClick={handleSubmit} className={styles.button}>
                Send Image
            </button>
        </div>
    );
}
