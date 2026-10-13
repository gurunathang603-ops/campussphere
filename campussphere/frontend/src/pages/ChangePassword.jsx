import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const DASH = { student: "/dashboard/student", staff: "/dashboard/staff", hod: "/dashboard/hod" };

const errorMessage = (error) => {
  const data = error?.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  for (const value of Object.values(data || {})) {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && value.length) return value.join(" ");
  }
  return "Password change failed. Check your current password and try again.";
};

export default function ChangePassword() {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await changePassword(oldPassword, newPassword, confirmPassword);
      navigate(DASH[user.role], { replace: true });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-lg bg-white border border-black/10 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="h-11 w-11 flex items-center justify-center bg-gold-50 text-gold-700"><KeyRound size={20} /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo">Account security</p>
            <h1 className="text-2xl font-semibold mt-1">{user?.must_change_password ? "Choose your password" : "Change password"}</h1>
          </div>
        </div>
        {user?.must_change_password && <p className="text-sm text-ink/60 mb-6">Set a private password before opening your portal. Use at least 8 characters and avoid your name or username.</p>}
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-ink/60 mb-1.5 block">Current password</span>
            <input type="password" autoComplete="current-password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} required className="input" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink/60 mb-1.5 block">New password</span>
            <div className="relative">
              <input type={visible ? "text" : "password"} autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required className="input pr-11" />
              <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide new password" : "Show new password"} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40">
                {visible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink/60 mb-1.5 block">Confirm new password</span>
            <input type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required className="input" />
          </label>
          {error && <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>}
          <button type="submit" disabled={busy} className="btn-navy w-full">
            {busy ? "Saving…" : "Save password"}
          </button>
        </form>
      </section>
    </div>
  );
}
