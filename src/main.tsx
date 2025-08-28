// src/main.tsx

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";


// Lance la vérification et le téléchargement des mises à jour

createRoot(document.getElementById("root")!).render(<App />);