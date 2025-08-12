import styles from './styles.module.scss'
import InputBox from "../InputBox";
import FillterPort from "../FillterPort";

export default function SideContainer(){
    return(
        <span className={styles.container}>
            <FillterPort/>
            <InputBox/>
        </span>
    )
}