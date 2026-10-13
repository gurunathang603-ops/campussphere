import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Loader2, CheckCircle2, XCircle } from "lucide-react";
import api, { mediaUrl } from "../services/api";

const EMPTY_PARAMS = {};

/**
 * Generic CRUD manager used across staff/HOD dashboards.
 * fields: [{ name, label, type: text|textarea|number|date|time|select|file|checkbox|url, options, required, help }]
 */
export default function ManageResource({ endpoint, title, columns, fields, manage = true, canDelete = true, extraParams = EMPTY_PARAMS }) {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(
    () => api.get(endpoint, { params: { ...(manage ? { manage: 1 } : {}), ...extraParams } }).then((r) => setItems(r.data.results || r.data)),
    [endpoint, manage, extraParams],
  );
  useEffect(() => { load(); }, [load]);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  const openCreate = () => {
    const init = {};
    fields.forEach((f) => {
      init[f.name] = f.type === "checkbox" ? (f.default ?? false)
        : f.type === "checkbox_group" ? (f.default ?? [])
          : (f.default ?? "");
    });
    setForm(init); setEditing(null); setError(""); setOpen(true);
  };
  const openEdit = (item) => {
    const init = {};
    fields.forEach((f) => {
      const value = item[f.name];
      init[f.name] = f.type === "file" ? null
        : f.type === "user_ids" ? (value || []).join(", ")
          : (value ?? (f.type === "checkbox" ? false : f.type === "checkbox_group" ? [] : ""));
    });
    setForm(init); setEditing(item); setError(""); setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const fd = new FormData();
      fields.forEach((f) => {
        const v = form[f.name];
        if (f.type === "file") { if (v) fd.append(f.name, v); }
        else if (f.type === "checkbox") fd.append(f.name, v ? "true" : "false");
        else if (f.type === "checkbox_group") fd.append(f.name, JSON.stringify(v || []));
        else if (f.type === "user_ids") {
          const parts = v ? v.split(",").map((id) => id.trim()).filter(Boolean) : [];
          if (parts.some((id) => !/^\d+$/.test(id) || Number(id) < 1)) {
            throw new Error("User IDs must be comma-separated positive whole numbers.");
          }
          const ids = parts.map(Number);
          fd.append(f.name, JSON.stringify(ids));
        }
        else if (v !== "" && v !== null && v !== undefined) fd.append(f.name, v);
      });
      if (editing) await api.patch(`${endpoint}${editing.id}/`, fd);
      else await api.post(endpoint, fd);
      setOpen(false); load(); flash(editing ? "Updated successfully" : "Created successfully");
    } catch (err) {
      const data = err?.response?.data;
      setError(data ? Object.values(data).flat().join(" ") : err.message || "Something went wrong. Please check the fields.");
    } finally { setBusy(false); }
  };

  const del = async (item) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    await api.delete(`${endpoint}${item.id}/`);
    load(); flash("Deleted");
  };

  const togglePublish = async (item) => {
    await api.patch(`${endpoint}${item.id}/`, { is_published: !item.is_published });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={openCreate} className="btn-navy !py-2 !px-4 text-sm"><Plus size={16} /> Add new</button>
      </div>

      {!items ? (
        <div className="py-10 text-center text-ink/40 flex justify-center"><Loader2 className="animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-ink/40">No records yet. Click "Add new" to create one.</div>
      ) : (
        <div className="table-wrap bg-white">
          <table className="w-full text-sm">
            <thead className="bg-mist"><tr>
              {columns.map((c) => <th key={c.key} className="p-3 text-left font-medium text-ink/50">{c.label}</th>)}
              <th className="p-3"></th>
            </tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-black/5 hover:bg-mist/50">
                  {columns.map((c) => (
                    <td key={c.key} className="p-3 align-top max-w-[220px]">
                      {c.render ? c.render(item) : <span className="line-clamp-2">{String(item[c.key] ?? "")}</span>}
                    </td>
                  ))}
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      {"is_published" in item && (
                        <button onClick={() => togglePublish(item)} title={item.is_published ? "Unpublish" : "Publish"} className={item.is_published ? "text-emerald-600" : "text-ink/30"}>
                          {item.is_published ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
                        </button>
                      )}
                      <button onClick={() => openEdit(item)} className="p-1.5 text-ink/50 hover:text-indigo"><Pencil size={15} /></button>
                      {canDelete && <button onClick={() => del(item)} className="p-1.5 text-ink/50 hover:text-red-600"><Trash2 size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[100] bg-navy-900/50 backdrop-blur-sm flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-pop w-full max-w-lg max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 sticky top-0 bg-white">
                <h3 className="font-semibold">{editing ? "Edit" : "Add"} {title.replace(/^Manage /, "")}</h3>
                <button onClick={() => setOpen(false)} className="text-ink/40 hover:text-ink"><X size={18} /></button>
              </div>
              <form onSubmit={submit} className="p-6 space-y-4">
                {fields.map((f) => (
                  f.type === "section" ? (
                    <h4 key={f.name} className="pt-3 border-t border-black/10 font-semibold text-sm">{f.label}</h4>
                  ) : (
                  <div key={f.name}>
                    <label className="text-xs font-medium text-ink/50 mb-1.5 block">{f.label}{f.required && " *"}</label>
                    {f.type === "textarea" ? (
                      <textarea rows={f.rows || 3} className="input" required={f.required} value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                    ) : f.type === "select" ? (
                      <select className="input" required={f.required} value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                        <option value="">Select…</option>
                        {f.options.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
                      </select>
                    ) : f.type === "checkbox" ? (
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })} /> {f.help}</label>
                    ) : f.type === "checkbox_group" ? (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {f.options.map(([value, label]) => (
                          <label key={value} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={(form[f.name] || []).map(String).includes(String(value))}
                              onChange={(e) => {
                                const values = form[f.name] || [];
                                setForm({ ...form, [f.name]: e.target.checked
                                  ? [...values, typeof value === "number" ? value : String(value)]
                                  : values.filter((current) => String(current) !== String(value)) });
                              }} />
                            {label}
                          </label>
                        ))}
                      </div>
                    ) : f.type === "user_ids" ? (
                      <input type="text" className="input" value={form[f.name] || ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                    ) : f.type === "file" ? (
                      <div>
                        <input type="file" accept={f.accept} multiple={f.multiple} className="input !py-2"
                          onChange={(e) => setForm({ ...form, [f.name]: f.multiple ? e.target.files : e.target.files[0] })} />
                        {editing?.[f.name] && !f.multiple && <img src={mediaUrl(editing[f.name])} className="h-14 mt-2 rounded" alt="" />}
                      </div>
                    ) : (
                      <input type={f.type} step={f.step} className="input" required={f.required} value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                    )}
                    {f.help && f.type !== "checkbox" && <p className="text-xs text-ink/40 mt-1">{f.help}</p>}
                  </div>
                  )
                ))}
                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-full border border-black/10 text-sm font-medium">Cancel</button>
                  <button disabled={busy} className="flex-1 btn-navy !py-2.5 text-sm">{busy ? "Saving…" : "Save"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-navy text-white text-sm px-5 py-3 rounded-full shadow-pop z-[110]">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
