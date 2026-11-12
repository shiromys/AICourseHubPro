// The free resource library: the fixed list of pages, the rules a page must meet before it goes live,
// and helpers. No React, so the build step and the site share it.
//
// THE TEXT OF EACH PAGE lives in content/resourceContent.js (written by the content coworker).
// A page is published only when its text is COMPLETE; until then it does not exist on the site:
// no address, not on the hub, not in the sitemap, no links to it.
import { RESOURCE_CONTENT } from './resourceContent.js';

export const AUDIENCES = [
  { id: 'nonprofit', label: 'Nonprofits', course: 'ai-for-nonprofits' },
  { id: 'government', label: 'Local government', course: 'ai-for-local-government' },
  { id: 'hr', label: 'HR', course: 'ai-for-hr' },
  { id: 'business', label: 'Business', course: 'ai-for-business-analytics' },
  { id: 'education', label: 'Education', course: 'ai-for-education' },
  { id: 'workflow', label: 'Workflow', course: 'ai-for-workflow-automation' },
];

// The first twelve pages, in the order the plan lists them. "topic" is only a working label for the editor.
export const RESOURCE_PAGES = [
  { slug: 'grant-proposal-first-draft', audience: 'nonprofit', topic: 'First draft of a grant proposal' },
  { slug: 'donor-thank-you-and-outreach-messages', audience: 'nonprofit', topic: 'Donor thank-you and outreach messages' },
  { slug: 'impact-report-summary-for-board', audience: 'nonprofit', topic: 'Impact report summary for the board' },
  { slug: 'replies-to-resident-enquiries', audience: 'government', topic: 'Replies to resident enquiries' },
  { slug: 'policy-brief-from-research-notes', audience: 'government', topic: 'Policy brief from research notes' },
  { slug: 'public-meeting-summary', audience: 'government', topic: 'Public meeting summary' },
  { slug: 'job-description', audience: 'hr', topic: 'Job description' },
  { slug: 'performance-review', audience: 'hr', topic: 'Performance review' },
  { slug: 'onboarding-plan', audience: 'hr', topic: 'Onboarding plan' },
  { slug: 'spreadsheet-to-executive-report', audience: 'business', topic: 'Turn a spreadsheet into an executive report' },
  { slug: 'lesson-plan', audience: 'education', topic: 'Lesson plan' },
  { slug: 'automate-weekly-report', audience: 'workflow', topic: 'Automate a recurring weekly report' },
].map((p) => ({ ...p, course: AUDIENCES.find((a) => a.id === p.audience).course }));

export const TEMPLATE_FILE_RE = /^[a-z0-9][a-z0-9._-]{0,90}\.(docx|xlsx|pptx|pdf|csv|md|txt)$/;
const str = (v, min = 1, max = 100000) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
const list = (v, min = 1) => Array.isArray(v) && v.length >= min && v.every((x) => str(x));

// What is still missing or wrong on a page's text. Empty list = complete.
export const problemsFor = (content) => {
  const c = content || {};
  const p = [];
  if (!str(c.title, 15, 120)) p.push('title (the H1, 15-120 characters, written the way a person would search for the task)');
  if (!str(c.shortAnswer, 60, 450)) p.push('shortAnswer (2-3 sentences, 60-450 characters)');
  if (!list(c.whoFor)) p.push('whoFor (list)');
  if (!list(c.beforeYouStart)) p.push('beforeYouStart (list of inputs, data, tools)');
  const e = c.example || {};
  if (!str(e.task, 10)) p.push('example.task');
  if (!str(e.input, 40)) p.push('example.input (the real input)');
  if (!str(e.output, 80)) p.push('example.output (the real output)');
  if (!list(e.check)) p.push('example.check (what to check or change by hand)');
  const t = c.template || {};
  if (!TEMPLATE_FILE_RE.test(String(t.file || ''))) p.push('template.file (lower-case file name ending .docx .xlsx .pptx .pdf .csv .md or .txt)');
  if (!str(t.label, 5)) p.push('template.label');
  if (!str(t.format, 2, 12)) p.push('template.format (for example DOCX)');
  if (!list(c.cautions)) p.push('cautions (list: privacy, accuracy checks, where a human must review)');
  const faq = Array.isArray(c.faq) ? c.faq : [];
  if (faq.length < 3 || faq.length > 5 || !faq.every((f) => f && str(f.q, 8) && str(f.a, 20))) p.push('faq (3 to 5 items, each with q and a)');
  const r = c.reviewer || {};
  if (!str(r.name, 3)) p.push('reviewer (name)');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(c.lastUpdated || '')) || isNaN(new Date(c.lastUpdated))) p.push('lastUpdated (YYYY-MM-DD)');
  if (c.metaDescription !== undefined && !str(c.metaDescription, 40, 155)) p.push('metaDescription (optional; 40-155 characters)');
  return p;
};

export const contentFor = (slug) => RESOURCE_CONTENT[slug] || null;
// Pages that are complete, with their text: [{ slug, audience, topic, course, content }]
export const publishedResources = () =>
  RESOURCE_PAGES.filter((p) => contentFor(p.slug) && problemsFor(contentFor(p.slug)).length === 0).map((p) => ({ ...p, content: contentFor(p.slug) }));
export const hasPublishedResources = () => publishedResources().length > 0;
export const resourceBySlug = (slug) => publishedResources().find((p) => p.slug === slug) || null;
export const resourcesForCourse = (courseSlug) => publishedResources().filter((p) => p.course === courseSlug);
export const resourceUrl = (slug) => `/resources/${slug}`;

// The pages shown at the foot of a page: the ones the editor named, else others for the same audience.
export const relatedResources = (page, max = 3) => {
  const pub = publishedResources().filter((p) => p.slug !== page.slug);
  const named = (page.content.related || []).map((s) => pub.find((p) => p.slug === s)).filter(Boolean);
  const same = pub.filter((p) => p.audience === page.audience && !named.includes(p));
  const rest = pub.filter((p) => !named.includes(p) && !same.includes(p));
  return [...named, ...same, ...rest].slice(0, max);
};

// Build-time report: incomplete pages that have some text, and published pages not reviewed for 6 months.
export const libraryReport = (today = new Date()) => {
  const incomplete = []; const stale = [];
  for (const p of RESOURCE_PAGES) {
    const c = contentFor(p.slug); if (!c) continue;
    const probs = problemsFor(c);
    if (probs.length) incomplete.push({ slug: p.slug, missing: probs });
    else if ((today - new Date(c.lastUpdated)) / 86400000 > 183) stale.push(p.slug);
  }
  return { incomplete, stale };
};
