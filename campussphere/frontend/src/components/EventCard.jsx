import { Link } from "react-router-dom";
import { CalendarDays, MapPin } from "lucide-react";
import { mediaUrl } from "../services/api";
import Badge from "./Badge";

export default function EventCard({ event }) {
  return (
    <Link to={`/events/${event.id}`} className="card overflow-hidden group block h-full">
      <div className="aspect-[16/10] overflow-hidden bg-navy-50 relative">
        {event.banner ? (
          <img src={mediaUrl(event.banner)} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : <div className="w-full h-full bg-gradient-to-br from-navy to-indigo" />}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge tone="indigo">{event.type_label}</Badge>
          {event.is_cancelled && <Badge tone="urgent">Cancelled</Badge>}
        </div>
      </div>
      <div className="p-5">
        <p className="flex items-center gap-1.5 text-xs text-ink/50 mb-2"><CalendarDays size={13} />
          {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <h3 className="font-display font-semibold text-[16px] leading-snug line-clamp-2 group-hover:text-indigo transition-colors">{event.title}</h3>
        {event.venue && <p className="flex items-center gap-1.5 text-xs text-ink/50 mt-2"><MapPin size={13} />{event.venue}</p>}
      </div>
    </Link>
  );
}
