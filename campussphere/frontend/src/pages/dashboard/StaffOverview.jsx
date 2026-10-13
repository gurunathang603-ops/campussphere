import { useEffect, useState } from "react";
import { CalendarDays, FileText, Megaphone, Award } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Reveal from "../../components/Reveal";

export default function StaffOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/stats/").then((r) => setStats(r.data)); }, []);

  const cards = [
    ["Total events", stats?.events_total, CalendarDays, "indigo"],
    ["Upcoming events", stats?.upcoming_events, CalendarDays, "gold"],
    ["Documents", stats?.documents, FileText, "emerald"],
    ["Announcements", stats?.announcements, Megaphone, "rose"],
  ];
  const tones = { indigo: "bg-indigo-50 text-indigo", gold: "bg-gold-50 text-gold-600", emerald: "bg-emerald-50 text-emerald-600", rose: "bg-rose-50 text-rose-600" };

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="card p-7 bg-gradient-to-br from-navy to-indigo text-white">
          <p className="text-white/60 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-semibold mt-1">{user?.full_name}</h1>
          <p className="text-white/70 text-sm mt-2">{user?.profile?.designation} · Staff ID {user?.profile?.staff_id}</p>
        </div>
      </Reveal>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map(([label, val, Icon, tone], i) => (
          <Reveal key={label} delay={i * 0.05}>
            <div className="card p-5 flex items-center gap-4">
              <span className={`h-11 w-11 rounded-xl flex items-center justify-center ${tones[tone]}`}><Icon size={19} /></span>
              <div><p className="text-xl font-semibold">{val ?? "—"}</p><p className="text-xs text-ink/50">{label}</p></div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <div className="card p-6 text-sm text-ink/60 leading-relaxed">
          Use the sidebar to add events, upload documents and the timetable, publish announcements, and record achievements.
          Changes go live on the public website immediately after saving.
        </div>
      </Reveal>
    </div>
  );
}
