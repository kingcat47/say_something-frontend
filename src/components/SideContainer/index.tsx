import styles from './styles.module.scss';
import { useState } from 'react';
import InputBox from "../InputBox";
import FillterPort from "../FillterPort";
import InputBoxImage from "../InputBoxImage";

export default function SideContainer() {
    const [sendPort, setSendPort] = useState('');

    return (
        <div className={styles.container}>
            <div className={styles.portInputs}>
                    <FillterPort />
                <div className={styles.portContainer}>
                    <span className={styles.portTitle}>SEND PORT</span>
                    <input
                        value={sendPort}
                        onChange={(e) => setSendPort(e.target.value.trim())}
                        className={styles.portInput}
                        type="text"
                        placeholder="포트 (선택사항)"
                    />
                </div>
            </div>
            <div className={styles.inpuscontainer}>
                <InputBox port={sendPort} />
                <InputBoxImage port={sendPort} />
            </div>

        </div>
    );
}