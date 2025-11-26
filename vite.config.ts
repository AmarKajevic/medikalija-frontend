import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

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
