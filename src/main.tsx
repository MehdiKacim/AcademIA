// src/main.tsx

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { Capacitor } from "@capacitor/core";

// Lance la vérification et le téléchargement des mises à jour
Capacitor.LiveUpdates.sync();

createRoot(document.getElementById("root")!).render(<App />);