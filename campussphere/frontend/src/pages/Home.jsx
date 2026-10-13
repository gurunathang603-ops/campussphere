import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, ClipboardList, BookOpen, Users, Megaphone, Trophy, Presentation, FileText, ArrowRight, Sparkles } from "lucide-react";
import api, { mediaUrl } from "../services/api";
import { useSite } from "../context/SiteContext";
import Reveal from "../components/Reveal";
import AnimatedCounter from "../components/AnimatedCounter";
import EventCard from "../components/EventCard";
import Badge from "../components/Badge";
import Loader from "../components/Loader";

const QUICK = [
  { to: "/events", label: "Events", icon: CalendarDays, hue: "from-indigo to-blue-500" },
  { to: "/timetable", label: "Timetable", icon: ClipboardList, hue: "from-emerald-500 to-teal-500" },
  { to: "/syllabus", label: "Syllabus", icon: BookOpen, hue: "from-gold to-orange-400" },
  { to: "/faculty", label: "Faculty", icon: Users, hue: "from-violet-500 to-purple-500" },
  { to: "/announcements", label: "Announcements", icon: Megaphone, hue: "from-rose-500 to-pink-500" },
  { to: "/events?type=sports_day", label: "Sports", icon: Trophy, hue: "from-lime-500 to-emerald-500" },
  { to: "/events?type=conference", label: "Conferences", icon: Presentation, hue: "from-sky-500 to-indigo" },
  { to: "/documents", label: "Documents", icon: FileText, hue: "from-slate-500 to-slate-700" },
];

export default function Home() {
  const { settings, dept, stats } = useSite();
  const [events, setEvents] = useState(null);
  const [announcements, setAnnouncements] = useState(null);

  useEffect(() => {
    api.get("/events/", { params: { upcoming: 1, limit: 3 } }).then((r) => setEvents(r.data));
    api.get("/announcements/", { params: { limit: 3 } }).then((r) => setAnnouncements(r.data));
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-900 text-white min-h-[92vh] flex items-center">
        <div className="absolute inset-0">
          {settings?.banner && <img src={mediaUrl(settings.banner)} className="w-full h-full object-cover opacity-25" alt="" />}
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800/95 to-indigo-600/40" />
          <motion.div className="absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-indigo/30 blur-3xl animate-drift" />
          <motion.div className="absolute bottom-0 -left-20 h-[420px] w-[420px] rounded-full bg-gold/20 blur-3xl animate-drift" style={{ animationDelay: "3s" }} />
        </div>

        <div className="container-page relative z-10 pt-40 pb-16 grid lg:grid-cols-[1.15fr_.85fr] gap-14 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-8">
              {settings?.college_logo && <img src={mediaUrl(settings.college_logo)} className="h-20 w-20 shrink-0 rounded-md bg-white p-1 object-contain shadow-sm" alt="College logo" />}
              {dept?.logo && <img src={mediaUrl(dept.logo)} className="h-20 w-20 shrink-0 rounded-md bg-white p-1 object-contain shadow-sm" alt="AI and ML department logo" />}
              <div className="text-sm text-white/60 leading-tight">
                <p>{settings?.college_name}</p>
                <p className="text-white/40">{settings?.college_tagline}</p>
              </div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
              className="text-[38px] sm:text-[54px] leading-[1.05] font-semibold tracking-tight">
              {dept?.name || "Department"}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-5 text-white/65 text-lg max-w-lg">
              {dept?.tagline || "Innovate. Learn. Lead."}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-9 flex flex-wrap gap-4">
              <Link to="/department" className="btn-primary">Explore department <ArrowRight size={17} /></Link>
              <a href="#ai-cta" className="btn-outline"><Sparkles size={16} className="text-gold" /> AI Assistant</a>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative">
            <div className="rounded-3xl overflow-hidden shadow-pop border border-white/10 aspect-[4/5]">
              {dept?.hero_image ? <img src={mediaUrl(dept.hero_image)} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-gradient-to-br from-indigo to-navy" />}
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white text-ink rounded-2xl shadow-pop px-6 py-4">
              <p className="text-2xl font-display font-bold text-navy"><AnimatedCounter value={stats?.students || 0} /></p>
              <p className="text-xs text-ink/50">Students enrolled</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* QUICK ACCESS */}
      <section className="section container-page">
        <Reveal><p className="eyebrow">Quick access</p></Reveal>
        <Reveal delay={0.05}><h2 className="text-3xl font-semibold mt-2 mb-10">Everything students need, one tap away</h2></Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUICK.map((q, i) => (
            <Reveal key={q.to} delay={i * 0.05}>
              <Link to={q.to} className="card p-6 flex flex-col gap-4 hover:shadow-pop hover:-translate-y-1 transition-all duration-300 group h-full">
                <span className={`h-11 w-11 rounded-xl bg-gradient-to-br ${q.hue} text-white flex items-center justify-center shadow-card`}>
                  <q.icon size={19} />
                </span>
                <span className="font-medium text-[15px]">{q.label}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* LATEST EVENTS */}
      <section className="section bg-white">
        <div className="container-page">
          <div className="flex items-end justify-between mb-10">
            <div>
              <Reveal><p className="eyebrow">What's on</p></Reveal>
              <Reveal delay={0.05}><h2 className="text-3xl font-semibold mt-2">Upcoming events</h2></Reveal>
            </div>
            <Link to="/events" className="hidden sm:flex items-center gap-1 text-sm font-medium text-indigo">View all <ArrowRight size={15} /></Link>
          </div>
          {!events ? <Loader /> : events.length === 0 ? <p className="text-ink/50">No upcoming events right now — check back soon.</p> : (
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((e, i) => <Reveal key={e.id} delay={i * 0.08}><EventCard event={e} /></Reveal>)}
            </div>
          )}
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="section bg-navy-900 text-white relative overflow-hidden">
        <div className="container-page relative z-10">
          <Reveal><p className="eyebrow text-gold">By the numbers</p></Reveal>
          <Reveal delay={0.05}><h2 className="text-3xl font-semibold mt-2 mb-12">Department highlights</h2></Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              ["students", "Students"], ["staff", "Staff"], ["events_conducted", "Events conducted"],
              ["workshops", "Workshops"], ["conferences", "Conferences"], ["achievements", "Achievements"],
            ].map(([key, label], i) => (
              <Reveal key={key} delay={i * 0.06}>
                <p className="text-4xl font-display font-bold text-gold"><AnimatedCounter value={stats?.[key] || 0} suffix="+" /></p>
                <p className="text-sm text-white/50 mt-1">{label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ANNOUNCEMENTS */}
      <section className="section container-page">
        <div className="flex items-end justify-between mb-10">
          <div>
            <Reveal><p className="eyebrow">Stay informed</p></Reveal>
            <Reveal delay={0.05}><h2 className="text-3xl font-semibold mt-2">Recent announcements</h2></Reveal>
          </div>
          <Link to="/announcements" className="hidden sm:flex items-center gap-1 text-sm font-medium text-indigo">View all <ArrowRight size={15} /></Link>
        </div>
        {!announcements ? <Loader /> : (
          <div className="space-y-4">
            {announcements.map((a, i) => (
              <Reveal key={a.id} delay={i * 0.06}>
                <Link to="/announcements" className="card p-5 flex items-start gap-4 hover:shadow-pop transition-shadow">
                  <span className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo flex items-center justify-center shrink-0"><Megaphone size={17} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium truncate">{a.title}</h3>
                      {a.priority !== "normal" && <Badge tone={a.priority}>{a.priority_label.toUpperCase()}</Badge>}
                      {a.is_new && <Badge tone="new">NEW</Badge>}
                    </div>
                    <p className="text-sm text-ink/50 mt-1 line-clamp-1">{a.description}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section id="ai-cta" className="container-page pb-24">
        <Reveal>
          <div className="rounded-3xl bg-gradient-to-br from-indigo to-navy text-white p-10 sm:p-14 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div>
              <p className="eyebrow text-gold">Ask CampusSphere AI</p>
              <h3 className="text-2xl sm:text-3xl font-semibold mt-2 max-w-md">"When is the next hackathon?" — just ask the assistant in the corner.</h3>
            </div>
            <Sparkles size={64} className="text-gold/40 shrink-0" />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
