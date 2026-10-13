import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-6xl font-display font-bold text-navy">404</p>
      <p className="text-ink/50 mt-3 mb-6">This page doesn't exist.</p>
      <Link to="/" className="btn-navy">Back to home</Link>
    </div>
  );
}
