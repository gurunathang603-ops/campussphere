export default function EmptyState({ title = "Nothing here yet", hint }) {
  return (
    <div className="text-center py-16 text-ink/50">
      <p className="font-medium text-ink/70">{title}</p>
      {hint && <p className="text-sm mt-1">{hint}</p>}
    </div>
  );
}
