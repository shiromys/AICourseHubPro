// Head details (title, description, structured data) for the resource library. No React.
import { SITE_URL, SITE_NAME, DEFAULT_IMAGE, clip, organizationLd, breadcrumbLd, faqLd } from './meta.js';
import { postTitle } from './blog.js';
import { resourceUrl } from '../content/resources.js';

export const RESOURCE_HUB_META = {
  title: 'Free AI Templates and Guides for Work | AICourseHubPro',
  description: 'Free, practical AI guides with worked examples and downloadable templates for nonprofits, local government, HR, business, education and workflow automation.',
};

const graph = (nodes) => ({ '@context': 'https://schema.org', '@graph': nodes });

export const metaForResourceHub = () => ({
  title: RESOURCE_HUB_META.title,
  description: RESOURCE_HUB_META.description,
  path: '/resources',
  noindex: false,
  image: DEFAULT_IMAGE,
  jsonLd: graph([organizationLd(), breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Resources', path: '/resources' }])]),
});

export const metaForResource = (page) => {
  const c = page.content;
  const path = resourceUrl(page.slug);
  return {
    title: postTitle(c.title, c.metaTitle),
    description: clip(c.metaDescription || c.shortAnswer, 155),
    path,
    noindex: false,
    ogType: 'article',
    image: DEFAULT_IMAGE,
    jsonLd: graph([
      organizationLd(),
      {
        '@type': 'Article',
        headline: clip(c.title, 110),
        description: clip(c.metaDescription || c.shortAnswer, 155),
        image: [DEFAULT_IMAGE],
        datePublished: c.published || c.lastUpdated,
        dateModified: c.lastUpdated,
        author: c.reviewer.role
          ? { '@type': 'Person', name: c.reviewer.name, jobTitle: c.reviewer.role }
          : { '@type': 'Organization', name: c.reviewer.name, url: SITE_URL },
        publisher: { '@id': `${SITE_URL}/#organization` },
        mainEntityOfPage: { '@type': 'WebPage', '@id': SITE_URL + path },
        url: SITE_URL + path,
        inLanguage: 'en',
      },
      faqLd(c.faq.map((f) => ({ q: f.q, a: f.a }))),
      breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Resources', path: '/resources' }, { name: c.title, path }]),
    ]),
  };
};

// "2026-11-15" -> "November 15, 2026"
export const longDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return '';
  const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${names[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
};
export { SITE_NAME };
