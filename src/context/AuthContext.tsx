import axios from "axios";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { User } from "../types";

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
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: "http://localhost:5000/api",
    withCredentials: true,
  });

  // -------------------------
  // 1️⃣ Auto-refresh pri load-u
  // -------------------------
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        if (!token) {
          // pokušaj refresh-a koristeći cookie
          const res = await api.post("/auth/refresh");
          if (res.data.success) {
            const newToken = res.data.accessToken;
            localStorage.setItem("token", newToken);
            setToken(newToken);
            api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          }
        }
      } catch (err) {
        console.log("Refresh pri load-u nije uspeo:", err);
        setUser(null);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // -------------------------
  // 2️⃣ Verify user kada postoji token
  // -------------------------
  useEffect(() => {
    const verifyUser = async () => {
      if (!token) return;

      try {
        const res = await api.get("/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.log("Verify nije uspeo:", err);
      }
    };

    verifyUser();
  }, [token]);

  // -------------------------
  // 3️⃣ Axios interceptor – refresh on 401
  // -------------------------
useEffect(() => {
  const verifyUser = async () => {
    setLoading(true);
    try {
      // 1️⃣ Nema access tokena → probaj refresh token (cookie)
      if (!token) {
        console.log("Nema access tokena — pokušavam refresh token...");
        try {
          const res = await api.post("/auth/refresh");
          if (res.data.success) {
            const newToken = res.data.accessToken;
            localStorage.setItem("token", newToken);
            setToken(newToken);
            setUser(res.data.user);
            api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
            return;
          }
        } catch (err) {
          console.log("Refresh nije uspeo:", err);
          setUser(null);
          return;
        }
      }

      // 2️⃣ Ako imamo token → pokušaj verify
      if (token) {
        const response = await api.get("/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Greška pri verifikaciji korisnika:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  verifyUser();
}, [token]);


  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

 const logoutRequest = async () => {
  try {
    await api.post("/auth/logout", {}, { withCredentials: true });

    // 💥 Obrisi frontend state
    setUser(null);
    setToken(null);

    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
  } catch (error) {
    console.error("Logout greška:", error);
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
