import { useEffect, useState } from "react";
import { Megaphone, Paperclip } from "lucide-react";
import api, { mediaUrl } from "../services/api";
import Reveal from "../components/Reveal";
import Badge from "../components/Badge";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";

export default function Announcements() {
  const [items, setItems] = useState(null);
  useEffect(() => { api.get("/announcements/").then((r) => setItems(r.data)); }, []);

  return (
    <div>
      <section className="bg-navy-900 text-white pt-40 pb-16">
        <div className="container-page">
          <p className="eyebrow text-gold">Stay informed</p>
          <h1 className="text-4xl font-semibold mt-2">Announcements</h1>
        </div>
      </section>
      <section className="section container-page max-w-3xl">
        {!items ? <Loader /> : items.length === 0 ? <EmptyState title="No announcements yet" /> : (
          <div className="space-y-4">
            {items.map((a, i) => (
              <Reveal key={a.id} delay={(i % 8) * 0.05}>
                <div className="card p-6 flex items-start gap-4">
                  <span className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo flex items-center justify-center shrink-0"><Megaphone size={19} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h3 className="font-semibold">{a.title}</h3>
                      {a.priority !== "normal" && <Badge tone={a.priority}>{a.priority_label.toUpperCase()}</Badge>}
                      {a.is_new && <Badge tone="new">NEW</Badge>}
                    </div>
                    <p className="text-sm text-ink/60 leading-relaxed">{a.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <p className="text-xs text-ink/40">{new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      {a.attachment && <a href={mediaUrl(a.attachment)} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo flex items-center gap-1"><Paperclip size={12} />Attachment</a>}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
