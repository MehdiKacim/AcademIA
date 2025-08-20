import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import basicSsl from '@vitejs/plugin-basic-ssl'; // Import the plugin

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    https: true, // Enable HTTPS for the development server
  },
  plugins: [
    dyadComponentTagger(),
    react(),
    basicSsl() // Add the basicSsl plugin here
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));