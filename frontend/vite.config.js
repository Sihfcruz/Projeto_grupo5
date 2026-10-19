import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
const pages = [
  "index",
  "login",
  "dashboard",
  "inventory",
  "registration",
  "movements",
  "reports",
  "users",
];
export default defineConfig({
  base: "./",
  esbuild: { jsx: "automatic" },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((page) => [
          page,
          fileURLToPath(new URL(`./${page}.html`, import.meta.url)),
        ]),
      ),
    },
  },
});
