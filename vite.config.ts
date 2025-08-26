import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    dyadComponentTagger(),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Ajout d'un alias pour forcer la résolution de 'react-dom' vers 'react-dom/client'
      "react-dom": "react-dom/client",
    },
  },
  // Exclure @dnd-kit/core de l'optimisation des dépendances de Vite
  optimizeDeps: {
    exclude: ['@dnd-kit/core'],
    // NEW: Explicitly include react-dom/client to ensure it's correctly pre-bundled
    include: ['react-dom/client'],
  },
}));