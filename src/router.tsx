import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AnalysisPage from "./pages/AnalysisPage";
import RandomPage from "./pages/RandomPage";


const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
    },
    {
        path: "/analysis",
        element: <AnalysisPage />,
    },
    {
        path: "/random",
        element: <RandomPage />,
    },
]);

export { router };