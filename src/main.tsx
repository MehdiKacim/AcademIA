import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { LiveUpdates } from "@capacitor/live-updates";

// console.log("[main.tsx] Application starting up.");
// Lance la vérification et le téléchargement des mises à jour
LiveUpdates.sync();


createRoot(document.getElementById("root")!).render(<App />);