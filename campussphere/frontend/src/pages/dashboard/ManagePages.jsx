import { useEffect, useState } from "react";
import ManageResource from "../../components/ManageResource";
import api, { mediaUrl } from "../../services/api";
import { useSite } from "../../context/SiteContext";
import { useAuth } from "../../context/AuthContext";
import * as cfg from "../../resourceConfigs.jsx";

export const ManageEvents = () => <ManageResource endpoint="/events/" title="Manage events" fields={cfg.eventFields} columns={cfg.eventColumns} />;
export const ManageDocuments = () => <ManageResource endpoint="/documents/" title="Manage documents" fields={cfg.documentFields} columns={cfg.documentColumns} />;
export const ManageAnnouncements = () => <ManageResource endpoint="/announcements/" title="Manage announcements" fields={cfg.announcementFields} columns={cfg.announcementColumns} />;
export const ManageAchievements = () => <ManageResource endpoint="/achievements/" title="Manage achievements" fields={cfg.achievementFields} columns={cfg.achievementColumns} />;
export const ManageTimetable = () => <ManageResource endpoint="/timetable/" title="Manage timetable" fields={cfg.timetableFields} columns={cfg.timetableColumns} />;
export const ManageSyllabus = () => <ManageResource endpoint="/syllabus/" title="Manage syllabus" fields={cfg.syllabusFields} columns={cfg.syllabusColumns} />;
export const ManageGallery = () => <ManageResource endpoint="/gallery/" title="Manage gallery" fields={cfg.galleryFields} columns={cfg.galleryColumns} manage={false} />;
export const ManageFaculty = () => <ManageResource endpoint="/faculty/" title="Manage staff information" fields={cfg.facultyFields} columns={cfg.facultyColumns} manage={false} />;
export const ManageStudents = () => <ManageResource endpoint="/students/" title="Manage students" fields={cfg.studentFields} columns={cfg.studentColumns} manage={false} />;
export const ManageStaff = () => <ManageResource endpoint="/staff/" title="Manage staff" fields={cfg.staffFields} columns={cfg.staffColumns} manage={false} />;

export function ManageDepartment() {
  const { dept, refresh } = useSite();
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const isHod = user?.hod_level;

  useEffect(() => { if (dept) setForm(dept); }, [dept]);
  if (!form) return null;

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    const editable = isHod
      ? ["name", "short_name", "code", "tagline", "description", "vision", "mission", "programs", "hod_message", "established_year", "email", "phone"]
      : ["tagline", "description", "vision", "mission", "programs", "hod_message", "email", "phone", "established_year"];
    editable.forEach((k) => fd.append(k, form[k] ?? ""));
    if (form.logoFile) fd.append("logo", form.logoFile);
    if (form.heroFile) fd.append("hero_image", form.heroFile);
    if (form.aboutFile) fd.append("about_image", form.aboutFile);
    await api.patch("/department/", fd);
    await refresh();
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-5">Department profile</h2>
      <form onSubmit={submit} className="card p-6 space-y-4">
        {isHod && (
          <>
            <Field label="Department name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Short name"><input className="input" value={form.short_name || ""} onChange={(e) => setForm({ ...form, short_name: e.target.value })} /></Field>
              <Field label="Code"><input className="input" value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
            </div>
          </>
        )}
        <Field label="Tagline"><input className="input" value={form.tagline || ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></Field>
        <Field label="Description"><textarea rows={3} className="input" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Vision"><textarea rows={2} className="input" value={form.vision || ""} onChange={(e) => setForm({ ...form, vision: e.target.value })} /></Field>
        <Field label="Mission"><textarea rows={2} className="input" value={form.mission || ""} onChange={(e) => setForm({ ...form, mission: e.target.value })} /></Field>
        <Field label="Programmes (one per line)"><textarea rows={3} className="input" value={form.programs || ""} onChange={(e) => setForm({ ...form, programs: e.target.value })} /></Field>
        <Field label="HOD message"><textarea rows={2} className="input" value={form.hod_message || ""} onChange={(e) => setForm({ ...form, hod_message: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email"><input className="input" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><input className="input" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        </div>
        {isHod && (
          <div className="grid grid-cols-3 gap-4">
            <Field label="Department logo"><input type="file" accept="image/*" className="input !py-2" onChange={(e) => setForm({ ...form, logoFile: e.target.files[0] })} /></Field>
            <Field label="Hero image"><input type="file" accept="image/*" className="input !py-2" onChange={(e) => setForm({ ...form, heroFile: e.target.files[0] })} /></Field>
            <Field label="About image"><input type="file" accept="image/*" className="input !py-2" onChange={(e) => setForm({ ...form, aboutFile: e.target.files[0] })} /></Field>
          </div>
        )}
        <button className="btn-navy">{saved ? "Saved ✓" : "Save changes"}</button>
      </form>
    </div>
  );
}

export function ManageSettings() {
  const { settings, refresh } = useSite();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (settings) setForm(settings); }, [settings]);
  if (!form) return null;

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    ["college_name", "college_tagline", "address", "phone", "email", "website", "facebook", "instagram", "linkedin", "youtube", "twitter"].forEach((k) => fd.append(k, form[k] ?? ""));
    ["logoFile:college_logo", "faviconFile:favicon", "bannerFile:banner"].forEach((pair) => {
      const [fkey, apikey] = pair.split(":");
      if (form[fkey]) fd.append(apikey, form[fkey]);
    });
    await api.patch("/settings/", fd);
    await refresh();
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-5">College branding & settings</h2>
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div className="flex gap-6 items-center">
          {settings.college_logo && <img src={mediaUrl(settings.college_logo)} className="h-16 w-16 shrink-0 rounded-md bg-white p-1 object-contain" alt="College logo" />}
          <Field label="College logo"><input type="file" accept="image/*" className="input !py-2" onChange={(e) => setForm({ ...form, logoFile: e.target.files[0] })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Favicon"><input type="file" accept="image/*" className="input !py-2" onChange={(e) => setForm({ ...form, faviconFile: e.target.files[0] })} /></Field>
          <Field label="Website banner"><input type="file" accept="image/*" className="input !py-2" onChange={(e) => setForm({ ...form, bannerFile: e.target.files[0] })} /></Field>
        </div>
        <Field label="College name"><input className="input" value={form.college_name || ""} onChange={(e) => setForm({ ...form, college_name: e.target.value })} /></Field>
        <Field label="College tagline"><input className="input" value={form.college_tagline || ""} onChange={(e) => setForm({ ...form, college_tagline: e.target.value })} /></Field>
        <Field label="Address"><textarea rows={2} className="input" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone"><input className="input" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><input className="input" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {["facebook", "instagram", "linkedin", "youtube"].map((k) => (
            <Field key={k} label={k[0].toUpperCase() + k.slice(1)}><input className="input" value={form[k] || ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></Field>
          ))}
        </div>
        <button className="btn-navy">{saved ? "Saved ✓" : "Save changes"}</button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="text-xs font-medium text-ink/50 mb-1.5 block">{label}</label>{children}</div>;
}
