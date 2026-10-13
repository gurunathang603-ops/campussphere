import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Users, Image as ImageIcon } from "lucide-react";
import { mediaUrl } from "../services/api";
import Badge from "./Badge";

export default function EventCard({ event }) {
  const [imageError, setImageError] = useState(false);
  const registeredCount = event.registered_students_count ?? 0;

  return (
    <Link to={`/events/${event.id}`} className="card overflow-hidden group block h-full">
      <div className="aspect-[16/10] overflow-hidden bg-navy-50 relative">
        {event.banner && !imageError ? (
          <img src={mediaUrl(event.banner)} alt={event.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-navy to-indigo flex items-center justify-center text-white/50">
            <ImageIcon size={34} aria-hidden="true" />
          </div>
        )}
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
        <p className="flex items-center gap-1.5 text-xs text-ink/50 mt-2">
          <Users size={13} />{registeredCount} {registeredCount === 1 ? "student registered" : "students registered"}
        </p>
      </div>
    </Link>
  );
}
