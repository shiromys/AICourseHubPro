import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { CheckCircle, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { RESOURCE_PAGES, contentFor, problemsFor } from '../../content/resources';
import { SAMPLE_COURSES, sampleContentFor, sampleProblems, sampleUrl, SAMPLE_CERTIFICATE_URL } from '../../content/samples';
import { COURSE_MARKETING } from '../../content/courseMarketing';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const STALE_DAYS = 183;
const ageDays = (d) => d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null;
const longDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

const Badge = ({ kind, children }) => {
  const cls = { ok: 'bg-green-50 text-green-700 border-green-200', warn: 'bg-yellow-50 text-yellow-700 border-yellow-200', bad: 'bg-red-50 text-red-700 border-red-200', none: 'bg-gray-100 text-gray-500 border-gray-200' }[kind];
  const Icon = kind === 'ok' ? CheckCircle : kind === 'warn' ? AlertTriangle : XCircle;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${cls}`}><Icon size={12} />{children}</span>;
};

const Section = ({ title, note, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
    <div className="p-4 pb-2"><h3 className="font-bold text-gray-900">{title}</h3>{note && <p className="text-xs text-gray-500 mt-1">{note}</p>}</div>
    {children}
  </div>
);

const ContentPanel = ({ courses = [] }) => {
  const [files, setFiles] = useState(null);
  const [filesError, setFilesError] = useState(false);
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/admin/resources/files`, { headers: authHeaders() })
      .then((r) => setFiles(new Set((r.data.files || []).map((f) => f.name)))).catch(() => setFilesError(true));
  }, []);

  const guides = RESOURCE_PAGES.map((p) => {
    const c = contentFor(p.slug); const probs = c ? problemsFor(c) : ['no text yet'];
    return { p, c, probs, age: c ? ageDays(c.lastUpdated) : null };
  });
  const guidesLive = guides.filter((g) => g.c && g.probs.length === 0).length;
  const missingFiles = guides.filter((g) => g.c && g.c.template && files && !files.has(g.c.template.file));

  const samples = SAMPLE_COURSES.map((slug) => {
    const c = sampleContentFor(slug); const probs = c ? sampleProblems(c) : ['no text yet'];
    return { slug, c, probs, age: c ? ageDays(c.lastUpdated) : null };
  });
  const samplesLive = samples.filter((s) => s.c && s.probs.length === 0).length;

  const coursePages = Object.keys(COURSE_MARKETING).map((slug) => {
    const m = COURSE_MARKETING[slug] || {};
    const have = {
      'outcome line': !!m.outcome, 'who it is for': (m.whoFor || []).length > 0, 'what you produce': (m.produces || []).length > 0,
      'worked example': !!(m.workedExample && (m.workedExample.task || m.workedExample.result)),
      'module summaries': (m.modules || []).some((x) => x && x.summary), 'course questions': (m.faq || []).length >= 4,
    };
    const course = courses.find((c) => c.slug === slug);
    return { slug, have, missing: Object.entries(have).filter(([, v]) => !v).map(([k]) => k), title: course && course.title };
  });

  return (
    <div className="space-y-6" data-testid="content-panel">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[[`${guidesLive} of ${RESOURCE_PAGES.length}`, 'Guides live'], [`${samplesLive} of ${SAMPLE_COURSES.length}`, 'Sample lessons live'],
          [`${coursePages.filter((c) => c.missing.length === 0).length} of ${coursePages.length}`, 'Course pages complete'],
          [filesError ? '?' : files ? missingFiles.length : '…', 'Template files missing']].map(([v, l]) => (
          <div key={l} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"><p className="text-2xl font-black text-gray-900">{v}</p><p className="text-xs text-gray-500">{l}</p></div>
        ))}
      </div>
      <p className="text-xs text-gray-500">This is what the website was built with. The text lives in the code, so a change here needs a new release before it shows on the site. A guide, sample or course section that is incomplete is simply left off the site.</p>

      <Section title="Resource guides" note="A guide appears on the site only when all of its text is complete and its Word template exists on the server.">
        <table className="w-full text-sm" data-testid="content-guides">
          <thead className="text-left text-xs text-gray-500 uppercase"><tr><th className="px-4 py-2">Guide</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Template file</th><th className="px-4 py-2">Last updated</th><th className="px-4 py-2"></th></tr></thead>
          <tbody>
            {guides.map(({ p, c, probs, age }) => {
              const live = c && probs.length === 0;
              const fileOk = !c || !c.template ? null : files ? files.has(c.template.file) : null;
              return (
                <tr key={p.slug} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-2 text-gray-900">{(c && c.title) || p.topic}{!live && <p className="text-xs text-red-600 mt-1">Missing: {probs.join('; ')}</p>}</td>
                  <td className="px-4 py-2">{live ? <Badge kind="ok">Live</Badge> : <Badge kind="bad">Not live</Badge>}</td>
                  <td className="px-4 py-2">{fileOk === null ? <Badge kind="none">{filesError ? 'Unknown' : 'Checking'}</Badge> : fileOk ? <Badge kind="ok">On server</Badge> : <Badge kind="bad">Missing</Badge>}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{c ? longDate(c.lastUpdated) : '—'} {age !== null && age > STALE_DAYS && <Badge kind="warn">Review due</Badge>}</td>
                  <td className="px-4 py-2">{live && <a href={`/resources/${p.slug}`} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-red-600"><ExternalLink size={14} /></a>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      <Section title="Free sample lessons" note="Each course shows a 'Try a free lesson' link only when its sample is complete.">
        <table className="w-full text-sm" data-testid="content-samples">
          <thead className="text-left text-xs text-gray-500 uppercase"><tr><th className="px-4 py-2">Course</th><th className="px-4 py-2">Sample lesson</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Last updated</th><th className="px-4 py-2"></th></tr></thead>
          <tbody>
            {samples.map(({ slug, c, probs, age }) => {
              const live = c && probs.length === 0;
              return (
                <tr key={slug} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-2 text-gray-900">{slug}</td>
                  <td className="px-4 py-2">{c ? c.title : '—'}{c && !live && <p className="text-xs text-red-600 mt-1">Missing: {probs.join('; ')}</p>}</td>
                  <td className="px-4 py-2">{live ? <Badge kind="ok">Live</Badge> : <Badge kind="bad">Not live</Badge>}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{c ? longDate(c.lastUpdated) : '—'} {age !== null && age > STALE_DAYS && <Badge kind="warn">Review due</Badge>}</td>
                  <td className="px-4 py-2">{live && <a href={sampleUrl(slug)} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-red-600"><ExternalLink size={14} /></a>}</td>
                </tr>
              );
            })}
            <tr className="border-t border-gray-100"><td className="px-4 py-2 text-gray-900" colSpan={2}>Sample certificate page</td><td className="px-4 py-2"><Badge kind="ok">Live</Badge></td><td className="px-4 py-2">—</td><td className="px-4 py-2"><a href={SAMPLE_CERTIFICATE_URL} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-red-600"><ExternalLink size={14} /></a></td></tr>
          </tbody>
        </table>
      </Section>

      <Section title="Course page text" note="Each part shows only when it has content. All six parts are expected for every course.">
        <table className="w-full text-sm" data-testid="content-courses">
          <thead className="text-left text-xs text-gray-500 uppercase"><tr><th className="px-4 py-2">Course</th><th className="px-4 py-2">Status</th><th className="px-4 py-2"></th></tr></thead>
          <tbody>
            {coursePages.map((c) => (
              <tr key={c.slug} className="border-t border-gray-100 align-top">
                <td className="px-4 py-2 text-gray-900">{c.title || c.slug}<p className="text-xs text-gray-400">{c.slug}</p></td>
                <td className="px-4 py-2">{c.missing.length === 0 ? <Badge kind="ok">Complete</Badge> : <><Badge kind="warn">Incomplete</Badge><p className="text-xs text-red-600 mt-1">Missing: {c.missing.join(', ')}</p></>}</td>
                <td className="px-4 py-2"><a href={`/courses/${c.slug}`} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-red-600"><ExternalLink size={14} /></a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
};

export default ContentPanel;
