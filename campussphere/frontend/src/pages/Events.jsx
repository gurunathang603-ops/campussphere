import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Reveal from "../components/Reveal";
import EventCard from "../components/EventCard";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import api from "../services/api";

const TYPES = [
  ["", "All"], ["conference", "Conference"], ["workshop", "Workshop"], ["seminar", "Seminar"],
  ["sports_day", "Sports Day"], ["pongal", "Pongal"], ["cultural", "Cultural"], ["symposium", "Symposium"],
  ["hackathon", "Hackathon"], ["technical", "Technical"],
];

export default function Events() {
  const [params, setParams] = useSearchParams();
  const type = params.get("type") || "";
  const [events, setEvents] = useState(null);

  useEffect(() => {
    setEvents(null);
    api.get("/events/", { params: type ? { type } : {} }).then((r) => setEvents(r.data));
  }, [type]);

  return (
    <div>
      <section className="bg-navy-900 text-white pt-40 pb-16">
        <div className="container-page">
          <Reveal><p className="eyebrow text-gold">What's happening</p></Reveal>
          <Reveal delay={0.05}><h1 className="text-4xl font-semibold mt-2">Department events</h1></Reveal>
        </div>
      </section>
      <section className="section container-page">
        <div className="flex gap-2 flex-wrap mb-10">
          {TYPES.map(([v, l]) => (
            <button key={v} onClick={() => setParams(v ? { type: v } : {})}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${type === v ? "bg-navy text-white" : "bg-white border border-black/10 text-ink/60 hover:border-navy/30"}`}>
              {l}
            </button>
          ))}
        </div>
        {!events ? <Loader /> : events.length === 0 ? <EmptyState title="No events in this category yet" /> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e, i) => <Reveal key={e.id} delay={(i % 6) * 0.06}><EventCard event={e} /></Reveal>)}
          </div>
        )}
      </section>
    </div>
  );
}
