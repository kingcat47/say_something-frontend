// import {Outlet} from 'react-router-dom'
import SideContainer from "./components/SideContainer";
import MessageDisplay from "./components/MessageDisplay";
import styles from './App.module.scss';

function App() {
  return (
    <div className={styles.appContainer}>
        <SideContainer/>
        <MessageDisplay/>
        {/*<Outlet />*/}
    </div>
  )
}

export default App
