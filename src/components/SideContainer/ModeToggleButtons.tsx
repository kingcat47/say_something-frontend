import styles from './styles.module.scss';
import { useIsMobile } from '../../hooks/useIsMobile';

type ModeType = 'image' | 'gif';

interface ModeToggleButtonsProps {
    value: ModeType;
    onChange: (mode: ModeType) => void;
}

export default function ModeToggleButtons({ value, onChange }: ModeToggleButtonsProps) {
    const isMobile = useIsMobile();
    if (isMobile) return null;

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
