import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { Search, Loader2, Eye, Download, X, ExternalLink, Award } from 'lucide-react';
import CertificateCanvas, { downloadCertificatePdf } from '../CertificateCanvas';

const PER_PAGE = 25;

// Admin registry of every certificate issued: search, view an exact copy, download PDF.
const CertificatesPanel = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);       // certificate being viewed
  const [autoDownload, setAutoDownload] = useState(false);
  const [scale, setScale] = useState(0.7);
  const [downloading, setDownloading] = useState(false);
  const hiddenRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => { setDebounced(query.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [query]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await axios.get(`${API_BASE_URL}/api/admin/certificates`, {
        params: { q: debounced, page, per_page: PER_PAGE },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setItems(r.data.items); setTotal(r.data.total);
    } catch { setError('Could not load certificates.'); }
    finally { setLoading(false); }
  }, [debounced, page]);
  useEffect(() => { load(); }, [load]);

  // Fit the 1123px-wide certificate into the viewer.
  useEffect(() => {
    if (!active) return;
    const fit = () => setScale(Math.min(1, (Math.min(window.innerWidth, 1200) - 64) / 1123));
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [active]);

  const doDownload = useCallback(async (cert) => {
    if (!hiddenRef.current) return;
    setDownloading(true);
    try { await downloadCertificatePdf(hiddenRef.current, `${cert.name}_${cert.certificate_id}`); }
    finally { setDownloading(false); }
  }, []);

  // Row "Download" opens the hidden full-size render, then saves as soon as it exists.
  useEffect(() => {
    if (active && autoDownload && hiddenRef.current) { setAutoDownload(false); doDownload(active); }
  }, [active, autoDownload, doDownload]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><Award size={18} className="text-red-600" /> Certificates</h3>
          <p className="text-xs text-gray-500">{total} issued · exact copies of what learners received</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, email, course or ID"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-red-500 outline-none" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs"><tr>
            <th className="px-6 py-4">Certificate ID</th><th className="px-6 py-4">Holder</th><th className="px-6 py-4">Course</th>
            <th className="px-6 py-4">Issued</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan="5" className="px-6 py-12 text-center"><Loader2 className="animate-spin inline text-red-600" /></td></tr>}
            {!loading && error && <tr><td colSpan="5" className="px-6 py-10 text-center text-red-600">{error}</td></tr>}
            {!loading && !error && items.length === 0 && <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">{debounced ? 'No certificates match your search.' : 'No certificates have been issued yet.'}</td></tr>}
            {!loading && items.map(c => (
              <tr key={c.certificate_id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-mono text-xs text-gray-700">{c.certificate_id}</td>
                <td className="px-6 py-4"><div className="font-bold text-gray-900">{c.name}</div><div className="text-xs text-gray-500">{c.user_email}</div>
                  {c.name !== c.user_name_now && <div className="text-xs text-gray-400">Account name now: {c.user_name_now}</div>}</td>
                <td className="px-6 py-4 text-gray-700">{c.course_title}</td>
                <td className="px-6 py-4 text-gray-500">{c.completion_date || '—'}</td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <button onClick={() => setActive(c)} title="View certificate" className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 mr-2"><Eye size={18} /></button>
                  <button onClick={() => { setAutoDownload(true); setActive(c); }} title="Download PDF" className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100"><Download size={18} /></button>
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 text-sm text-gray-600">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded disabled:opacity-40">Previous</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded disabled:opacity-40">Next</button>
        </div>)}

      {active && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex flex-col items-center p-4 overflow-auto" role="dialog" aria-modal="true">
          <div className="w-full max-w-[1200px] flex items-center justify-between py-3 text-white">
            <div className="min-w-0"><p className="font-bold truncate">{active.name} — {active.course_title}</p><p className="text-xs text-gray-300 font-mono">{active.certificate_id} · {active.user_email}</p></div>
            <div className="flex items-center gap-2 shrink-0">
              <a href={`/verify/${active.certificate_id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20"><ExternalLink size={14} /> Public page</a>
              <button onClick={() => doDownload(active)} disabled={downloading} className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60">
                {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} Download PDF</button>
              <button onClick={() => { setActive(null); setAutoDownload(false); }} aria-label="Close" className="p-2 rounded-lg bg-white/10 hover:bg-white/20"><X size={18} /></button>
            </div>
          </div>
          {/* Visible, scaled-to-fit copy */}
          <div style={{ width: 1123 * scale, height: 794 * scale }} className="shadow-2xl shadow-black shrink-0 overflow-hidden">
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1123, height: 794 }}>
              <CertificateCanvas name={active.name} courseTitle={active.course_title} completionDate={active.completion_date} score={active.score} certId={active.certificate_id} />
            </div>
          </div>
          {/* Off-screen, un-scaled copy used for PDF capture */}
          <div style={{ position: 'fixed', left: -20000, top: 0 }} aria-hidden="true">
            <CertificateCanvas ref={hiddenRef} name={active.name} courseTitle={active.course_title} completionDate={active.completion_date} score={active.score} certId={active.certificate_id} />
          </div>
        </div>)}
    </div>
  );
};

export default CertificatesPanel;
