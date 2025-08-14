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

        const sendChunk = (chunk: ArrayBuffer) => {
            const base64Chunk = btoa(
                new Uint8Array(chunk).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            socket.emit("sendImage", {
                port: port.trim() || '',
                fileChunk: base64Chunk,
                isLastChunk: offset >= fileToSend.size
            });
        };

        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                sendChunk(reader.result);
                offset += chunkSize;
                if (offset < fileToSend.size) {
                    readNextChunk();
                }
            } else {
                console.error("Unexpected FileReader result type");
            }
        };

        reader.onerror = (error) => {
            console.error("Error reading file:", error);
        };

        const readNextChunk = () => {
            const slice = fileToSend.slice(offset, offset + chunkSize);
            reader.readAsArrayBuffer(slice);
        };

        readNextChunk();
    };


    const handleSubmit = () => {
        if (!file) {
            alert("Please select an image file.");
            return;
        }

        console.log('이미지전송');
        sendImage(file);

        console.log('이미지초기화');
        setFile(null);

        const inputElement = document.getElementById("image-file-input") as HTMLInputElement | null;
        if (inputElement) inputElement.value = "";
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSubmit();
        }
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
                    onKeyDown={handleKeyDown}
                    className={styles.input}
                />
            </div>

            <button onClick={handleSubmit} className={styles.button}>
                Send Image
            </button>
        </div>
    );
}