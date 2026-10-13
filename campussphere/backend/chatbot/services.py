"""Rule + database powered assistant. Every answer is built from live database rows.
An optional LLM (chatbot/llm.py) can rephrase the retrieved facts when an API key is configured."""
import re

from django.utils import timezone

from accounts.models import HOD, Staff, Student
from academics.models import Faculty, Syllabus, Timetable
from announcements.models import Announcement
from departments.models import Achievement, CollegeSettings, Department
from documents.models import Document
from documents.utils import visible_documents
from events.models import Event

from . import llm
from .search import SEM_RE, _num, r_ach, r_ann, r_doc, r_event, r_faculty, r_syllabus, r_tt, smart_search

INTENTS = [
    ("greeting", r"^\s*(hi|hello|hey|vanakkam|good (morning|afternoon|evening)|help)\b"),
    ("hod", r"\bhod\b|head of (the )?(dept|department)|who (heads|leads)"),
    ("timetable_download", r"(download|where|get|pdf).*(timetable|time table)|(timetable|time table).*(download|pdf|file)"),
    ("timetable_today", r"timetable|time table|class schedule|classes|periods"),
    ("syllabus", r"syllabus|curriculum|regulation"),
    ("conference", r"conference"),
    ("workshop", r"workshop"),
    ("sports", r"sports?\b"),
    ("faculty", r"faculty|professor|teacher|lecturer|staff members|who are the staff"),
    ("achievements", r"achievement|award|winner|\bwon\b|proud"),
    ("announcements", r"announcement|notice|circular|news"),
    ("contact", r"contact|e-?mail|phone|address|location|reach"),
    ("documents", r"document|download|report|form\b"),
    ("about", r"(dept|department|college)\b.*(about|overview|detail|info)|about (the )?(dept|department|college)|vision|mission|overview|programmes?|courses?"),
    ("events", r"\bevents?\b|fest|programme|when is the next|what.?s happening|upcoming|latest"),
]
GENERIC_TITLE_WORDS = {"national", "annual", "department", "celebration", "celebrations", "conference", "workshop", "with",
                       "and", "the", "for", "day", "international", "technical", "event", "fest", "2026", "2027", "2025", "on", "of"}


def _fmt_event(e):
    s = f"{e.title} ({e.get_event_type_display()}) on {e.date:%d %b %Y}"
    if e.time:
        s += f" at {e.time:%I:%M %p}"
    if e.venue:
        s += f", {e.venue}"
    return s


def _find_event(text):
    words = set(re.findall(r"[a-z0-9]+", text.lower()))
    for e in Event.objects.filter(is_published=True).order_by("-date"):
        toks = {t for t in re.findall(r"[a-z0-9]+", e.title.lower()) if len(t) >= 4 and t not in GENERIC_TITLE_WORDS}
        if toks & words:
            return e
    return None


def _event_answer(e):
    parts = [f"{_fmt_event(e)}."]
    if e.coordinator:
        parts.append(f"Faculty coordinator: {e.coordinator}.")
    if e.description:
        parts.append(e.description[:280] + ("…" if len(e.description) > 280 else ""))
    if e.registration_link and e.is_upcoming:
        parts.append("Registration is open — use the link on the event page.")
    if e.results:
        parts.append("Results: " + e.results.replace("\n", "; ")[:200])
    return " ".join(parts), [r_event(e)]


def _events_of(etype, label, plural):
    today = timezone.localdate()
    base = Event.objects.filter(is_published=True, event_type=etype)
    up = list(base.filter(date__gte=today).order_by("date")[:4])
    if up:
        return f"Upcoming {plural}:\n" + "\n".join("• " + _fmt_event(e) for e in up), [r_event(e) for e in up]
    past = list(base.order_by("-date")[:3])
    if past:
        return (f"There are no upcoming {plural} right now. Recent {plural}:\n" + "\n".join("• " + _fmt_event(e) for e in past),
                [r_event(e) for e in past])
    return f"No {plural} are listed yet. Please check back soon.", []


def answer(message, user=None):
    text = message.strip()
    low = text.lower()
    today = timezone.localdate()
    dept = Department.objects.first()
    college = CollegeSettings.load()
    reply, cards, intent = "", [], None

    ev = _find_event(low)
    if ev and not re.search(r"\b(hod|faculty|timetable|syllabus)\b", low):
        intent = "event_detail"
        reply, cards = _event_answer(ev)
    else:
        for name, pat in INTENTS:
            if re.search(pat, low):
                intent = name
                break

    if intent is None or reply:
        pass
    elif intent == "greeting":
        reply = (f"Hi! I'm the CampusSphere AI Assistant for {dept.name if dept else 'the department'}. "
                 "Ask me about events, timetable, syllabus, faculty, announcements or documents.")
    elif intent == "hod":
        h = HOD.objects.select_related("user").first()
        if h:
            reply = f"{h.user.full_name} is the Head of the Department" + (f" ({h.qualification})" if h.qualification else "") + "."
            if h.user.email:
                reply += f" Email: {h.user.email}."
            cards = [{"type": "hod", "title": h.user.full_name, "subtitle": "Head of the Department", "link": "/department"}]
        else:
            reply = "The HOD information has not been added yet."
    elif intent == "timetable_download":
        docs = list(visible_documents(Document.objects.filter(is_published=True, category="timetable"), user)[:4])
        reply = ("You can download the timetable from the Documents page or view it online on the Timetable page."
                 if docs else "You can view the timetable online on the Timetable page.")
        cards = [r_doc(d) for d in docs] + [{"type": "timetable", "title": "Open timetable page", "subtitle": "View by year & section", "link": "/timetable"}]
    elif intent == "timetable_today":
        day = today.strftime("%A")
        prof = getattr(user, "student_profile", None) if user is not None and getattr(user, "is_authenticated", False) else None
        year, sec = (prof.year, prof.section) if prof else (3, "A")
        rows = list(Timetable.objects.filter(is_published=True, year=year, section=sec, day=day).select_related("faculty").order_by("period"))
        who = "your class" if prof else f"Year {year} Section {sec} (log in as a student for your own class)"
        if rows:
            reply = f"Today's timetable ({day}) for {who}:\n" + "\n".join(
                f"• Period {t.period}: {t.subject}" + (f" – {t.faculty.name}" if t.faculty else "") + (f" [{t.room}]" if t.room else "") for t in rows)
            cards = [{"type": "timetable", "title": "Open full timetable", "subtitle": "All days", "link": "/timetable"}]
        else:
            reply = f"No classes are scheduled for {day} for {who}."
            cards = [{"type": "timetable", "title": "Open full timetable", "subtitle": "All days", "link": "/timetable"}]
    elif intent == "syllabus":
        m = SEM_RE.search(low)
        sem = _num(m) if m else None
        qs = Syllabus.objects.filter(is_published=True)
        if sem:
            qs = qs.filter(semester=sem)
        items = list(qs[:6])
        reply = (f"Found {qs.count()} subject syllabus entries" + (f" for semester {sem}" if sem else "") +
                 ". You can preview or download each PDF from the Syllabus page (Academics → Syllabus).")
        cards = [r_syllabus(s) for s in items] or [{"type": "syllabus", "title": "Open syllabus page", "subtitle": "Filter by regulation, year & semester", "link": "/syllabus"}]
    elif intent == "conference":
        reply, cards = _events_of("conference", "conference", "conferences")
    elif intent == "workshop":
        reply, cards = _events_of("workshop", "workshop", "workshops")
    elif intent == "sports":
        reply, cards = _events_of("sports_day", "sports day", "sports events")
    elif intent == "faculty":
        fs = list(Faculty.objects.filter(is_published=True)[:10])
        reply = f"Our department has {Faculty.objects.filter(is_published=True).count()} faculty members:\n" + "\n".join(
            f"• {f.name} – {f.designation}" for f in fs) if fs else "Faculty details have not been added yet."
        cards = [r_faculty(f) for f in fs[:4]] + [{"type": "faculty", "title": "View all faculty", "subtitle": "Photos, subjects & contact", "link": "/faculty"}]
    elif intent == "achievements":
        a = list(Achievement.objects.filter(is_published=True)[:4])
        reply = "Recent achievements:\n" + "\n".join(f"• {x.title}" + (f" – {x.person_name}" if x.person_name else "") for x in a) if a else "No achievements listed yet."
        cards = [r_ach(x) for x in a]
    elif intent == "announcements":
        a = list(Announcement.objects.filter(is_published=True)[:4])
        reply = "Latest announcements:\n" + "\n".join(f"• [{x.get_priority_display()}] {x.title}" for x in a) if a else "There are no announcements right now."
        cards = [r_ann(x) for x in a]
    elif intent == "contact":
        bits = [b for b in [college.address, dept.phone if dept and dept.phone else college.phone,
                            dept.email if dept and dept.email else college.email] if b]
        reply = "You can reach the department office at: " + " | ".join(bits) if bits else "Contact details have not been added yet."
    elif intent == "documents":
        docs = list(visible_documents(Document.objects.filter(is_published=True), user)[:5])
        reply = "Here are the latest documents. The Documents page has every category (circulars, reports, academic documents…)."
        cards = [r_doc(d) for d in docs]
    elif intent == "about":
        parts = []
        if dept:
            parts.append(f"{dept.name}" + (f" (established {dept.established_year})" if dept.established_year else "") + f" at {college.college_name}.")
            if dept.description:
                parts.append(dept.description[:350])
            if dept.vision:
                parts.append("Vision: " + dept.vision[:200])
        parts.append(f"We have {Student.objects.count()} students and {Staff.objects.count()} staff members.")
        reply = " ".join(parts)
        cards = [{"type": "department", "title": "Department overview", "subtitle": "Vision, mission & HOD message", "link": "/department"}]
    elif intent == "events":
        up = list(Event.objects.filter(is_published=True, date__gte=today).order_by("date")[:4])
        if up:
            first = up[0]
            reply = f"The next event is {_fmt_event(first)}.\n\nComing up:\n" + "\n".join("• " + _fmt_event(e) for e in up)
        else:
            up = list(Event.objects.filter(is_published=True)[:3])
            reply = "No upcoming events are scheduled. Recent events:\n" + "\n".join("• " + _fmt_event(e) for e in up)
        cards = [r_event(e) for e in up]

    if not reply:
        res = smart_search(text, user, limit=4)["results"][:5]
        if res:
            reply, cards, intent = "Here is what I found in the department portal:", res, "search"
        else:
            intent = "unknown"
            reply = ("I couldn't find that in the department data. Try asking about events, timetable, syllabus, faculty, "
                     "announcements or documents — or contact the department office.")

    used_llm = False
    polished = llm.enhance(text, reply) if reply and intent not in ("greeting",) else None
    if polished:
        reply, used_llm = polished, True
    return {"reply": reply, "cards": cards[:6], "intent": intent, "ai": used_llm}
