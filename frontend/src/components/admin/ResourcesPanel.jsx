import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { Loader2, Download, RefreshCcw } from 'lucide-react';
import AdminSearch, { useDebounced } from './AdminSearch';
import { RESOURCE_PAGES, contentFor } from '../../content/resources';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const fmt = (iso) => iso ? new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const titleOf = (slug) => (contentFor(slug) && contentFor(slug).title) || (RESOURCE_PAGES.find((p) => p.slug === slug) || {}).topic || slug;

const NL_STYLE = {
  active: 'bg-green-50 text-green-700 border-green-200', pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  unsubscribed: 'bg-gray-100 text-gray-500 border-gray-200', none: 'bg-gray-50 text-gray-400 border-gray-200',
};
const NL_LABEL = { active: 'Subscribed', pending: 'Awaiting confirmation', unsubscribed: 'Unsubscribed', none: 'Not subscribed' };
const NlBadge = ({ s }) => <span className={`px-2 py-0.5 rounded text-xs font-bold border ${NL_STYLE[s] || NL_STYLE.none}`}>{NL_LABEL[s] || s}</span>;
const AccountBadge = ({ yes }) => yes ? <span className="ml-2 px-2 py-0.5 rounded text-[11px] font-bold border bg-blue-50 text-blue-700 border-blue-200">Has an account</span> : null;

const Stat = ({ label, value, hint, active, onClick, testId }) => (
  <button type="button" onClick={onClick} aria-pressed={!!active} data-testid={testId}
    className={`text-left bg-white p-4 rounded-xl border shadow-sm transition hover:shadow-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 ${active ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-200'}`}>
    <p className="text-2xl font-black text-gray-900">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
    {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    <p className="text-[11px] text-red-600 mt-2 font-medium">{active ? 'Showing below' : 'Click to see who'}</p>
  </button>
);

const Pager = ({ total, page, setPage, per, noun }) => {
  const pages = Math.max(1, Math.ceil(total / per));
  if (total <= per) return null;
  return (
    <div className="flex items-center justify-between p-4 text-sm text-gray-600">
      <span>{total} {noun}</span>
      <div className="flex gap-2">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Previous</button>
        <span className="py-1">Page {page} of {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
      </div>
    </div>
  );
};

const ResourcesPanel = () => {
  const [data, setData] = useState(null);       // downloads answer: items, total, summary, by_slug
  const [people, setPeople] = useState(null);   // people answer: items, total
  const [days, setDays] = useState('30');
  const [slug, setSlug] = useState('');
  const [optin, setOptin] = useState(false);
  const [nl, setNl] = useState('');             // '' or 'active'
  const [view, setView] = useState('downloads'); // 'downloads' = every download, 'people' = one row per email address
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const byGuideRef = useRef(null);
  const listRef = useRef(null);
  const q = useDebounced(search.trim());
  const PER = 25;

  const params = useCallback(() => ({ days: days === 'all' ? 0 : days, slug: slug || undefined, optin: optin ? 1 : undefined, nl: nl || undefined, q: q || undefined }), [days, slug, optin, nl, q]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const h = { headers: authHeaders() };
      const down = await axios.get(`${API_BASE_URL}/api/admin/resources/downloads`, { ...h, params: { ...params(), page: view === 'downloads' ? page : 1, per_page: view === 'downloads' ? PER : 1 } });
      setData(down.data);
      if (view === 'people') {
        const ppl = await axios.get(`${API_BASE_URL}/api/admin/resources/people`, { ...h, params: { ...params(), page, per_page: PER } });
        setPeople(ppl.data);
      }
    } catch (e) { setError('Could not load downloads. Try again in a moment.'); }
    setLoading(false);
  }, [params, page, view]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [days, slug, optin, nl, q, view]);

  const exportCsv = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/api/admin/resources/${view === 'people' ? 'people' : 'downloads'}.csv`, { headers: authHeaders(), params: params(), responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a'); a.href = url; a.download = view === 'people' ? 'resource-people.csv' : 'resource-downloads.csv'; a.click(); URL.revokeObjectURL(url);
    } catch (e) { setError('Could not export the CSV.'); }
  };

  const goto = (v, o, n) => { setView(v); setOptin(o); setNl(n); setSlug(''); setSearch(''); setTimeout(() => listRef.current && listRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); };
  const showPerson = (email) => { setView('downloads'); setSearch(email); setOptin(false); setNl(''); setSlug(''); };

  const s = data && data.summary;
  const plain = !slug && !q;
  const active = {
    all: view === 'downloads' && !optin && !nl && plain, people: view === 'people' && !optin && !nl && plain,
    optin: view === 'downloads' && optin && !nl && plain, subscribed: view === 'downloads' && optin && nl === 'active' && plain,
  };
  const what = view === 'people' ? 'Every person (email address) who downloaded' : 'Every download';
  const bits = [optin && nl === 'active' ? 'ticked the digest box and are now subscribed' : optin ? 'ticked the digest box' : '', slug ? `guide: ${titleOf(slug)}` : '', q ? `email contains "${q}"` : ''].filter(Boolean);
  const heading = what + (bits.length ? ` - ${bits.join(', ')}` : '');

  return (
    <div className="space-y-6" data-testid="resources-panel">
      <div className="flex flex-wrap items-center gap-3">
        <AdminSearch value={search} onChange={setSearch} placeholder="Search email address" className="w-full sm:w-64" testId="resources-search" />
        <select value={days} onChange={(e) => setDays(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" aria-label="Period">
          <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="all">All time</option>
        </select>
        <select value={slug} onChange={(e) => setSlug(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white max-w-xs" aria-label="Guide">
          <option value="">All guides</option>
          {RESOURCE_PAGES.map((p) => <option key={p.slug} value={p.slug}>{titleOf(p.slug)}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={optin} onChange={(e) => { setOptin(e.target.checked); if (!e.target.checked) setNl(''); }} /> Only people who ticked the digest box</label>
        <div className="ml-auto flex gap-2">
          <button onClick={load} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2"><RefreshCcw size={14} /> Refresh</button>
          <button onClick={exportCsv} className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-black flex items-center gap-2" data-testid="resources-csv"><Download size={14} /> Export CSV</button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {s && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3" data-testid="resources-cards">
          <Stat testId="card-downloads" label="Downloads" value={s.downloads} hint="Every download, newest first" active={active.all} onClick={() => goto('downloads', false, '')} />
          <Stat testId="card-people" label="Different email addresses" value={s.unique_emails} hint="One row per person" active={active.people} onClick={() => goto('people', false, '')} />
          <Stat testId="card-optin" label="Ticked the digest box" value={s.opt_ins} hint={`${s.opt_in_rate}% of downloads`} active={active.optin} onClick={() => goto('downloads', true, '')} />
          <Stat testId="card-subscribed" label="Of those, now subscribed" value={s.opt_ins_now_active} hint="Confirmed their email" active={active.subscribed} onClick={() => goto('downloads', true, 'active')} />
          <Stat testId="card-guides" label="Guides downloaded" value={data.by_slug.length} hint={`of ${RESOURCE_PAGES.length}`} active={false} onClick={() => { setSlug(''); byGuideRef.current && byGuideRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} />
        </div>
      )}

      {data && (
        <div ref={byGuideRef} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <h3 className="font-bold text-gray-900 p-4 pb-1">By guide</h3>
          <p className="px-4 pb-2 text-xs text-gray-500">Click a guide to see who downloaded it.</p>
          <table className="w-full text-sm" data-testid="resources-by-guide">
            <thead className="text-left text-xs text-gray-500 uppercase"><tr><th className="px-4 py-2">Guide</th><th className="px-4 py-2">Downloads</th><th className="px-4 py-2">Different emails</th><th className="px-4 py-2">Digest box ticked</th></tr></thead>
            <tbody>
              {data.by_slug.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No downloads in this period.</td></tr>}
              {data.by_slug.map((r) => (
                <tr key={r.slug} className={`border-t border-gray-100 ${slug === r.slug ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-2"><button className="text-left text-gray-900 hover:text-red-600 underline decoration-dotted underline-offset-2" onClick={() => { setSlug(r.slug); setSearch(''); listRef.current && listRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{titleOf(r.slug)}</button></td>
                  <td className="px-4 py-2 font-bold">{r.downloads}</td><td className="px-4 py-2">{r.unique_emails}</td><td className="px-4 py-2">{r.opt_ins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div ref={listRef} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between p-4 pb-2 gap-3">
          <h3 className="font-bold text-gray-900" data-testid="resources-heading">{heading}</h3>
          {loading && <Loader2 className="animate-spin text-gray-400 shrink-0" size={16} />}
        </div>

        {view === 'downloads' && (
          <>
            <table className="w-full text-sm" data-testid="resources-log">
              <thead className="text-left text-xs text-gray-500 uppercase"><tr><th className="px-4 py-2">When</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Guide</th><th className="px-4 py-2">Digest box</th><th className="px-4 py-2">Newsletter now</th></tr></thead>
              <tbody>
                {data && data.items.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Nothing to show.</td></tr>}
                {data && data.items.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 whitespace-nowrap text-gray-600">{fmt(r.created_at)}</td>
                    <td className="px-4 py-2">{r.email}<AccountBadge yes={r.has_account} /></td>
                    <td className="px-4 py-2 text-gray-700">{titleOf(r.slug)}</td>
                    <td className="px-4 py-2">{r.opt_in ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2"><NlBadge s={r.newsletter_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data && <Pager total={data.total} page={page} setPage={setPage} per={PER} noun="downloads" />}
          </>
        )}

        {view === 'people' && (
          <>
            <table className="w-full text-sm" data-testid="resources-people">
              <thead className="text-left text-xs text-gray-500 uppercase"><tr><th className="px-4 py-2">Email</th><th className="px-4 py-2">Downloads</th><th className="px-4 py-2">Guides</th><th className="px-4 py-2">Last download</th><th className="px-4 py-2">Digest box</th><th className="px-4 py-2">Newsletter now</th></tr></thead>
              <tbody>
                {people && people.items.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Nothing to show.</td></tr>}
                {people && people.items.map((r) => (
                  <tr key={r.email} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-2"><button className="text-left text-gray-900 hover:text-red-600 underline decoration-dotted underline-offset-2" title="See every download by this person" onClick={() => showPerson(r.email)}>{r.email}</button><AccountBadge yes={r.has_account} /></td>
                    <td className="px-4 py-2 font-bold">{r.downloads}</td>
                    <td className="px-4 py-2 text-gray-700">{r.guides.map(titleOf).join('; ')}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-600">{fmt(r.last_at)}</td>
                    <td className="px-4 py-2">{r.opt_in ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2"><NlBadge s={r.newsletter_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {people && <Pager total={people.total} page={page} setPage={setPage} per={PER} noun="people" />}
          </>
        )}
      </div>
    </div>
  );
};

export default ResourcesPanel;
