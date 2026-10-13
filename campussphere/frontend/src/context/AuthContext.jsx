import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = async () => {
    const token = localStorage.getItem("cs_token");
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get("/auth/me/");
      setUser(data);
    } catch {
      localStorage.removeItem("cs_token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMe(); }, []);

  const login = async (username, password, role) => {
    const { data } = await api.post("/auth/login/", { username, password, role });
    localStorage.setItem("cs_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    const { data } = await api.post("/auth/change-password/", {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    localStorage.setItem("cs_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await api.post("/auth/logout/"); } catch { /* ignore */ }
    localStorage.removeItem("cs_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, changePassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
