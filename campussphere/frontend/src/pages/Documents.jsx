import { useEffect, useState } from "react";
import { FileText, Download, Lock } from "lucide-react";
import api, { API_BASE } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Reveal from "../components/Reveal";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";

const CATS = [["", "All"], ["syllabus", "Syllabus"], ["timetable", "Timetable"], ["circular", "Circulars"],
  ["event", "Event"], ["conference", "Conference"], ["workshop", "Workshop"], ["academic", "Academic"],
  ["report", "Reports"], ["student", "Student"]];

export default function Documents() {
  const { user } = useAuth();
  const [cat, setCat] = useState("");
  const [items, setItems] = useState(null);

  useEffect(() => { setItems(null); api.get("/documents/", { params: cat ? { category: cat } : {} }).then((r) => setItems(r.data)); }, [cat]);

  const download = (doc) => {
    const token = localStorage.getItem("cs_token");
    const url = `${API_BASE}${doc.download_url}?dl=1`;
    if (!token) { window.open(url, "_blank"); return; }
    fetch(url, { headers: { Authorization: `Token ${token}` } })
      .then((r) => r.blob()).then((b) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b); a.download = doc.filename || doc.title; a.click();
      });
  };

  return (
    <div>
      <section className="bg-navy-900 text-white pt-40 pb-16">
        <div className="container-page">
          <p className="eyebrow text-gold">Resources</p>
          <h1 className="text-4xl font-semibold mt-2">Documents</h1>
          {!user && <p className="text-white/50 text-sm mt-2">Log in as a student or staff member to see additional restricted documents.</p>}
        </div>
      </section>
      <section className="section container-page">
        <div className="flex gap-2 flex-wrap mb-10">
          {CATS.map(([v, l]) => (
            <button key={v} onClick={() => setCat(v)} className={`px-4 py-2 rounded-full text-sm font-medium ${cat === v ? "bg-navy text-white" : "bg-white border border-black/10 text-ink/60"}`}>{l}</button>
          ))}
        </div>
        {!items ? <Loader /> : items.length === 0 ? <EmptyState title="No documents in this category" /> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((d, i) => (
              <Reveal key={d.id} delay={(i % 9) * 0.05}>
                <div className="card p-5 flex items-start gap-3">
                  <span className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo flex items-center justify-center shrink-0"><FileText size={17} /></span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-snug">{d.title}</p>
                    <p className="text-xs text-ink/40 mt-1">{d.category_label}{d.visibility !== "public" && <> · <Lock size={10} className="inline mb-0.5" /> {d.visibility_label}</>}</p>
                    <button onClick={() => download(d)} className="flex items-center gap-1.5 text-xs font-medium text-indigo mt-2"><Download size={13} />Download</button>
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
