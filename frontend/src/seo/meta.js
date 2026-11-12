// Everything search engines and social sites are told about each public page.
// Plain JavaScript with no imports from React: the build step (vite-plugins/prerender.js) and the
// running app both use this file, so the text a crawler gets in the first response and the text
// the app shows afterwards always come from the same place.
import { marketingFor } from '../content/courseMarketing.js';

export const SITE_URL = 'https://www.aicoursehubpro.com';
export const SITE_NAME = 'AICourseHubPro';
export const DEFAULT_IMAGE = `${SITE_URL}/social-banner.jpg`;

export const ORGANIZATION = {
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  email: 'info@aicoursehubpro.com',
  telephone: '+1-800-971-8013',
  address: {
    streetAddress: '5080 Spectrum Drive, Suite 575E',
    addressLocality: 'Addison',
    addressRegion: 'TX',
    postalCode: '75001',
    addressCountry: 'US',
  },
  sameAs: [
    'https://x.com/aicoursehubpro',
    'https://www.facebook.com/aicoursehubpro',
    'https://www.instagram.com/aicoursehubpro/',
    'https://in.pinterest.com/aicoursehubpro/',
  ],
};

// ---------------------------------------------------------------------------------------------
// Public pages that should appear in search. `lastmod` is the date the page's CONTENT last
// changed - update it when you change a page's text (it feeds the sitemap).
// Titles: 60 characters or fewer. Descriptions: 155 or fewer. (A test checks both.)
// ---------------------------------------------------------------------------------------------
export const PAGES = {
  '/': {
    title: 'AICourseHubPro | Master AI for Your Career',
    description: 'Prompt-based AI courses for HR, nonprofits, local government, business, education and automation. Pay once, learn at your pace, earn a certificate.',
    lastmod: '2026-11-09', changefreq: 'weekly', priority: '1.0',
  },
  '/courses': {
    title: 'Prompt-Based AI Courses for Work | AICourseHubPro',
    description: 'Browse six self-paced AI courses for HR, nonprofits, local government, business analytics, workflow automation and education. $29 each, lifetime access.',
    lastmod: '2026-11-09', changefreq: 'weekly', priority: '0.9',
  },
  '/pricing': {
    title: 'Pricing: $29 a Course or $159 Bundle | AICourseHubPro',
    description: 'Pay once, no subscription. Each AI course is $29 with lifetime access, or get every course in the Pro Bundle for $159, reduced for courses you already own.',
    lastmod: '2026-11-09', changefreq: 'monthly', priority: '0.8',
  },
  '/blog': {
    title: 'AI at Work Blog: Insights and Career Tips | AICourseHubPro',
    description: 'Practical AI tips, career insights and guides for professionals in HR, business, nonprofits, government and education.',
    lastmod: '2026-11-09', changefreq: 'weekly', priority: '0.7',
  },
  '/contact': {
    title: 'Contact AICourseHubPro | Support and Questions',
    description: 'Questions about a course, your account or a payment? Email info@aicoursehubpro.com or send us a message and we will get back to you.',
    lastmod: '2026-11-09', changefreq: 'yearly', priority: '0.5',
  },
  '/sample-certificate': {
    title: 'Sample Certificate of Completion | AICourseHubPro',
    description: 'See a sample AICourseHubPro certificate of completion, how you earn a real one (pass mark 70%) and how anyone can verify it with its unique ID.',
    lastmod: '2026-11-12', changefreq: 'yearly', priority: '0.6',
  },
  '/privacy': {
    title: 'Privacy Policy | AICourseHubPro',
    description: 'How AICourseHubPro collects, uses and protects your information, including analytics and marketing cookies, and the choices you have.',
    lastmod: '2026-07-22', changefreq: 'yearly', priority: '0.3',
  },
  '/terms': {
    title: 'Terms of Use | AICourseHubPro',
    description: 'The terms that apply when you use AICourseHubPro, buy a course or earn a certificate of completion.',
    lastmod: '2026-07-22', changefreq: 'yearly', priority: '0.3',
  },
  '/refund-policy': {
    title: 'Refund Policy | AICourseHubPro',
    description: 'Our refund policy: course sales are final except for technical or billing errors such as a duplicate charge.',
    lastmod: '2026-07-22', changefreq: 'yearly', priority: '0.3',
  },
};

// Pages that must stay out of search (sign-in, sign-up, payment and similar).
export const NOINDEX_PAGES = {
  '/login': 'Sign In | AICourseHubPro',
  '/signup': 'Create Account | AICourseHubPro',
  '/register': 'Create Account | AICourseHubPro',
  '/forgot-password': 'Forgot Password | AICourseHubPro',
  '/reset-password': 'Reset Password | AICourseHubPro',
  '/payment-success': 'Payment Successful | AICourseHubPro',
};

// Short, plain titles for the course pages (<= 44 characters; " | AICourseHubPro" is added).
export const COURSE_SEO_TITLES = {
  'ai-for-nonprofits': 'AI for Nonprofits Course: Grants and Donors',
  'ai-for-local-government': 'AI Course for Local Government Staff',
  'ai-for-hr': 'AI for HR Course: Hiring to Onboarding',
  'ai-for-business-analytics': 'AI for Business Analytics: Reports Course',
  'ai-for-workflow-automation': 'AI for Workflow Automation Course',
  'ai-for-education': 'AI for Education and Learning Course',
};
export const COURSE_PAGES_LASTMOD = '2026-11-09';

// ---------------------------------------------------------------------------------------------
export const clip = (text, max) => {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const head = t.slice(0, max);
  const stop = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '));
  if (stop >= 60) return head.slice(0, stop + 1);
  return head.slice(0, head.lastIndexOf(' ', max - 1)).replace(/[,;:\s]+$/, '') + '…';
};

export const courseUrl = (course) => `/courses/${course.slug || course.id}`;

export const generalFaq = (price) => [
  { q: 'Is this a subscription?', a: `No. You pay $${price} once and keep access to the course for life.` },
  { q: 'Do I need an account before I buy?', a: 'No. Enter your email at checkout and we create your account for you. If you already have an account, log in first and the course is added to it.' },
  { q: 'How do I get the certificate?', a: 'Pass the final assessment with a score of at least 70%. Your certificate carries a unique ID that anyone can check on our verification page. It is a certificate of completion for this course.' },
  { q: 'Can I get a refund?', a: 'All sales are final, except for technical or billing errors such as being charged twice for the same course. The full wording is in our Refund Policy.' },
  { q: 'Can I buy all the courses together?', a: 'Yes. The Pro Bundle ($159) gives you every course, and its price goes down by $29 for each course you already own.' },
];

// This course's own questions first, then the general ones. Used by the page AND the FAQ markup.
export const courseFaq = (course) => {
  const mk = marketingFor(course.slug);
  return [...((mk && mk.faq) || []).filter((f) => f && f.q && f.a), ...generalFaq(course.price)];
};

// ---------------------------------------------------------------------------------------------
// Structured data (JSON-LD)
const CTX = 'https://schema.org';
export const organizationLd = () => ({
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: ORGANIZATION.name,
  url: ORGANIZATION.url,
  logo: ORGANIZATION.logo,
  email: ORGANIZATION.email,
  telephone: ORGANIZATION.telephone,
  address: { '@type': 'PostalAddress', ...ORGANIZATION.address },
  sameAs: ORGANIZATION.sameAs,
});
export const breadcrumbLd = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: SITE_URL + it.path })),
});
export const faqLd = (faq) => ({
  '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});
export const courseLd = (course) => ({
  '@type': 'Course',
  name: course.title,
  description: String(course.description || '').replace(/\s+/g, ' ').trim(),
  url: SITE_URL + courseUrl(course),
  inLanguage: 'en',
  provider: { '@type': 'Organization', name: SITE_NAME, sameAs: SITE_URL },
  offers: [{
    '@type': 'Offer',
    category: 'Paid',
    price: String(course.price),
    priceCurrency: 'USD',
    availability: `${CTX}/InStock`,
    url: SITE_URL + courseUrl(course),
  }],
  hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online' },
});
const graph = (nodes) => ({ '@context': CTX, '@graph': nodes });

// ---------------------------------------------------------------------------------------------
// One description of a page's head: { title, description, path, noindex, image, jsonLd }
export const metaForStaticPath = (rawPath) => {
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;
  if (PAGES[path]) {
    const p = PAGES[path];
    const crumbs = path === '/' ? [] : [{ name: 'Home', path: '/' }, { name: p.title.split(' | ')[0], path }];
    const nodes = [organizationLd()];
    if (crumbs.length) nodes.push(breadcrumbLd(crumbs));
    return { title: p.title, description: p.description, path, noindex: false, image: DEFAULT_IMAGE, jsonLd: graph(nodes) };
  }
  if (NOINDEX_PAGES[path]) {
    return { title: NOINDEX_PAGES[path], description: null, path: null, noindex: true, image: null, jsonLd: null };
  }
  return null;
};

export const metaForCourse = (course) => {
  const slug = course.slug || String(course.id);
  const short = COURSE_SEO_TITLES[slug] || clip(course.title, 44);
  const path = courseUrl(course);
  return {
    title: `${short} | ${SITE_NAME}`,
    description: clip(course.description, 155),
    path,
    noindex: false,
    image: DEFAULT_IMAGE,
    jsonLd: graph([
      organizationLd(),
      courseLd(course),
      faqLd(courseFaq(course)),
      breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Courses', path: '/courses' }, { name: course.title, path }]),
    ]),
  };
};

// The head tags for one page, as plain descriptions. Used to write HTML at build time and to
// update the live page when someone navigates inside the app.
export const buildHead = (meta) => {
  const tags = [];
  const add = (key, tag, sel, attrs, text) => tags.push({ key, tag, sel, attrs, text });
  if (meta.description) {
    add('description', 'meta', 'meta[name="description"]', { name: 'description', content: meta.description });
    add('title-meta', 'meta', 'meta[name="title"]', { name: 'title', content: meta.title });
  }
  add('robots', 'meta', 'meta[name="robots"]', { name: 'robots', content: meta.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large' });
  if (meta.path && !meta.noindex) {
    const url = SITE_URL + (meta.path === '/' ? '/' : meta.path);
    add('canonical', 'link', 'link[rel="canonical"]', { rel: 'canonical', href: url });
    add('og-url', 'meta', 'meta[property="og:url"]', { property: 'og:url', content: url });
  }
  if (!meta.noindex && meta.description) {
    add('og-type', 'meta', 'meta[property="og:type"]', { property: 'og:type', content: meta.ogType || 'website' });
    add('og-site', 'meta', 'meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    add('og-title', 'meta', 'meta[property="og:title"]', { property: 'og:title', content: meta.title });
    add('og-desc', 'meta', 'meta[property="og:description"]', { property: 'og:description', content: meta.description });
    if (meta.image) add('og-image', 'meta', 'meta[property="og:image"]', { property: 'og:image', content: meta.image });
    add('tw-card', 'meta', 'meta[property="twitter:card"],meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    add('tw-title', 'meta', 'meta[property="twitter:title"],meta[name="twitter:title"]', { name: 'twitter:title', content: meta.title });
    add('tw-desc', 'meta', 'meta[property="twitter:description"],meta[name="twitter:description"]', { name: 'twitter:description', content: meta.description });
    if (meta.image) add('tw-image', 'meta', 'meta[property="twitter:image"],meta[name="twitter:image"]', { name: 'twitter:image', content: meta.image });
  }
  if (meta.jsonLd) add('jsonld', 'script', 'script[type="application/ld+json"]', { type: 'application/ld+json' }, JSON.stringify(meta.jsonLd));
  return tags;
};
