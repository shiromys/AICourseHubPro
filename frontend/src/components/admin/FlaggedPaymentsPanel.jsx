import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { AlertCircle, Download, ExternalLink, Loader2, X } from 'lucide-react';

const OUTCOMES = [
  { id: 'refunded', label: 'Refunded', help: 'Management approved a refund and it was issued in the Stripe Dashboard.' },
  { id: 'credit_given', label: 'Credit given', help: 'The customer was given another course (or other credit) instead of a refund.' },
  { id: 'declined', label: 'Declined', help: 'No refund or credit. A short reason is required.' },
];
const OUTCOME_STYLE = {
  refunded: 'bg-blue-50 text-blue-700 border-blue-200',
  credit_given: 'bg-purple-50 text-purple-700 border-purple-200',
  declined: 'bg-gray-100 text-gray-700 border-gray-300',
};

const money = (a, c) => (a == null ? '—' : `${c === 'USD' || !c ? '$' : ''}${a.toFixed(2)}${c && c !== 'USD' ? ` ${c}` : ''}`);
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

// Review queue + permanent record of duplicate payments. Nothing is refunded here:
// management decides, any refund is made in Stripe by hand, and the decision is recorded.
const FlaggedPaymentsPanel = () => {
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, resolved: 0, all: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);   // flag being decided
  const [outcome, setOutcome] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [list, c] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/flagged-payments`, { params: { status }, headers: authHeaders() }),
        axios.get(`${API_BASE_URL}/api/flagged-payments/counts`, { headers: authHeaders() }),
      ]);
      setItems(list.data); setCounts(c.data);
    } catch { setError('Could not load flagged payments.'); }
    finally { setLoading(false); }
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const openDialog = (f) => { setDialog(f); setOutcome(''); setNote(''); setDialogError(''); };

  const save = async () => {
    if (!outcome) { setDialogError('Choose how this was handled.'); return; }
    if (outcome === 'declined' && !note.trim()) { setDialogError('Add a short reason for declining.'); return; }
    setSaving(true); setDialogError('');
    try {
      await axios.post(`${API_BASE_URL}/api/flagged-payments/${dialog.id}/resolve`, { outcome, note }, { headers: authHeaders() });
      setDialog(null); load();
    } catch (e) { setDialogError(e.response?.data?.msg || 'Could not save. Please try again.'); }
    finally { setSaving(false); }
  };

  const exportCsv = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/api/flagged-payments.csv`, { params: { status }, headers: authHeaders(), responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a'); a.href = url; a.download = 'flagged_payments.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Could not export the CSV.'); }
  };

  const tabs = [['pending', 'Needs review'], ['resolved', 'Resolved'], ['all', 'All']];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setStatus(id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${status === id ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {label} <span className={`ml-1 text-xs ${status === id ? 'text-gray-300' : 'text-gray-400'}`}>{counts[id] ?? 0}</span>
            </button>
          ))}
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Nothing here is refunded automatically and no record is ever deleted. Decide each case, handle any refund by hand in Stripe, then record the decision.
      </p>
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Customer</th><th className="px-6 py-4">Course</th><th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Flagged</th><th className="px-6 py-4">Status / decision</th><th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400"><Loader2 className="inline animate-spin mr-2" size={16} />Loading…</td></tr>}
            {!loading && items.length === 0 && (
              <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">
                {status === 'pending' ? 'No flagged payments — nothing needs review.' : 'Nothing to show here yet.'}
              </td></tr>
            )}
            {!loading && items.map(f => (
              <tr key={f.id} className="hover:bg-gray-50 align-top">
                <td className="px-6 py-4"><div className="font-bold text-gray-900">{f.user_name}</div><div className="text-xs text-gray-500">{f.user_email}</div></td>
                <td className="px-6 py-4 text-gray-700">{f.course_title}</td>
                <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{money(f.amount, f.currency)}</td>
                <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{f.created_at}</td>
                <td className="px-6 py-4">
                  {!f.resolved ? <span className="text-yellow-600 font-bold">Needs review</span> : (
                    <div className="space-y-1">
                      <span className={`inline-block px-2 py-0.5 rounded border text-xs font-bold ${OUTCOME_STYLE[f.outcome] || 'bg-green-50 text-green-700 border-green-200'}`}>{f.outcome_label}</span>
                      {f.resolution_note && <div className="text-xs text-gray-600 max-w-xs whitespace-pre-wrap">{f.resolution_note}</div>}
                      <div className="text-xs text-gray-400">{f.resolved_by ? `by ${f.resolved_by} · ` : ''}{f.resolved_at}</div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  {f.stripe_url && (
                    <a href={f.stripe_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mr-2 px-3 py-1.5 border border-gray-200 rounded text-xs font-bold text-gray-600 hover:bg-gray-50">
                      Stripe <ExternalLink size={12} />
                    </a>
                  )}
                  {!f.resolved && <button onClick={() => openDialog(f)} className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-bold hover:bg-green-100">Record decision</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialog && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => !saving && setDialog(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><AlertCircle size={18} className="text-yellow-600" /> Record decision</h3>
                <p className="text-sm text-gray-500 mt-1">{dialog.user_name} · {dialog.course_title} · {money(dialog.amount, dialog.currency)}</p>
              </div>
              <button onClick={() => setDialog(null)} disabled={saving} className="text-gray-400 hover:text-black"><X size={18} /></button>
            </div>
            <div className="space-y-2 mb-4">
              {OUTCOMES.map(o => (
                <label key={o.id} className={`flex gap-3 p-3 rounded-lg border cursor-pointer ${outcome === o.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="outcome" className="mt-1" checked={outcome === o.id} onChange={() => { setOutcome(o.id); setDialogError(''); }} />
                  <span><span className="font-bold text-gray-900 text-sm">{o.label}</span><span className="block text-xs text-gray-500">{o.help}</span></span>
                </label>
              ))}
            </div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Note {outcome === 'declined' ? '(required)' : '(optional)'}</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={2000}
              placeholder="e.g. Approved by management on 29 Oct; refunded in Stripe; customer emailed."
              className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-black" />
            {dialogError && <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded">{dialogError}</div>}
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setDialog(null)} disabled={saving} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-black">Cancel</button>
              <button onClick={save} disabled={saving} className="px-5 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlaggedPaymentsPanel;
