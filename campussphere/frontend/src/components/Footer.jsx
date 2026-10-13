import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { Facebook, Instagram, Linkedin, Youtube } from "./SocialIcons";
import { useSite } from "../context/SiteContext";
import { mediaUrl } from "../services/api";

const QUICK = [
  { to: "/events", label: "Events" }, { to: "/syllabus", label: "Syllabus" },
  { to: "/timetable", label: "Timetable" }, { to: "/faculty", label: "Faculty" },
  { to: "/documents", label: "Documents" }, { to: "/login", label: "Login" },
];
const SOCIAL = [
  ["facebook", Facebook], ["instagram", Instagram], ["linkedin", Linkedin], ["youtube", Youtube],
];

export default function Footer() {
  const { settings, dept } = useSite();
  return (
    <footer className="bg-navy-900 text-white/80 mt-24">
      <div className="container-page py-16 grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
        <div>
          <div className="flex items-center gap-2 mb-4">
            {settings?.college_logo && <img src={mediaUrl(settings.college_logo)} className="h-9 w-9 shrink-0 rounded-md bg-white p-0.5 object-contain" alt="College logo" />}
            <span className="font-display font-semibold text-white text-lg">{settings?.college_name || "CampusSphere"}</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs">{dept?.name}. {settings?.college_tagline}</p>
          <div className="flex gap-2 mt-5">
            {SOCIAL.map(([key, Icon]) => settings?.[key] && (
              <a key={key} href={settings[key]} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-full bg-white/10 hover:bg-gold hover:text-navy-900 flex items-center justify-center transition">
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-4">Quick links</p>
          <ul className="space-y-2.5 text-sm">
            {QUICK.map((q) => <li key={q.to}><Link to={q.to} className="hover:text-gold transition-colors">{q.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-4">Department</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/department" className="hover:text-gold">About the department</Link></li>
            <li><Link to="/achievements" className="hover:text-gold">Achievements</Link></li>
            <li><Link to="/gallery" className="hover:text-gold">Gallery</Link></li>
            <li><Link to="/announcements" className="hover:text-gold">Announcements</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-4">Contact</p>
          <ul className="space-y-3 text-sm">
            {settings?.address && <li className="flex gap-2"><MapPin size={16} className="shrink-0 mt-0.5" />{settings.address}</li>}
            {(dept?.phone || settings?.phone) && <li className="flex gap-2"><Phone size={16} className="shrink-0 mt-0.5" />{dept?.phone || settings.phone}</li>}
            {(dept?.email || settings?.email) && <li className="flex gap-2"><Mail size={16} className="shrink-0 mt-0.5" />{dept?.email || settings.email}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {settings?.college_name || "CampusSphere"} · {dept?.name}. All rights reserved.
      </div>
    </footer>
  );
}
