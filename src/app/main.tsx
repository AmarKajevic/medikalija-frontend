import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "@app/App";
import { AppWrapper } from "@shared/ui/common/PageMeta";
import { ThemeProvider } from "@app/providers/ThemeContext";
import AuthProvider from "@app/providers/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExchangeRateProvider } from "@entities/exchange-rate/model/ExchangeRateContext";


const queryClient = new QueryClient()


createRoot(document.getElementById("root")!).render(
  
  
  <StrictMode>
    <AuthProvider>
      
      <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AppWrapper>
        <ExchangeRateProvider>
        <App />
        </ExchangeRateProvider>
      </AppWrapper>
    </ThemeProvider>
    </QueryClientProvider>
    </AuthProvider>
  </StrictMode>
  ,
);
