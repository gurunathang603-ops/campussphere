import { useEffect, useState } from "react";
import { FileText, Download, Eye } from "lucide-react";
import api, { mediaUrl } from "../services/api";
import Reveal from "../components/Reveal";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";

export default function Syllabus() {
  const [regulation, setRegulation] = useState("R2021");
  const [semester, setSemester] = useState("");
  const [items, setItems] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    setItems(null);
    const params = { regulation };
    if (semester) params.semester = semester;
    api.get("/syllabus/", { params }).then((r) => setItems(r.data));
  }, [regulation, semester]);

  const grouped = (items || []).reduce((acc, s) => { (acc[s.semester] ||= []).push(s); return acc; }, {});

  return (
    <div>
      <section className="bg-navy-900 text-white pt-40 pb-16">
        <div className="container-page">
          <Reveal><p className="eyebrow text-gold">Academics</p></Reveal>
          <Reveal delay={0.05}><h1 className="text-4xl font-semibold mt-2">Syllabus</h1></Reveal>
        </div>
      </section>

      <section className="section container-page">
        <div className="flex flex-wrap gap-3 mb-10">
          <select value={regulation} onChange={(e) => setRegulation(e.target.value)} className="input w-auto">
            <option value="R2021">Regulation R2021</option>
          </select>
          <select value={semester} onChange={(e) => setSemester(e.target.value)} className="input w-auto">
            <option value="">All semesters</option>
            {Array.from({ length: 6 }, (_, i) => i + 1).map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>

        {!items ? <Loader /> : items.length === 0 ? <EmptyState title="No syllabus found" /> : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([sem, subs]) => (
              <Reveal key={sem}>
                <h2 className="text-xl font-semibold mb-4">Semester {sem}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subs.map((s) => (
                    <div key={s.id} className="card p-5 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <span className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo flex items-center justify-center shrink-0"><FileText size={17} /></span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm leading-snug">{s.subject_name}</p>
                          <p className="text-xs text-ink/40 mt-0.5">{s.subject_code} · {s.credits} credits</p>
                        </div>
                      </div>
                      {s.pdf && (
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => setPreview(s)} className="flex-1 text-xs font-medium flex items-center justify-center gap-1.5 py-2 rounded-lg bg-mist hover:bg-black/5"><Eye size={13} />Preview</button>
                          <a href={mediaUrl(s.pdf)} download className="flex-1 text-xs font-medium flex items-center justify-center gap-1.5 py-2 rounded-lg bg-navy text-white hover:bg-navy-600"><Download size={13} />Download</a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {preview && (
        <div className="fixed inset-0 bg-black/80 z-[90] flex items-center justify-center p-4 sm:p-10" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-black/5">
              <p className="font-medium text-sm truncate">{preview.subject_name}</p>
              <button onClick={() => setPreview(null)} className="text-ink/40 hover:text-ink text-sm">Close</button>
            </div>
            <iframe src={mediaUrl(preview.pdf)} title="Syllabus preview" className="w-full h-[calc(100%-49px)]" />
          </div>
        </div>
      )}
    </div>
  );
}
