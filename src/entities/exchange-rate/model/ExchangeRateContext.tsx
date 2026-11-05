
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from "@shared/api/api";
import { useAuth } from "@app/providers/AuthContext";

interface ExchangeRates {
  lower: number;
  middle: number;
}

interface ExchangeRateContextType {
  rates: ExchangeRates;
  setRates: (rates: ExchangeRates) => void;
  refreshRates: () => Promise<void>;
  updateRates: (lower: number, middle: number) => Promise<void>;
}

const ExchangeRateContext = createContext<ExchangeRateContextType | undefined>(undefined);

export const ExchangeRateProvider = ({ children }: { children: ReactNode }) => {
  const [rates, setRates] = useState<ExchangeRates>({ lower: 0, middle: 0 });

  const refreshRates = async () => {
    const { data } = await api.get('/api/exchange-rates');
    setRates(data.rates);
  };

  const updateRates = async (lower: number, middle: number) => {
    await api.put('/api/exchange-rates', { lowerExchangeRate: lower, middleExchangeRate: middle });
    await refreshRates();
  };

  // Kursevi traže prijavu: učitavaju se tek kad korisnik postoji (i ponovo
  // posle prijave), a ne pri prvom učitavanju stranice kada bi dobili 401.
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    refreshRates().catch((err) => console.error("Kursna lista nije učitana:", err));
  }, [user]);

  return (
    <ExchangeRateContext.Provider value={{ rates, setRates, refreshRates, updateRates }}>
      {children}
    </ExchangeRateContext.Provider>
  );
};

export const useExchangeRates = () => {
  const ctx = useContext(ExchangeRateContext);
  if (!ctx) throw new Error('useExchangeRates must be used within ExchangeRateProvider');
  return ctx;
};