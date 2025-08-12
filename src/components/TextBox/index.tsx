import styles from './styles.module.scss';


interface TextBoxProps {
    text?: string;
}
export default function TextBox( {text}: TextBoxProps) {
    return(
        <div className={styles.container}>
          <span className={styles.main_text}>{text}</span>
        </div>
    )
}