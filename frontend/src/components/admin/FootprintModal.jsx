import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config';
import {
  X, Loader2, LogIn, Eye, CreditCard, GraduationCap, Award, UserPlus, KeyRound,
  ShieldAlert, AlertTriangle, Gift, User as UserIcon, Ban, Globe, Monitor, Clock
} from 'lucide-react';

// Per-event presentation: label, icon, tint, and which filter chip it belongs to.
const EVENT_META = {
  signup:                    { label: 'Account created',        icon: UserPlus,      tint: 'bg-blue-50 text-blue-600',     group: 'account' },
  login:                     { label: 'Logged in',              icon: LogIn,         tint: 'bg-green-50 text-green-600',   group: 'logins' },
  login_failed:              { label: 'Failed login',           icon: ShieldAlert,   tint: 'bg-red-50 text-red-600',       group: 'logins' },
  page_view:                 { label: 'Viewed page',            icon: Eye,           tint: 'bg-gray-100 text-gray-600',    group: 'pages' },
  payment:                   { label: 'Payment',                icon: CreditCard,    tint: 'bg-emerald-50 text-emerald-600', group: 'payments' },
  duplicate_payment_resolved: { label: 'Duplicate payment decision recorded', icon: AlertTriangle, tint: 'bg-green-50 text-green-700', group: 'payments' },
  duplicate_payment_flagged: { label: 'Duplicate payment flagged', icon: AlertTriangle, tint: 'bg-yellow-50 text-yellow-700', group: 'payments' },
  course_granted:            { label: 'Course granted',         icon: Gift,          tint: 'bg-purple-50 text-purple-600', group: 'payments' },
  lesson_progress:           { label: 'Progress',               icon: GraduationCap, tint: 'bg-indigo-50 text-indigo-600', group: 'learning' },
  certificate_issued:        { label: 'Certificate issued',     icon: Award,         tint: 'bg-amber-50 text-amber-600',   group: 'learning' },
  account_setup:             { label: 'Account setup completed', icon: UserIcon,     tint: 'bg-blue-50 text-blue-600',     group: 'account' },
  password_reset:            { label: 'Password reset',         icon: KeyRound,      tint: 'bg-orange-50 text-orange-600', group: 'account' },
  profile_update:            { label: 'Profile updated',        icon: UserIcon,      tint: 'bg-blue-50 text-blue-600',     group: 'account' },
  ban_change:                { label: 'Ban status changed',     icon: Ban,           tint: 'bg-red-50 text-red-600',       group: 'account' },
};
const FALLBACK = { label: 'Event', icon: Clock, tint: 'bg-gray-100 text-gray-600', group: 'account' };

const FILTERS = [
  { id: 'all', label: 'All' }, { id: 'logins', label: 'Logins' }, { id: 'pages', label: 'Pages' },
  { id: 'payments', label: 'Payments' }, { id: 'learning', label: 'Learning' }, { id: 'account', label: 'Account' },
];

const fmt = (iso) => iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const Tile = ({ label, value }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
    <div className="text-xs text-gray-500 font-medium">{label}</div>
    <div className="text-base font-bold text-gray-900 mt-0.5 leading-snug">{value}</div>
  </div>
);

const FootprintModal = ({ userId, onClose }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    setData(null); setError('');
    axios.get(`${API_BASE_URL}/api/admin/users/${userId}/footprint`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => { if (!cancelled) setData(r.data); })
      .catch(() => { if (!cancelled) setError('Could not load this user\'s footprint.'); });
    return () => { cancelled = true; };
  }, [userId]);

  const events = useMemo(() => {
    if (!data) return [];
    return data.events.filter(e => filter === 'all' || (EVENT_META[e.type] || FALLBACK).group === filter);
  }, [data, filter]);

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="min-w-0">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Digital footprint</p>
            <h2 className="text-xl font-bold text-gray-900 truncate">{data?.user.name || 'Loading…'}</h2>
            {data && <p className="text-sm text-gray-500 truncate">{data.user.email}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {!data && !error && <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-red-600" size={32} /></div>}
          {error && <p className="text-red-600 text-center py-10">{error}</p>}

          {data && (<>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200">{data.user.role}</span>
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200">Origin: {data.user.signup_source === 'guest_checkout' ? 'Guest checkout' : 'Signup'}</span>
              {!data.user.account_setup_complete && <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 border border-yellow-200">No password set yet</span>}
              {data.user.banned && <span className="px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200">Banned</span>}
              {data.user.is_deleted && <span className="px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200">Deleted</span>}
              {data.newsletter && <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">Newsletter: {data.newsletter}</span>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Tile label="Member since" value={fmt(data.user.created_at).split(',')[0]} />
              <Tile label="Logins" value={data.user.login_count} />
              <Tile label="Pages viewed (tracked)" value={data.stats.page_views} />
              <Tile label="Last seen" value={data.stats.last_seen ? fmt(data.stats.last_seen) : fmt(data.user.last_login)} />
            </div>

            <section>
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Courses &amp; access</h3>
              {data.enrollments.length === 0 ? <p className="text-sm text-gray-400">No courses.</p> : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr>
                      <th className="px-4 py-2 text-left">Course</th><th className="px-4 py-2 text-left">Access</th>
                      <th className="px-4 py-2 text-left">Progress</th><th className="px-4 py-2 text-left">Certificate</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.enrollments.map(e => (
                        <tr key={e.course_id}>
                          <td className="px-4 py-2 font-medium text-gray-900">{e.course}<div className="text-xs text-gray-400 font-normal">Enrolled {fmt(e.enrolled_at)}</div></td>
                          <td className="px-4 py-2 text-gray-600">{e.access}</td>
                          <td className="px-4 py-2 text-gray-600">{e.status === 'completed' ? 'Completed' : `${e.progress}%`}</td>
                          <td className="px-4 py-2 font-mono text-xs text-gray-600">{e.certificate_id || '—'}</td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>)}
            </section>

            {data.flagged_payments.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Flagged payments</h3>
                <ul className="space-y-1.5">
                  {data.flagged_payments.map(f => (
                    <li key={f.id} className="text-sm bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 flex justify-between gap-3">
                      <span>Duplicate payment for <b>{f.course}</b> · {fmt(f.created_at)}</span>
                      <span className={`font-bold ${f.resolved ? 'text-green-600' : 'text-yellow-700'}`}>{f.resolved ? 'Resolved' : 'Needs review'}</span>
                    </li>))}
                </ul>
              </section>)}

            <section>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-gray-700 uppercase">Activity timeline</h3>
                <div className="flex flex-wrap gap-1.5">
                  {FILTERS.map(f => (
                    <button key={f.id} onClick={() => setFilter(f.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border transition ${filter === f.id ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>{f.label}</button>))}
                </div>
              </div>
              {events.length === 0 ? <p className="text-sm text-gray-400 py-6 text-center">No activity recorded for this filter.</p> : (
                <ol className="space-y-1.5">
                  {events.map(ev => {
                    const m = EVENT_META[ev.type] || FALLBACK; const Icon = m.icon;
                    return (
                      <li key={ev.id} className="flex gap-3 items-start p-2.5 rounded-lg hover:bg-gray-50">
                        <span className={`mt-0.5 h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${m.tint}`}><Icon size={16} /></span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                            <p className="text-sm font-semibold text-gray-900">
                              {m.label}{ev.path && <span className="font-mono font-normal text-gray-500"> {ev.path}</span>}
                              {ev.historical && <span className="ml-2 text-[10px] uppercase font-bold text-gray-400 border border-gray-200 rounded px-1 py-0.5">from records</span>}
                            </p>
                            <span className="text-xs text-gray-400 whitespace-nowrap">{fmt(ev.at)}</span>
                          </div>
                          {(ev.detail && ev.type !== 'page_view' && ev.detail.toLowerCase() !== m.label.toLowerCase() && ev.detail !== 'Logged in') && <p className="text-sm text-gray-600">{ev.detail}</p>}
                          {ev.course && <p className="text-xs text-gray-500">Course: {ev.course}</p>}
                          {(ev.ip || ev.device) && (
                            <p className="text-xs text-gray-400 flex flex-wrap gap-x-3 mt-0.5">
                              {ev.ip && <span className="flex items-center gap-1"><Globe size={11} />{ev.ip}</span>}
                              {ev.device && <span className="flex items-center gap-1"><Monitor size={11} />{ev.device}</span>}
                            </p>)}
                        </div>
                      </li>);
                  })}
                </ol>)}
              <p className="text-xs text-gray-400 mt-3">{data.stats.tracking_since}</p>
            </section>
          </>)}
        </div>
      </div>
    </div>
  );
};

export default FootprintModal;
