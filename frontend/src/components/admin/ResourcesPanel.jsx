import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { Loader2, Download, RefreshCcw } from 'lucide-react';
import { RESOURCE_PAGES } from '../../content/resources';
import { contentFor } from '../../content/resources';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const fmt = (iso) => iso ? new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const titleOf = (slug) => (contentFor(slug) && contentFor(slug).title) || (RESOURCE_PAGES.find((p) => p.slug === slug) || {}).topic || slug;

const NL_STYLE = {
  active: 'bg-green-50 text-green-700 border-green-200', pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  unsubscribed: 'bg-gray-100 text-gray-500 border-gray-200', none: 'bg-gray-50 text-gray-400 border-gray-200',
};
const NL_LABEL = { active: 'Subscribed', pending: 'Awaiting confirmation', unsubscribed: 'Unsubscribed', none: 'Not subscribed' };

const Stat = ({ label, value, hint }) => (
  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
    <p className="text-2xl font-black text-gray-900">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
    {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
  </div>
);

const ResourcesPanel = () => {
  const [data, setData] = useState(null);
  const [days, setDays] = useState('30');
  const [slug, setSlug] = useState('');
  const [optin, setOptin] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const PER = 25;

  const params = useCallback(() => ({ days: days === 'all' ? 0 : days, slug: slug || undefined, optin: optin ? 1 : undefined }), [days, slug, optin]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await axios.get(`${API_BASE_URL}/api/admin/resources/downloads`, { headers: authHeaders(), params: { ...params(), page, per_page: PER } });
      setData(r.data);
    } catch (e) { setError('Could not load downloads. Try again in a moment.'); }
    setLoading(false);
  }, [params, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [days, slug, optin]);

  const exportCsv = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/api/admin/resources/downloads.csv`, { headers: authHeaders(), params: params(), responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a'); a.href = url; a.download = 'resource-downloads.csv'; a.click(); URL.revokeObjectURL(url);
    } catch (e) { setError('Could not export the CSV.'); }
  };

  const s = data && data.summary;
  const pages = data ? Math.max(1, Math.ceil(data.total / PER)) : 1;

  return (
    <div className="space-y-6" data-testid="resources-panel">
      <div className="flex flex-wrap items-center gap-3">
        <select value={days} onChange={(e) => setDays(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" aria-label="Period">
          <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="all">All time</option>
        </select>
        <select value={slug} onChange={(e) => setSlug(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white max-w-xs" aria-label="Guide">
          <option value="">All guides</option>
          {RESOURCE_PAGES.map((p) => <option key={p.slug} value={p.slug}>{titleOf(p.slug)}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={optin} onChange={(e) => setOptin(e.target.checked)} /> Only people who ticked the digest box</label>
        <div className="ml-auto flex gap-2">
          <button onClick={load} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2"><RefreshCcw size={14} /> Refresh</button>
          <button onClick={exportCsv} className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-black flex items-center gap-2" data-testid="resources-csv"><Download size={14} /> Export CSV</button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {s && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Stat label="Downloads" value={s.downloads} />
          <Stat label="Different email addresses" value={s.unique_emails} />
          <Stat label="Ticked the digest box" value={s.opt_ins} hint={`${s.opt_in_rate}% of downloads`} />
          <Stat label="Of those, now subscribed" value={s.opt_ins_now_active} hint="Confirmed their email" />
          <Stat label="Guides downloaded" value={data.by_slug.length} hint={`of ${RESOURCE_PAGES.length}`} />
        </div>
      )}

      {data && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <h3 className="font-bold text-gray-900 p-4 pb-2">By guide</h3>
          <table className="w-full text-sm" data-testid="resources-by-guide">
            <thead className="text-left text-xs text-gray-500 uppercase"><tr><th className="px-4 py-2">Guide</th><th className="px-4 py-2">Downloads</th><th className="px-4 py-2">Different emails</th><th className="px-4 py-2">Digest box ticked</th></tr></thead>
            <tbody>
              {data.by_slug.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No downloads in this period.</td></tr>}
              {data.by_slug.map((r) => (
                <tr key={r.slug} className="border-t border-gray-100">
                  <td className="px-4 py-2"><button className="text-left text-gray-900 hover:text-red-600" onClick={() => setSlug(r.slug)}>{titleOf(r.slug)}</button></td>
                  <td className="px-4 py-2 font-bold">{r.downloads}</td><td className="px-4 py-2">{r.unique_emails}</td><td className="px-4 py-2">{r.opt_ins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between p-4 pb-2"><h3 className="font-bold text-gray-900">Every download</h3>{loading && <Loader2 className="animate-spin text-gray-400" size={16} />}</div>
        <table className="w-full text-sm" data-testid="resources-log">
          <thead className="text-left text-xs text-gray-500 uppercase"><tr><th className="px-4 py-2">When</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Guide</th><th className="px-4 py-2">Digest box</th><th className="px-4 py-2">Newsletter now</th></tr></thead>
          <tbody>
            {data && data.items.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Nothing to show.</td></tr>}
            {data && data.items.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-2 whitespace-nowrap text-gray-600">{fmt(r.created_at)}</td>
                <td className="px-4 py-2">{r.email}</td>
                <td className="px-4 py-2 text-gray-700">{titleOf(r.slug)}</td>
                <td className="px-4 py-2">{r.opt_in ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded text-xs font-bold border ${NL_STYLE[r.newsletter_status] || NL_STYLE.none}`}>{NL_LABEL[r.newsletter_status] || r.newsletter_status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.total > PER && (
          <div className="flex items-center justify-between p-4 text-sm text-gray-600">
            <span>{data.total} downloads</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Previous</button>
              <span className="py-1">Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesPanel;
