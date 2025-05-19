import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Different port from other UI for running simultaneously
    proxy: {
      "/api": {
        target: "http://localhost:7071", // Default Azure Functions local port
        changeOrigin: true,
      },
    },
  },
});
