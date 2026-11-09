// Blog helpers shared by the build step, the text copies for search engines and the live page.
// No React and no browser-only code in here.
import { BLOG_ARTICLES, BLOG_CATEGORIES, articleIsoDate } from '../content/blogPosts.js';
import { SITE_URL, SITE_NAME, DEFAULT_IMAGE, clip, organizationLd, breadcrumbLd } from './meta.js';

export const blogPath = (slug) => `/blog/${slug}`;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// "2026-05-07..." -> "May 7, 2026" (the calendar date as written, no time-zone shifting)
export const dateLabel = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${MONTH_NAMES[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}` : '';
};

// ---- which course a post should point to ---------------------------------------------------
export const COURSE_LABELS = {
  'ai-for-hr': 'AI for HR',
  'ai-for-nonprofits': 'AI for Nonprofits',
  'ai-for-local-government': 'AI for Local Government',
  'ai-for-business-analytics': 'AI for Business Analytics',
  'ai-for-workflow-automation': 'AI for Workflow Automation',
  'ai-for-education': 'AI for Education',
};
// First match wins, so the most specific topics come first.
const TOPIC_RULES = [
  ['ai-for-nonprofits', /non-?profit|fundrais|donor|grant/],
  ['ai-for-local-government', /government|public[- ]service|citizen|municipal|policy/],
  ['ai-for-education', /educat|student|teacher|classroom|learning[- ]design|personalized[- ]learning|l-?d professionals/],
  ['ai-for-business-analytics', /analytic|business[- ]data|reporting|business guide|data/],
  ['ai-for-workflow-automation', /workflow|automat|prompt[- ]system|prompting/],
  ['ai-for-hr', /\bhr\b|recruit|hiring|employee|employer|talent|lifecycle/],
];
export const relatedCourseSlug = (entry) => {
  const text = `${entry.title || ''} ${entry.slug || ''} ${(entry.tags || []).join(' ')}`.toLowerCase();
  for (const [slug, re] of TOPIC_RULES) if (re.test(text)) return slug;
  return null; // no clear match: the page links to the whole catalog instead
};

// ---- clean the article HTML coming from Hashnode ---------------------------------------------
const SAFE_IFRAME = /^https:\/\/(www\.youtube(-nocookie)?\.com|player\.vimeo\.com)\//i;
export const cleanPostHtml = (html) => {
  let h = String(html || '');
  h = h.replace(/<!--[\s\S]*?-->/g, '');
  h = h.replace(/<(script|style|object|embed|form|noscript|template)\b[\s\S]*?<\/\1\s*>/gi, '');
  h = h.replace(/<(script|style|object|embed|form|input|button|link|meta|base)\b[^>]*>/gi, '');
  // iframes: keep only YouTube / Vimeo players
  h = h.replace(/<iframe\b([^>]*)>\s*<\/iframe>|<iframe\b([^>]*)\/?>/gi, (m, a1, a2) => {
    const attrs = a1 || a2 || '';
    const src = /\bsrc\s*=\s*"([^"]*)"/i.exec(attrs);
    return src && SAFE_IFRAME.test(src[1]) ? `<iframe src="${src[1]}" loading="lazy" allowfullscreen title="Video"></iframe>` : '';
  });
  h = h.replace(/\s(on[a-z]+|style|srcdoc|formaction)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  h = h.replace(/\s(href|src)\s*=\s*("|')\s*(javascript|vbscript|data:text)[^"']*\2/gi, ' $1="#"');
  // old blog / www addresses become site-relative links
  h = h.replace(/https?:\/\/blog\.aicoursehubpro\.com\/?(?=["'#?])/gi, '/blog');
  h = h.replace(/https?:\/\/blog\.aicoursehubpro\.com\/([a-z0-9][a-z0-9-]*)(\/?)(?=["'#?])/gi, (m, slug) => `/blog/${slug}`);
  h = h.replace(/(href|src)="https?:\/\/(?:www\.)?aicoursehubpro\.com(\/[^"]*)?"/gi, (m, attr, rest) => `${attr}="${rest || '/'}"`);
  // other sites: open safely; images load lazily
  h = h.replace(/<a\b([^>]*?)href="(https?:\/\/[^"]+)"([^>]*)>/gi, (m, pre, href, post) => `<a${pre}href="${href}"${post.replace(/\s(rel|target)\s*=\s*"[^"]*"/gi, '')} rel="noopener noreferrer" target="_blank">`);
  h = h.replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy" decoding="async" ');
  // the page already has the article title as its heading
  h = h.replace(/^\s*<h1\b[\s\S]*?<\/h1>\s*/i, '');
  return h.trim();
};

// ---- the list of posts shown on /blog ----------------------------------------------------------
// Hand-written entries (category, summary, featured) are kept; posts that exist only on Hashnode are added.
export const mergeBlogIndex = (posts) => {
  const bySlug = new Map((posts || []).map((p) => [p.slug, p]));
  const entries = [];
  for (const a of BLOG_ARTICLES) {
    const p = bySlug.get(a.slug);
    if (posts && posts.length && !p) continue; // listed here but not on Hashnode: nothing to open, so do not list it
    entries.push({
      slug: a.slug, title: a.title, excerpt: a.excerpt, category: a.category, featured: !!a.featured,
      readTime: (p && p.readTime) || a.readTime,
      iso: (p && p.publishedAt) || articleIsoDate(a),
      date: p && p.publishedAt ? dateLabel(p.publishedAt) : a.date,
    });
    bySlug.delete(a.slug);
  }
  for (const p of bySlug.values()) {
    const cat = (p.tags || []).find((t) => BLOG_CATEGORIES.includes(t));
    entries.push({
      slug: p.slug, title: p.title, excerpt: clip(p.brief || p.description, 180), category: cat || 'Industry News', featured: false,
      readTime: p.readTime || '', iso: p.publishedAt, date: dateLabel(p.publishedAt),
    });
  }
  entries.sort((x, y) => String(y.iso || '').localeCompare(String(x.iso || '')));
  return entries;
};

// ---- head details for one post -------------------------------------------------------------------
const postTitle = (title, seoTitle) => {
  const t = String(seoTitle || title || '').replace(/\s+/g, ' ').trim();
  const full = `${t} | ${SITE_NAME}`;
  if (full.length <= 60) return full;
  if (t.length <= 70) return t; // "about 60": a slightly long headline is kept whole rather than cut mid-thought
  return t.slice(0, t.lastIndexOf(' ', 70)).replace(/[,;:\s(]+$/, '');
};

export const articleLd = (entry, post) => {
  const url = SITE_URL + blogPath(entry.slug);
  const published = (post && post.publishedAt) || entry.iso || undefined;
  const modified = (post && post.updatedAt) || published;
  const image = (post && post.image) || DEFAULT_IMAGE;
  const author = post && post.author ? { '@type': 'Person', name: post.author } : { '@type': 'Organization', name: SITE_NAME, url: SITE_URL };
  return {
    '@type': 'Article',
    headline: clip(entry.title, 110),
    description: clip((post && (post.description || post.brief)) || entry.excerpt, 155),
    image: [image],
    datePublished: published,
    dateModified: modified,
    author,
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    inLanguage: 'en',
    ...(post && post.tags && post.tags.length ? { keywords: post.tags.join(', ') } : {}),
  };
};

export const metaForPost = (entry, post) => {
  const path = blogPath(entry.slug);
  return {
    title: postTitle(entry.title, post && post.seoTitle),
    description: clip((post && (post.description || post.brief)) || entry.excerpt, 155),
    path,
    noindex: false,
    ogType: 'article',
    image: (post && post.image) || DEFAULT_IMAGE,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        organizationLd(),
        articleLd(entry, post),
        breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: entry.title, path }]),
      ],
    },
  };
};

// What the old addresses on blog.aicoursehubpro.com turn into: /<slug> -> /blog/<slug>, anything else -> /blog
export const newAddressForOldBlogPath = (rawPath) => {
  const p = String(rawPath || '/').split('?')[0].split('#')[0];
  const m = /^\/([a-z0-9][a-z0-9-]*)\/?$/i.exec(p);
  if (!m || ['rss.xml', 'sitemap.xml', 'series', 'badge', 'archive', 'newsletter', 'search'].includes(m[1].toLowerCase())) return '/blog';
  return `/blog/${m[1]}`;
};
