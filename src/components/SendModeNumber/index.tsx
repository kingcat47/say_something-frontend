import styles from './styels.module.scss'

interface SendModeNumberProps {
    onChange: (num: 1 | 2 | 3) => void;
    value: 1 | 2 | 3;
}

export default function SendModeNumber({ onChange, value }: SendModeNumberProps) {
    return (
        <div className={styles.sendModeNumberContainer}>
            <button
                className={value === 1 ? styles.active : ''}
                onClick={() => onChange(1)}
            >
                1
            </button>
            <button
                className={value === 2 ? styles.active : ''}
                onClick={() => onChange(2)}
            >
                2
            </button>
            <button
                className={value === 3 ? styles.active : ''}
                onClick={() => onChange(3)}
            >
                3
            </button>
        </div>
    );
}
