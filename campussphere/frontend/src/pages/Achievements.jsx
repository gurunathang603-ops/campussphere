import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import api, { mediaUrl } from "../services/api";
import Reveal from "../components/Reveal";
import Loader from "../components/Loader";

const CATS = [["", "All"], ["student", "Student"], ["faculty", "Faculty"], ["award", "Award"], ["hackathon", "Hackathon"], ["sports", "Sports"], ["conference", "Conference"]];

export default function Achievements() {
  const [cat, setCat] = useState("");
  const [items, setItems] = useState(null);
  useEffect(() => { setItems(null); api.get("/achievements/", { params: cat ? { category: cat } : {} }).then((r) => setItems(r.data)); }, [cat]);

  return (
    <div>
      <section className="bg-navy-900 text-white pt-40 pb-16">
        <div className="container-page">
          <p className="eyebrow text-gold">Celebrating success</p>
          <h1 className="text-4xl font-semibold mt-2">Achievements</h1>
        </div>
      </section>
      <section className="section container-page">
        <div className="flex gap-2 flex-wrap mb-10">
          {CATS.map(([v, l]) => (
            <button key={v} onClick={() => setCat(v)} className={`px-4 py-2 rounded-full text-sm font-medium ${cat === v ? "bg-navy text-white" : "bg-white border border-black/10 text-ink/60"}`}>{l}</button>
          ))}
        </div>
        {!items ? <Loader /> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((a, i) => (
              <Reveal key={a.id} delay={(i % 6) * 0.06}>
                <div className="card overflow-hidden h-full group">
                  <div className="aspect-[16/10] overflow-hidden bg-gradient-to-br from-navy to-gold-600">
                    {a.image && <img src={mediaUrl(a.image)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />}
                  </div>
                  <div className="p-5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-600 mb-2"><Award size={13} />{a.category_label.toUpperCase()}</span>
                    <h3 className="font-semibold leading-snug">{a.title}</h3>
                    {a.person_name && <p className="text-sm text-ink/50 mt-1">{a.person_name}</p>}
                    {a.date && <p className="text-xs text-ink/40 mt-2">{new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>}
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
