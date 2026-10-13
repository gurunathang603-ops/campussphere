import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [dept, setDept] = useState(null);
  const [stats, setStats] = useState(null);

  const refresh = async () => {
    const [s, d, st] = await Promise.all([
      api.get("/settings/"), api.get("/department/"), api.get("/stats/"),
    ]);
    setSettings(s.data); setDept(d.data); setStats(st.data);
  };

  useEffect(() => { refresh().catch(() => {}); }, []);

  return (
    <SiteContext.Provider value={{ settings, dept, stats, refresh }}>
      {children}
    </SiteContext.Provider>
  );
}

export const useSite = () => useContext(SiteContext);
