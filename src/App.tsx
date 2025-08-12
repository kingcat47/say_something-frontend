// import {Outlet} from 'react-router-dom'
import SideContainer from "./components/SideContainer";
import UpGround from "./components/UpGround";
function App() {


  return (
    <div style={{width: "100%", height: "100%"}}>
        <SideContainer/>
        <UpGround/>
        {/*<Outlet />*/}
    </div>
  )
}

export default App
