import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SiteProvider } from "./context/SiteContext";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import About from "./pages/About";
import Department from "./pages/Department";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Calendar from "./pages/Calendar";
import Timetable from "./pages/Timetable";
import Syllabus from "./pages/Syllabus";
import Faculty from "./pages/Faculty";
import Announcements from "./pages/Announcements";
import Achievements from "./pages/Achievements";
import Documents from "./pages/Documents";
import Gallery from "./pages/Gallery";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

import StudentDashboard from "./pages/dashboard/StudentDashboard";
import StaffLayout from "./pages/dashboard/StaffLayout";
import StaffOverview from "./pages/dashboard/StaffOverview";
import HODLayout from "./pages/dashboard/HODLayout";
import HODOverview from "./pages/dashboard/HODOverview";
import DashboardLayout from "./layouts/DashboardLayout";
import { LayoutDashboard } from "lucide-react";
import {
  ManageEvents, ManageDocuments, ManageAnnouncements, ManageAchievements,
  ManageTimetable, ManageSyllabus, ManageGallery, ManageFaculty,
  ManageStudents, ManageStaff, ManageDepartment, ManageSettings,
} from "./pages/dashboard/ManagePages";

const STUDENT_LINKS = [{ to: "/dashboard/student", end: true, label: "Overview", icon: LayoutDashboard }];

export default function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/department" element={<Department />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/syllabus" element={<Syllabus />} />
            <Route path="/faculty" element={<Faculty />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute roles={["student", "staff", "hod"]} />}>
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["student", "staff", "hod"]} />}>
            <Route path="/change-password" element={<ChangePassword />} />
          </Route>

          <Route element={<ProtectedRoute roles={["student"]} />}>
            <Route element={<DashboardLayout links={STUDENT_LINKS} roleLabel="Student" />}>
              <Route path="/dashboard/student" element={<StudentDashboard />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["staff", "hod"]} />}>
            <Route path="/dashboard/staff" element={<StaffLayout />}>
              <Route index element={<StaffOverview />} />
              <Route path="events" element={<ManageEvents />} />
              <Route path="documents" element={<ManageDocuments />} />
              <Route path="timetable" element={<ManageTimetable />} />
              <Route path="syllabus" element={<ManageSyllabus />} />
              <Route path="announcements" element={<ManageAnnouncements />} />
              <Route path="achievements" element={<ManageAchievements />} />
              <Route path="gallery" element={<ManageGallery />} />
              <Route path="department" element={<ManageDepartment />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["hod"]} />}>
            <Route path="/dashboard/hod" element={<HODLayout />}>
              <Route index element={<HODOverview />} />
              <Route path="students" element={<ManageStudents />} />
              <Route path="staff" element={<ManageStaff />} />
              <Route path="faculty" element={<ManageFaculty />} />
              <Route path="events" element={<ManageEvents />} />
              <Route path="documents" element={<ManageDocuments />} />
              <Route path="timetable" element={<ManageTimetable />} />
              <Route path="syllabus" element={<ManageSyllabus />} />
              <Route path="announcements" element={<ManageAnnouncements />} />
              <Route path="achievements" element={<ManageAchievements />} />
              <Route path="gallery" element={<ManageGallery />} />
              <Route path="department" element={<ManageDepartment />} />
              <Route path="settings" element={<ManageSettings />} />
            </Route>
          </Route>

          <Route path="*" element={<MainLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </SiteProvider>
    </AuthProvider>
  );
}
