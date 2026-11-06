// Marketing copy for each public course page, keyed by the course's address (its "slug").
// Written by the content coworker from the REAL course material. A section with no content is
// simply not shown on the page, so nothing here ever appears as placeholder text.
//
//   outcome        one sentence: what the learner can do afterwards
//   whoFor         ["Grant writers at small charities", ...]  job roles and situations, plain language
//   produces       ["A first-draft grant proposal", ...]       what the learner finishes with
//   workedExample  { task, input, result, check }              ONE complete example, real course output.
//                    task   what the learner is trying to do
//                    input  the data or text they start with
//                    result the output they get (line breaks are kept)
//                    check  what they check or edit by hand before using it
//   modules        [{ summary: "1 or 2 sentences", minutes: 25 }, ...]   in module order; both optional
//   faq            [{ q: "...", a: "..." }, ...]   4 to 6 real questions about THIS course
//
// The general questions (payment, certificate, refunds, bundle) are added automatically.
export const COURSE_MARKETING = {
  'ai-for-nonprofits':          { outcome: '', whoFor: [], produces: [], workedExample: null, modules: [], faq: [] },
  'ai-for-local-government':    { outcome: '', whoFor: [], produces: [], workedExample: null, modules: [], faq: [] },
  'ai-for-hr':                  { outcome: '', whoFor: [], produces: [], workedExample: null, modules: [], faq: [] },
  'ai-for-business-analytics':  { outcome: '', whoFor: [], produces: [], workedExample: null, modules: [], faq: [] },
  'ai-for-workflow-automation': { outcome: '', whoFor: [], produces: [], workedExample: null, modules: [], faq: [] },
  'ai-for-education':           { outcome: '', whoFor: [], produces: [], workedExample: null, modules: [], faq: [] },
};

export const marketingFor = (slug) => COURSE_MARKETING[slug] || {};
