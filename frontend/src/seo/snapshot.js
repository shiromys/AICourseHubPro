// The plain-HTML text version of each public page that is saved into the site at build time, so
// that anything that does not run JavaScript (many AI crawlers, link previews, search engines'
// first pass) still gets the page's real words and links. The running app replaces it as soon as
// it starts. Course text comes from the live course list; wording shared with the page comes from
// meta.js / courseMarketing.js.
import { marketingFor } from '../content/courseMarketing.js';
import { ORGANIZATION, SITE_URL, courseFaq, courseUrl, PAGES } from './meta.js';
import { blogPath, relatedCourseSlug, COURSE_LABELS, cleanPostHtml } from './blog.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const a = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`;
const li = (inner) => `<li>${inner}</li>`;

const NAV = [['Home', '/'], ['Courses', '/courses'], ['Pricing', '/pricing'], ['Blog', '/blog'], ['Contact', '/contact']];

const frame = (main, courses) => `<div class="seo-snapshot" data-prerender="1">
<header><nav aria-label="Main"><ul>${NAV.map(([t, h]) => li(a(h, t))).join('')}</ul></nav></header>
<main>
${main}
</main>
<footer>
<nav aria-label="Courses"><h2>Courses</h2><ul>${courses.map((c) => li(a(courseUrl(c), c.title))).join('')}</ul></nav>
<nav aria-label="Legal"><ul>${li(a('/privacy', 'Privacy Policy'))}${li(a('/terms', 'Terms of Use'))}${li(a('/refund-policy', 'Refund Policy'))}</ul></nav>
<p>${esc(ORGANIZATION.name)} · ${esc(ORGANIZATION.address.streetAddress)}, ${esc(ORGANIZATION.address.addressLocality)}, ${esc(ORGANIZATION.address.addressRegion)} ${esc(ORGANIZATION.address.postalCode)} · ${a('mailto:' + ORGANIZATION.email, ORGANIZATION.email)}</p>
</footer>
</div>`;

const courseList = (courses, heading = 'h2') => `<ul>${courses.map((c) => li(`<${heading}>${a(courseUrl(c), c.title)}</${heading}><p>${esc(c.description)}</p><p>${(c.modules || []).length} modules · $${esc(c.price)} · lifetime access · certificate of completion</p>`)).join('')}</ul>`;

// entries: the merged post list (see mergeBlogIndex); baked: whether the article pages exist on this site
const blogIndexMain = (blog) => {
  const entries = (blog && blog.entries) || [];
  const baked = !!(blog && blog.baked);
  const list = entries.length
    ? `<ul>${entries.map((e) => li(`<h2>${a(baked ? blogPath(e.slug) : `https://blog.aicoursehubpro.com/${e.slug}`, e.title)}</h2><p>${esc(e.excerpt)}</p><p>${esc(e.category)} · ${esc(e.date)}${e.readTime ? ' · ' + esc(e.readTime) : ''}</p>`)).join('')}</ul>`
    : `<p>${a('https://blog.aicoursehubpro.com', 'Read the latest articles')}</p>`;
  return `<h1>Blog: AI Insights and Career Tips</h1>
<p>Practical AI tips, career insights, and industry guides for professionals in HR, business, and beyond.</p>
${list}`;
};

// One article. post = { title, html, author, publishedAt, ... }; entry = a merged-index entry.
export function postSnapshot(entry, post, courses) {
  const list = Array.isArray(courses) ? courses : [];
  const slug = relatedCourseSlug({ ...entry, tags: post.tags });
  const course = slug ? list.find((c) => c.slug === slug) : null;
  const related = slug
    ? `<aside><h2>Related course</h2><p>${a(`/courses/${slug}`, course ? course.title : COURSE_LABELS[slug])}: ${esc(course ? course.description : 'a practical, prompt-based course with a certificate of completion.')}</p></aside>`
    : `<aside><h2>Go deeper</h2><p>${a('/courses', 'Browse all six AI courses')}</p></aside>`;
  return frame(`<nav aria-label="Breadcrumb">${a('/', 'Home')} › ${a('/blog', 'Blog')} › ${esc(entry.title)}</nav>
<article>
<h1>${esc(entry.title)}</h1>
<p>${post.author ? 'By ' + esc(post.author) + ' · ' : ''}<time datetime="${esc(post.publishedAt || entry.iso || '')}">${esc(entry.date)}</time>${entry.readTime ? ' · ' + esc(entry.readTime) : ''}</p>
${cleanPostHtml(post.html)}
</article>
${related}
<p>${a('/blog', 'All articles')} · ${a('/courses', 'All courses')} · ${a('/pricing', 'Pricing')}</p>`, list);
}

export function snapshotFor(path, courses, blog) {
  const list = Array.isArray(courses) ? courses : [];
  let main = '';
  switch (path) {
    case '/':
      main = `<h1>Master AI in Human Resources, Public Services, Automation, Education and Business</h1>
<p>Less theory. More real-life AI. Learn how to apply AI to everyday challenges, decisions, and workflows—no complexity, just clarity.</p>
<p>${a('/courses', 'Explore the course catalog')} · ${a('/pricing', 'View pricing')}</p>
<h2>Find your learning path</h2>
${courseList(list, 'h3')}
<h2>How you get certified</h2>
<p>Finish a course's lessons and pass its final assessment with a score of at least 70% to earn a certificate of completion with a unique ID that anyone can verify.</p>`;
      break;
    case '/courses':
      main = `<h1>Browse All Courses</h1>
${courseList(list)}`;
      break;
    case '/pricing':
      main = `<h1>Simple, Transparent Pricing</h1>
<p>No monthly subscriptions. Pay once and keep access for life.</p>
<h2>Single course: $29</h2>
<p>Each course is a one-time payment of $29 with lifetime access and a certificate of completion when you pass the final assessment.</p>
<h2>Pro Bundle: $159</h2>
<p>Every course in one purchase. The bundle price goes down by $29 for each course you already own.</p>
<p>${a('/courses', 'See the courses')} · ${a('/refund-policy', 'Refund Policy')}</p>`;
      break;
    case '/blog':
      main = blogIndexMain(blog);
      break;
    case '/contact':
      main = `<h1>Get in touch</h1>
<p>Questions about a course, your account or a payment? We will get back to you.</p>
<p>Email: ${a('mailto:' + ORGANIZATION.email, ORGANIZATION.email)}<br>Phone: ${a('tel:+18009718013', ORGANIZATION.telephone)}<br>${esc(ORGANIZATION.address.streetAddress)}, ${esc(ORGANIZATION.address.addressLocality)}, ${esc(ORGANIZATION.address.addressRegion)} ${esc(ORGANIZATION.address.postalCode)}</p>`;
      break;
    case '/privacy':
      main = `<h1>Privacy Policy</h1><p>How ${esc(ORGANIZATION.name)} collects, uses and protects your information.</p>`;
      break;
    case '/terms':
      main = `<h1>Terms of Use</h1><p>The terms that apply when you use ${esc(ORGANIZATION.name)}, buy a course or earn a certificate of completion.</p>`;
      break;
    case '/refund-policy':
      main = `<h1>Refund Policy</h1>
<p>Because course content is available immediately after purchase, ${esc(ORGANIZATION.name)} generally does not offer refunds and all sales are considered final.</p>
<p>Requests are considered only for a technical or billing error, such as being charged more than once for the same course.</p>`;
      break;
    default:
      return '';
  }
  return frame(main, list);
}

export function courseSnapshot(course, courses) {
  const mk = marketingFor(course.slug) || {};
  const modules = course.modules || [];
  const faq = courseFaq(course);
  const bullets = (items) => `<ul>${items.map((t) => li(esc(t))).join('')}</ul>`;
  const ex = mk.workedExample && (mk.workedExample.task || mk.workedExample.result) ? mk.workedExample : null;
  const main = `<h1>${esc(course.title)}</h1>
${mk.outcome ? `<p><strong>${esc(mk.outcome)}</strong></p>` : ''}
<p>${esc(course.description)}</p>
<p>$${esc(course.price)} · one-time payment · lifetime access · certificate of completion</p>
<h2>What's inside</h2>
<p>${modules.length} modules · ${modules.reduce((n, m) => n + ((m.lessons || []).length), 0)} lessons</p>
${mk.whoFor && mk.whoFor.length ? `<h2>Who it is for</h2>${bullets(mk.whoFor)}` : ''}
${mk.produces && mk.produces.length ? `<h2>What you will produce</h2>${bullets(mk.produces)}` : ''}
${ex ? `<h2>A worked example</h2>${ex.task ? `<h3>The task</h3><p>${esc(ex.task)}</p>` : ''}${ex.input ? `<h3>What you start with</h3><p>${esc(ex.input)}</p>` : ''}${ex.result ? `<h3>What you get</h3><p>${esc(ex.result)}</p>` : ''}${ex.check ? `<h3>What you check or change by hand before using it</h3><p>${esc(ex.check)}</p>` : ''}` : ''}
<h2>Syllabus</h2>
<ol>${modules.map((m, i) => {
    const info = (mk.modules && mk.modules[i]) || {};
    const lessons = m.lessons || [];
    return li(`<h3>${esc(m.title)}</h3>${info.summary ? `<p>${esc(info.summary)}</p>` : ''}<p>${lessons.length} lesson${lessons.length === 1 ? '' : 's'}${info.minutes ? ` · about ${esc(info.minutes)} min` : ''}</p><ul>${lessons.map((l) => li(esc(l.title))).join('')}</ul>`);
  }).join('')}</ol>
<h2>Your certificate</h2>
<p>Finish the lessons, then pass the final assessment with a score of at least 70% to earn your certificate of completion.</p>
<p>Every certificate has a unique ID. Anyone you share it with can check that it is real on our verification page.</p>
<h2>Price and terms</h2>
<p>$${esc(course.price)}, paid once, with lifetime access. No subscription.</p>
<p>Want more than one course? The ${a('/pricing', 'Pro Bundle')} ($159) includes every course, and its price drops by $29 for each course you already own.</p>
<p>All sales are final, except for technical or billing errors such as a duplicate charge. See the ${a('/refund-policy', 'Refund Policy')} for the full wording.</p>
<h2>Questions</h2>
${faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('\n')}
<h2>Other courses</h2>
<ul>${courses.filter((c) => c.id !== course.id).map((c) => li(a(courseUrl(c), c.title))).join('')}</ul>`;
  return frame(main, courses);
}

export const SNAPSHOT_PATHS = Object.keys(PAGES);
export { SITE_URL };
