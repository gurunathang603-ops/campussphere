import Badge from "./components/Badge";

const EVENT_TYPES = [["conference", "Conference"], ["workshop", "Workshop"], ["seminar", "Seminar"], ["sports_day", "Sports Day"],
  ["pongal", "Pongal"], ["cultural", "Cultural Event"], ["symposium", "Symposium"], ["hackathon", "Hackathon"], ["technical", "Technical"], ["other", "Other"]];

export const eventFields = [
  { name: "title", label: "Event name", type: "text", required: true },
  { name: "event_type", label: "Event type", type: "select", options: EVENT_TYPES, required: true },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "end_date", label: "End date (optional)", type: "date" },
  { name: "time", label: "Time", type: "time" },
  { name: "venue", label: "Venue", type: "text" },
  { name: "description", label: "Description", type: "textarea", rows: 4 },
  { name: "banner", label: "Banner image", type: "file", accept: "image/*" },
  { name: "gallery_uploads", label: "Add gallery images", type: "file", accept: "image/*", multiple: true },
  { name: "organizers", label: "Organizers", type: "text" },
  { name: "coordinator", label: "Faculty coordinator", type: "text" },
  { name: "registration_link", label: "Registration link", type: "url" },
  { name: "notification_settings", label: "Notification settings", type: "section" },
  { name: "reminder_minutes", label: "Remind recipients", type: "checkbox_group", options: [
    [10080, "7 days before"], [4320, "3 days before"], [1440, "1 day before"], [60, "1 hour before"],
  ], default: [10080, 4320, 1440, 60] },
  { name: "notification_channels", label: "Channels", type: "checkbox_group", options: [
    ["in_app", "In portal"], ["email", "Email"], ["sms", "SMS (consenting users only)"], ["push", "Browser push"],
  ], default: ["in_app", "email", "sms", "push"] },
  { name: "target_audience", label: "Recipients", type: "select", options: [
    ["all", "All students and staff"], ["students", "All students"], ["staff", "All staff"],
    ["department", "This department"], ["class", "Specific class"], ["selected", "Selected user IDs"],
  ], default: "department" },
  { name: "target_year", label: "Class year (for specific class)", type: "select", options: [[1, "Year 1"], [2, "Year 2"], [3, "Year 3"], [4, "Year 4"]] },
  { name: "target_section", label: "Class section (for specific class)", type: "text" },
  { name: "target_user_ids", label: "Selected user IDs (comma separated)", type: "user_ids", help: "Enter account IDs, for example: 12, 18, 25." },
  { name: "is_cancelled", label: "", type: "checkbox", help: "Cancel this event and notify its audience" },
  { name: "schedule_text", label: "Schedule", type: "textarea", rows: 3, help: "One per line: time | title | speaker" },
  { name: "participants_count", label: "Participants count", type: "number" },
  { name: "participants", label: "Participants / teams", type: "textarea", rows: 2, help: "One per line" },
  { name: "results", label: "Results", type: "textarea", rows: 3 },
  { name: "is_published", label: "", type: "checkbox", help: "Publish immediately", default: true },
];
export const eventColumns = [
  { key: "title", label: "Event" },
  { key: "event_type", label: "Type", render: (i) => <span className="text-xs">{i.type_label}</span> },
  { key: "date", label: "Date" },
  { key: "venue", label: "Venue" },
];

export const documentFields = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "category", label: "Category", type: "select", required: true, options: [
    ["syllabus", "Syllabus"], ["timetable", "Timetable"], ["circular", "Circulars"], ["event", "Event Documents"],
    ["conference", "Conference Documents"], ["workshop", "Workshop Documents"], ["academic", "Academic Documents"],
    ["report", "Department Reports"], ["student", "Student Documents"]] },
  { name: "description", label: "Description", type: "textarea", rows: 2 },
  { name: "visibility", label: "Who can see this", type: "select", required: true, options: [
    ["public", "Public (everyone)"], ["student", "Logged-in students & staff"], ["staff", "Staff & HOD only"]] },
  { name: "file", label: "File", type: "file", accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip" },
  { name: "is_published", label: "", type: "checkbox", help: "Publish immediately", default: true },
];
export const documentColumns = [
  { key: "title", label: "Title" }, { key: "category_label", label: "Category" }, { key: "visibility_label", label: "Visibility" },
];

export const announcementFields = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea", rows: 4, required: true },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "priority", label: "Priority", type: "select", required: true, options: [["normal", "Normal"], ["important", "Important"], ["urgent", "Urgent"]] },
  { name: "attachment", label: "Attachment (optional)", type: "file" },
  { name: "is_published", label: "", type: "checkbox", help: "Publish immediately", default: true },
];
export const announcementColumns = [
  { key: "title", label: "Title" },
  { key: "priority", label: "Priority", render: (i) => <Badge tone={i.priority}>{i.priority_label}</Badge> },
  { key: "date", label: "Date" },
];

export const achievementFields = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "category", label: "Category", type: "select", required: true, options: [
    ["student", "Student"], ["faculty", "Faculty"], ["award", "Award"], ["hackathon", "Hackathon"], ["sports", "Sports"], ["conference", "Conference"]] },
  { name: "person_name", label: "Person / team name", type: "text" },
  { name: "description", label: "Description", type: "textarea", rows: 3 },
  { name: "date", label: "Date", type: "date" },
  { name: "image", label: "Image", type: "file", accept: "image/*" },
  { name: "is_published", label: "", type: "checkbox", help: "Publish immediately", default: true },
];
export const achievementColumns = [{ key: "title", label: "Title" }, { key: "category_label", label: "Category" }, { key: "person_name", label: "Person" }];

export const facultyFields = [
  { name: "name", label: "Full name", type: "text", required: true },
  { name: "designation", label: "Designation", type: "text", required: true },
  { name: "qualification", label: "Qualification", type: "text" },
  { name: "specialization", label: "Specialization", type: "text" },
  { name: "email", label: "Email", type: "text" },
  { name: "phone", label: "Phone", type: "text" },
  { name: "subjects", label: "Subjects handled", type: "text", help: "Comma separated" },
  { name: "photo", label: "Photo", type: "file", accept: "image/*" },
  { name: "order", label: "Display order", type: "number" },
  { name: "is_published", label: "", type: "checkbox", help: "Show on website", default: true },
];
export const facultyColumns = [{ key: "name", label: "Name" }, { key: "designation", label: "Designation" }, { key: "email", label: "Email" }];

export const timetableFields = [
  { name: "year", label: "Year", type: "select", required: true, options: [[1, "Year 1"], [2, "Year 2"], [3, "Year 3"]] },
  { name: "section", label: "Section", type: "select", required: true, options: [["A", "A"]] },
  { name: "day", label: "Day", type: "select", required: true, options: [["Monday", "Monday"], ["Tuesday", "Tuesday"], ["Wednesday", "Wednesday"], ["Thursday", "Thursday"], ["Friday", "Friday"], ["Saturday", "Saturday"]] },
  { name: "period", label: "Period", type: "number", required: true },
  { name: "start_time", label: "Start time", type: "time" },
  { name: "end_time", label: "End time", type: "time" },
  { name: "subject", label: "Subject", type: "text", required: true },
  { name: "room", label: "Room", type: "text" },
  { name: "is_published", label: "", type: "checkbox", help: "Publish", default: true },
];
export const timetableColumns = [
  { key: "year", label: "Class", render: (i) => `Y${i.year}${i.section}` }, { key: "day", label: "Day" },
  { key: "period", label: "Period" }, { key: "subject", label: "Subject" },
];

export const syllabusFields = [
  { name: "regulation", label: "Regulation", type: "text", required: true },
  { name: "year", label: "Year", type: "select", required: true, options: [[1, "Year 1"], [2, "Year 2"], [3, "Year 3"], [4, "Year 4"]] },
  { name: "semester", label: "Semester", type: "select", required: true, options: Array.from({ length: 6 }, (_, i) => [i + 1, `Semester ${i + 1}`]) },
  { name: "subject_code", label: "Subject code", type: "text", required: true },
  { name: "subject_name", label: "Subject name", type: "text", required: true },
  { name: "credits", label: "Credits", type: "number" },
  { name: "pdf", label: "Syllabus PDF", type: "file", accept: ".pdf" },
  { name: "is_published", label: "", type: "checkbox", help: "Publish", default: true },
];
export const syllabusColumns = [{ key: "subject_code", label: "Code" }, { key: "subject_name", label: "Subject" }, { key: "semester", label: "Sem" }];

export const galleryFields = [
  { name: "title", label: "Title", type: "text" },
  { name: "category", label: "Category", type: "select", required: true, options: [
    ["events", "Events"], ["sports", "Sports"], ["conference", "Conference"], ["workshops", "Workshops"], ["cultural", "Cultural"], ["activities", "Department Activities"]] },
  { name: "image", label: "Image", type: "file", accept: "image/*" },
  { name: "is_published", label: "", type: "checkbox", help: "Publish", default: true },
];
export const galleryColumns = [{ key: "title", label: "Title" }, { key: "category_label", label: "Category" }];

export const studentFields = [
  { name: "register_number", label: "Register number", type: "text", required: true },
  { name: "first_name", label: "First name", type: "text", required: true },
  { name: "last_name", label: "Last name", type: "text" },
  { name: "email", label: "Email", type: "text" },
  { name: "phone", label: "Mobile (E.164, e.g. +919876543210)", type: "tel" },
  { name: "year", label: "Year", type: "select", required: true, options: [[1, "Year 1"], [2, "Year 2"], [3, "Year 3"], [4, "Year 4"]] },
  { name: "section", label: "Section", type: "select", required: true, options: [["A", "A"], ["B", "B"]] },
  { name: "attendance_percentage", label: "Attendance %", type: "number", step: "0.1" },
  { name: "password", label: "Password", type: "text", help: "Leave blank to keep existing password when editing" },
  { name: "is_active", label: "", type: "checkbox", help: "Account active", default: true },
];
export const studentColumns = [{ key: "register_number", label: "Reg. no." }, { key: "full_name", label: "Name" }, { key: "year", label: "Year" }, { key: "section", label: "Sec" }];

export const staffFields = [
  { name: "staff_id", label: "Staff ID", type: "text", required: true },
  { name: "first_name", label: "First name", type: "text", required: true },
  { name: "last_name", label: "Last name", type: "text" },
  { name: "email", label: "Email", type: "text" },
  { name: "phone", label: "Mobile (E.164, e.g. +919876543210)", type: "tel" },
  { name: "designation", label: "Designation", type: "text" },
  { name: "password", label: "Password", type: "text", help: "Leave blank to keep existing password when editing" },
  { name: "hod_privileges", label: "", type: "checkbox", help: "Grant HOD-level management access" },
  { name: "is_active", label: "", type: "checkbox", help: "Account active", default: true },
];
export const staffColumns = [{ key: "staff_id", label: "Staff ID" }, { key: "full_name", label: "Name" }, { key: "designation", label: "Designation" }];
