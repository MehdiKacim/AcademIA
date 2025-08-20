import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import basicSsl from '@vitejs/plugin-basic-ssl'; // Remove the import

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    // https: true, // Remove this line
  },
  plugins: [
    dyadComponentTagger(),
    react(),
    // basicSsl() // Remove this line
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));