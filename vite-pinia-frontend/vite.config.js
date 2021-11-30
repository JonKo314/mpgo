import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import config from "../config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
    proxy: {
      "/api": {
        secure: config.ssl.secure,
        target: config.ssl.enabled
          ? "https://localhost:3000"
          : "http://localhost:3000/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },

      "/ws": {
        secure: config.ssl.secure,
        target: config.ssl.enabled
          ? "wss://localhost:3000"
          : "ws://localhost:3000",
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, ""),
      },
    },
  },
});
