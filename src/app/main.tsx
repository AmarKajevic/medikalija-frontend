import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import "../index.css";
import App from "@app/App";
import { ThemeProvider } from "@app/providers/ThemeContext";
import ScriptProvider from "@app/providers/ScriptProvider";
import AuthProvider from "@app/providers/AuthContext";
import { ExchangeRateProvider } from "@entities/exchange-rate/model/ExchangeRateContext";
import ErrorBoundary from "@shared/ui/feedback/ErrorBoundary";
import { initMonitoring } from "@shared/lib/monitoring";

void initMonitoring();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ScriptProvider>
        <AuthProvider>
          <ExchangeRateProvider>
            <App />
          </ExchangeRateProvider>
        </AuthProvider>
        </ScriptProvider>
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            className:
              "!rounded-xl !border !border-gray-200 !bg-white !px-3.5 !py-2.5 !text-sm !text-gray-900 !shadow-theme-lg dark:!border-gray-800 dark:!bg-gray-900 dark:!text-white",
            success: { iconTheme: { primary: "#2c712e", secondary: "#fff" } },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
