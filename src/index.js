import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Test from "./page/test";
import Login from "./page/Login";
import Register from "./page/Register";

const router = createBrowserRouter([
	{
		path: "/",
		element: <App />,
	},
	{
		path: "/test",
		element: <Test />,
	},
	{
		path: "/auth/login",
		element: <Login />,
	},
	{
		path: "/auth/register",
		element: <Register />,
	},
]);
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);
