import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AnalysisPage from "./pages/AnalysisPage";
// import Main_Page from "./page/Main_Page";


const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        // children: [
        //     { path: "main", element: <Main_Page /> },
        //
        // ],
    },
    {
        path: "/analysis",
        element: <AnalysisPage />,
    },
]);

export { router };