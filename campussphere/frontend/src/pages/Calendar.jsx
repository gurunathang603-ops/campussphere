import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import Reveal from "../components/Reveal";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const eventStart = (event) => new Date(`${event.date}T${event.time || "09:00:00"}`);

export default function Calendar() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [now] = useState(() => Date.now());

  useEffect(() => {
    Promise.all([api.get("/events/"), api.get("/announcements/")]).then(([eventResponse, announcementResponse]) => {
      const events = eventResponse.data.map((event) => ({
        ...event,
        kind: "event",
        key: `event-${event.id}`,
        href: `/events/${event.id}`,
      }));
      const announcements = announcementResponse.data.map((announcement) => ({
        ...announcement,
        id: `announcement-${announcement.id}`,
        kind: "announcement",
        type_label: "Announcement",
        key: `announcement-${announcement.id}`,
        href: "/announcements",
        time: null,
        venue: "",
        end_date: null,
      }));
      setItems([...events, ...announcements]);
    }).catch(() => setItems([]));
  }, []);

  const monthLabel = useMemo(() => month.toLocaleDateString("en-IN", { month: "long", year: "numeric" }), [month]);
  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day < 1 || day > daysInMonth ? null : new Date(month.getFullYear(), month.getMonth(), day);
  });

  const eventsForDate = (key) => (items || []).filter((event) => event.date <= key && (event.end_date || event.date) >= key);
  const selectedEvents = items ? eventsForDate(dateKey(selectedDate)).sort((a, b) => eventStart(a) - eventStart(b)) : [];

  const changeMonth = (offset) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelectedDate(next);
  };

  return (
    <div>
      <section className="bg-navy-900 text-white pt-40 pb-14">
        <div className="container-page">
          <Reveal><p className="eyebrow text-gold">Events</p></Reveal>
          <Reveal delay={0.05}><h1 className="text-4xl font-semibold mt-2">Campus calendar</h1></Reveal>
        </div>
      </section>

      <section className="section container-page">
        <div className="grid lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)] gap-8 items-start">
          <Reveal>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{monthLabel}</h2>
              <div className="flex items-center gap-1">
                <button type="button" title="Previous month" aria-label="Previous month" onClick={() => changeMonth(-1)} className="h-10 w-10 flex items-center justify-center border border-black/10 hover:bg-mist"><ChevronLeft size={19} /></button>
                <button type="button" title="Next month" aria-label="Next month" onClick={() => changeMonth(1)} className="h-10 w-10 flex items-center justify-center border border-black/10 hover:bg-mist"><ChevronRight size={19} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-t border-l border-black/10">
              {WEEKDAYS.map((day) => <div key={day} className="border-r border-b border-black/10 py-2 text-center text-xs font-semibold text-ink/50">{day}</div>)}
              {cells.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="min-h-[4.5rem] sm:min-h-24 border-r border-b border-black/10 bg-mist/40" />;
                const key = dateKey(date);
                const dayEvents = items ? eventsForDate(key) : [];
                const active = key === dateKey(selectedDate);
                const today = key === dateKey(new Date());
                return (
                  <button key={key} type="button" onClick={() => setSelectedDate(date)} aria-pressed={active}
                    aria-label={`${date.toLocaleDateString("en-IN", { dateStyle: "long" })}, ${dayEvents.length} calendar items`}
                    className={`min-h-[4.5rem] sm:min-h-24 p-1 sm:p-2 border-r border-b border-black/10 text-left align-top transition ${active ? "bg-indigo-50 ring-2 ring-inset ring-indigo" : "bg-white hover:bg-mist/60"}`}>
                    <span className={`inline-flex h-6 min-w-6 items-center justify-center text-xs ${today ? "bg-gold text-navy-900 font-bold" : "text-ink/70"}`}>{date.getDate()}</span>
                    <span className="mt-1 flex flex-wrap gap-1 sm:hidden">
                      {dayEvents.slice(0, 3).map((event) => <i key={event.key} className={`h-1.5 w-1.5 rounded-full ${event.kind === "announcement" ? "bg-gold" : "bg-indigo"}`} />)}
                    </span>
                    <span className="hidden sm:block mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((event) => <span key={event.key} className={`block truncate text-[10px] leading-4 ${event.kind === "announcement" ? "text-gold-700" : "text-indigo"}`}>{event.title}</span>)}
                      {dayEvents.length > 2 && <span className="block text-[10px] text-ink/40">+{dayEvents.length - 2} more</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <aside>
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={18} className="text-indigo" />
                <h2 className="text-lg font-semibold">{selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}</h2>
              </div>
              {!items ? <Loader /> : selectedEvents.length === 0 ? <EmptyState title="No events or announcements on this date" /> : (
                <div className="divide-y divide-black/10 border-y border-black/10">
                  {selectedEvents.map((event) => {
                    const isUpcoming = event.kind === "announcement"
                      ? new Date(`${event.date}T23:59:59`).getTime() > now
                      : eventStart(event).getTime() > now;
                    return (
                      <article key={event.key} className="py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo">
                              {event.is_cancelled ? "Cancelled" : event.type_label || "Event"}
                            </p>
                            <Link to={event.href} className="mt-1 block font-semibold hover:text-indigo">{event.title}</Link>
                          </div>
                          {isUpcoming && event.kind === "event" && !event.is_cancelled && (
                            <Link to={user ? "/notifications#preferences" : "/login"}
                              title="Manage event reminder preferences" aria-label={`Manage reminders for ${event.title}`}
                              className="h-9 w-9 shrink-0 flex items-center justify-center border border-black/10 hover:bg-mist">
                              <Bell size={17} />
                            </Link>
                          )}
                        </div>
                        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/50">
                          {event.time && <span className="inline-flex items-center gap-1"><Clock3 size={12} />{event.time.slice(0, 5)}</span>}
                          {event.venue && <span className="inline-flex items-center gap-1"><MapPin size={12} />{event.venue}</span>}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </aside>
          </Reveal>
        </div>
      </section>
    </div>
  );
}