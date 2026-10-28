import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { Loader2, Wand2, Send, Save, Eye, Download, Trash2, Plus, Clock, CheckCircle, Mail } from 'lucide-react';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const api = (path) => `${API_BASE_URL}/api/admin/newsletter${path}`;
const fmt = (iso) => iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const STATUS_STYLE = {
  active: 'bg-green-50 text-green-700 border-green-200', pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  unsubscribed: 'bg-gray-100 text-gray-500 border-gray-200', draft: 'bg-gray-100 text-gray-600 border-gray-200',
  queued: 'bg-blue-50 text-blue-700 border-blue-200', sending: 'bg-orange-50 text-orange-700 border-orange-200',
  sent: 'bg-green-50 text-green-700 border-green-200',
};
const Pill = ({ s }) => <span className={`px-2 py-0.5 rounded text-xs font-bold border capitalize ${STATUS_STYLE[s] || ''}`}>{s}</span>;

const EMPTY = { id: null, subject: '', preheader: '', body_html: '', status: 'draft' };

const NewsletterPanel = () => {
  const [stats, setStats] = useState(null);
  const [subs, setSubs] = useState({ items: [], total: 0 });
  const [subFilter, setSubFilter] = useState('');
  const [issues, setIssues] = useState([]);
  const [draft, setDraft] = useState(null);          // issue being composed
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState(null);            // {type:'ok'|'err', text}
  const [testTo, setTestTo] = useState('');

  const flash = (type, text) => { setNote({ type, text }); setTimeout(() => setNote(null), 6000); };

  const loadAll = useCallback(async () => {
    try {
      const [s, l, i] = await Promise.all([
        axios.get(api('/stats'), { headers: authHeaders() }),
        axios.get(api('/subscribers'), { headers: authHeaders(), params: { status: subFilter || undefined, per_page: 50 } }),
        axios.get(api('/issues'), { headers: authHeaders() }),
      ]);
      setStats(s.data); setSubs(l.data); setIssues(i.data);
    } catch { flash('err', 'Could not load newsletter data.'); }
  }, [subFilter]);
  useEffect(() => { loadAll(); }, [loadAll]);

  const run = async (label, fn) => {
    setBusy(label);
    try { await fn(); } catch (e) { flash('err', e.response?.data?.msg || 'Something went wrong.'); }
    finally { setBusy(''); }
  };

  const generate = () => run('gen', async () => {
    const r = await axios.get(api('/suggest'), { headers: authHeaders() });
    setDraft({ ...EMPTY, ...r.data }); setPreview('');
    flash('ok', 'Starter draft generated - edit anything, then preview and send a test.');
  });

  const openIssue = (id) => run('open', async () => {
    const r = await axios.get(api(`/issues/${id}`), { headers: authHeaders() });
    setDraft(r.data); setPreview('');
  });

  const save = (status) => run('save', async () => {
    const payload = { subject: draft.subject, preheader: draft.preheader, body_html: draft.body_html, status };
    const r = draft.id
      ? await axios.put(api(`/issues/${draft.id}`), payload, { headers: authHeaders() })
      : await axios.post(api('/issues'), payload, { headers: authHeaders() });
    setDraft(r.data); await loadAll();
    flash('ok', status === 'queued' ? 'Queued - the weekly scheduler will send it.' : 'Draft saved.');
  });

  const doPreview = () => run('prev', async () => {
    const r = await axios.post(api('/preview'), draft, { headers: authHeaders() });
    setPreview(r.data.html);
  });

  const sendTest = () => run('test', async () => {
    const r = await axios.post(api('/send-test'), { ...draft, email: testTo || undefined }, { headers: authHeaders() });
    flash('ok', r.data.msg);
  });

  const sendNow = () => {
    if (!draft.id) { flash('err', 'Save the draft first.'); return; }
    if (!window.confirm(`Send "${draft.subject}" to ${stats?.active ?? 0} confirmed subscribers now? This cannot be undone.`)) return;
    run('send', async () => {
      const r = await axios.post(api(`/issues/${draft.id}/send`), {}, { headers: authHeaders() });
      flash('ok', r.data.msg); setDraft(null); await loadAll();
    });
  };

  const del = (id) => {
    if (!window.confirm('Delete this unsent issue?')) return;
    run('del', async () => { await axios.delete(api(`/issues/${id}`), { headers: authHeaders() }); if (draft?.id === id) setDraft(null); await loadAll(); });
  };

  const exportCsv = () => run('csv', async () => {
    const r = await axios.get(api('/subscribers.csv'), { headers: authHeaders(), responseType: 'blob' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = 'newsletter_subscribers.csv'; a.click(); URL.revokeObjectURL(a.href);
  });

  const locked = draft && (draft.status === 'sending' || draft.status === 'sent');
  const input = 'w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-red-500 outline-none disabled:bg-gray-50';

  return (
    <div className="space-y-6">
      {note && <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${note.type === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`} role="status">{note.text}</div>}

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['Confirmed subscribers', stats?.active], ['Awaiting confirmation', stats?.pending], ['Unsubscribed', stats?.unsubscribed], ['Last digest sent', stats?.last_sent ? fmt(stats.last_sent) : 'Never']].map(([l, v]) => (
          <div key={l} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"><p className="text-xs text-gray-500 font-medium">{l}</p><p className="text-xl font-bold text-gray-900 mt-1">{v ?? '—'}</p></div>))}
      </div>

      {/* COMPOSER */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Mail size={18} className="text-red-600" /> Weekly digest</h3>
          <div className="flex gap-2">
            <button onClick={generate} disabled={!!busy} className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
              {busy === 'gen' ? <Loader2 className="animate-spin" size={15} /> : <Wand2 size={15} />} Generate starter draft</button>
            <button onClick={() => { setDraft({ ...EMPTY }); setPreview(''); }} className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"><Plus size={15} /> Blank</button>
          </div>
        </div>

        {!draft ? (
          <p className="p-8 text-center text-sm text-gray-500">Click <b>Generate starter draft</b> for this week's prompt, tip and a course spotlight - or open a previous issue below.</p>
        ) : (
          <div className="p-5 grid lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              {locked && <p className="text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-3 py-2">This issue is {draft.status} and can't be edited.</p>}
              <div><label className="text-xs font-bold text-gray-500 uppercase">Subject</label><input className={input} disabled={locked} value={draft.subject} onChange={e => setDraft({ ...draft, subject: e.target.value })} maxLength={200} /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Preview text <span className="normal-case font-normal">(shown next to the subject in inboxes)</span></label><input className={input} disabled={locked} value={draft.preheader || ''} onChange={e => setDraft({ ...draft, preheader: e.target.value })} maxLength={200} /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Body (HTML)</label><textarea className={`${input} font-mono h-72`} disabled={locked} value={draft.body_html} onChange={e => setDraft({ ...draft, body_html: e.target.value })} spellCheck={false} /></div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={doPreview} disabled={!!busy} className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black"><Eye size={15} /> Preview</button>
                {!locked && <>
                  <button onClick={() => save('draft')} disabled={!!busy} className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"><Save size={15} /> Save draft</button>
                  <button onClick={() => save('queued')} disabled={!!busy} className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"><Clock size={15} /> Queue for weekly send</button>
                  <button onClick={sendNow} disabled={!!busy} className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"><Send size={15} /> Send now</button>
                </>}
              </div>
              <div className="flex gap-2 items-center">
                <input className={`${input} max-w-[16rem]`} placeholder="Test email (default: yours)" value={testTo} onChange={e => setTestTo(e.target.value)} />
                <button onClick={sendTest} disabled={!!busy} className="text-sm font-bold px-3 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 whitespace-nowrap">Send test</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Email preview</label>
              <div className="mt-1 border border-gray-200 rounded-lg bg-gray-100 h-[34rem] overflow-hidden">
                {preview
                  ? <iframe title="Email preview" sandbox="" srcDoc={preview} className="w-full h-full bg-white" />
                  : <div className="h-full flex items-center justify-center text-sm text-gray-400">Click Preview to see exactly how it will look.</div>}
              </div>
            </div>
          </div>)}
      </div>

      {/* ISSUES */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-gray-50"><h3 className="font-bold text-gray-900">Issues</h3></div>
        <table className="w-full text-sm text-left"><tbody className="divide-y divide-gray-100">
          {issues.length === 0 && <tr><td className="px-5 py-8 text-center text-gray-400">No issues yet.</td></tr>}
          {issues.map(i => (
            <tr key={i.id} className="hover:bg-gray-50">
              <td className="px-5 py-3"><button onClick={() => openIssue(i.id)} className="font-bold text-gray-900 hover:text-red-600 text-left">{i.subject}</button>
                <div className="text-xs text-gray-400">{i.status === 'sent' ? `Sent ${fmt(i.sent_at)} to ${i.recipient_count}` : `Created ${fmt(i.created_at)}`}</div></td>
              <td className="px-5 py-3"><Pill s={i.status} /></td>
              <td className="px-5 py-3 text-right">{(i.status === 'draft' || i.status === 'queued') && <button onClick={() => del(i.id)} title="Delete" className="p-2 text-red-600 bg-red-50 rounded hover:bg-red-100"><Trash2 size={16} /></button>}</td>
            </tr>))}
        </tbody></table>
      </div>

      {/* SUBSCRIBERS */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-gray-900">Subscribers <span className="text-gray-400 font-normal">({subs.total})</span></h3>
          <div className="flex gap-2">
            <select value={subFilter} onChange={e => setSubFilter(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-2 py-2 bg-white text-gray-800">
              <option value="">All</option><option value="active">Confirmed</option><option value="pending">Awaiting confirmation</option><option value="unsubscribed">Unsubscribed</option></select>
            <button onClick={exportCsv} className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"><Download size={15} /> Export CSV</button>
          </div>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs"><tr><th className="px-5 py-3">Email</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Source</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3">Last sent</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {subs.items.length === 0 && <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-400">No subscribers yet.</td></tr>}
            {subs.items.map(s => (
              <tr key={s.id} className="hover:bg-gray-50"><td className="px-5 py-3 text-gray-900">{s.email}{s.has_account && <span className="ml-2 text-[10px] font-bold text-blue-600 border border-blue-200 rounded px-1">ACCOUNT</span>}</td>
                <td className="px-5 py-3"><Pill s={s.status} /></td><td className="px-5 py-3 text-gray-500">{s.source}</td>
                <td className="px-5 py-3 text-gray-500">{fmt(s.created_at)}</td><td className="px-5 py-3 text-gray-500">{fmt(s.last_sent_at)}</td></tr>))}
          </tbody></table></div>
      </div>
    </div>
  );
};

export default NewsletterPanel;
