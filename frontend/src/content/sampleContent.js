// The free sample lesson for each course, chosen from the REAL course by the content coworker.
// A course's sample goes live only when its entry below is COMPLETE (the rules are in
// content/samples.js). Until then the course page shows no sample link and the sample address
// does not exist. Incomplete entries are listed in the build log.
//
// To add one, copy this block, put the course address (slug) as the key, and fill every field:
//
//   'ai-for-nonprofits': {
//     title: 'Write a first draft of a grant proposal',      // the lesson's own title (10-100 characters)
//     minutes: 12,                                             // about how long it takes, a whole number 3-60
//     intro: 'One or two sentences: what the learner does in this lesson and what they leave with.',
//     sections: [                                              // 2 to 8 parts, in reading order
//       { heading: 'Start with the funder', body: ['A paragraph.', 'Another paragraph.'] },
//       { heading: 'Ask for the draft', body: ['A paragraph.'], bullets: ['Optional list item', 'Another'] },
//     ],
//     tryIt: {                                                 // the hands-on step: a prompt to copy
//       instruction: 'Paste this into your AI assistant, then replace the bracketed parts.',
//       prompt: 'You are a grant writer. Using the notes below, write ...',
//     },
//     check: [                                                 // optional: 1 to 4 self-check questions (not graded, not saved)
//       { q: 'Question?', options: ['A', 'B', 'C'], answer: 1, why: 'One sentence on why B is right.' },
//     ],
//     lastUpdated: '2026-11-15',                               // YYYY-MM-DD
//   },
//
// Use real lesson material, not a summary written for the page. The sample needs no email address.
export const SAMPLE_CONTENT = {
};
