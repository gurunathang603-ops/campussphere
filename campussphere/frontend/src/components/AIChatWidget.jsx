import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";

const SUGGESTIONS = ["Who is the HOD?", "Show today's timetable", "When is the next event?", "Where can I find the syllabus?"];

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm the CampusSphere AI Assistant. Ask me about events, timetable, syllabus, faculty or announcements.", cards: [] },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const sessionId = useRef(Math.random().toString(36).slice(2));

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput(""); setBusy(true);
    try {
      const { data } = await api.post("/chatbot/", { message: q, session_id: sessionId.current });
      setMessages((m) => [...m, { role: "bot", text: data.reply, cards: data.cards || [] }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Sorry, I couldn't reach the department server. Please try again.", cards: [] }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[60] h-14 w-14 rounded-full bg-navy text-white shadow-pop flex items-center justify-center"
        aria-label="Open CampusSphere AI Assistant"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={22} /></motion.span>
          ) : (
            <motion.span key="c" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageCircle size={22} /></motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-24 right-6 z-[60] w-[92vw] max-w-[380px] h-[70vh] max-h-[560px] bg-white rounded-2xl shadow-pop border border-black/5 flex flex-col overflow-hidden"
          >
            <div className="bg-navy text-white px-5 py-4 flex items-center gap-3">
              <span className="h-9 w-9 rounded-full bg-gold/20 flex items-center justify-center"><Sparkles size={17} className="text-gold" /></span>
              <div>
                <p className="font-semibold text-sm leading-tight">CampusSphere AI Assistant</p>
                <p className="text-[11px] text-white/60">Ask anything about the department</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-mist/60">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13.5px] whitespace-pre-line leading-relaxed ${
                    m.role === "user" ? "bg-navy text-white rounded-br-sm" : "bg-white border border-black/5 rounded-bl-sm"
                  }`}>
                    {m.text}
                    {m.cards?.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 -mx-1">
                        {m.cards.map((c, j) => (
                          <Link key={j} to={c.link || "#"} onClick={() => setOpen(false)}
                            className="flex items-center justify-between gap-2 bg-mist hover:bg-indigo-50 rounded-lg px-3 py-2 mx-1 transition">
                            <span>
                              <span className="block text-xs font-semibold text-ink">{c.title}</span>
                              <span className="block text-[11px] text-ink/50">{c.subtitle}</span>
                            </span>
                            <ArrowUpRight size={14} className="text-indigo shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {busy && <div className="flex justify-start"><div className="bg-white border border-black/5 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-ink/30 animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />)}
              </div></div>}
              <div ref={endRef} />
            </div>

            {messages.length < 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="text-[11.5px] px-3 py-1.5 rounded-full bg-indigo-50 text-indigo hover:bg-indigo hover:text-white transition">{s}</button>
                ))}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 p-3 border-t border-black/5">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question…"
                className="flex-1 text-sm px-4 py-2.5 rounded-full bg-mist outline-none focus:ring-2 focus:ring-indigo/30" />
              <button type="submit" disabled={busy} className="h-10 w-10 rounded-full bg-navy text-white flex items-center justify-center shrink-0 disabled:opacity-50">
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
