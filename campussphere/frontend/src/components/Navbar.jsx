import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, Sparkles, ChevronDown } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { useAuth } from "../context/AuthContext";
import { mediaUrl } from "../services/api";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/department", label: "Department" },
  { label: "Events", children: [
    { to: "/events", label: "All events" },
    { to: "/calendar", label: "Calendar" },
  ] },
  {
    label: "Academics", children: [
      { to: "/timetable", label: "Timetable" },
      { to: "/syllabus", label: "Syllabus" },
      { to: "/faculty", label: "Faculty" },
    ],
  },
  { to: "/announcements", label: "Announcements" },
  { to: "/achievements", label: "Achievements" },
  { to: "/documents", label: "Documents" },
  { to: "/gallery", label: "Gallery" },
];

const DASH = { student: "/dashboard/student", staff: "/dashboard/staff", hod: "/dashboard/hod" };

export default function Navbar() {
  const { settings, dept } = useSite();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass = ({ isActive }) =>
    `text-[14.5px] font-medium transition-colors ${isActive ? "text-indigo" : scrolled ? "text-ink/70 hover:text-ink" : "text-white/85 hover:text-white"}`;

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-card" : "bg-transparent"}`}>
        <div className="container-page flex items-center justify-between h-[72px]">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            {settings?.college_logo && <img src={mediaUrl(settings.college_logo)} alt="College logo" className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-md bg-white p-0.5 object-contain" />}
            {dept?.logo && <img src={mediaUrl(dept.logo)} alt="AI and ML department logo" className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-md bg-white p-0.5 object-contain" />}
            <span className={`font-display font-semibold text-[17px] leading-none ${scrolled ? "text-navy" : "text-white"}`}>
              CampusSphere
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            {LINKS.map((l) =>
              l.children ? (
                <div key={l.label} className="relative" onMouseEnter={() => setOpenMenu(l.label)} onMouseLeave={() => setOpenMenu(null)}>
                  <button className={`flex items-center gap-1 text-[14.5px] font-medium ${scrolled ? "text-ink/70 hover:text-ink" : "text-white/85 hover:text-white"}`}>
                    {l.label} <ChevronDown size={14} />
                  </button>
                  <AnimatePresence>
                    {openMenu === l.label && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                        className="absolute top-full left-0 pt-3 w-44">
                        <div className="bg-white rounded-xl shadow-pop border border-black/5 py-2">
                          {l.children.map((c) => (
                            <NavLink key={c.to} to={c.to} className="block px-4 py-2 text-sm text-ink/70 hover:bg-mist hover:text-ink">{c.label}</NavLink>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>
              )
            )}
          </nav>

          <div className="flex items-center gap-1.5">
            <button onClick={() => setSearchOpen(true)} className={`h-10 w-10 rounded-full flex items-center justify-center transition ${scrolled ? "hover:bg-black/5 text-ink" : "hover:bg-white/10 text-white"}`}>
              <Search size={18} />
            </button>
            <NotificationBell />
            {user ? (
              <div className="hidden sm:flex items-center gap-2 ml-1">
                <button onClick={() => nav(DASH[user.role])} className={`text-sm font-medium px-4 py-2 rounded-full ${scrolled ? "bg-navy text-white" : "bg-white text-navy"}`}>
                  {user.first_name || "Dashboard"}
                </button>
                <button onClick={() => { logout(); nav("/"); }} className={`text-sm font-medium ${scrolled ? "text-ink/50" : "text-white/70"} hover:underline`}>Logout</button>
              </div>
            ) : (
              <Link to="/login" className={`hidden sm:inline-flex text-sm font-semibold px-5 py-2.5 rounded-full ml-1 ${scrolled ? "bg-navy text-white" : "bg-white text-navy"}`}>Login</Link>
            )}
            <button onClick={() => setMobileOpen(true)} className={`lg:hidden h-10 w-10 rounded-full flex items-center justify-center ${scrolled ? "text-ink" : "text-white"}`}>
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-[80] bg-navy-900 text-white" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.3 }}>
            <div className="flex items-center justify-between px-5 h-[72px] border-b border-white/10">
              <span className="font-display font-semibold flex items-center gap-2"><Sparkles size={16} className="text-gold" /> CampusSphere</span>
              <button onClick={() => setMobileOpen(false)}><X size={24} /></button>
            </div>
            <div className="px-5 py-6 flex flex-col gap-1 overflow-y-auto h-[calc(100%-72px)]">
              {LINKS.flatMap((l) => l.children ? l.children : [l]).map((l) => (
                <NavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="py-3.5 border-b border-white/10 text-[16px] font-medium text-white/90">
                  {l.label}
                </NavLink>
              ))}
              {user ? (
                <>
                  <button onClick={() => { setMobileOpen(false); nav(DASH[user.role]); }} className="mt-6 btn-primary">Go to dashboard</button>
                  <button onClick={() => { logout(); setMobileOpen(false); nav("/"); }} className="mt-3 text-white/60">Logout</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="mt-6 btn-primary">Login</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
