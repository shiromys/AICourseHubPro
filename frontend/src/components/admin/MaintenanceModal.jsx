import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

const PRESETS = [
  { id: '30', label: '30 minutes', minutes: 30 }, { id: '60', label: '1 hour', minutes: 60 },
  { id: '120', label: '2 hours', minutes: 120 }, { id: '240', label: '4 hours', minutes: 240 },
];
const MAX_DAYS = 14;
const pad = (n) => String(n).padStart(2, '0');
const toLocalInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const when = (d) => d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
export const tzName = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'your time zone'; } catch { return 'your time zone'; } };

// Asks the admin to confirm before the public site is switched to "Under Maintenance",
// and lets them choose when it switches itself off again.
const MaintenanceModal = ({ open, editing = false, busy = false, error = '', onConfirm, onCancel }) => {
  const [choice, setChoice] = useState('60');
  const [custom, setCustom] = useState('');
  const cancelRef = useRef(null);

  useEffect(() => { if (open) { setChoice('60'); setCustom(''); setTimeout(() => cancelRef.current && cancelRef.current.focus(), 0); } }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  const minInput = useMemo(() => toLocalInput(new Date(Date.now() + 5 * 60000)), [open]);       // eslint-disable-line react-hooks/exhaustive-deps
  const maxInput = useMemo(() => toLocalInput(new Date(Date.now() + MAX_DAYS * 86400000)), [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const computeEnd = () => {
    if (choice === 'manual') return { end: null, problem: '' };
    if (choice === 'custom') {
      if (!custom) return { end: null, problem: 'Pick the date and time it should end.' };
      const d = new Date(custom);
      if (isNaN(d)) return { end: null, problem: 'That date and time is not valid.' };
      if (d.getTime() < Date.now() + 60000) return { end: null, problem: 'The end time must be in the future.' };
      if (d.getTime() > Date.now() + MAX_DAYS * 86400000) return { end: null, problem: `The end time can be at most ${MAX_DAYS} days away.` };
      return { end: d, problem: '' };
    }
    const p = PRESETS.find((x) => x.id === choice);
    return { end: new Date(Date.now() + p.minutes * 60000), problem: '' };
  };
  const { end, problem } = computeEnd();
  const blocked = busy || (choice === 'custom' && !!problem);

  if (!open) return null;
  const confirm = () => { const r = computeEnd(); if (choice === 'custom' && r.problem) return; onConfirm(r.end ? r.end.toISOString() : null); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" data-testid="maintenance-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="mm-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto" data-testid="maintenance-modal">
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-red-100 text-red-600 p-2.5 rounded-full shrink-0"><AlertTriangle size={22} /></div>
          <div>
            <h3 id="mm-title" className="text-xl font-black text-gray-900">{editing ? 'Change when maintenance ends' : 'Turn on maintenance mode?'}</h3>
            <p className="text-sm text-gray-500 mt-1">{editing ? 'Maintenance mode is already on.' : 'Please check before you confirm. This affects every visitor.'}</p>
          </div>
        </div>

        {!editing && (
          <ul className="text-sm text-gray-700 space-y-1.5 mb-5 list-disc pl-5">
            <li>Visitors who are not admins will see the "Under Maintenance" page when they open or refresh the site.</li>
            <li>Admins can still sign in at <span className="font-mono text-xs bg-gray-100 px-1 rounded">/login</span>.</li>
            <li>People already on a page keep working until they refresh it. Payments already in progress are not stopped.</li>
          </ul>
        )}

        <fieldset className="mb-3">
          <legend className="text-sm font-bold text-gray-900 mb-2">Switch maintenance off automatically</legend>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <label key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${choice === p.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="mm-end" checked={choice === p.id} onChange={() => setChoice(p.id)} /> After {p.label}
              </label>
            ))}
            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${choice === 'custom' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type="radio" name="mm-end" checked={choice === 'custom'} onChange={() => setChoice('custom')} /> At a date and time
            </label>
            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${choice === 'manual' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type="radio" name="mm-end" checked={choice === 'manual'} onChange={() => setChoice('manual')} /> I will switch it off myself
            </label>
          </div>
          {choice === 'custom' && (
            <div className="mt-3">
              <input type="datetime-local" value={custom} min={minInput} max={maxInput} onChange={(e) => setCustom(e.target.value)} aria-label="End date and time"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" data-testid="maintenance-custom" />
              <p className="text-xs text-gray-500 mt-1">In {tzName()}. Up to {MAX_DAYS} days from now.</p>
            </div>
          )}
        </fieldset>

        <div className={`text-sm rounded-lg px-3 py-2 mb-4 ${choice === 'manual' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' : 'bg-gray-50 border border-gray-200 text-gray-700'}`} data-testid="maintenance-summary">
          {choice === 'manual'
            ? 'It stays on until you switch it off in Global Settings. Visitors cannot use the site until then, so do not forget.'
            : problem ? problem
            : `${editing ? 'It will now end' : 'It starts now and ends'} automatically on ${when(end)} (${tzName()}).`}
        </div>

        {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4" role="alert">{error}</div>}

        <div className="flex justify-end gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} data-testid="maintenance-cancel"
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-800 font-bold hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={confirm} disabled={blocked} data-testid="maintenance-confirm"
            className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            {busy && <Loader2 size={16} className="animate-spin" />}{editing ? 'Save end time' : 'Turn on maintenance mode'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceModal;
