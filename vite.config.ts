import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig({
  plugins: [react()],

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
    chunkSizeWarningLimit: 1500, // pdfmake sa ugrađenim fontovima je sam po sebi velik

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

          // PDF (pdfmake sa fontovima) učitava se samo kad se pravi PDF
          pdf: ["pdfmake"],

          // 🟩 DOCX i FileSaver – teški moduli
          docs: ["docx", "file-saver"],

          // 🟫 Najviše korišćene vendor biblioteke
          vendor: ["axios", "@tanstack/react-query"],
        },
      },
    },
  },
});
