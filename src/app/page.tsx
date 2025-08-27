'use client';

import React, { useEffect, useMemo, useState } from "react";

type Row = {
  created_date?: string | null;
  referring_doctor?: string | null;
  referring_doctor_npi?: string | null;
  facility?: string | null;
  primary_insurance?: string | null;
  discipline?: string | null;
  therapist?: string | null;
  arrived_visits?: number | null;
  scheduled_visits?: number | null;
  initial_eval_date?: string | null;
  first_scheduled_date?: string | null;
  first_arrived_date?: string | null;
  discharge_date?: string | null;
  case_status?: string | null;
  [k: string]: any;
};

function asISO(d?: string | null) {
  if (!d) return null;
  const t = new Date(d);
  if (isNaN(t as unknown as number)) return null;
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function downloadBlob(filename: string, content: string, type = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows: Row[]) {
  const preferred = ["created_date","referring_doctor","referring_doctor_npi","facility","primary_insurance","discipline","therapist","arrived_visits","scheduled_visits","initial_eval_date","first_scheduled_date","first_arrived_date","discharge_date","case_status"];
  const headerSet = new Set<string>(preferred);
  for (const r of rows) Object.keys(r || {}).forEach((k) => headerSet.add(k));
  const rest = Array.from(headerSet).filter((h) => !preferred.includes(h)).sort();
  const headers = [...preferred, ...rest];
  const esc = (v: any) => JSON.stringify(v ?? "");
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(h === "created_date" ? asISO(r[h]) : r[h])).join(","));
  return lines.join("\n");
}

export default function App() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [discipline, setDiscipline] = useState<string>("ALL");
  const [facility, setFacility] = useState<string>("ALL");
  const [insurance, setInsurance] = useState<string>("ALL");

  // Remember filter choices between visits
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tristar_filters') || '{}');
      if (saved.discipline) setDiscipline(saved.discipline);
      if (saved.facility) setFacility(saved.facility);
      if (saved.insurance) setInsurance(saved.insurance);
    } catch {}
  }, []);
  useEffect(() => {
    const payload = { discipline, facility, insurance };
    try { localStorage.setItem('tristar_filters', JSON.stringify(payload)); } catch {}
  }, [discipline, facility, insurance]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/data/latest", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data)) setRows(data as Row[]);
      } catch (e: any) {
        console.error(e);
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const disciplineOptions = useMemo(() => {
    const opts = Array.from(new Set(rows.map(r => (r.discipline || "").toUpperCase()).filter(Boolean)));
    return ["ALL", ...opts];
  }, [rows]);

  const facilityOptions = useMemo(() => {
    const opts = Array.from(new Set(rows.map(r => r.facility).filter(Boolean)));
    return ["ALL", ...opts.sort()];
  }, [rows]);

  const insuranceOptions = useMemo(() => {
    const opts = Array.from(new Set(rows.map(r => r.primary_insurance).filter(Boolean)));
    return ["ALL", ...opts.sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const discOk = discipline === "ALL" ? true : (r.discipline || "").toUpperCase() === discipline;
      const facOk = facility === "ALL" ? true : r.facility === facility;
      const insOk = insurance === "ALL" ? true : r.primary_insurance === insurance;
      return discOk && facOk && insOk;
    });
  }, [rows, discipline, facility, insurance]);

  const kpis = useMemo(() => {
    if (!filtered.length) return null as any;
    const total = filtered.length;
    const uniqueDocs = new Set(filtered.map((r) => (r.referring_doctor || "").trim()).filter(Boolean)).size;
    const pt = filtered.filter((r) => (r.discipline || "").toUpperCase() === "PT").length;
    const ot = filtered.filter((r) => (r.discipline || "").toUpperCase() === "OT").length;
    const scheduled = filtered.filter(r => !!r.first_scheduled_date).length;
    const arrived = filtered.filter(r => !!r.first_arrived_date).length;
    const scheduledPct = total ? (scheduled/total*100).toFixed(1) : "0.0";
    const arrivedPct = total ? (arrived/total*100).toFixed(1) : "0.0";

    const dates = filtered.map((r) => new Date(r.created_date as any)).filter((d) => !isNaN(d as any));
    const min = dates.length ? new Date(Math.min(...(dates as any))) : null;
    const max = dates.length ? new Date(Math.max(...(dates as any))) : null;

    let perDay: string | number = "-";
    if (min && max) {
      const days = Math.max(1, Math.ceil((Number(max) - Number(min)) / (1000 * 60 * 60 * 24)) + 1);
      perDay = (total / days).toFixed(1);
    }

    return { total, uniqueDocs, pt, ot, scheduled, scheduledPct, arrived, arrivedPct, perDay, span: min && max ? `${asISO(min.toISOString())} → ${asISO(max.toISOString())}` : "-" };
  }, [filtered]);

  const topDocs = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      const doc = (r.referring_doctor || "Unknown").trim();
      m.set(doc, (m.get(doc) || 0) + 1);
    }
    return Array.from(m.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10);
  }, [filtered]);

  function handleDownload(all: boolean) {
    const src = all ? rows : filtered;
    if (!src.length) return;
    const csv = toCSV(src);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(`tristar_referrals_${all ? 'all' : 'filtered'}_${stamp}.csv`, csv);
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 p-6">
      <header className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold">Tristar PRM — Physician Relationship Manager</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-zinc-600">Discipline</label>
          <select value={discipline} onChange={e => setDiscipline(e.target.value)} className="px-2 py-1 border rounded-lg text-sm bg-white">
            {disciplineOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          <label className="text-xs text-zinc-600">Facility</label>
          <select value={facility} onChange={e => setFacility(e.target.value)} className="px-2 py-1 border rounded-lg text-sm bg-white">
            {facilityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          <label className="text-xs text-zinc-600">Insurance</label>
          <select value={insurance} onChange={e => setInsurance(e.target.value)} className="px-2 py-1 border rounded-lg text-sm bg-white">
            {insuranceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          <button onClick={() => { setDiscipline('ALL'); setFacility('ALL'); setInsurance('ALL'); }} className="px-2 py-1 rounded-lg border bg-white text-xs">
            Reset
          </button>

          <button onClick={() => handleDownload(false)} className="px-3 py-2 rounded-xl border bg-white hover:shadow-sm transition text-sm" disabled={!filtered.length}>
            Download filtered CSV
          </button>
          <button onClick={() => handleDownload(true)} className="px-3 py-2 rounded-xl border bg-white hover:shadow-sm transition text-sm" disabled={!rows.length}>
            Download all CSV
          </button>
        </div>
      </header>

      {loading ? (
        <div>Loading latest dataset…</div>
      ) : error ? (
        <div className="text-red-600">Error loading data: {error}</div>
      ) : filtered.length === 0 ? (
        <div>No data available (or no rows match current filters).</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
            <div className="rounded-2xl border bg-white p-3"><div className="text-xs text-zinc-500">Referrals</div><div className="text-2xl font-semibold">{kpis.total}</div></div>
            <div className="rounded-2xl border bg-white p-3"><div className="text-xs text-zinc-500">Unique Docs</div><div className="text-2xl font-semibold">{kpis.uniqueDocs}</div></div>
            <div className="rounded-2xl border bg-white p-3"><div className="text-xs text-zinc-500">PT</div><div className="text-2xl font-semibold">{kpis.pt}</div></div>
            <div className="rounded-2xl border bg-white p-3"><div className="text-xs text-zinc-500">OT</div><div className="text-2xl font-semibold">{kpis.ot}</div></div>
            <div className="rounded-2xl border bg-white p-3"><div className="text-xs text-zinc-500">Scheduled %</div><div className="text-2xl font-semibold">{kpis.scheduledPct}%</div></div>
            <div className="rounded-2xl border bg-white p-3"><div className="text-xs text-zinc-500">Arrived %</div><div className="text-2xl font-semibold">{kpis.arrivedPct}%</div></div>
            <div className="rounded-2xl border bg-white p-3"><div className="text-xs text-zinc-500">Avg / Day</div><div className="text-2xl font-semibold">{kpis.perDay}</div></div>
          </div>
          <div className="text-xs text-zinc-600">Date span: {kpis.span}</div>

          <div className="bg-white rounded-xl border">
            <div className="p-3 text-sm text-zinc-500">Showing {Math.min(50, filtered.length)} of {filtered.length} filtered rows</div>
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left">
                    <th className="p-2">Date</th>
                    <th className="p-2">Doctor</th>
                    <th className="p-2">Facility</th>
                    <th className="p-2">Insurance</th>
                    <th className="p-2">Discipline</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0,50).map((r,i)=>(
                    <tr key={i} className="border-t">
                      <td className="p-2">{r.created_date}</td>
                      <td className="p-2">{r.referring_doctor}</td>
                      <td className="p-2">{r.facility}</td>
                      <td className="p-2">{r.primary_insurance}</td>
                      <td className="p-2">{r.discipline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-3">
            <div className="text-sm font-semibold mb-2">Top Doctors</div>
            {topDocs.map(([doc,n]) => (
              <div key={doc} className="flex items-center justify-between border-b py-1">
                <div>{doc} <span className="text-xs text-zinc-500">({n})</span></div>
                <button onClick={() => alert(`Would POST outreach for ${doc}`)} className="text-xs px-2 py-1 rounded-lg border bg-white">Outreach</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-10 text-xs text-zinc-500">Tip: POST your Excel to <code>/api/ingest/upload</code> (with <code>x-ingest-secret</code>) or use the Google Drive script to refresh data automatically.</footer>
    </div>
  );
}
