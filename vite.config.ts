/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],

  // Lokalno: /api ide na lokalni API (isti sajt kao u produkciji, gde to radi vercel.json)
  server: {
    proxy: {
      "/api": { target: loadEnv(mode, process.cwd(), "").VITE_API_PROXY || "http://localhost:5000", changeOrigin: true },
    },
  },

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
        // Samo stabilno jezgro (retko se menja) u poseban paket, da ga browser drži u kešu
        // i posle izmena aplikacije. Kalendar, PDF i Word izvoz NISU ovde: uvoze se tek
        // kad zatrebaju, pa ih Rollup sam deli — ručno grupisanje bi ih vuklo u početno učitavanje.
        manualChunks: {
          react: ["react", "react-dom", "react-router", "@tanstack/react-query", "axios"],
        },
      },
    },
  },

  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    restoreMocks: true,
    // Rezultati ne smeju da zavise od zone računara (CI je UTC, kancelarija Beograd)
    env: { TZ: "Europe/Belgrade" },
  },
}));
