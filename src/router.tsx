import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Main_Page from "./page/Main_Page";


const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            { path: "main", element: <Main_Page /> },

        ],
    },
]);

export { router };