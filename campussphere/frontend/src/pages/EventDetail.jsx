import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, Users, Link2, FileText, ArrowLeft, Trophy, ListChecks } from "lucide-react";
import api, { mediaUrl } from "../services/api";
import { getTheme } from "../eventThemes";
import Reveal from "../components/Reveal";
import Loader from "../components/Loader";

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => { setEvent(null); api.get(`/events/${id}/`).then((r) => setEvent(r.data)); }, [id]);

  if (!event) return <div className="pt-40"><Loader /></div>;
  const theme = getTheme(event.event_type);
  const Icon = theme.icon;
  const participants = event.participants.split("\n").filter(Boolean);

  return (
    <div>
      <section className={`relative ${theme.bg} text-white pt-36 pb-20 overflow-hidden`}>
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: theme.pattern }} />
        {event.banner && <img src={mediaUrl(event.banner)} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" alt="" />}
        <div className="container-page relative z-10">
          <Link to="/events" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-6"><ArrowLeft size={15} /> All events</Link>
          <div className="flex items-center gap-3 mb-5">
            <span className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center"><Icon size={20} /></span>
            <span className="text-sm font-medium text-white/70 uppercase tracking-wide">{theme.label}</span>
          </div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`text-3xl sm:text-5xl ${theme.font} font-semibold max-w-3xl leading-tight`}>
            {event.title}
          </motion.h1>
          <div className="flex flex-wrap gap-x-8 gap-y-3 mt-8 text-sm text-white/80">
            <span className="flex items-center gap-2"><CalendarDays size={16} />{new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            {event.time && <span className="flex items-center gap-2"><Clock size={16} />{event.time.slice(0, 5)}</span>}
            {event.venue && <span className="flex items-center gap-2"><MapPin size={16} />{event.venue}</span>}
            {event.participants_count > 0 && <span className="flex items-center gap-2"><Users size={16} />{event.participants_count} participants</span>}
          </div>
          {event.registration_link && event.is_upcoming && (
            <a href={event.registration_link} target="_blank" rel="noreferrer" className="btn-primary mt-8 inline-flex">Register now</a>
          )}
        </div>
      </section>

      <section className="section container-page grid lg:grid-cols-[1.5fr_1fr] gap-14">
        <div className="space-y-12">
          <Reveal>
            <h2 className="text-2xl font-semibold mb-4">About this event</h2>
            <p className="text-ink/60 leading-relaxed whitespace-pre-line">{event.description}</p>
          </Reveal>

          {event.schedule.length > 0 && (
            <Reveal>
              <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2"><ListChecks size={22} className={theme.accent} />Schedule</h2>
              <div className="space-y-0">
                {event.schedule.map((s, i) => (
                  <div key={i} className="flex gap-5 pb-6 relative">
                    {i < event.schedule.length - 1 && <span className="absolute left-[54px] top-6 bottom-0 w-px bg-black/10" />}
                    <span className={`text-xs font-semibold w-[70px] shrink-0 pt-1 ${theme.accent}`}>{s.time}</span>
                    <span className={`h-3 w-3 rounded-full mt-1.5 shrink-0 ${theme.bg}`} />
                    <div>
                      <p className="font-medium">{s.title}</p>
                      {s.speaker && <p className="text-sm text-ink/50">{s.speaker}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          {event.gallery.length > 0 && (
            <Reveal>
              <h2 className="text-2xl font-semibold mb-5">Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {event.gallery.map((g) => (
                  <button key={g.id} onClick={() => setLightbox(g.image)} className="aspect-square rounded-xl overflow-hidden">
                    <img src={mediaUrl(g.image)} alt={g.caption} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </button>
                ))}
              </div>
            </Reveal>
          )}

          {event.results && (
            <Reveal>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Trophy size={22} className={theme.accent} />Results</h2>
              <div className="card p-6 whitespace-pre-line text-ink/70 leading-relaxed">{event.results}</div>
            </Reveal>
          )}
        </div>

        <div className="space-y-6">
          <Reveal>
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold">Event details</h3>
              {event.organizers && <Info label="Organized by" value={event.organizers} />}
              {event.coordinator && <Info label="Faculty coordinator" value={event.coordinator} />}
              {participants.length > 0 && <Info label="Participants / teams" value={participants.join(", ")} />}
            </div>
          </Reveal>
          {event.documents.length > 0 && (
            <Reveal delay={0.06}>
              <div className="card p-6 space-y-3">
                <h3 className="font-semibold mb-1">Documents</h3>
                {event.documents.map((d) => (
                  <a key={d.id} href={`${d.download_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm p-3 rounded-lg bg-mist hover:bg-black/5">
                    <FileText size={16} className={theme.accent} /> {d.title}
                  </a>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-[90] flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          <img src={mediaUrl(lightbox)} className="max-h-[85vh] max-w-full rounded-lg" alt="" />
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink/40 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
