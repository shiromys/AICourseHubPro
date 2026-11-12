// Free sample lessons: the fixed list of course addresses, the rules a sample must meet before it
// goes live, and helpers. No React, so the build step and the site share it.
// The lesson text itself lives in content/sampleContent.js (written by the content coworker).
import { SAMPLE_CONTENT } from './sampleContent.js';

export const SAMPLE_COURSES = [
  'ai-for-nonprofits',
  'ai-for-local-government',
  'ai-for-hr',
  'ai-for-business-analytics',
  'ai-for-workflow-automation',
  'ai-for-education',
];

const str = (v, min = 1, max = 100000) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

// What is still missing or wrong in a sample's text. Empty list = complete.
export const sampleProblems = (c) => {
  const x = c || {};
  const p = [];
  if (!str(x.title, 10, 100)) p.push('title (10-100 characters)');
  if (!Number.isInteger(x.minutes) || x.minutes < 3 || x.minutes > 60) p.push('minutes (a whole number, 3-60)');
  if (!str(x.intro, 40, 400)) p.push('intro (1-2 sentences, 40-400 characters)');
  const s = Array.isArray(x.sections) ? x.sections : [];
  const goodSection = (z) => z && str(z.heading, 3, 120) && Array.isArray(z.body) && z.body.length >= 1 && z.body.every((t) => str(t, 20))
    && (z.bullets === undefined || (Array.isArray(z.bullets) && z.bullets.every((t) => str(t))));
  if (s.length < 2 || s.length > 8 || !s.every(goodSection)) p.push('sections (2 to 8; each with heading, body = list of paragraphs of at least 20 characters, optional bullets)');
  const t = x.tryIt || {};
  if (!str(t.instruction, 20)) p.push('tryIt.instruction');
  if (!str(t.prompt, 60)) p.push('tryIt.prompt (the real prompt to copy, at least 60 characters)');
  if (x.check !== undefined) {
    const ok = Array.isArray(x.check) && x.check.length >= 1 && x.check.length <= 4 && x.check.every((q) =>
      q && str(q.q, 8) && Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 5 && q.options.every((o) => str(o))
      && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length && str(q.why, 10));
    if (!ok) p.push('check (optional; 1-4 questions, each with q, options (2-5), answer = position starting at 0, why)');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(x.lastUpdated || '')) || isNaN(new Date(x.lastUpdated))) p.push('lastUpdated (YYYY-MM-DD)');
  return p;
};

export const sampleContentFor = (slug) => (SAMPLE_COURSES.includes(slug) && SAMPLE_CONTENT[slug]) || null;
export const sampleFor = (slug) => {
  const c = sampleContentFor(slug);
  return c && sampleProblems(c).length === 0 ? { slug, content: c } : null;
};
export const publishedSamples = () => SAMPLE_COURSES.map(sampleFor).filter(Boolean);
export const sampleUrl = (slug) => `/courses/${slug}/sample`;
export const SAMPLE_CERTIFICATE_URL = '/sample-certificate';

export const samplesReport = (today = new Date()) => {
  const incomplete = []; const stale = [];
  for (const slug of SAMPLE_COURSES) {
    const c = SAMPLE_CONTENT[slug]; if (!c) continue;
    const probs = sampleProblems(c);
    if (probs.length) incomplete.push({ slug, missing: probs });
    else if ((today - new Date(c.lastUpdated)) / 86400000 > 183) stale.push(slug);
  }
  return { incomplete, stale };
};
