import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      modules: path.resolve(__dirname, "src/modules"),
    },
  },
  server: {
    host: "127.0.0.1",
  },
});