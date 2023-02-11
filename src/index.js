import {createRoot} from "react-dom/client";
import { StrictMode } from "react";
import { App } from "./App";
import "@picocss/pico";

const app = document.getElementById("app");
const root = createRoot(app);
root.render(<StrictMode><App /></StrictMode>);