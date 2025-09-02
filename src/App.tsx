// import {Outlet} from 'react-router-dom'
import SideContainer from "./components/SideContainer";
import UpGround from "./components/UpGround";
import styles from './App.module.scss';

function App() {
  return (
    <div className={styles.appContainer}>
        <SideContainer/>
        <UpGround/>
        {/*<Outlet />*/}
    </div>
  )
}

export default App
