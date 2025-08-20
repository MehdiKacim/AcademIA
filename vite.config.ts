import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(() => ({
  server: {
    host: "0.0.0.0", // Changed from "::" to "0.0.0.0" for broader compatibility
    port: 8080,
    https: true,
  },
  plugins: [
    dyadComponentTagger(),
    react(),
    basicSsl()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));