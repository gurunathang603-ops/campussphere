import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { Users, UserCog, CalendarDays, FileText, Award, Megaphone } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Reveal from "../../components/Reveal";

const COLORS = ["#3452E1", "#E8A33D", "#10B981", "#F43F5E", "#8B5CF6", "#0EA5E9", "#F59E0B", "#14B8A6"];

export default function HODOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/stats/").then((r) => setStats(r.data)); }, []);

  const cards = [
    ["Students", stats?.students, Users, "indigo"], ["Staff", stats?.staff, UserCog, "emerald"],
    ["Total events", stats?.events_total, CalendarDays, "gold"], ["Upcoming", stats?.upcoming_events, CalendarDays, "rose"],
    ["Documents", stats?.documents, FileText, "violet"], ["Announcements", stats?.announcements, Megaphone, "sky"],
  ];
  const tones = { indigo: "bg-indigo-50 text-indigo", emerald: "bg-emerald-50 text-emerald-600", gold: "bg-gold-50 text-gold-600",
    rose: "bg-rose-50 text-rose-600", violet: "bg-violet-50 text-violet-600", sky: "bg-sky-50 text-sky-600" };

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="card p-7 bg-gradient-to-br from-navy to-indigo text-white">
          <p className="text-white/60 text-sm">Welcome back,</p>
          <h1 className="text-2xl font-semibold mt-1">{user?.full_name}</h1>
          <p className="text-white/70 text-sm mt-2">Head of the Department</p>
        </div>
      </Reveal>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map(([label, val, Icon, tone], i) => (
          <Reveal key={label} delay={i * 0.04}>
            <div className="card p-5">
              <span className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${tones[tone]}`}><Icon size={17} /></span>
              <p className="text-xl font-semibold">{val ?? "—"}</p><p className="text-xs text-ink/50">{label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Reveal>
          <div className="card p-6">
            <h2 className="font-semibold mb-5">Events by type</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats?.events_by_type || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3452E1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="card p-6">
            <h2 className="font-semibold mb-5">Documents by category</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats?.documents_by_category || []} dataKey="count" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {(stats?.documents_by_category || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
