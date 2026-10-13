import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Briefcase, ShieldCheck, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSite } from "../context/SiteContext";
import { mediaUrl } from "../services/api";

const ROLES = [
  { key: "student", label: "Student", icon: GraduationCap, hint: "Register number" },
  { key: "staff", label: "Staff", icon: Briefcase, hint: "Staff ID" },
  { key: "hod", label: "HOD", icon: ShieldCheck, hint: "HOD username" },
];
const DASH = { student: "/dashboard/student", staff: "/dashboard/staff", hod: "/dashboard/hod" };

export default function Login() {
  const [role, setRole] = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const { settings } = useSite();
  const nav = useNavigate();
  const active = ROLES.find((r) => r.key === role);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const user = await login(username.trim(), password, role);
      nav(user.must_change_password ? "/change-password" : DASH[user.role]);
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4 py-20 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gold/10 blur-3xl" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          {settings?.college_logo && <img src={mediaUrl(settings.college_logo)} className="h-10 w-10 shrink-0 rounded-md bg-white p-0.5 object-contain" alt="College logo" />}
          <span className="font-display font-semibold text-white text-lg">CampusSphere</span>
        </Link>
        <div className="bg-white rounded-3xl shadow-pop p-8">
          <h1 className="text-2xl font-semibold text-center">Welcome back</h1>
          <p className="text-center text-sm text-ink/50 mt-1 mb-7">Sign in to access your dashboard</p>

          <div className="grid grid-cols-3 gap-2 mb-7 bg-mist rounded-xl p-1.5">
            {ROLES.map((r) => (
              <button key={r.key} type="button" onClick={() => { setRole(r.key); setError(""); }}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-lg text-xs font-medium transition-all ${role === r.key ? "bg-navy text-white shadow-card" : "text-ink/50 hover:text-ink"}`}>
                <r.icon size={17} /> {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink/50 mb-1.5 block">{active.hint}</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required className="input" placeholder={`Enter your ${active.hint.toLowerCase()}`} />
            </div>
            <div>
              <label className="text-xs font-medium text-ink/50 mb-1.5 block">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="input pr-11" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40">
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button disabled={busy} className="btn-navy w-full">
              {busy ? "Signing in…" : <>Sign in as {active.label} <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-xs text-ink/40 mt-6">Demo credentials are temporary. You must choose your own password after signing in.</p>
        </div>
      </motion.div>
    </div>
  );
}
