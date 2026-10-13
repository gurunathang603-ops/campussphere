export default function Loader({ label = "Loading" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink/50">
      <span className="h-4 w-4 rounded-full border-2 border-navy/20 border-t-navy animate-spin" />
      {label}
    </div>
  );
}
