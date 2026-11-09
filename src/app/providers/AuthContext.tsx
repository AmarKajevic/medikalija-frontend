import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/types/index";
import { api, refreshSession, RefreshUnavailableError, setAccessToken, setOnAuthFailure, type SessionResult } from "@shared/api/api";
import { SplashScreen } from "@widgets/shell/BrandMark";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Prijava i odjava se javljaju ostalim tabovima (isti browser, isti kolačić sesije):
// odjava u jednom tabu odjavljuje sve, a prijava u jednom prijavljuje i ostale.
type AuthMessage = { type: "logout" } | { type: "login" };
const CHANNEL = "medikalija-auth";
const openChannel = () => (typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL) : null);

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const channel = useRef<BroadcastChannel | null>(null);

  const clearLocal = useCallback(() => {
    setUser(null);
    setToken(null);
    setAccessToken(null);
    // Podaci prethodnog korisnika ne smeju ostati u kešu (deljeni računari na odeljenju)
    queryClient.clear();
  }, [queryClient]);

  const restore = useCallback(async () => {
    // Pri pokretanju: mreža ili server mogu kratko da ne odgovore — nekoliko pokušaja pre ekrana za prijavu
    let session: SessionResult | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        session = await refreshSession();
        break;
      } catch (err) {
        if (!(err instanceof RefreshUnavailableError) || attempt === 2) break;
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
    if (session) {
      setToken(session.accessToken);
      setUser(session.user);
    } else {
      setUser(null);
      setToken(null);
    }
  }, []);

  // Pri učitavanju aplikacije: nov access token iz httpOnly refresh kolačića (radi i posle reload-a)
  useEffect(() => {
    restore().finally(() => setLoading(false));
  }, [restore]);

  // Ako tihi refresh iz axios interceptor-a (na 401 tokom rada) ne uspe,
  // resetuj i AuthContext stanje da UI odmah pređe na /signin.
  useEffect(() => {
    setOnAuthFailure(clearLocal);
    return () => setOnAuthFailure(null);
  }, [clearLocal]);

  useEffect(() => {
    const ch = openChannel();
    channel.current = ch;
    if (!ch) return;
    ch.onmessage = (e: MessageEvent<AuthMessage>) => {
      if (e.data?.type === "logout") clearLocal();
      if (e.data?.type === "login") void restore();
    };
    return () => {
      ch.close();
      channel.current = null;
    };
  }, [clearLocal, restore]);

  const login = (user: User, accessToken: string) => {
    setUser(user);
    setToken(accessToken);
    setAccessToken(accessToken);
    channel.current?.postMessage({ type: "login" } satisfies AuthMessage);
  };

  const logoutRequest = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout greška:", error);
    } finally {
      clearLocal();
      channel.current?.postMessage({ type: "logout" } satisfies AuthMessage);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout: logoutRequest, token, loading }}>
      {loading ? <SplashScreen /> : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth mora biti korišćen unutar AuthProvider-a");
  return ctx;
};

export default AuthProvider;
