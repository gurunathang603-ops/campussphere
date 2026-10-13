import { LayoutDashboard, CalendarDays, FileText, ClipboardList, BookOpen, Megaphone, Award, Image, Building2, Users, UserCog, GraduationCap, Settings } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";

const LINKS = [
  { to: "/dashboard/hod", end: true, label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/hod/students", label: "Students", icon: Users },
  { to: "/dashboard/hod/staff", label: "Staff", icon: UserCog },
  { to: "/dashboard/hod/faculty", label: "Staff information", icon: GraduationCap },
  { to: "/dashboard/hod/events", label: "Events", icon: CalendarDays },
  { to: "/dashboard/hod/documents", label: "Documents", icon: FileText },
  { to: "/dashboard/hod/timetable", label: "Timetable", icon: ClipboardList },
  { to: "/dashboard/hod/syllabus", label: "Syllabus", icon: BookOpen },
  { to: "/dashboard/hod/announcements", label: "Announcements", icon: Megaphone },
  { to: "/dashboard/hod/achievements", label: "Achievements", icon: Award },
  { to: "/dashboard/hod/gallery", label: "Gallery", icon: Image },
  { to: "/dashboard/hod/department", label: "Department info", icon: Building2 },
  { to: "/dashboard/hod/settings", label: "College settings", icon: Settings },
];

export default function HODLayout() {
  return <DashboardLayout links={LINKS} roleLabel="HOD" />;
}
