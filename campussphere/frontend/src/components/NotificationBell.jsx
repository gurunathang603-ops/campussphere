import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { enablePushNotifications } from "../services/pushNotifications";

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ unread: 0, results: [] });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [alertError, setAlertError] = useState("");
  const [loadError, setLoadError] = useState(false);
  const ref = useRef(null);

  const load = () => api.get("/notifications/").then((r) => {
    setData(r.data);
    setLoadError(false);
  }).catch(() => setLoadError(true));

  useEffect(() => {
    if (!user) return;
    load();
    api.get("/notifications/preferences/").then((response) => setPushEnabled(response.data.push_enabled))
      .catch(() => setLoadError(true));
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  const markAll = async () => { await api.post("/notifications/read-all/"); load(); };
  const enableAlerts = async () => {
    setAlertError("");
    try {
      await enablePushNotifications();
      setPushEnabled(true);
    } catch (error) {
      setAlertError(error.message || "Could not enable browser alerts.");
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative h-10 w-10 rounded-full flex items-center justify-center hover:bg-black/5 transition">
        <Bell size={19} />
        {data.unread > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-gold text-[10px] font-bold text-navy-900 flex items-center justify-center">
            {data.unread > 9 ? "9+" : data.unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-pop border border-black/5 overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
              <p className="font-semibold text-sm">Notifications</p>
              {data.unread > 0 && <button onClick={markAll} className="text-xs text-indigo font-medium">Mark all read</button>}
            </div>
            <div className="px-4 py-2 border-b border-black/5 flex items-center justify-between gap-3">
              <span className="text-xs text-ink/50">Background push alerts</span>
              {pushEnabled ? (
                <span className="text-xs font-medium text-emerald-700">Enabled</span>
              ) : (
                <button onClick={enableAlerts} className="text-xs font-semibold text-indigo">Enable</button>
              )}
            </div>
            {alertError && <p className="px-4 py-2 text-xs text-red-700">{alertError}</p>}
            {loadError && <p className="px-4 py-2 text-xs text-red-700">Could not load notifications. Please retry.</p>}
            <div className="max-h-80 overflow-y-auto divide-y divide-black/5">
              {data.results.length === 0 && <p className="px-4 py-6 text-sm text-ink/40 text-center">You're all caught up.</p>}
              {data.results.map((n) => (
                <Link key={n.id} to={n.link || "#"} onClick={() => { setOpen(false); if (!n.is_read) api.post(`/notifications/${n.id}/read/`).then(load); }}
                  className={`block px-4 py-3 hover:bg-mist ${!n.is_read ? "bg-indigo-50/40" : ""}`}>
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.message && <p className="text-xs text-ink/50 mt-0.5 line-clamp-2">{n.message}</p>}
                </Link>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-black/5 flex justify-between text-xs">
              <Link to="/notifications" onClick={() => setOpen(false)} className="font-medium text-indigo">Notification history</Link>
              <Link to="/notifications#preferences" onClick={() => setOpen(false)} className="font-medium text-indigo">Preferences</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
