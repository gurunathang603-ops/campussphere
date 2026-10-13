"""python manage.py seed_demo [--reset]  -> realistic demo data (college, dept, HOD, 4 staff, 20 students, events ...)"""
import random
from datetime import date, time, timedelta
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from PIL import Image, ImageDraw, ImageFont

from academics.models import Faculty, Syllabus, Timetable
from accounts.models import HOD, Staff, Student, User
from announcements.models import Announcement, Notification
from departments.models import Achievement, CollegeSettings, Department, GalleryImage
from documents.models import Document
from events.models import Event, EventGallery

random.seed(7)
STAFF_PW, STUDENT_PW = "Staff@12345", "Student@12345"


def img(w, h, c1, c2, text="", circle=False, fmt="JPEG"):
    im = Image.new("RGB", (w, h), c1)
    d = ImageDraw.Draw(im)
    for y in range(h):
        t = y / h
        d.line([(0, y), (w, y)], fill=tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3)))
    ov = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    for _ in range(6):
        r = random.randint(h // 6, h // 2)
        x, y = random.randint(0, w), random.randint(0, h)
        od.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, random.randint(10, 28)))
    im = Image.alpha_composite(im.convert("RGBA"), ov)
    if text:
        d = ImageDraw.Draw(im)
        font_size = max(14, h // 4)
        try:
            font = ImageFont.load_default(size=font_size)
            while d.textbbox((0, 0), text, font=font)[2] > w * 0.82 and font_size > 14:
                font_size -= 2
                font = ImageFont.load_default(size=font_size)
        except TypeError:
            font = ImageFont.load_default()
        bb = d.textbbox((0, 0), text, font=font)
        d.text(((w - (bb[2] - bb[0])) / 2, (h - (bb[3] - bb[1])) / 2 - bb[1]), text, font=font, fill=(255, 255, 255, 235))
    if circle:
        mask = Image.new("L", (w, h), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, w - 1, h - 1], fill=255)
        im.putalpha(mask)
        fmt = "PNG"
    buf = BytesIO()
    (im if fmt == "PNG" else im.convert("RGB")).save(buf, fmt, **({} if fmt == "PNG" else {"quality": 82}))
    return buf.getvalue()


def pdf(title, lines):
    esc = lambda s: s.replace("–", "-").replace("•", "-").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    stream = f"BT /F1 20 Tf 50 780 Td ({esc(title)}) Tj ET\n"
    y = 750
    for l in lines:
        stream += f"BT /F1 12 Tf 50 {y} Td ({esc(l)}) Tj ET\n"
        y -= 20
    objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
            f"<< /Length {len(stream)} >>\nstream\n{stream}endstream", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
    out, offs = "%PDF-1.4\n", []
    for i, o in enumerate(objs, 1):
        offs.append(len(out))
        out += f"{i} 0 obj\n{o}\nendobj\n"
    x = len(out)
    out += f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n" + "".join(f"{o:010d} 00000 n \n" for o in offs)
    out += f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{x}\n%%EOF"
    return ContentFile(out.encode("latin-1", "replace"))


NAVY, NAVY2 = (28, 47, 82), (60, 100, 170)
PALETTE = {"pongal": ((234, 120, 20), (250, 200, 60)), "sports_day": ((16, 110, 70), (120, 190, 40)),
           "conference": ((28, 47, 82), (70, 90, 170)), "hackathon": ((20, 20, 50), (110, 50, 200)),
           "workshop": ((15, 118, 110), (40, 160, 190)), "seminar": ((60, 60, 140), (110, 120, 200)),
           "cultural": ((170, 40, 110), (240, 120, 90))}


class Command(BaseCommand):
    help = "Create realistic demo data"

    def add_arguments(self, p):
        p.add_argument("--reset", action="store_true", help="delete existing content first")

    @transaction.atomic
    def handle(self, *a, **o):
        if Department.objects.exists() and not o["reset"]:
            self.stdout.write(self.style.WARNING("Data already exists. Run with --reset to rebuild demo data."))
            return
        if o["reset"]:
            for m in (Notification, Announcement, Document, EventGallery, Event, Achievement, GalleryImage, Timetable, Syllabus, Faculty, Department):
                m.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
        today = timezone.localdate()
        pongal_date = date(today.year, 1, 14)
        if pongal_date < today:
            pongal_date = date(today.year + 1, 1, 14)

        cs = CollegeSettings.load()
        cs.college_name = "Sacred Heart College (Autonomous), Tirupattur"
        cs.college_tagline = "Empowering Minds, Enriching Futures"
        cs.address = "Tirupattur, Tamil Nadu"
        cs.phone, cs.email, cs.website = "+91 00000 00000", "info@sacredheartcollege.edu.in", "https://www.sacredheartcollege.edu.in"
        cs.facebook = cs.instagram = cs.linkedin = cs.youtube = cs.twitter = "https://example.com"
        cs.college_logo.save("college_logo.png", ContentFile(img(400, 400, NAVY, NAVY2, "SHC", circle=True)), save=False)
        cs.favicon.save("favicon.png", ContentFile(img(128, 128, NAVY, NAVY2, "G", circle=True)), save=False)
        cs.banner.save("banner.jpg", ContentFile(img(1800, 800, (15, 26, 51), (44, 80, 144))), save=False)
        cs.save()

        dept = Department.objects.create(
            name="Artificial Intelligence & Machine Learning", short_name="AIML", code="AIML", established_year=2024,
            tagline="Innovate • Intelligence • Impact", email="aiml@sacredheartcollege.edu.in", phone="+91 00000 00000",
            description="The Artificial Intelligence & Machine Learning department focuses on building future-ready learners through hands-on learning, research, and practical innovation in AI, data science, and intelligent systems.",
            vision="To be a center of excellence in AI and machine learning education, research, and entrepreneurship.",
            mission="To empower students with deep technical knowledge, ethical thinking, and real-world problem-solving in intelligent systems.",
            programs="B.Sc. / B.E. AI & ML\nAI Research & Innovation Lab\nData Science and Analytics\nIndustry Collaboration Program",
            hod_message="Welcome to the AI & ML department. We aim to transform students into capable, ethical, and innovative technologists ready to shape the future.")
        dept.logo.save("department_logo.png", ContentFile(img(400, 400, (30, 100, 120), (60, 160, 170), "AI AND ML", circle=True)), save=False)
        dept.hero_image.save("dept_hero.jpg", ContentFile(img(1600, 800, (28, 47, 82), (90, 130, 200))), save=False)
        dept.about_image.save("dept_about.jpg", ContentFile(img(1000, 700, (40, 70, 120), (120, 170, 220))), save=False)
        dept.save()

        # ---- people ----
        hod = User.objects.create_user("staff1", "johnbosco@shctpt.edu", STAFF_PW, first_name="John Bosco", last_name="S",
                                       role="hod", is_staff=True, is_superuser=True, must_change_password=True, phone="8438408257")
        HOD.objects.create(user=hod, department=dept, hod_id="HOD001", qualification="M.C.A., SET.")
        staff_data = [
            ("Vijay", "S", "Dr.", "Assistant Professor", "", "M.Sc., M.Phil., Ph.D.", "", "svijay@shctpt.edu", "9500659141"),
            ("Santhoshkumar", "K", "Mr.", "Assistant Professor", "", "MCA., PGDDS", "", "santhoshkumar@shctpt.edu", "6381279826"),
            ("Ezhilarasi S", "S", "Ms.", "Assistant Professor", "", "M.C.A., PGDCS", "", "ezhilarasi046@gmail.com", "6382466286"),
        ]
        Staff.objects.create(user=hod, department=dept, staff_id="STF001", designation="Assistant Professor")
        fac = [Faculty.objects.create(department=dept, user=hod, name="Mr. John Bosco S", designation="Assistant Professor", order=1,
                                      qualification="M.C.A., SET.", email=hod.email, phone=hod.phone)]
        for i, (fn, ln, prefix, desig, spec, qual, subj, email, phone) in enumerate(staff_data, 2):
            u = User.objects.create_user(f"staff{i}", email, STAFF_PW, first_name=fn, last_name=ln,
                                         role="staff", must_change_password=True, phone=phone)
            Staff.objects.create(user=u, department=dept, staff_id=f"STF00{i}", designation=desig, hod_privileges=(i == 1 and False))
            f = Faculty.objects.create(department=dept, user=u, name=f"{prefix} {fn} {ln}",
                                       designation=desig, qualification=qual, specialization=spec, email=u.email,
                                       phone=phone, subjects=subj, order=i)
            fac.append(f)

        students = [
            ("BU241901", "ROAHINI G"), ("BU241902", "RAVISUNDAR T"), ("BU241903", "LOKESHWARAN P S"),
            ("BU241904", "IKNESH A"), ("BU241905", "SANGEETHA F"), ("BU241906", "PARTHASARATHI S"),
            ("BU241907", "PRAVEEN KUMAR T"), ("BU241908", "JENILA J"), ("BU241909", "GOWTHAM V"),
            ("BU241910", "LAVANYA R"), ("BU241911", "SIRANJEEVI J"), ("BU241912", "MONISHA M"),
            ("BU241913", "VEENUPRIYA G"), ("BU241915", "KAVIYARASU K"), ("BU241916", "ASHEEFA BANU P"),
            ("BU241917", "MERLIN NIVETHITHA V"), ("BU241918", "SIKAONA FAUSTINA"), ("BU241919", "CHABINDWA REGINA"),
            ("BU241920", "LINGESH U"), ("BU241922", "SUDHARSAN M"), ("BU241923", "DIVYA Y"),
            ("BU241924", "VEDI V"), ("BU241925", "Lokesh P"), ("BU241926", "LURTHU MARI S"),
            ("BU241927", "GOWTAM V K"), ("BU241928", "LINGESHWARAN N"), ("BU241929", "KAVIPRIYAN S"),
            ("BU241930", "KAVIPRIYAN V K"), ("BU241931", "SADHANA A"), ("BU241932", "ANISHKUMAR S"),
            ("BU241933", "BHARANIDHARAN Y"), ("BU241934", "SUDHARSHAN V"), ("BU241935", "KALAIYARASI V"),
            ("BU241936", "DHANALAKSHMI V"), ("BU241937", "ARAVINTH G"), ("BU241938", "MANORAJAN M"),
            ("BU241939", "THIRUSELVAA K U"), ("BU241940", "ARASAN D"), ("BU241941", "GOKUL VS"),
            ("BU241942", "VETRIVEL N"), ("BU241943", "ROOHIN S"), ("BU241945", "GURUNATHAN S"),
            ("BU241946", "RAHIMAN F"), ("BU241947", "PAVITHRA S"), ("BU241948", "ROSHITH SREE S"),
            ("BU241949", "RAGUL R"), ("BU241950", "AKKALA STEVEN"),
        ]
        for reg, full_name in students:
            fn, *last_parts = full_name.split()
            ln = " ".join(last_parts)
            user_name = reg
            u = User.objects.create_user(user_name, f"{user_name.lower()}@student.sacredheart.edu.in", STUDENT_PW,
                                         first_name=fn, last_name=ln, role="student", must_change_password=True)
            Student.objects.create(user=u, department=dept, register_number=reg, year=3, section="A",
                                   attendance_percentage=random.choice([96, 92.5, 88, 84.5, 79, 91, 95.2, 73.5]))

        # ---- timetable (Years 1-3, Section A) ----
        times = [(time(9, 0), time(9, 50)), (time(9, 50), time(10, 40)), (time(11, 0), time(11, 50)), (time(11, 50), time(12, 40)),
                 (time(13, 30), time(14, 20)), (time(14, 20), time(15, 10))]
        subs1 = [("Programming Fundamentals", 3), ("Mathematics for Computing", 0), ("Digital Logic", 2), ("Introduction to AI", 0), ("Communication Skills", 1), ("Programming Lab", 3)]
        subs3 = [("Machine Learning", 1), ("Deep Learning", 1), ("Natural Language Processing", 1), ("Computer Vision", 1), ("AI Ethics", 0), ("AI Lab", 3)]
        subs2 = [("Python for AI", 2), ("Probability & Statistics", 0), ("Data Structures", 2), ("Operating Systems", 3), ("Database Systems", 2), ("AI Seminar", 3)]
        for yr, sec, subs, room in [(1, "A", subs1, "AIML-101"), (2, "A", subs2, "AIML-201"), (3, "A", subs3, "AIML-301")]:
            for d_i, day in enumerate(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]):
                for p in range(6 if day != "Saturday" else 3):
                    s, fi = subs[(p + d_i) % 6]
                    Timetable.objects.create(department=dept, year=yr, section=sec, day=day, period=p + 1, start_time=times[p][0],
                                             end_time=times[p][1], subject=s, faculty=fac[fi], room="Lab-2" if "Lab" in s else room)

        # ---- syllabus (AI & ML curriculum, semesters 1-8) ----
        base = {1: ["Mathematics for AI", "Python for Data Science", "Digital Logic & Computer Architecture", "Introduction to AI"],
                2: ["Probability & Statistics", "Data Structures & Algorithms", "Operating Systems", "Database Management Systems"],
                3: ["Machine Learning Foundations", "Deep Learning", "Computer Vision", "Natural Language Processing"],
                4: ["AI for Healthcare", "Reinforcement Learning", "Big Data Analytics", "Software Engineering for AI"],
                5: ["Neural Networks", "Computer Vision & Image Processing", "MLOps", "Cloud AI"],
                6: ["Generative AI", "Time Series Analysis", "AI Ethics & Governance", "Knowledge Representation"]}
        for sem, subs in base.items():
            for j, name in enumerate(subs, 1):
                s = Syllabus(department=dept, regulation="R2021", year=(sem + 1) // 2, semester=sem, subject_code=f"AIML{sem}{j:02d}", subject_name=name, credits=random.choice([3, 3, 4]))
                s.pdf.save(f"AIML{sem}{j:02d}.pdf", pdf(f"AIML{sem}{j:02d} - {name}", ["Regulation 2021 | Artificial Intelligence & Machine Learning", "", "Unit I   - Core Concepts",
                          "Unit II  - Models & Algorithms", "Unit III - Applications", "Unit IV  - Advanced Topics", "Unit V   - Lab & Research Methods"]), save=True)

        # ---- events ----
        def mk(title, etype, days, tm, venue, desc, org, coord, reg, sched, part=0, results="", plist=""):
            e = Event.objects.create(department=dept, title=title, event_type=etype, date=today + timedelta(days=days), time=tm, venue=venue,
                                     description=desc, organizers=org, coordinator=coord, registration_link=reg, schedule_text=sched,
                                     participants_count=part, results=results, participants=plist, created_by=hod)
            c1, c2 = PALETTE.get(etype, (NAVY, NAVY2))
            e.banner.save(f"{etype}.jpg", ContentFile(img(1600, 700, c1, c2)), save=True)
            for k in range(3):
                g = EventGallery(event=e, caption=f"{title} – moment {k + 1}")
                g.image.save(f"{etype}_g{k}.jpg", ContentFile(img(900, 600, c1, c2)), save=True)
            return e
        mk("Full-Stack Web Development Workshop", "workshop", 5, time(9, 30), "Seminar Hall A", "A two-day hands-on workshop covering React, Django REST APIs and deployment. Bring your laptop and build a working web application from scratch.",
           "CSE Association", "Mr. Arun Kumar", "",
           "09:30 | Registration & Setup\n10:00 | Frontend Fundamentals with React | Mr. Arun Kumar\n12:30 | Lunch Break\n13:30 | Building REST APIs with Django | Ms. Divya\n16:00 | Mini Project Demo", 60)
        mk("CodeStorm 24-Hour Hackathon", "hackathon", 18, time(9, 0), "Innovation Lab & Central Auditorium", "Build, break and ship in 24 hours. Teams of up to four solve real problem statements shared by industry partners. Prizes worth Rs. 50,000.",
           "Coding Club", "Dr. S. Karthikeyan", "",
           "09:00 | Kick-off & Problem Statements\n10:00 | Hacking Begins\n16:00 | Mentor Round 1\n02:00 | Midnight Snack Break\n09:00 | Final Submission\n11:00 | Demos & Judging\n15:00 | Prize Distribution", 120)
        mk(f"Pongal Vizha {pongal_date.year}", "pongal", (pongal_date - today).days, time(10, 0), "College Grounds", "Celebrate the harvest festival with traditional attire, pongal pot cooking competition, kolam, uriyadi and folk performances by students and staff.",
           "Cultural Committee", "Ms. P. Lakshmi", "", "10:00 | Pongal Pot Ceremony\n11:00 | Kolam Competition\n12:30 | Traditional Lunch\n14:00 | Uriyadi & Village Games\n16:00 | Folk Dance & Music", 400)
        mk("Annual Sports Day 2027", "sports_day", 45, time(8, 0), "Greenfield Stadium", "Track, field and team events across all years. Inter-year rivalry, Best Athlete award and the department trophy.",
           "Physical Education Dept & CSE Sports Club", "Dr. A. Venkatesh", "",
           "08:00 | March Past & Torch Relay\n09:00 | 100m & 200m Sprints\n10:30 | Long Jump & Shot Put\n13:30 | Volleyball & Kabaddi Finals\n16:00 | Relay Race\n17:00 | Prize Distribution", 250)
        mk("National Conference on AI & Data Science (NCAIDS 2026)", "conference", 60, time(9, 0), "Main Auditorium", "A two-day national conference featuring keynote talks, paper presentations and industry panels on artificial intelligence and data science.",
           "Department of CSE", "Mr. John Bosco S", "",
           "09:00 | Inauguration & Keynote | Chief Guest\n11:00 | Paper Session I: Machine Learning\n13:30 | Industry Panel: AI in Practice\n15:00 | Paper Session II: Data Engineering\n17:00 | Valedictory", 300)
        mk("Cyber Security Awareness Seminar", "seminar", -20, time(14, 0), "Seminar Hall B", "Expert talk on phishing, password hygiene and safe internet practices for students.", "CSE Association", "Dr. A. Venkatesh", "",
           "14:00 | Welcome\n14:15 | Talk: Staying Safe Online | Industry Speaker\n15:15 | Live Demo & Q&A", 180, "Best Q&A participants: Diya Sharma, Karthik Raja.", "")
        mk("Tech Symposium – Technovate 2026", "symposium", -50, time(9, 30), "Main Block", "Paper presentation, project expo and technical quiz with participation from 12 colleges.", "CSE Association", "Ms. K. Divya", "",
           "09:30 | Inauguration\n10:30 | Paper Presentation\n13:30 | Project Expo\n15:30 | Prize Distribution", 320,
           "Paper Presentation - 1st: Team Quantum (GCET); 2nd: Team Nexus (CSE).\nProject Expo - 1st: Smart Attendance (CSE III Year).", "")

        # ---- announcements ----
        Announcement.objects.create(department=dept, title="Internal Assessment I – Schedule Released", priority="urgent", created_by=hod, date=today,
                                    description="Internal Assessment I will begin next Monday. Students must carry ID cards and hall tickets. The detailed timetable is available in the Documents section.")
        Announcement.objects.create(department=dept, title="CodeStorm Hackathon – Registrations Open", priority="important", created_by=hod, date=today - timedelta(days=1),
                                    description="Form teams of up to four members and register before the deadline. Problem statements will be shared during the kick-off.")
        a3 = Announcement(department=dept, title="Library Extended Hours During Exams", priority="normal", created_by=hod, date=today - timedelta(days=4),
                          description="The central library will remain open until 8:00 PM on all working days during the assessment period.")
        a3.attachment.save("library_notice.pdf", pdf("Library Notice", ["Extended hours: 8:00 AM - 8:00 PM", "Valid during the assessment period."]), save=True)

        # ---- achievements ----
        for t, c, p, d, desc in [
            ("Winner – Smart India Hackathon (Software Edition)", "hackathon", "Team Nexus (Aarav, Diya, Vihaan, Ananya)", -30, "Built an AI-based crop disease detection app and won the national finals."),
            ("Best Paper Award – IEEE Conference", "conference", "Dr. S. Karthikeyan", -60, "Awarded for research on explainable machine learning in healthcare."),
            ("Inter-College Kabaddi Champions", "sports", "CSE Sports Team", -15, "The department team won the university inter-college kabaddi tournament."),
            ("University Rank 1 – B.E. CSE", "student", "Priya Dharshini", -90, "Secured first rank in the university semester examinations."),
            ("Best Teacher Award 2026", "faculty", "Ms. P. Lakshmi", -40, "Recognised for outstanding teaching and mentoring."),
            ("Google Cloud Certified Professionals", "award", "18 Students", -25, "Eighteen final-year students cleared Google Cloud Associate certification."),
        ]:
            a = Achievement(department=dept, title=t, category=c, person_name=p, date=today + timedelta(days=d), description=desc)
            a.image.save("ach.jpg", ContentFile(img(900, 600, NAVY, (200, 150, 40))), save=True)

        # ---- gallery ----
        cats = ["events", "sports", "conference", "workshops", "cultural", "activities"]
        for i in range(12):
            c1, c2 = list(PALETTE.values())[i % len(PALETTE)]
            g = GalleryImage(title=f"{cats[i % 6].title()} highlight {i // 6 + 1}", category=cats[i % 6])
            g.image.save(f"gallery{i}.jpg", ContentFile(img(random.choice([900, 800, 1000]), random.choice([600, 700, 900]), c1, c2)), save=True)

        # ---- documents ----
        ev = {e.event_type: e for e in Event.objects.all()}
        docs = [("Academic Calendar 2026-27", "academic", "public", None, "Semester dates, holidays and exam schedule."),
                ("Circular – Internal Assessment Schedule", "circular", "public", None, "IA-I timetable for all years."),
                ("Year 3 Weekly Timetable", "timetable", "public", None, "Class timetable for III Year."),
                ("Syllabus Booklet – Regulation 2021", "syllabus", "public", None, "Complete curriculum and syllabus for R2021."),
                ("CodeStorm Hackathon Rulebook", "event", "public", "hackathon", "Rules, judging criteria and prizes."),
                ("NCAIDS 2026 – Call for Papers", "conference", "public", "conference", "Paper submission guidelines and important dates."),
                ("Full-Stack Workshop – Setup Guide", "workshop", "student", "workshop", "Software to install before the workshop."),
                ("Annual Department Report 2025-26", "report", "staff", None, "Confidential report for staff and HOD."),
                ("Bonafide Certificate Request Form", "student", "student", None, "Form for students to request a bonafide certificate.")]
        for t, c, v, et, d in docs:
            doc = Document(department=dept, title=t, category=c, visibility=v, description=d, event=ev.get(et) if et else None, created_by=hod)
            doc.file.save(t.replace(" ", "_")[:30] + ".pdf", pdf(t, [d, "", "Greenfield College of Engineering & Technology", "Department of CSE"]), save=True)

        self.stdout.write(self.style.SUCCESS("Demo data created."))
        self.stdout.write("HOD:      staff1 / " + STAFF_PW + "\nStaff:    staff2..staff4 / " + STAFF_PW + "\nStudents: BU241901..BU241950 / " + STUDENT_PW)
