import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { User } from "@shared/types/index";
import { api, setAccessToken, setOnAuthFailure } from "@shared/api/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Pri učitavanju aplikacije, pokušaj da dobiješ novi access token
  // koristeći httpOnly refresh cookie (radi i posle reload-a stranice).
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await api.post("/api/auth/refresh");
        if (res.data.success) {
          setAccessToken(res.data.accessToken);
          setToken(res.data.accessToken);
          setUser(res.data.user);
        }
      } catch {
        setAccessToken(null);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  // Ako tihi refresh iz axios interceptor-a (na 401 tokom rada) ne uspe,
  // resetuj i AuthContext stanje da UI odmah pređe na /signin.
  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null);
      setToken(null);
    });

    return () => setOnAuthFailure(null);
  }, []);

  const login = (user: User, accessToken: string) => {
    setUser(user);
    setToken(accessToken);
    setAccessToken(accessToken);
  };

  const logoutRequest = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout greška:", error);
    } finally {
      setUser(null);
      setToken(null);
      setAccessToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout: logoutRequest, token, loading }}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth mora biti korišćen unutar AuthProvider-a");
  return ctx;
};

export default AuthProvider;
