import { Mail, Phone, Calendar, GraduationCap } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { mediaUrl } from "../services/api";
import Reveal from "../components/Reveal";

export default function Department() {
  const { dept } = useSite();
  if (!dept) return null;
  return (
    <div>
      <section className="relative bg-navy-900 text-white pt-40 pb-24 overflow-hidden">
        {dept.hero_image && <img src={mediaUrl(dept.hero_image)} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="" />}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/80" />
        <div className="container-page relative z-10">
          <Reveal><div className="flex items-center gap-4 mb-6">
            {dept.logo && <img src={mediaUrl(dept.logo)} className="h-16 w-16 rounded-full ring-2 ring-white/20" alt="" />}
            <div>
              <p className="text-gold text-sm font-medium">{dept.code} · Est. {dept.established_year}</p>
              <h1 className="text-3xl sm:text-4xl font-semibold">{dept.name}</h1>
            </div>
          </div></Reveal>
          <Reveal delay={0.1}><p className="text-white/60 max-w-xl">{dept.tagline}</p></Reveal>
        </div>
      </section>

      <section className="section container-page grid lg:grid-cols-[1.6fr_1fr] gap-12">
        <div className="space-y-10">
          <Reveal>
            <h2 className="text-2xl font-semibold mb-4">Overview</h2>
            <p className="text-ink/60 leading-relaxed">{dept.description}</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="text-2xl font-semibold mb-4">Programmes offered</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {dept.programs_list.map((p) => (
                <div key={p} className="card p-4 flex items-center gap-3">
                  <GraduationCap size={18} className="text-indigo shrink-0" />
                  <span className="text-sm font-medium">{p}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-2xl font-semibold mb-4">Message from the HOD</h2>
            <div className="card p-7 italic text-ink/60 leading-relaxed">"{dept.hod_message}"</div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="card p-7 sticky top-24 space-y-5">
            <h3 className="font-semibold">Department contact</h3>
            {dept.hod && (
              <div>
                <p className="text-xs text-ink/40 uppercase tracking-wide mb-1">Head of Department</p>
                <p className="font-medium">{dept.hod.name}</p>
                <p className="text-sm text-ink/50">{dept.hod.qualification}</p>
              </div>
            )}
            {dept.email && <p className="flex items-center gap-2 text-sm text-ink/60"><Mail size={15} />{dept.email}</p>}
            {dept.phone && <p className="flex items-center gap-2 text-sm text-ink/60"><Phone size={15} />{dept.phone}</p>}
            <p className="flex items-center gap-2 text-sm text-ink/60"><Calendar size={15} />Established {dept.established_year}</p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
