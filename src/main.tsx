import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

console.log("[main.tsx] Application starting up.");

createRoot(document.getElementById("root")!).render(<App />);