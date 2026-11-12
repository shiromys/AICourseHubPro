// TEXT OF THE FREE RESOURCE LIBRARY: the only file the content coworker edits for these pages.
//
// One block per page, keyed by the page's address name (the list is in content/resources.js).
// A page goes live only when EVERY required field below is filled in; a page with anything missing
// stays hidden everywhere (the build log lists what is missing). Nothing placeholder is ever shown.
// Everything must come from the real course material: the example input and output are real, not mock-ups.
//
// Template files: put the file in backend/resource_files/ (NOT in the website folder; downloads are
// unlocked with an email address) and write exactly the same file name in template.file.
// Review every page at least every 6 months and update lastUpdated.
//
// Copy this block, remove the // marks and fill it in:
//
//   'grant-proposal-first-draft': {
//     title: 'How to write a first draft of a grant proposal with AI',            // the H1, as people search for it
//     shortAnswer: 'Two or three sentences: what this page helps you do and what you get.',
//     whoFor: ['Who this is for (one line each)'],
//     beforeYouStart: ['What you need first: inputs, data, tools'],
//     example: {
//       task: 'The task in one line',
//       input: 'The real input you gave the AI (can be several lines).',
//       output: 'The real output it produced (can be several lines).',
//       check: ['What to check or change by hand'],
//     },
//     template: { file: 'grant-proposal-first-draft.docx', label: 'Grant proposal outline (Word)', format: 'DOCX' },
//     cautions: ['Privacy, accuracy checks, where a human must review'],
//     faq: [ { q: 'Question 1?', a: 'Answer.' }, { q: 'Question 2?', a: 'Answer.' }, { q: 'Question 3?', a: 'Answer.' } ],  // 3 to 5
//     related: ['donor-thank-you-and-outreach-messages', 'impact-report-summary-for-board'],  // 2 or 3 other pages (optional)
//     reviewer: { name: 'Full name', role: 'Role, for example Grants consultant' },
//     lastUpdated: '2026-11-15',
//     metaDescription: 'Optional. Up to 155 characters; otherwise the short answer is used.',
//   },

export const RESOURCE_CONTENT = {
  'grant-proposal-first-draft': {
    title: 'How to write a first draft of a grant proposal with AI',
    shortAnswer: 'This is a TEST page that shows how a guide looks, with a worked example and a free template. It will be removed before the real content goes in.',
    whoFor: ['Test line one: staff who write grant proposals', 'Test line two: small teams'],
    beforeYouStart: ['Test: your own notes about the programme', 'Test: an AI assistant your organisation allows'],
    example: {
      task: 'A test run of the example section',
      input: 'Write a first draft from these notes:\n- Programme: after-school reading\n- 120 children\n- Budget $48,000',
      output: 'Draft opening paragraph:\nOur after-school reading programme supports 120 children each term with trained volunteers and a $48,000 annual budget.',
      check: ['Test: every figure matches your records', 'Test: tone matches the funder'],
    },
    template: { file: 'grant-proposal-first-draft-test.txt', label: 'Test template (text file)', format: 'TXT' },
    cautions: ['Test: do not paste personal details into public tools', 'Test: a person must review before sending'],
    faq: [
      { q: 'Is this a real guide?', a: 'No, this is a test page and will be removed before the real content goes in.' },
      { q: 'Can I trust the output as it is?', a: 'No, always check every figure and claim before sending anything.' },
      { q: 'How long does a first draft take?', a: 'About fifteen minutes, plus your own review time.' },
    ],
    lastUpdated: '2026-11-11',
  },
};
