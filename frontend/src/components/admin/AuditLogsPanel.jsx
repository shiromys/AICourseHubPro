import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { Loader2, Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;   // the admin's own calendar day
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
const fmt = (iso, fallback) => iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : fallback;

const PRESETS = [
  { id: 'today', label: 'Today', range: () => [daysAgo(0), daysAgo(0)] },
  { id: 'yesterday', label: 'Yesterday', range: () => [daysAgo(1), daysAgo(1)] },
  { id: '7', label: 'Last 7 days', range: () => [daysAgo(6), daysAgo(0)] },
  { id: '30', label: 'Last 30 days', range: () => [daysAgo(29), daysAgo(0)] },
  { id: 'all', label: 'All time', range: () => ['', ''] },
];
const PER_PAGE = 25;

const AuditLogsPanel = () => {
  const [preset, setPreset] = useState('7');
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(daysAgo(0));
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await axios.get(`${API_BASE_URL}/api/admin/logs`, {
        headers: authHeaders(),
        params: { from: from || undefined, to: to || undefined, q: q || undefined, page, per_page: PER_PAGE, tz_offset: new Date().getTimezoneOffset() },
      });
      setData(r.data);
    } catch (e) { setError(e.response?.data?.msg || 'Could not load the audit logs.'); }
    finally { setLoading(false); }
  }, [from, to, q, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setTimeout(() => { setQ(search.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [search]);

  const pick = (p) => { const [f, t] = p.range(); setPreset(p.id); setFrom(f); setTo(t); setPage(1); };
  const custom = (f, t) => { setPreset('custom'); setFrom(f); setTo(t); setPage(1); };
  const pages = Math.max(1, Math.ceil((data.total || 0) / PER_PAGE));
  const rangeText = !from && !to ? 'all time' : from === to ? from : `${from || 'the beginning'} to ${to || 'today'}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-200 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => pick(p)}
              className={`px-3 py-1.5 rounded-full text-sm font-bold border transition ${preset === p.id ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>{p.label}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-bold text-gray-500 flex flex-col gap-1"><span className="flex items-center gap-1"><Calendar size={12} /> From</span>
            <input type="date" value={from} max={to || undefined} onChange={e => custom(e.target.value, to)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" /></label>
          <label className="text-xs font-bold text-gray-500 flex flex-col gap-1"><span className="flex items-center gap-1"><Calendar size={12} /> To</span>
            <input type="date" value={to} min={from || undefined} onChange={e => custom(from, e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" /></label>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search action, admin or details" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
        <p className="text-xs text-gray-500">{loading ? 'Loading…' : `${data.total} ${data.total === 1 ? 'entry' : 'entries'} for ${rangeText}${q ? ` matching “${q}”` : ''}`}. Dates use your local time.</p>
      </div>

      {error && <div className="m-5 p-3 rounded-lg bg-red-50 text-red-700 text-sm font-semibold border border-red-200">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-bold tracking-wider">
            <tr><th className="px-6 py-4">Action</th><th className="px-6 py-4">Admin</th><th className="px-6 py-4">Details</th><th className="px-6 py-4">Time</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading && <tr><td colSpan={4} className="px-6 py-10 text-center"><Loader2 className="animate-spin inline text-red-600" /></td></tr>}
            {!loading && data.items.length === 0 && <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">No audit entries for this selection.</td></tr>}
            {!loading && data.items.map((l, i) => (
              <tr key={`${l.timestamp}-${i}`} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-bold text-gray-900">{l.action}</td>
                <td className="px-6 py-4 text-gray-500">{l.admin}</td>
                <td className="px-6 py-4 italic text-gray-600">{l.details}</td>
                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{fmt(l.timestamp, l.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.total > PER_PAGE && (
        <div className="flex items-center justify-between p-4 border-t border-gray-200 text-sm">
          <span className="text-gray-500">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded disabled:opacity-40 flex items-center gap-1"><ChevronLeft size={14} /> Previous</button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded disabled:opacity-40 flex items-center gap-1">Next <ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPanel;
