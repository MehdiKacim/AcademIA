import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

console.log("[main.tsx] Application starting up."); // Added early log

createRoot(document.getElementById("root")!).render(<App />);