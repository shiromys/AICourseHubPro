// Head details for the free sample lessons and the sample certificate page. No React.
import { SITE_URL, SITE_NAME, DEFAULT_IMAGE, clip, organizationLd, breadcrumbLd } from './meta.js';
import { COURSE_LABELS } from './blog.js';
import { sampleUrl } from '../content/samples.js';

const graph = (nodes) => ({ '@context': 'https://schema.org', '@graph': nodes });

export const metaForSample = (slug, content) => {
  const path = sampleUrl(slug);
  const label = COURSE_LABELS[slug] || slug;
  const title = `Free Sample Lesson: ${label} | ${SITE_NAME}`;
  return {
    title: title.length <= 60 ? title : `Free Sample Lesson: ${label}`.slice(0, 60),
    description: clip(`Try a free lesson from the ${label} course, no payment or email needed. ${content.intro}`, 155),
    path,
    noindex: false,
    image: DEFAULT_IMAGE,
    jsonLd: graph([
      organizationLd(),
      {
        '@type': 'LearningResource',
        name: content.title,
        description: clip(content.intro, 155),
        url: SITE_URL + path,
        inLanguage: 'en',
        isAccessibleForFree: true,
        timeRequired: `PT${content.minutes}M`,
        dateModified: content.lastUpdated,
        isPartOf: { '@type': 'Course', name: label, url: `${SITE_URL}/courses/${slug}`, provider: { '@id': `${SITE_URL}/#organization` } },
      },
      breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Courses', path: '/courses' }, { name: label, path: `/courses/${slug}` }, { name: 'Free sample lesson', path }]),
    ]),
  };
};

// The words on the sample certificate page. Shared by the page and the saved copy for crawlers.
export const SAMPLE_CERT_TEXT = {
  h1: 'Sample certificate of completion',
  lead: "This is a sample. It shows what an AICourseHubPro certificate looks like. It has no real person's name, and it cannot be verified because nobody earned it.",
  whatTitle: 'What the certificate is',
  what: 'A real AICourseHubPro certificate is a verifiable certificate of completion issued by AICourseHubPro. It shows that the named person finished a course and passed its final assessment. We confirm it is genuine on our verification page; how an employer or organization regards it is up to them.',
  earnTitle: 'How you earn a real certificate',
  earn: [
    'Buy a course and work through its lessons.',
    'Pass the final assessment with a score of at least 70%. If you do not pass, you can retake it.',
    'Your certificate is created when you pass. It carries your name, the course title, your score and a unique ID, and you can download it as a PDF.',
  ],
  verifyTitle: 'How anyone can verify it',
  verify: [
    'Every real certificate has a unique ID and a QR code.',
    'Anyone can scan the QR code, or open the verification page with the certificate ID, to see who earned it, for which course and when.',
    'If an ID is not valid, the verification page says so.',
  ],
};
