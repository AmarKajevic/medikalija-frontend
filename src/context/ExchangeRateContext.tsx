
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../shared/api/api';

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
    await api.put('/exchange-rates', { lowerExchangeRate: lower, middleExchangeRate: middle });
    await refreshRates();
  };

  useEffect(() => {
    refreshRates();
  }, []);

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