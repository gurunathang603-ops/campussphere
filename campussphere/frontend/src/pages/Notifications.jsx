import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { disablePushNotifications, enablePushNotifications } from "../services/pushNotifications";

const defaultPreferences = {
  email_enabled: true, sms_enabled: false, push_enabled: false, sms_consent: false, push_public_key: "", phone: "",
};

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [announcement, setAnnouncement] = useState({ title: "", message: "", audience: "all" });
  const [recipientPreview, setRecipientPreview] = useState(null);
  const [testChannel, setTestChannel] = useState("email");
  const [testResults, setTestResults] = useState([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const isStaff = user?.role === "staff" || user?.role === "hod" || user?.hod_level;

  const load = async () => {
    try {
      const [notifications, settings] = await Promise.all([
        api.get("/notifications/"),
        api.get("/notifications/preferences/"),
      ]);
      setItems(notifications.data.results);
      setPreferences(settings.data);
      if (isStaff) {
        const deliveryHistory = await api.get("/notifications/history/");
        setHistory(deliveryHistory.data.results);
      }
      setError("");
    } catch {
      setError("Could not load notification settings. Please try again.");
    }
  };

  useEffect(() => {
    let active = true;
    const loadInitial = async () => {
      try {
        const [notifications, settings] = await Promise.all([
          api.get("/notifications/"),
          api.get("/notifications/preferences/"),
        ]);
        let deliveryHistory = [];
        if (isStaff) {
          const response = await api.get("/notifications/history/");
          deliveryHistory = response.data.results;
        }
        if (!active) return;
        setItems(notifications.data.results);
        setPreferences(settings.data);
        setHistory(deliveryHistory);
        setError("");
      } catch {
        if (active) setError("Could not load notification settings. Please try again.");
      }
    };
    loadInitial();
    return () => { active = false; };
  }, [isStaff]);

  const savePreference = async (key, value) => {
    setError("");
    try {
      const { data } = await api.patch("/notifications/preferences/", { [key]: value });
      setPreferences(data);
      setNotice("Preference saved.");
    } catch {
      setError("Could not save that preference.");
    }
  };

  const togglePush = async (enabled) => {
    setError("");
    try {
      if (enabled) await enablePushNotifications();
      else await disablePushNotifications();
      const { data } = await api.get("/notifications/preferences/");
      setPreferences(data);
      setNotice(enabled ? "Browser push is enabled on this device." : "Browser push disabled on this device.");
    } catch (failure) {
      setError(failure.message || "Could not update browser push settings.");
    }
  };

  const previewAnnouncement = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/notifications/preview/", announcement);
      setRecipientPreview({ ...data, announcement: { ...announcement } });
    } catch (failure) {
      setError(Object.values(failure?.response?.data || {}).flat().join(" ") || "Could not count notification recipients.");
    }
  };

  const sendAnnouncement = async () => {
    if (!recipientPreview) return;
    setError("");
    try {
      await api.post("/notifications/send/", {
        ...recipientPreview.announcement,
        channels: ["in_app", "email", "sms", "push"],
        link: "/announcements",
      });
      setAnnouncement({ title: "", message: "", audience: "all" });
      setRecipientPreview(null);
      setNotice("Announcement queued for immediate delivery. Check history for channel status.");
      await load();
    } catch (failure) {
      setError(Object.values(failure?.response?.data || {}).flat().join(" ") || "Could not send announcement.");
    }
  };

  const sendTest = async () => {
    setError("");
    setTestResults([]);
    try {
      const { data } = await api.post("/notifications/test/", { channels: [testChannel] });
      setTestResults(data.results);
      setNotice("Test notification attempt completed. See the provider status below.");
      await load();
    } catch (failure) {
      setError(Object.values(failure?.response?.data || {}).flat().join(" ") || "Could not send the test notification.");
    }
  };

  const markAll = async () => {
    try {
      await api.post("/notifications/read-all/");
      await load();
    } catch {
      setError("Could not mark notifications as read.");
    }
  };

  return (
    <main className="container-page pt-32 pb-20">
      <div className="max-w-4xl mx-auto">
        <p className="eyebrow text-indigo">Your account</p>
        <h1 className="text-3xl font-semibold text-navy mt-2">Notifications</h1>
        <p className="text-sm text-ink/55 mt-2">Recent event reminders, delivery history, and your notification preferences.</p>
        {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</p>}
        {notice && <p role="status" className="mt-5 rounded-lg bg-emerald-50 text-emerald-800 px-4 py-3 text-sm">{notice}</p>}

        <section className="card p-6 mt-8">
          <div className="flex justify-between items-center gap-4">
            <h2 className="font-semibold">Recent notifications</h2>
            <button onClick={markAll} className="text-sm text-indigo font-medium">Mark all as read</button>
          </div>
          <div className="divide-y divide-black/5 mt-3">
            {items.length === 0 && <p className="py-8 text-center text-sm text-ink/45">You’re all caught up.</p>}
            {items.map((item) => (
              <div key={item.id} className={`py-4 ${item.is_read ? "" : "bg-indigo-50/30"}`}>
                <div className="flex justify-between gap-4">
                  <div>
                    <Link to={item.link || "/notifications"} className="font-medium hover:text-indigo">{item.title}</Link>
                    <p className="text-sm text-ink/65 mt-1 whitespace-pre-line">{item.message}</p>
                    <p className="text-xs text-ink/40 mt-2">{new Date(item.created_at).toLocaleString("en-IN")}</p>
                  </div>
                  {!item.is_read && <button onClick={() => api.post(`/notifications/${item.id}/read/`).then(load)} className="text-xs text-indigo shrink-0">Mark read</button>}
                </div>
                {item.deliveries?.length > 0 && (
                  <p className="text-xs text-ink/50 mt-2">
                    Delivery: {item.deliveries.map((delivery) => `${delivery.channel}: ${delivery.status}`).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section id="preferences" className="card p-6 mt-6 scroll-mt-24">
          <h2 className="font-semibold">Notification preferences</h2>
          <div className="divide-y divide-black/5 mt-3">
            <div className="py-4">
              <label htmlFor="notification-phone" className="block text-sm font-medium">Mobile number for SMS</label>
              <p className="text-xs text-ink/45 mt-1">Use international format (for example, +919876543210).</p>
              <div className="flex gap-2 mt-2">
                <input id="notification-phone" type="tel" maxLength={20} className="input"
                  value={preferences.phone || ""} onChange={(event) => setPreferences({ ...preferences, phone: event.target.value })} />
                <button type="button" className="btn-navy shrink-0" onClick={() => savePreference("phone", preferences.phone)}>Save number</button>
              </div>
            </div>
            <Preference label="Email reminders" help={user?.email || "Add an email address to your account to receive reminders."}
              checked={preferences.email_enabled} onChange={(checked) => savePreference("email_enabled", checked)} />
            <Preference label="Browser push notifications" help="Requires browser permission and a configured push service."
              checked={preferences.push_enabled} onChange={togglePush} />
            <Preference label="SMS reminders" help={preferences.phone || "Add a mobile number to your account to receive SMS."}
              checked={preferences.sms_enabled} disabled={!preferences.sms_consent || !preferences.phone}
              onChange={(checked) => savePreference("sms_enabled", checked)} />
            <Preference label="I consent to event reminder SMS messages" help="You can withdraw this consent at any time."
              checked={preferences.sms_consent}
              onChange={(checked) => savePreference("sms_consent", checked)} />
          </div>
          <p className="text-xs text-ink/45 mt-4">
            Background delivery and vibration vary by browser, device, operating system, battery settings, and granted permissions.
            Vibration is attempted only on supported devices and when permitted.
          </p>
        </section>

        {isStaff && (
          <>
            <section className="card p-6 mt-6">
              <h2 className="font-semibold">Send an announcement now</h2>
              <form onSubmit={previewAnnouncement} className="space-y-4 mt-4">
                <input required maxLength={200} className="input" placeholder="Announcement title"
                  value={announcement.title} onChange={(e) => { setAnnouncement({ ...announcement, title: e.target.value }); setRecipientPreview(null); }} />
                <textarea required rows={4} className="input" placeholder="Message"
                  value={announcement.message} onChange={(e) => { setAnnouncement({ ...announcement, message: e.target.value }); setRecipientPreview(null); }} />
                <select className="input" value={announcement.audience}
                  onChange={(e) => { setAnnouncement({ ...announcement, audience: e.target.value }); setRecipientPreview(null); }}>
                  <option value="all">All students and staff</option>
                  <option value="student">All students</option>
                  <option value="staff">All staff</option>
                  <option value="department">This department</option>
                </select>
                <button className="btn-navy">Preview recipients</button>
              </form>
              {recipientPreview && (
                <div className="mt-4 rounded-lg bg-indigo-50 p-4 text-sm">
                  <p>Recipients: <strong>{recipientPreview.recipients}</strong> · Email: <strong>{recipientPreview.email_recipients}</strong> · SMS: <strong>{recipientPreview.sms_recipients}</strong></p>
                  <p className="mt-1 text-ink/60">Email/SMS preferences, valid contact details, and SMS consent control actual channel delivery.</p>
                  <button type="button" className="btn-navy mt-3" onClick={sendAnnouncement}>Confirm and queue announcement</button>
                </div>
              )}
            </section>

            <section className="card p-6 mt-6">
              <h2 className="font-semibold">Test email or SMS delivery</h2>
              <p className="text-sm text-ink/55 mt-1">Sends only to your own registered contact details. SMS requires your consent and SMS reminders enabled.</p>
              <div className="flex flex-wrap gap-3 mt-4">
                <select className="input max-w-xs" value={testChannel} onChange={(event) => setTestChannel(event.target.value)}>
                  <option value="email">Test email to my account</option>
                  <option value="sms">Test SMS to my account</option>
                </select>
                <button type="button" className="btn-navy" onClick={sendTest}>Send test</button>
              </div>
              {testResults.map((result) => (
                <p key={result.channel} className="mt-3 text-sm">
                  {result.channel}: <strong className="capitalize">{result.status}</strong>
                  {result.provider_id && ` · Provider ID: ${result.provider_id}`}
                  {result.error && ` · ${result.error}`}
                </p>
              ))}
            </section>

            <section className="card p-6 mt-6">
              <h2 className="font-semibold">Delivery history</h2>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-ink/45"><th className="py-2">Reminder</th><th>Scheduled</th><th>Recipients</th><th>Sent / delivered / failed</th><th>Status</th></tr></thead>
                  <tbody>
                    {history.map((entry) => (
                      <Fragment key={entry.id}>
                        <tr className="border-t border-black/5">
                          <td className="py-3">{entry.title}</td>
                          <td>{entry.scheduled_for ? new Date(entry.scheduled_for).toLocaleString("en-IN") : "—"}</td>
                          <td>{entry.recipients}</td>
                          <td>{entry.sent} / {entry.delivered} / {entry.failed}</td>
                          <td className="capitalize">{entry.status}</td>
                        </tr>
                        {entry.delivery_summary?.length > 0 && (
                          <tr className="border-t border-black/5">
                            <td colSpan="5" className="pb-3 text-xs text-ink/55">
                              {entry.delivery_summary.map((delivery) => `${delivery.channel} ${delivery.status}: ${delivery.count}`).join(" · ")}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                    {history.length === 0 && <tr><td colSpan="5" className="py-6 text-center text-ink/40">No event deliveries yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Preference({ label, help, checked, disabled = false, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 py-4">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-ink/45 mt-1">{help}</span>
      </span>
      <input type="checkbox" checked={checked} disabled={disabled}
        onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-indigo disabled:opacity-40" />
    </label>
  );
}
