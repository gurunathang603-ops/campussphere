"""Natural-language search across the whole database ("Find the 3rd semester syllabus")."""
import re

from django.db.models import Q
from django.utils import timezone

from academics.models import Faculty, Syllabus, Timetable
from announcements.models import Announcement
from departments.models import Achievement
from documents.models import Document
from documents.utils import visible_documents
from events.models import Event

STOP = set("show me find the a an of for to in on at is are was what which who when where how about please tell give get "
           "list all any and or my our latest recent last next upcoming coming new details detail info information can "
           "you do does there this that with from i want need look looking search".split())
TYPE_WORDS = {"conference": "conference", "conferences": "conference", "workshop": "workshop", "workshops": "workshop",
              "seminar": "seminar", "seminars": "seminar", "sports": "sports_day", "sport": "sports_day",
              "pongal": "pongal", "cultural": "cultural", "symposium": "symposium", "hackathon": "hackathon",
              "hackathons": "hackathon", "technical": "technical"}
CAT_WORDS = {"event": "events", "events": "events", "syllabus": "syllabus", "faculty": "faculty", "staff": "faculty",
             "professor": "faculty", "professors": "faculty", "timetable": "timetable", "announcement": "announcements",
             "announcements": "announcements", "notice": "announcements", "circular": "documents",
             "circulars": "documents", "document": "documents", "documents": "documents", "pdf": "documents",
             "report": "documents", "achievement": "achievements", "achievements": "achievements",
             "award": "achievements", "awards": "achievements"}
NUM = {"first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5, "sixth": 6, "seventh": 7, "eighth": 8, "final": 4}
SEM_RE = re.compile(r"(?:(\d)(?:st|nd|rd|th)?|(first|second|third|fourth|fifth|sixth|seventh|eighth))[\s-]*sem(?:ester)?|sem(?:ester)?\s*[-:]?\s*(\d)")
YEAR_RE = re.compile(r"(?:(\d)(?:st|nd|rd|th)?|(first|second|third|fourth|final))[\s-]*year|year\s*[-:]?\s*(\d)")


def _num(m):
    d = next((g for g in m.groups() if g), None)
    return int(d) if d and d.isdigit() else NUM.get(d)


def r_event(e):
    return {"type": "event", "title": e.title, "subtitle": f"{e.get_event_type_display()} • {e.date:%d %b %Y}",
            "link": f"/events/{e.id}"}


def r_syllabus(s):
    return {"type": "syllabus", "title": f"{s.subject_code} – {s.subject_name}",
            "subtitle": f"{s.regulation} • Year {s.year} • Semester {s.semester}",
            "link": f"/syllabus?semester={s.semester}", "file": s.pdf.url if s.pdf else None}


def r_faculty(f):
    return {"type": "faculty", "title": f.name, "subtitle": f"{f.designation} • {f.specialization}".strip(" •"), "link": "/faculty"}


def r_tt(t):
    return {"type": "timetable", "title": f"{t.subject} – {t.day}, period {t.period}",
            "subtitle": f"Year {t.year} Sec {t.section} • {t.room}".strip(" •"), "link": "/timetable"}


def r_ann(a):
    return {"type": "announcement", "title": a.title, "subtitle": f"{a.get_priority_display()} • {a.date:%d %b %Y}",
            "link": "/announcements", "file": a.attachment.url if a.attachment else None}


def r_doc(d):
    return {"type": "document", "title": d.title, "subtitle": d.get_category_display(), "link": "/documents",
            "file": d.file.url if d.visibility == "public" and d.file else None, "download_url": f"/api/documents/{d.id}/download/"}


def r_ach(a):
    return {"type": "achievement", "title": a.title, "subtitle": a.person_name or a.get_category_display(), "link": "/achievements"}


def _kw(fields, words):
    cond = Q()
    for w in words:
        for f in fields:
            cond |= Q(**{f + "__icontains": w})
    return cond


def smart_search(query, user=None, limit=6):
    q = (query or "").lower().strip()
    if len(q) < 2:
        return {"query": query, "interpretation": "", "results": []}
    today = timezone.localdate()
    notes = []
    sem = year = None
    m = SEM_RE.search(q)
    if m:
        sem = _num(m)
        q = q.replace(m.group(0), " ")
        notes.append(f"semester {sem}")
    m = YEAR_RE.search(q)
    if m:
        year = _num(m)
        q = q.replace(m.group(0), " ")
        notes.append(f"year {year}")
    tokens = re.findall(r"[a-z0-9]+", q)
    latest = any(t in tokens for t in ("latest", "recent", "last", "newest"))
    upcoming = any(t in tokens for t in ("next", "upcoming", "coming", "future"))
    etype = next((TYPE_WORDS[t] for t in tokens if t in TYPE_WORDS), None)
    cats = {CAT_WORDS[t] for t in tokens if t in CAT_WORDS}
    if sem or year:
        cats.add("syllabus") if "syllabus" in q or "syllab" in q or not cats else None
    if etype:
        cats.add("events")
    words = [t for t in tokens if t not in STOP and t not in TYPE_WORDS and t not in CAT_WORDS and len(t) > 2 and not t.isdigit()]
    if etype:
        notes.append(f"event type {etype.replace('_', ' ')}")
    if words:
        notes.append("keywords: " + ", ".join(words))
    if latest:
        notes.append("latest first")
    if upcoming:
        notes.append("upcoming only")
    search_all = not cats
    out = []

    if "events" in cats or search_all:
        qs = Event.objects.filter(is_published=True)
        if etype:
            qs = qs.filter(event_type=etype)
        if words:
            qs = qs.filter(_kw(["title", "description", "venue", "organizers"], words))
        if upcoming:
            qs = qs.filter(date__gte=today).order_by("date")
        else:
            qs = qs.order_by("-date")
        if search_all and not words:
            qs = qs.none()
        out += [r_event(e) for e in qs[:limit]]
    if "syllabus" in cats or (search_all and words):
        qs = Syllabus.objects.filter(is_published=True)
        if sem:
            qs = qs.filter(semester=sem)
        if year:
            qs = qs.filter(year=year)
        if words and not (sem or year) or (words and "syllabus" not in cats and not sem):
            qs = qs.filter(_kw(["subject_name", "subject_code"], words))
        if "syllabus" in cats or words:
            out += [r_syllabus(s) for s in qs[: limit + 4]]
    if "faculty" in cats or (search_all and words):
        qs = Faculty.objects.filter(is_published=True)
        if words:
            qs = qs.filter(_kw(["name", "specialization", "subjects", "designation"], words))
        out += [r_faculty(f) for f in qs[:limit]]
    if "timetable" in cats or (search_all and words):
        docs = visible_documents(Document.objects.filter(is_published=True, category="timetable"), user)
        out += [r_doc(d) for d in docs[:3]] if "timetable" in cats else []
        if words:
            out += [r_tt(t) for t in Timetable.objects.filter(is_published=True).filter(_kw(["subject", "faculty__name"], words))[:limit]]
        elif "timetable" in cats:
            out.append({"type": "timetable", "title": "Open the class timetable", "subtitle": "View by year & section", "link": "/timetable"})
    if "announcements" in cats or (search_all and words):
        qs = Announcement.objects.filter(is_published=True)
        if words:
            qs = qs.filter(_kw(["title", "description"], words))
        out += [r_ann(a) for a in qs[:limit]]
    if "documents" in cats or (search_all and words):
        qs = visible_documents(Document.objects.filter(is_published=True), user)
        if words:
            qs = qs.filter(_kw(["title", "description"], words))
        out += [r_doc(d) for d in qs[:limit]]
    if "achievements" in cats or (search_all and words):
        qs = Achievement.objects.filter(is_published=True)
        if words:
            qs = qs.filter(_kw(["title", "person_name", "description"], words))
        out += [r_ach(a) for a in qs[:limit]]

    seen, uniq = set(), []
    for r in out:
        k = (r["type"], r["title"], r["subtitle"])
        if k not in seen:
            seen.add(k)
            uniq.append(r)
    interp = ("Searching for " + "; ".join(notes)) if notes else "Searching the whole portal"
    return {"query": query, "interpretation": interp, "results": uniq[:30]}
