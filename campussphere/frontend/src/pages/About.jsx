import { GraduationCap, Target, Eye, Quote } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { mediaUrl } from "../services/api";
import Reveal from "../components/Reveal";
import AnimatedCounter from "../components/AnimatedCounter";

export default function About() {
  const { settings, dept, stats } = useSite();
  return (
    <div>
      <section className="bg-navy-900 text-white pt-40 pb-20">
        <div className="container-page">
          <Reveal><p className="eyebrow text-gold">About us</p></Reveal>
          <Reveal delay={0.05}><h1 className="text-4xl sm:text-5xl font-semibold mt-3 max-w-2xl">{settings?.college_name}</h1></Reveal>
          <Reveal delay={0.1}><p className="text-white/60 mt-4 max-w-xl">{settings?.college_tagline}</p></Reveal>
        </div>
      </section>

      <section className="section container-page grid lg:grid-cols-2 gap-14 items-center">
        <Reveal>
          <div className="rounded-3xl overflow-hidden shadow-card aspect-[4/3]">
            {dept?.about_image ? <img src={mediaUrl(dept.about_image)} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-gradient-to-br from-navy to-indigo" />}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="eyebrow">Who we are</p>
          <h2 className="text-3xl font-semibold mt-2 mb-5">A community built on curiosity</h2>
          <p className="text-ink/60 leading-relaxed">{dept?.description}</p>
          <div className="grid grid-cols-3 gap-6 mt-8">
            {[["students", "Students"], ["staff", "Staff"], ["achievements", "Achievements"]].map(([k, l]) => (
              <div key={k}>
                <p className="text-3xl font-display font-bold text-navy"><AnimatedCounter value={stats?.[k] || 0} /></p>
                <p className="text-xs text-ink/50 mt-1">{l}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="section bg-white">
        <div className="container-page grid md:grid-cols-2 gap-6">
          <Reveal>
            <div className="card p-8 h-full">
              <Eye className="text-indigo mb-4" size={26} />
              <h3 className="text-xl font-semibold mb-3">Our vision</h3>
              <p className="text-ink/60 leading-relaxed">{dept?.vision}</p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="card p-8 h-full">
              <Target className="text-gold-600 mb-4" size={26} />
              <h3 className="text-xl font-semibold mb-3">Our mission</h3>
              <p className="text-ink/60 leading-relaxed">{dept?.mission}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {dept?.hod && (
        <section className="section container-page">
          <Reveal>
            <div className="card p-10 grid sm:grid-cols-[auto_1fr] gap-8 items-center">
              <span className="h-20 w-20 rounded-full bg-navy text-white flex items-center justify-center"><GraduationCap size={32} /></span>
              <div>
                <Quote className="text-gold mb-2" size={22} />
                <p className="text-ink/70 italic leading-relaxed">{dept.hod_message}</p>
                <p className="mt-4 font-semibold">{dept.hod.name}</p>
                <p className="text-sm text-ink/50">Head of the Department</p>
              </div>
            </div>
          </Reveal>
        </section>
      )}
    </div>
  );
}
