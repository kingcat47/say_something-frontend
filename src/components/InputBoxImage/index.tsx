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
        const reader = new FileReader();

        reader.onload = () => {
            if (reader.result && typeof reader.result === 'string') {
                console.log("Sending image to port:", port);
                socket.emit("sendImage", {
                    port: port.trim() || '',
                    file: reader.result,
                });
            } else {
                console.error("FileReader result is not a string (Base64 data)");
            }
        };

        reader.onerror = (error) => {
            console.error("Error reading file:", error);
        };

        reader.readAsDataURL(fileToSend);
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