import { Flame, Trophy, Presentation, Cpu, Wrench, Mic2, PartyPopper, Landmark } from "lucide-react";

/* Dynamic event-page theming: one visual identity per event type, built from shared components. */
const THEMES = {
  pongal: {
    icon: Flame, label: "Festive celebration",
    bg: "bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-300", accent: "text-orange-600", chip: "bg-orange-50 text-orange-700",
    font: "font-display", pattern: "radial-gradient(circle at 20% 20%, rgba(255,255,255,.25), transparent 40%)",
  },
  sports_day: {
    icon: Trophy, label: "Sports event",
    bg: "bg-gradient-to-br from-emerald-600 via-green-500 to-lime-400", accent: "text-emerald-700", chip: "bg-emerald-50 text-emerald-700",
    font: "font-display italic", pattern: "repeating-linear-gradient(45deg, rgba(255,255,255,.06) 0 12px, transparent 12px 24px)",
  },
  conference: {
    icon: Landmark, label: "Academic conference",
    bg: "bg-gradient-to-br from-navy via-navy-600 to-indigo", accent: "text-indigo", chip: "bg-indigo-50 text-indigo",
    font: "font-display", pattern: "none",
  },
  hackathon: {
    icon: Cpu, label: "Technology sprint",
    bg: "bg-gradient-to-br from-slate-900 via-violet-800 to-fuchsia-600", accent: "text-violet-700", chip: "bg-violet-50 text-violet-700",
    font: "font-display", pattern: "linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px)",
  },
  workshop: {
    icon: Wrench, label: "Hands-on workshop",
    bg: "bg-gradient-to-br from-teal-600 via-cyan-500 to-sky-400", accent: "text-teal-700", chip: "bg-teal-50 text-teal-700",
    font: "font-display", pattern: "none",
  },
  seminar: {
    icon: Mic2, label: "Seminar",
    bg: "bg-gradient-to-br from-blue-700 via-indigo to-violet-500", accent: "text-blue-700", chip: "bg-blue-50 text-blue-700",
    font: "font-display", pattern: "none",
  },
  symposium: {
    icon: Presentation, label: "Symposium",
    bg: "bg-gradient-to-br from-navy via-slate-700 to-blue-600", accent: "text-navy", chip: "bg-navy-50 text-navy",
    font: "font-display", pattern: "none",
  },
  cultural: {
    icon: PartyPopper, label: "Cultural event",
    bg: "bg-gradient-to-br from-pink-600 via-rose-500 to-orange-400", accent: "text-pink-700", chip: "bg-pink-50 text-pink-700",
    font: "font-display", pattern: "radial-gradient(circle at 80% 20%, rgba(255,255,255,.2), transparent 40%)",
  },
  technical: {
    icon: Cpu, label: "Technical event",
    bg: "bg-gradient-to-br from-slate-800 via-indigo-600 to-blue-500", accent: "text-indigo", chip: "bg-indigo-50 text-indigo",
    font: "font-display", pattern: "none",
  },
  other: {
    icon: Presentation, label: "Event",
    bg: "bg-gradient-to-br from-navy to-indigo", accent: "text-navy", chip: "bg-navy-50 text-navy",
    font: "font-display", pattern: "none",
  },
};

export const getTheme = (type) => THEMES[type] || THEMES.other;
