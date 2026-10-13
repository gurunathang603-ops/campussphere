import { LayoutDashboard, CalendarDays, FileText, ClipboardList, BookOpen, Megaphone, Award, Image, Building2 } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";

const LINKS = [
  { to: "/dashboard/staff", end: true, label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/staff/events", label: "Events", icon: CalendarDays },
  { to: "/dashboard/staff/documents", label: "Documents", icon: FileText },
  { to: "/dashboard/staff/timetable", label: "Timetable", icon: ClipboardList },
  { to: "/dashboard/staff/syllabus", label: "Syllabus", icon: BookOpen },
  { to: "/dashboard/staff/announcements", label: "Announcements", icon: Megaphone },
  { to: "/dashboard/staff/achievements", label: "Achievements", icon: Award },
  { to: "/dashboard/staff/gallery", label: "Gallery", icon: Image },
  { to: "/dashboard/staff/department", label: "Department info", icon: Building2 },
];

export default function StaffLayout() {
  return <DashboardLayout links={LINKS} roleLabel="Staff" />;
}
