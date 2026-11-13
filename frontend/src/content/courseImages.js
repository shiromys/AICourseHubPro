// Cover pictures for the six courses, used on the Courses page and the learner dashboard.
// They are the same pictures the home page shows. A course with no picture here simply shows no picture.
const HR = 'https://i.postimg.cc/c1QxnDbq/niche-hr.jpg';
const EDU = 'https://i.postimg.cc/T2rdDkHz/niche-prompt.jpg';
const GOV = 'https://i.postimg.cc/kGF7P4bS/niche-govt.jpg';
const AUTO = 'https://i.postimg.cc/tJt9GTxt/niche-automation.jpg';
const NPO = 'https://i.postimg.cc/MHbzJTQV/niche-nonprofit.jpg';
const BIZ = 'https://i.postimg.cc/mkNTWDHY/niche-business.jpg';

const BY_SLUG = {
  'ai-for-hr': HR, 'ai-for-education': EDU, 'ai-for-local-government': GOV,
  'ai-for-workflow-automation': AUTO, 'ai-for-nonprofits': NPO, 'ai-for-business-analytics': BIZ,
};
// Fallback by words in the title, in case a course has a different address (for example an older version).
const BY_TITLE = [['human resources', HR], ['education', EDU], ['government', GOV], ['automation', AUTO], ['non-profit', NPO], ['nonprofit', NPO], ['business', BIZ]];

export const courseImage = (course) => {
  if (!course) return null;
  if (course.image) return course.image;
  if (course.slug && BY_SLUG[course.slug]) return BY_SLUG[course.slug];
  const t = String(course.title || '').toLowerCase();
  const hit = BY_TITLE.find(([k]) => t.includes(k));
  return hit ? hit[1] : null;
};
