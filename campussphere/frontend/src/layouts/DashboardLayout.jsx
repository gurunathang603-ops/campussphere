import { useState } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";
import { Menu, X, LogOut, Sparkles, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AIChatWidget from "../components/AIChatWidget";
import NotificationBell from "../components/NotificationBell";

export default function DashboardLayout({ links, roleLabel }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const Sidebar = (
    <div className="flex flex-col h-full">
      <Link to="/" className="flex items-center gap-2 px-6 h-[72px] border-b border-white/10 shrink-0">
        <Sparkles size={18} className="text-gold" />
        <span className="font-display font-semibold text-white">CampusSphere</span>
      </Link>
      <div className="px-6 py-5 border-b border-white/10">
        <p className="text-white font-medium text-sm">{user?.full_name}</p>
        <p className="text-white/40 text-xs mt-0.5">{roleLabel}</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${isActive ? "bg-white/10 text-gold border-r-2 border-gold" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
            <l.icon size={17} /> {l.label}
          </NavLink>
        ))}
      </nav>
      <Link to="/change-password" onClick={() => setOpen(false)} className="flex items-center gap-3 px-6 py-3 text-sm text-white/60 hover:text-white border-t border-white/10">
        <KeyRound size={16} /> Change password
      </Link>
      <button onClick={logout} className="flex items-center gap-3 px-6 py-4 text-sm text-white/50 hover:text-white border-t border-white/10">
        <LogOut size={16} /> Logout
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-mist flex">
      <aside className="hidden lg:block w-64 bg-navy-900 shrink-0 sticky top-0 h-screen">{Sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-navy-900">{Sidebar}</div>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-black/5 h-16 flex items-center justify-between px-4">
          <button onClick={() => setOpen(true)}><Menu size={22} /></button>
          <span className="font-display font-semibold text-navy">CampusSphere</span>
          <NotificationBell />
        </header>
        <main className="p-5 sm:p-8 max-w-6xl mx-auto">
          <Outlet />
        </main>
      </div>
      <AIChatWidget />
    </div>
  );
}
