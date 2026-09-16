import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { fileURLToPath, URL } from "node:url";

const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],

  resolve: {
    alias: {
      "@app": src("app"),
      "@pages": src("pages"),
      "@widgets": src("widgets"),
      "@features": src("features"),
      "@entities": src("entities"),
      "@shared": src("shared"),
    },
  },

  build: {
    chunkSizeWarningLimit: 900, // uklanja nepotrebna upozorenja

    rollupOptions: {
      output: {
        manualChunks: {
          // 🟦 React core u svoj bundle
          react: ["react", "react-dom"],

          // 🟪 FullCalendar (ogroman!)
          fullcalendar: [
            "@fullcalendar/react",
            "@fullcalendar/daygrid",
            "@fullcalendar/timegrid",
            "@fullcalendar/interaction",
          ],

          // 🟧 Chartovi (apexcharts)
          apexcharts: ["react-apexcharts", "apexcharts"],

          // 🟩 DOCX i FileSaver – teški moduli
          docs: ["docx", "file-saver"],

          // 🟫 Najviše korišćene vendor biblioteke
          vendor: ["axios", "@tanstack/react-query"],
        },
      },
    },
  },
});
