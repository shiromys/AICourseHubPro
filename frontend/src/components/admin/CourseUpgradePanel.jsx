import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { Loader2, Upload, Rocket, CalendarClock, Mail, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const api = (path) => `${API_BASE_URL}/api/admin/course-upgrade${path}`;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const fmt = (iso) => iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Chicago' }) + ' CST' : '—';

const CourseUpgradePanel = () => {
  const [status, setStatus] = useState(null);
  const [courses, setCourses] = useState(null);     // parsed upload
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState(null);
  const [cutoff, setCutoff] = useState('');
  const [ext, setExt] = useState({ email: '', course_id: '', days: 14 });

  const flash = (type, text) => { setNote({ type, text }); setTimeout(() => setNote(null), 8000); };
  const errText = (e) => e?.response?.data?.msg || e?.message || 'Something went wrong';

  const load = useCallback(async () => {
    try {
      const r = await axios.get(api('/status'), { headers: authHeaders() });
      setStatus(r.data);
      setCutoff(r.data.cutoff_utc ? r.data.cutoff_utc.slice(0, 16) : '');
    } catch (e) { flash('err', errText(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rePreview = async (list) => {
    setBusy('preview'); setConfirm('');
    try {
      const r = await axios.post(api('/preview'), { courses: list }, { headers: authHeaders() });
      setPreview(r.data);
    } catch (e) {
      if (e?.response?.data?.rows) setPreview(e.response.data); else flash('err', errText(e));
    } finally { setBusy(''); }
  };

  // The admin picks which existing course each uploaded course replaces ('' = automatic, 'none' = add as a new course).
  const choose = (idx, value) => {
    const next = courses.map((c, i) => {
      if (i !== idx) return c;
      const copy = { ...c };
      if (value === '') delete copy.old_id; else copy.old_id = value === 'none' ? 'none' : Number(value);
      return copy;
    });
    setCourses(next);
    rePreview(next);
  };

  const onFile = (ev) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    setPreview(null); setConfirm(''); setCourses(null); setFileName(f.name);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result);
        const list = Array.isArray(parsed) ? parsed : parsed.courses;
        setCourses(list);
        await rePreview(list);
      } catch (e) {
        flash('err', 'That file is not valid JSON.');
      }
    };
    reader.readAsText(f);
  };

  const run = async () => {
    setBusy('run');
    try {
      const r = await axios.post(api('/run'), { courses, confirm, send_emails: true }, { headers: authHeaders() });
      flash('ok', `Done. ${r.data.courses_upgraded} courses upgraded, ${r.data.free_grants} free accesses given, ${r.data.emails_queued} emails sending.`);
      setCourses(null); setPreview(null); setConfirm(''); setFileName('');
      load();
    } catch (e) { flash('err', errText(e)); } finally { setBusy(''); }
  };

  const saveCutoff = async () => {
    setBusy('cutoff');
    try {
      await axios.put(api('/cutoff'), { cutoff_utc: cutoff + ':00Z' }, { headers: authHeaders() });
      flash('ok', 'Closing date saved.'); load();
    } catch (e) { flash('err', errText(e)); } finally { setBusy(''); }
  };

  const resend = async () => {
    setBusy('resend');
    try { const r = await axios.post(api('/resend-emails'), {}, { headers: authHeaders() }); flash('ok', r.data.msg); load(); }
    catch (e) { flash('err', errText(e)); } finally { setBusy(''); }
  };

  const extend = async () => {
    setBusy('extend');
    try {
      const r = await axios.post(api('/extend'), { email: ext.email, course_id: Number(ext.course_id), days: Number(ext.days) }, { headers: authHeaders() });
      flash('ok', r.data.msg); load();
    } catch (e) { flash('err', errText(e)); } finally { setBusy(''); }
  };

  if (!status) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-red-600" /></div>;
  const legacy = status.legacy_courses || [];

  return (
    <div className="space-y-6 max-w-5xl">
      {note && <div className={`p-3 rounded-lg text-sm font-semibold border ${note.type === 'ok' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{note.text}</div>}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-lg flex items-center gap-2"><Clock size={18} /> Old courses close</h3>
        <p className="text-sm text-gray-600 mt-1">
          {status.closed ? 'The old courses are closed.' : 'Learners can keep using the old courses until:'} <strong>{fmt(status.cutoff_utc)}</strong>.
          Certificates keep working forever.
        </p>
        <div className="flex flex-wrap items-end gap-3 mt-3">
          <label className="text-xs font-bold text-gray-500">Change (UTC)
            <input type="datetime-local" value={cutoff} onChange={e => setCutoff(e.target.value)} className="block mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </label>
          <button onClick={saveCutoff} disabled={busy === 'cutoff'} className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg disabled:opacity-50"><CalendarClock size={14} className="inline mr-1" />Save date</button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-lg flex items-center gap-2"><Rocket size={18} /> Launch the new courses</h3>
        <p className="text-sm text-gray-600 mt-1">Upload <code>all_courses_new.json</code>. Each course replaces the existing course with the same title; if none matches you choose which one it replaces. You will see exactly what will happen before anything changes.</p>
        <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-400 rounded-lg cursor-pointer text-sm font-bold hover:bg-gray-50">
          <Upload size={16} /> {fileName || 'Choose file'}
          <input type="file" accept=".json,application/json" className="hidden" onChange={onFile} />
        </label>
        {busy === 'preview' && <Loader2 className="animate-spin inline ml-3" size={18} />}

        {preview?.rows?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-bold text-gray-700 mb-1">Which existing course does each new course replace?</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase text-gray-400"><th className="py-1">New course (from the file)</th><th>Replaces</th></tr></thead>
                <tbody>{preview.rows.map(r => (
                  <tr key={r.index} className="border-t border-gray-100 align-top">
                    <td className="py-2 pr-3">{r.new_title}</td>
                    <td className="py-2">
                      <select
                        value={courses?.[r.index]?.old_id === 'none' ? 'none' : (courses?.[r.index]?.old_id != null ? String(courses[r.index].old_id) : (r.old_id != null ? String(r.old_id) : ''))}
                        onChange={e => choose(r.index, e.target.value)}
                        className={`border rounded-lg px-2 py-1.5 text-sm max-w-full ${r.problem ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}>
                        <option value="">— choose —</option>
                        {(preview.available || []).map(a => <option key={a.id} value={String(a.id)}>{a.title} (#{a.id})</option>)}
                        <option value="none">Add as a new course (replaces nothing)</option>
                      </select>
                      {r.matched_by && r.matched_by !== 'choice' && r.matched_by !== 'new' && (
                        <span className="ml-2 text-xs text-gray-500">matched by {r.matched_by}</span>
                      )}
                      {r.title_differs && <p className="text-xs text-amber-700 mt-1">Titles differ. Check this is the right course before upgrading.</p>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {preview && !preview.ok && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <p className="font-bold flex items-center gap-1"><AlertTriangle size={14} /> Nothing will change until these are fixed:</p>
            <ul className="list-disc ml-5 mt-1">{(preview.errors || []).map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
        )}

        {preview?.ok && (
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase text-gray-400"><th className="py-1">Old course</th><th>New course</th><th>Price</th><th>Learners</th><th>Finished</th><th>Mid-course</th></tr></thead>
                <tbody>{preview.plan.map(p => (
                  <tr key={p.old_id ?? `new-${p.new_title}`} className="border-t border-gray-100"><td className="py-2">{p.old_title || <span className="text-gray-400">(new course)</span>}</td><td>{p.new_title}</td><td>${p.price}</td><td>{p.learners}</td><td>{p.completed}</td><td>{p.in_progress}</td></tr>
                ))}</tbody>
              </table>
            </div>
            <ul className="mt-3 text-sm text-gray-700 list-disc ml-5">
              <li>{preview.totals.free_grants} free accesses to the new courses will be given</li>
              <li>{preview.totals.emails} people who finished an old course will get the announcement email</li>
              <li>{preview.totals.popups} mid-course learners will see the dashboard pop-up</li>
              <li>Old courses stop being sold and disappear for everyone else; owners keep them until the closing date</li>
            </ul>
            <div className="flex flex-wrap items-end gap-3 mt-4">
              <label className="text-xs font-bold text-gray-500">Type UPGRADE to confirm
                <input value={confirm} onChange={e => setConfirm(e.target.value)} className="block mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </label>
              <button onClick={run} disabled={confirm !== 'UPGRADE' || busy === 'run'} className="px-5 py-2 bg-red-600 text-white font-bold rounded-lg disabled:opacity-40">
                {busy === 'run' ? <Loader2 className="animate-spin inline" size={16} /> : 'Upgrade now'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Retired courses</h3>
          <button onClick={resend} disabled={busy === 'resend' || legacy.length === 0} className="text-sm font-bold text-red-600 flex items-center gap-1 disabled:opacity-40"><Mail size={14} /> Email anyone not yet emailed</button>
        </div>
        {legacy.length === 0 ? <p className="text-sm text-gray-500 mt-2">No course has been retired yet.</p> : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-gray-400"><th className="py-1">Old course</th><th>Replaced by</th><th>Learners</th><th>Finished</th><th>Mid-course</th><th>Emails sent</th><th>Extended</th></tr></thead>
              <tbody>{legacy.map(l => (
                <tr key={l.id} className="border-t border-gray-100"><td className="py-2">{l.title} <span className="text-gray-400">#{l.id}</span></td><td>{l.new_title || '—'}</td><td>{l.learners}</td><td>{l.completed}</td><td>{l.in_progress}</td><td>{l.emails_sent}</td><td>{l.extended}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {legacy.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-bold text-lg flex items-center gap-2"><CheckCircle size={18} /> Give one learner more time</h3>
          <div className="flex flex-wrap items-end gap-3 mt-3">
            <label className="text-xs font-bold text-gray-500">Learner email
              <input value={ext.email} onChange={e => setExt({ ...ext, email: e.target.value })} className="block mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-bold text-gray-500">Old course
              <select value={ext.course_id} onChange={e => setExt({ ...ext, course_id: e.target.value })} className="block mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Choose…</option>{legacy.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-gray-500">Extra days
              <input type="number" min="1" max="365" value={ext.days} onChange={e => setExt({ ...ext, days: e.target.value })} className="block mt-1 w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </label>
            <button onClick={extend} disabled={!ext.email || !ext.course_id || busy === 'extend'} className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg disabled:opacity-40">Extend</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseUpgradePanel;
