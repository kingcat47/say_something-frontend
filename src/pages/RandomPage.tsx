import SideContainer from "../components/SideContainer";
import MessageDisplay from "../components/MessageDisplay";
import styles from "../App.module.scss";

export default function RandomPage() {
    return (
        <div className={styles.appContainer}>
            <SideContainer />
            <MessageDisplay algorithm="random" />
        </div>
    );
}
