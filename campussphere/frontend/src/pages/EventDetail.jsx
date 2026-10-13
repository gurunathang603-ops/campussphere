import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, Users, FileText, ArrowLeft, Trophy, ListChecks, Image as ImageIcon } from "lucide-react";
import api, { mediaUrl } from "../services/api";
import { getTheme } from "../eventThemes";
import Reveal from "../components/Reveal";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [eventState, setEventState] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [failedBanner, setFailedBanner] = useState("");
  const [failedGalleryImages, setFailedGalleryImages] = useState({});
  const [registrationBusy, setRegistrationBusy] = useState(false);
  const [registrationNotice, setRegistrationNotice] = useState(null);

  useEffect(() => {
    let active = true;
    api.get(`/events/${id}/`)
      .then((r) => { if (active) setEventState({ id, event: r.data }); })
      .catch(() => { if (active) setEventState({ id, error: true }); });
    return () => { active = false; };
  }, [id]);

  const event = eventState?.id === id ? eventState.event : null;
  const loadError = eventState?.id === id && eventState.error;
  if (!event) return loadError
    ? <div className="container-page pt-40 pb-20 text-center text-ink/60">Could not load this event. Please try again.</div>
    : <div className="pt-40"><Loader /></div>;
  const theme = getTheme(event.event_type);
  const Icon = theme.icon;
  const participants = (event.participants || "").split("\n").filter(Boolean);
  const registeredCount = event.registered_students_count ?? 0;

  const updateRegistration = async () => {
    setRegistrationBusy(true);
    setRegistrationNotice(null);
    try {
      const response = event.is_registered
        ? await api.delete(`/events/${id}/unregister/`)
        : await api.post(`/events/${id}/register/`);
      setEventState((current) => current?.id === id
        ? { ...current, event: { ...current.event, ...response.data } }
        : current);
      setRegistrationNotice({
        id,
        type: "success",
        message: response.data.is_registered
          ? "Your student registration is confirmed."
          : "Your registration has been cancelled.",
      });
    } catch (error) {
      const detail = error?.response?.data?.detail;
      setRegistrationNotice({
        id,
        type: "error",
        message: typeof detail === "string" ? detail : "Could not update your registration. Please try again.",
      });
    } finally {
      setRegistrationBusy(false);
    }
  };

  return (
    <div>
      <section className={`relative ${theme.bg} text-white pt-32 pb-14 sm:pt-36 sm:pb-20 overflow-hidden`}>
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: theme.pattern }} />
        {event.banner && failedBanner !== event.banner && (
          <img src={mediaUrl(event.banner)} onError={() => setFailedBanner(event.banner)}
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" alt="" />
        )}
        <div className="container-page relative z-10">
          <Link to="/events" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-6"><ArrowLeft size={15} /> All events</Link>
          <div className="flex items-center gap-3 mb-5">
            <span className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center"><Icon size={20} /></span>
            <span className="text-sm font-medium text-white/70 uppercase tracking-wide">{theme.label}</span>
          </div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`text-3xl sm:text-5xl ${theme.font} font-semibold max-w-4xl leading-tight break-words`}>
            {event.title}
          </motion.h1>
          <div className="flex flex-wrap gap-2.5 sm:gap-3 mt-7 text-sm text-white/90">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-2"><CalendarDays size={16} />{new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            {event.time && <span className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-2"><Clock size={16} />{event.time.slice(0, 5)}</span>}
            {event.venue && <span className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-2 max-w-full"><MapPin size={16} className="shrink-0" /><span className="break-words">{event.venue}</span></span>}
            <span className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-2">
              <Users size={16} />{registeredCount} {registeredCount === 1 ? "student registered" : "students registered"}
            </span>
          </div>
        </div>
      </section>

      <section className="section container-page">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] items-start gap-8 lg:gap-12">
          <div className="min-w-0 space-y-12">
            <Reveal>
              <h2 className="text-2xl font-semibold mb-4">About this event</h2>
              <p className="text-ink/60 leading-relaxed whitespace-pre-line">{event.description}</p>
            </Reveal>

            {event.schedule.length > 0 && (
              <Reveal>
                <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2"><ListChecks size={22} className={theme.accent} />Schedule</h2>
                <div className="space-y-0">
                  {event.schedule.map((s, i) => (
                    <div key={i} className="flex gap-4 sm:gap-5 pb-6 relative">
                      {i < event.schedule.length - 1 && <span className="absolute left-[54px] top-6 bottom-0 w-px bg-black/10" />}
                      <span className={`text-xs font-semibold w-[70px] shrink-0 pt-1 ${theme.accent}`}>{s.time}</span>
                      <span className={`h-3 w-3 rounded-full mt-1.5 shrink-0 ${theme.bg}`} />
                      <div className="min-w-0">
                        <p className="font-medium break-words">{s.title}</p>
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
                    <button key={g.id} onClick={() => setLightbox(g.image)} disabled={failedGalleryImages[g.id]}
                      aria-label={g.caption || `Open ${event.title} gallery image`}
                      className="aspect-square rounded-xl overflow-hidden bg-mist disabled:cursor-default">
                      {failedGalleryImages[g.id]
                        ? <span className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-mist to-white text-ink/35"><ImageIcon size={24} /><span className="px-2 text-center text-xs">Image unavailable</span></span>
                        : <img src={mediaUrl(g.image)} alt={g.caption || event.title}
                          onError={() => setFailedGalleryImages((images) => ({ ...images, [g.id]: true }))}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />}
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

          <aside className="min-w-0 space-y-6">
            {event.is_upcoming && !event.is_cancelled && (
              <Reveal>
                <div className="card p-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Users size={18} className={theme.accent} />Student registration</h3>
                  <p className="text-sm text-ink/60">
                    {registeredCount} {registeredCount === 1 ? "student has" : "students have"} registered.
                  </p>
                  {user?.role === "student" ? (
                    <button onClick={updateRegistration} disabled={registrationBusy}
                      className={event.is_registered ? "btn-outline !border-navy/20 !text-navy hover:!bg-navy/5 w-full" : "btn-navy w-full"}>
                      {registrationBusy ? "Updating…" : event.is_registered ? "Cancel registration" : "Register as a student"}
                    </button>
                  ) : !user ? (
                    <Link to="/login" className="btn-navy w-full">Sign in as a student to register</Link>
                  ) : (
                    <p className="text-xs text-ink/50">Registration is available to student accounts.</p>
                  )}
                  {event.registration_link && (
                    <a href={event.registration_link} target="_blank" rel="noreferrer"
                      className="block text-center text-sm font-medium text-indigo hover:underline">Open external registration form</a>
                  )}
                  {registrationNotice?.id === id && (
                    <p role={registrationNotice.type === "error" ? "alert" : "status"}
                      className={`rounded-lg px-3 py-2 text-sm ${registrationNotice.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {registrationNotice.message}
                    </p>
                  )}
                </div>
              </Reveal>
            )}
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
          </aside>
        </div>
      </section>

      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-[90] flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          <img src={mediaUrl(lightbox)} className="max-h-[85vh] max-w-full rounded-lg" alt={event.title} />
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
