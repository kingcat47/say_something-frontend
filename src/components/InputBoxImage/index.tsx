import styles from './styles.module.scss';
import { useState } from "react";
import { getApiBaseUrl } from "../../api.ts";
import axios from "axios";

interface InputBoxImageProps {
    port: string;
}

export default function InputBoxImage({ port }: InputBoxImageProps) {
    const BASE_URL = getApiBaseUrl();
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        } else {
            setFile(null);
        }
    };

    const sendImage = async (fileToSend: File) => {
        try {
            const formData = new FormData();
            formData.append("port", port.trim() || "");
            formData.append("file", fileToSend);

            await axios.post(`${BASE_URL}/image/upload`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            console.log("이미지 전송 완료");
        } catch (err) {
            console.error("이미지 전송 실패:", err);
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            // alert("Please select an image file.");
            return;
        }

        console.log("이미지 전송 시작");
        await sendImage(file); // await 추가

        console.log("이미지 초기화");
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
