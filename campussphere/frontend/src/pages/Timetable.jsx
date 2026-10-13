import { useEffect, useState } from "react";
import { Clock, User, MapPin } from "lucide-react";
import api from "../services/api";
import Reveal from "../components/Reveal";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Timetable() {
  const [year, setYear] = useState("all");
  const [section, setSection] = useState("A");
  const [rows, setRows] = useState(null);
  const [day, setDay] = useState(new Date().toLocaleDateString("en-US", { weekday: "long" }));

  useEffect(() => {
    setRows(null);
    const params = { section };
    if (year !== "all") params.year = year;
    api.get("/timetable/", { params }).then((r) => setRows(r.data));
  }, [year, section]);

  const yearsToShow = year === "all" ? [1, 2, 3] : [Number(year)];
  const rowsForYear = (yearValue) => (rows || []).filter((r) => r.year === yearValue);
  const byDay = (d, yearValue) => rowsForYear(yearValue).filter((r) => r.day === d).sort((a, b) => a.period - b.period);

  return (
    <div>
      <section className="bg-navy-900 text-white pt-40 pb-16">
        <div className="container-page">
          <Reveal><p className="eyebrow text-gold">Academics</p></Reveal>
          <Reveal delay={0.05}><h1 className="text-4xl font-semibold mt-2">Class timetable</h1></Reveal>
        </div>
      </section>

      <section className="section container-page">
        <div className="flex flex-wrap gap-3 mb-8">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="input w-auto">
            <option value="all">All years</option>
            {[1, 2, 3].map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
          <select value={section} onChange={(e) => setSection(e.target.value)} className="input w-auto">
            <option value="A">Section A</option>
          </select>
        </div>

        {!rows ? <Loader /> : rows.length === 0 ? <EmptyState title="No timetable published for this class yet" /> : (
          <>
            {/* Mobile: day tabs + card view */}
            <div className="lg:hidden">
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-5 px-5">
                {DAYS.map((d) => (
                  <button key={d} onClick={() => setDay(d)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium ${day === d ? "bg-navy text-white" : "bg-white border border-black/10"}`}>{d.slice(0, 3)}</button>
                ))}
              </div>
              {yearsToShow.map((yearValue) => (
                <section key={yearValue} className="mb-8">
                  <h2 className="text-lg font-semibold mb-3">Year {yearValue} · Section A</h2>
                  <div className="space-y-3">
                    {byDay(day, yearValue).map((r) => (
                      <div key={r.id} className="card p-4 flex items-center gap-4">
                        <span className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo flex items-center justify-center font-semibold shrink-0">{r.period}</span>
                        <div className="flex-1">
                          <p className="font-medium">{r.subject}</p>
                          <p className="text-xs text-ink/50 flex flex-wrap gap-x-3 mt-1">
                            {r.faculty_name && <span className="flex items-center gap-1"><User size={12} />{r.faculty_name}</span>}
                            {r.room && <span className="flex items-center gap-1"><MapPin size={12} />{r.room}</span>}
                            {r.start_time && <span className="flex items-center gap-1"><Clock size={12} />{r.start_time.slice(0, 5)}</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                    {byDay(day, yearValue).length === 0 && <p className="text-sm text-ink/50">No classes scheduled</p>}
                  </div>
                </section>
              ))}
            </div>

            {/* Desktop: full table */}
            <div className="hidden lg:block space-y-8">
              {yearsToShow.map((yearValue) => (
                <section key={yearValue}>
                  <h2 className="text-lg font-semibold mb-3">Year {yearValue} · Section A</h2>
                  <div className="table-wrap">
                    <table className="w-full text-sm bg-white">
                      <thead className="bg-navy text-white">
                        <tr>
                          <th className="p-3 text-left font-medium">Period</th>
                          {DAYS.map((d) => <th key={d} className="p-3 text-left font-medium">{d}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 6 }, (_, i) => i + 1).map((p) => (
                          <tr key={p} className="border-t border-black/5">
                            <td className="p-3 font-semibold text-ink/50">P{p}</td>
                            {DAYS.map((d) => {
                              const r = byDay(d, yearValue).find((x) => x.period === p);
                              return (
                                <td key={d} className="p-3">
                                  {r ? (
                                    <div>
                                      <p className="font-medium">{r.subject}</p>
                                      <p className="text-xs text-ink/40">{r.faculty_name}{r.room ? ` · ${r.room}` : ""}</p>
                                    </div>
                                  ) : <span className="text-ink/20">—</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
