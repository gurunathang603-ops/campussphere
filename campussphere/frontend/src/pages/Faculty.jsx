import { useEffect, useState } from "react";
import { Mail, Phone } from "lucide-react";
import api, { mediaUrl } from "../services/api";
import Reveal from "../components/Reveal";
import Loader from "../components/Loader";

export default function Faculty() {
  const [faculty, setFaculty] = useState(null);
  useEffect(() => { api.get("/faculty/").then((r) => setFaculty(r.data)); }, []);

  return (
    <div>
      <section className="bg-navy-900 text-white pt-40 pb-16">
        <div className="container-page">
          <p className="eyebrow text-gold">Artificial Intelligence &amp; Machine Learning</p>
          <h1 className="text-4xl font-semibold mt-2">Staff information</h1>
        </div>
      </section>
      <section className="section container-page">
        {!faculty ? <Loader /> : (
          <div>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Department staff</h2>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium">{faculty.length} Staff</span>
          </div>
          <div className="grid gap-4">
            {faculty.map((f, i) => (
              <Reveal key={f.id} delay={(i % 8) * 0.05}>
                <div className="card p-4 flex items-center gap-4 sm:gap-6">
                  <div className="h-32 w-24 sm:h-40 sm:w-32 shrink-0 border-l-4 border-navy overflow-hidden bg-mist flex items-center justify-center">
                    {f.photo ? <img src={mediaUrl(f.photo)} className="w-full h-full object-cover" alt={f.name} />
                      : <span className="font-display text-2xl font-semibold text-navy">{f.name.split(/\s+/).filter((part) => !["Dr.", "Mr.", "Ms."].includes(part)).map((part) => part[0]).slice(0, 2).join("")}</span>}
                  </div>
                  <div className="min-w-0 text-navy">
                    <p className="font-semibold text-lg leading-snug">{f.name}</p>
                    <p className="mt-1"><strong className="font-semibold">Designation:</strong> {f.designation}</p>
                    {f.qualification && <p className="mt-1"><strong className="font-semibold">Qualification:</strong> {f.qualification}</p>}
                    {f.phone && <p className="mt-1"><strong className="font-semibold">Mobile:</strong> <a href={`tel:${f.phone}`} className="hover:underline">{f.phone}</a></p>}
                    {f.email && <p className="mt-1 break-all"><strong className="font-semibold">Mail ID:</strong> <a href={`mailto:${f.email}`} className="hover:underline">{f.email}</a></p>}
                    {f.specialization && <p className="text-xs text-ink/50 mt-2">{f.specialization}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {f.subjects_list.slice(0, 3).map((s) => <span key={s} className="text-[10px] bg-mist px-2 py-1 text-ink/50">{s}</span>)}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          </div>
        )}
      </section>
    </div>
  );
}
