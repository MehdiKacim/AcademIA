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
    },
  },
  // Exclure @dnd-kit/core de l'optimisation des dépendances de Vite
  optimizeDeps: {
    exclude: ['@dnd-kit/core'],
    include: ['react-dom', 'react-dom/client'], // Re-adding explicit include as it was before the last change
  },
}));