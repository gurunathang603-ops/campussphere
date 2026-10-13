import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Megaphone, BookOpen, FileText, ClipboardList, TrendingUp, Bell } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Reveal from "../../components/Reveal";
import Badge from "../../components/Badge";
import Loader from "../../components/Loader";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [today, setToday] = useState(null);
  const [events, setEvents] = useState(null);
  const [announcements, setAnnouncements] = useState(null);
  const p = user?.profile || {};

  useEffect(() => {
    const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
    api.get("/timetable/", { params: { year: p.year, section: p.section, day } }).then((r) => setToday(r.data.sort((a, b) => a.period - b.period)));
    api.get("/events/", { params: { upcoming: 1, limit: 4 } }).then((r) => setEvents(r.data));
    api.get("/announcements/", { params: { limit: 4 } }).then((r) => setAnnouncements(r.data));
  }, []);

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="card p-6 sm:p-8 bg-gradient-to-br from-navy to-indigo text-white">
          <p className="text-white/60 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-semibold mt-1">{user?.full_name}</h1>
          <div className="flex flex-wrap gap-x-8 gap-y-2 mt-5 text-sm text-white/80">
            <span>Register No. <strong className="text-white">{p.register_number}</strong></span>
            <span>Year <strong className="text-white">{p.year}</strong></span>
            <span>Section <strong className="text-white">{p.section}</strong></span>
            <span>Department <strong className="text-white">{user?.department?.name}</strong></span>
          </div>
        </div>
      </Reveal>

      <div className="grid sm:grid-cols-3 gap-5">
        <Reveal><StatCard icon={TrendingUp} label="Attendance" value={`${p.attendance}%`} tone="emerald" /></Reveal>
        <Reveal delay={0.05}><StatCard icon={CalendarDays} label="Upcoming events" value={events?.length ?? "—"} tone="indigo" /></Reveal>
        <Reveal delay={0.1}><StatCard icon={ClipboardList} label="Today's periods" value={today?.length ?? "—"} tone="gold" /></Reveal>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Reveal>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Today's timetable</h2>
              <Link to="/timetable" className="text-xs font-medium text-indigo">Full timetable</Link>
            </div>
            {!today ? <Loader /> : today.length === 0 ? <p className="text-sm text-ink/40 py-6 text-center">No classes today.</p> : (
              <div className="space-y-2">
                {today.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-mist">
                    <span className="h-8 w-8 rounded-lg bg-indigo text-white text-xs font-bold flex items-center justify-center">{t.period}</span>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{t.subject}</p><p className="text-xs text-ink/40">{t.faculty_name} {t.room && `· ${t.room}`}</p></div>
                    {t.start_time && <span className="text-xs text-ink/40">{t.start_time.slice(0, 5)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Upcoming events</h2>
              <Link to="/events" className="text-xs font-medium text-indigo">View all</Link>
            </div>
            {!events ? <Loader /> : events.length === 0 ? <p className="text-sm text-ink/40 py-6 text-center">No upcoming events.</p> : (
              <div className="space-y-2">
                {events.map((e) => (
                  <Link key={e.id} to={`/events/${e.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-mist hover:bg-black/5">
                    <span className="h-8 w-8 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center shrink-0"><CalendarDays size={15} /></span>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{e.title}</p><p className="text-xs text-ink/40">{new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p></div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      </div>

      <Reveal>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Announcements</h2>
            <Link to="/announcements" className="text-xs font-medium text-indigo">View all</Link>
          </div>
          {!announcements ? <Loader /> : (
            <div className="space-y-2">
              {announcements.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-mist">
                  <Megaphone size={16} className="text-indigo mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><p className="text-sm font-medium">{a.title}</p>{a.priority !== "normal" && <Badge tone={a.priority}>{a.priority_label}</Badge>}</div>
                    <p className="text-xs text-ink/40 line-clamp-1 mt-0.5">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      <div className="grid sm:grid-cols-3 gap-4">
        <QuickLink to="/syllabus" icon={BookOpen} label="Syllabus" />
        <QuickLink to="/documents" icon={FileText} label="Academic documents" />
        <QuickLink to="/announcements" icon={Bell} label="Notifications" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = { emerald: "bg-emerald-50 text-emerald-600", indigo: "bg-indigo-50 text-indigo", gold: "bg-gold-50 text-gold-600" };
  return (
    <div className="card p-5 flex items-center gap-4">
      <span className={`h-11 w-11 rounded-xl flex items-center justify-center ${tones[tone]}`}><Icon size={19} /></span>
      <div><p className="text-xl font-semibold">{value}</p><p className="text-xs text-ink/50">{label}</p></div>
    </div>
  );
}
function QuickLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="card p-5 flex items-center gap-3 hover:shadow-pop transition-shadow">
      <span className="h-10 w-10 rounded-lg bg-navy text-white flex items-center justify-center"><Icon size={17} /></span>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}
