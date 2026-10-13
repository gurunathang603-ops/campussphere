import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api, { mediaUrl } from "../services/api";
import Reveal from "../components/Reveal";
import Loader from "../components/Loader";

const CATS = [["", "All"], ["events", "Events"], ["sports", "Sports"], ["conference", "Conference"], ["workshops", "Workshops"], ["cultural", "Cultural"], ["activities", "Activities"]];

export default function Gallery() {
  const [cat, setCat] = useState("");
  const [items, setItems] = useState(null);
  const [active, setActive] = useState(null);

  useEffect(() => { setItems(null); api.get("/gallery/", { params: cat ? { category: cat } : {} }).then((r) => setItems(r.data)); }, [cat]);

  return (
    <div>
      <section className="bg-navy-900 text-white pt-40 pb-16">
        <div className="container-page">
          <p className="eyebrow text-gold">Moments</p>
          <h1 className="text-4xl font-semibold mt-2">Department gallery</h1>
        </div>
      </section>
      <section className="section container-page">
        <div className="flex gap-2 flex-wrap mb-10">
          {CATS.map(([v, l]) => (
            <button key={v} onClick={() => setCat(v)} className={`px-4 py-2 rounded-full text-sm font-medium ${cat === v ? "bg-navy text-white" : "bg-white border border-black/10 text-ink/60"}`}>{l}</button>
          ))}
        </div>
        {!items ? <Loader /> : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
            {items.map((g, i) => (
              <Reveal key={g.id} delay={(i % 12) * 0.04} className="mb-3 break-inside-avoid">
                <button onClick={() => setActive(g)} className="block w-full rounded-xl overflow-hidden group">
                  <img src={mediaUrl(g.image)} alt={g.title} className="w-full h-auto group-hover:scale-105 transition-transform duration-500" />
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {active && (
        <div className="fixed inset-0 bg-black/90 z-[90] flex items-center justify-center p-6" onClick={() => setActive(null)}>
          <button className="absolute top-6 right-6 text-white/70 hover:text-white"><X size={26} /></button>
          <img src={mediaUrl(active.image)} className="max-h-[85vh] max-w-full rounded-lg" alt={active.title} />
        </div>
      )}
    </div>
  );
}
