import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Search, Loader2, Pencil, X, AlertTriangle } from 'lucide-react';

const PER_PAGE = 25;
const usd = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const SOURCE_FILTERS = [
  ['', 'All sources'], ['paid', 'Paid (Stripe)'], ['stripe', 'Single course'], ['stripe_bundle', 'All-Access bundle'],
  ['admin_grant', 'Admin grants'], ['free', 'Free'], ['unverified', 'Unverified'],
];
const SOURCE_STYLE = {
  stripe: 'bg-green-50 text-green-700 border-green-200', stripe_bundle: 'bg-purple-50 text-purple-700 border-purple-200',
  admin_grant: 'bg-blue-50 text-blue-700 border-blue-200', free: 'bg-gray-100 text-gray-600 border-gray-200',
  unverified: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const Card = ({ label, value, sub, tone = 'text-gray-900' }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
    <p className="text-xs font-bold text-gray-400 uppercase mb-1">{label}</p>
    <p className={`text-2xl font-black ${tone}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

// Revenue & Sales: every figure comes from the amount actually recorded on each enrollment
// (what Stripe charged), not from list price x number of enrollments.
const RevenuePanel = () => {
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [source, setSource] = useState('');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState(null);       // enrollment row being corrected
  const [editSource, setEditSource] = useState('stripe');
  const [editAmount, setEditAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => { const t = setTimeout(() => { setDebounced(query.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [query]);

  const loadSummary = useCallback(async () => {
    try { setSummary((await axios.get(`${API_BASE_URL}/api/admin/revenue/summary`, { headers: headers() })).data); }
    catch { setError('Could not load the revenue summary.'); }
  }, []);
  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_BASE_URL}/api/admin/transactions`, { params: { q: debounced, source, page, per_page: PER_PAGE }, headers: headers() });
      setItems(r.data.items); setTotal(r.data.total); setError('');
    } catch { setError('Could not load transactions.'); }
    finally { setLoading(false); }
  }, [debounced, source, page]);
  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadRows(); }, [loadRows]);

  const exportCsv = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/api/admin/transactions.csv`, { params: { q: debounced, source }, headers: headers(), responseType: 'blob' });
      const url = URL.createObjectURL(r.data); const a = document.createElement('a');
      a.href = url; a.download = 'transactions.csv'; a.click(); URL.revokeObjectURL(url);
    } catch { setError('Could not export the CSV.'); }
  };

  const openEdit = (row) => { setEdit(row); setEditSource(row.source === 'unverified' ? 'stripe' : row.source === 'free' ? 'free' : row.source === 'admin_grant' ? 'admin_grant' : 'stripe'); setEditAmount(row.amount != null ? String(row.amount) : ''); setEditError(''); };
  const saveEdit = async () => {
    if (editSource !== 'free' && (editAmount === '' || isNaN(Number(editAmount)) || Number(editAmount) < 0)) { setEditError('Enter the amount that was paid, e.g. 29.00'); return; }
    setSaving(true); setEditError('');
    try {
      await axios.post(`${API_BASE_URL}/api/admin/enrollments/${edit.id}/payment`, { source: editSource, amount: editSource === 'free' ? 0 : Number(editAmount) }, { headers: headers() });
      setEdit(null); loadRows(); loadSummary();
    } catch (e) { setEditError(e.response?.data?.msg || 'Could not save. Please try again.'); }
    finally { setSaving(false); }
  };

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const s = summary;
  const dup = s?.duplicates;

  return (
    <div className="space-y-6 animate-fade-in">
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

      {!s ? <div className="text-center py-10 text-gray-400"><Loader2 className="inline animate-spin mr-2" size={16} />Loading revenue…</div> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card label="Net revenue" value={usd(s.net_revenue)} sub="Course sales + duplicate charges kept" tone="text-green-600" />
            <Card label="This month" value={usd(s.this_month)} sub={`Last month ${usd(s.last_month)}`} />
            <Card label="Last 30 days" value={usd(s.last_30_days)} />
            <Card label="Course sales (gross)" value={usd(s.gross_sales)} sub="Recorded on enrollments" />
            <Card label="Single-course sales" value={usd(s.single.revenue)} sub={`${s.single.sales} purchase${s.single.sales === 1 ? '' : 's'}`} />
            <Card label="All-Access bundles" value={usd(s.bundle.revenue)} sub={`${s.bundle.sales} purchase${s.bundle.sales === 1 ? '' : 's'}`} tone="text-purple-600" />
            <Card label="Admin-recorded payments" value={usd(s.admin_recorded)} sub={`${s.grants} grants · ${s.free} free enrollments`} />
            <Card label="Duplicate charges" value={usd(dup.kept)} sub={`kept · ${usd(dup.refunded)} refunded`} />
          </div>

          {(s.unverified > 0 || s.estimated_revenue > 0 || dup.pending_count > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-900 space-y-1">
              <p className="font-bold flex items-center gap-2"><AlertTriangle size={16} /> Check before you rely on these totals</p>
              {s.estimated_revenue > 0 && <p>{usd(s.estimated_revenue)} of the total is an <strong>estimate</strong> for enrollments created before payments were recorded (list price, or $159 split across a bundle). Correct any row with the pencil to make it exact, or compare with Stripe.</p>}
              {s.unverified > 0 && <p><strong>{s.unverified}</strong> enrollment{s.unverified === 1 ? ' has' : 's have'} no payment receipt and count as $0. Use the pencil on those rows to record a Stripe payment or mark them free. Filter: “Unverified”.</p>}
              {dup.pending_count > 0 && <p><strong>{dup.pending_count}</strong> duplicate charge{dup.pending_count === 1 ? '' : 's'} ({usd(dup.pending)}) awaiting a decision in Flagged Payments. Not counted until decided.</p>}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Revenue by month</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={s.months}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="month" stroke="#9ca3af" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} interval={1} />
                    <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip formatter={v => [usd(v), 'Revenue']} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                    <Bar dataKey="revenue" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">By course</h3>
              <ul className="space-y-3">
                {s.by_course.map(c => (
                  <li key={c.title} className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-700 truncate" title={c.title}>{c.title}</span>
                    <span className="font-bold text-gray-900 whitespace-nowrap">{usd(c.revenue)} <span className="text-gray-400 font-normal">· {c.sales}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, email or course" className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:border-black" />
            </div>
            <select value={source} onChange={e => { setSource(e.target.value); setPage(1); }} className="py-2 px-3 text-sm border border-gray-200 rounded-lg bg-white text-gray-700">
              {SOURCE_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-gray-900 text-white hover:bg-black"><Download size={14} /> Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr><th className="px-6 py-3">Customer</th><th className="px-6 py-3">Course</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Source</th><th className="px-6 py-3 text-right">Amount</th><th className="px-6 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400"><Loader2 className="inline animate-spin mr-2" size={16} />Loading…</td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">No transactions match.</td></tr>}
              {!loading && items.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3"><div className="font-bold text-gray-900">{t.user}</div><div className="text-xs text-gray-500">{t.email}</div></td>
                  <td className="px-6 py-3 text-gray-700">{t.course}</td>
                  <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{t.date}</td>
                  <td className="px-6 py-3"><span className={`inline-block px-2 py-0.5 rounded border text-xs font-bold ${SOURCE_STYLE[t.source] || ''}`}>{t.source_label}</span></td>
                  <td className="px-6 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                    {t.amount == null ? <span className="text-gray-400 font-normal">—</span> : usd(t.amount)}
                    {t.estimated && <span title="Estimated: recorded before exact amounts were stored" className="ml-1 text-xs font-normal text-yellow-600">est.</span>}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {(t.source === 'unverified' || t.estimated) && (
                      <button onClick={() => openEdit(t)} title="Set the amount actually paid" className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"><Pencil size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>{total} transaction{total === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-gray-200 rounded disabled:opacity-40">Previous</button>
            <span>Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-gray-200 rounded disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {edit && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => !saving && setEdit(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div><h3 className="text-lg font-bold text-gray-900">Set payment</h3><p className="text-sm text-gray-500 mt-1">{edit.user} · {edit.course}</p></div>
              <button onClick={() => setEdit(null)} disabled={saving} className="text-gray-400 hover:text-black"><X size={18} /></button>
            </div>
            <div className="space-y-2 mb-4">
              {[['stripe', 'Paid through Stripe', 'Check the amount in your Stripe Dashboard.'], ['admin_grant', 'Payment received another way', 'Recorded as an admin-recorded payment.'], ['free', 'Free / no payment', 'Counts as $0.']].map(([id, l, h]) => (
                <label key={id} className={`flex gap-3 p-3 rounded-lg border cursor-pointer ${editSource === id ? 'border-black bg-gray-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" className="mt-1" checked={editSource === id} onChange={() => { setEditSource(id); setEditError(''); }} />
                  <span><span className="font-bold text-gray-900 text-sm">{l}</span><span className="block text-xs text-gray-500">{h}</span></span>
                </label>
              ))}
            </div>
            {editSource !== 'free' && (
              <div className="mb-2">
                <label className="block text-xs font-bold text-gray-600 mb-1">Amount paid (USD)</label>
                <input value={editAmount} onChange={e => setEditAmount(e.target.value)} inputMode="decimal" placeholder="29.00" className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-900 focus:outline-none focus:border-black" />
              </div>
            )}
            {editError && <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">{editError}</div>}
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEdit(null)} disabled={saving} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-black">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="px-5 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenuePanel;
