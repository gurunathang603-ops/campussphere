export default function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-black/5 text-ink/70",
    urgent: "bg-red-100 text-red-700",
    important: "bg-gold-50 text-gold-600",
    new: "bg-emerald-100 text-emerald-700",
    indigo: "bg-indigo-50 text-indigo",
  };
  return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${tones[tone] || tones.slate}`}>{children}</span>;
}
