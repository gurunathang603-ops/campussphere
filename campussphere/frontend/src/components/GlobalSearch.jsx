import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, FileText, CalendarDays, Users, ClipboardList, Megaphone, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const ICONS = {
  event: CalendarDays, syllabus: FileText, faculty: Users, timetable: ClipboardList,
  announcement: Megaphone, document: FileText, achievement: Award,
};

export default function GlobalSearch({ open, onClose }) {
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 80); }, [open]);
  useEffect(() => {
    if (!q.trim()) { setData(null); return; }
    setLoading(true);
    const t = setTimeout(() => {
      api.get("/search/", { params: { q } }).then((r) => setData(r.data)).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const go = (link) => { onClose(); setQ(""); nav(link); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] bg-navy-900/50 backdrop-blur-sm flex items-start justify-center px-4 pt-24"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="w-full max-w-xl bg-white rounded-2xl shadow-pop overflow-hidden"
            initial={{ opacity: 0, y: -16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-black/5">
              <Search size={19} className="text-ink/40 shrink-0" />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search events, faculty, syllabus, documents…"
                className="flex-1 outline-none text-[15px] bg-transparent" />
              <button onClick={onClose} className="text-ink/40 hover:text-ink"><X size={18} /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {loading && <p className="px-5 py-6 text-sm text-ink/40">Searching…</p>}
              {!loading && data?.interpretation && q && (
                <p className="px-5 pt-3 text-xs text-ink/40">{data.interpretation}</p>
              )}
              {!loading && data?.results?.length === 0 && (
                <p className="px-5 py-6 text-sm text-ink/40">No matches. Try a different term.</p>
              )}
              <ul className="py-2">
                {data?.results?.map((r, i) => {
                  const Icon = ICONS[r.type] || FileText;
                  return (
                    <li key={i}>
                      <button onClick={() => go(r.link)} className="w-full flex items-start gap-3 px-5 py-3 hover:bg-mist text-left">
                        <span className="mt-0.5 h-8 w-8 rounded-lg bg-indigo-50 text-indigo flex items-center justify-center shrink-0"><Icon size={16} /></span>
                        <span>
                          <span className="block text-sm font-medium">{r.title}</span>
                          <span className="block text-xs text-ink/50">{r.subtitle}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {!q && <p className="px-5 py-6 text-sm text-ink/40">Try "3rd semester syllabus" or "latest conference".</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
