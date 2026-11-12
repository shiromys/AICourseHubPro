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
  "ai-for-nonprofits": {
    "title": "Anatomy of a strong non-profit prompt",
    "minutes": 10,
    "intro": "In this lesson you learn the five parts of a clear prompt by turning a vague request into one that returns a warm, specific thank-you message to volunteers, using only true facts.",
    "sections": [
      {
        "heading": "The scenario",
        "body": [
          "You run communications for a community food bank. You need a short thank-you message to volunteers after a big weekend collection drive."
        ]
      },
      {
        "heading": "A weak prompt and a strong prompt",
        "body": [
          "Weak prompt: Write a thank you message to volunteers.",
          "The AI returns a generic message that could be from any organization and mentions nothing about what the volunteers actually did.",
          "Strong prompt, in five parts:"
        ],
        "bullets": [
          "Role: Act as the communications lead of a community food bank.",
          "Context: Last weekend, 60 volunteers collected 2,400 kg of food from three neighborhoods in two days. It rained on Saturday. The food will supply about 900 families next month.",
          "Task: Write a thank-you message to the volunteers.",
          "Format: Under 120 words, a warm opening line, one specific detail about what they did, and a closing invitation to our next drive on [DATE].",
          "Limits: Sincere, not overly dramatic. Use only the facts above. Do not exaggerate the impact."
        ]
      },
      {
        "heading": "What the strong prompt returns",
        "body": [
          "The AI returns a warm, specific message that matches what really happened."
        ]
      },
      {
        "heading": "Why it works",
        "body": [
          "Each part of the prompt does a different job."
        ],
        "bullets": [
          "Role sets the voice of your organization.",
          "Context supplies true facts, so the AI does not invent impact.",
          "Format and Limits keep the message short and honest."
        ]
      },
      {
        "heading": "The five parts of a clear prompt",
        "body": [
          "A clear prompt has five parts: Role, Context, Task, Format and Limits. Together they tell the AI who it is writing as, what is true, what to produce, what shape it should take and what to avoid.",
          "The point of the structure is simple: the AI fills any gap you leave with a confident guess, so the more you supply, the less it invents."
        ],
        "bullets": [
          "Role: whose voice the AI writes in",
          "Context: the true facts it must work from",
          "Task: exactly what you want produced",
          "Format: length and structure",
          "Limits: tone, things to avoid, and \"use only the facts above\""
        ]
      },
      {
        "heading": "Watch out",
        "body": [
          "AI will happily invent impressive numbers and stories. Never publish an impact claim you cannot support."
        ]
      }
    ],
    "tryIt": {
      "instruction": "Paste this into ChatGPT, Claude or your organization's approved AI tool and run it. Then change the facts to your own and run it again, and compare the two drafts.",
      "prompt": "Act as the communications lead of a community food bank.\nContext: Last weekend, 60 volunteers collected 2,400 kg of food from three neighborhoods in two days. It rained on Saturday. The food will supply about 900 families next month.\nTask: Write a thank-you message to the volunteers.\nFormat: Under 120 words, a warm opening line, one specific detail about what they did, and a closing invitation to our next drive on [DATE].\nLimits: Sincere, not overly dramatic. Use only the facts above. Do not exaggerate the impact."
    },
    "check": [
      {
        "q": "Which of these is NOT one of the five parts of a clear prompt?",
        "options": [
          "Role",
          "Context",
          "Budget",
          "Limits"
        ],
        "answer": 2,
        "why": "The five parts are Role, Context, Task, Format and Limits."
      },
      {
        "q": "In the food bank prompt, what does the Context part do?",
        "options": [
          "It supplies the true facts so the AI does not invent impact",
          "It sets the length of the message",
          "It chooses the tone of voice"
        ],
        "answer": 0,
        "why": "Context holds the true facts (60 volunteers, 2,400 kg, 900 families), so the AI works from them instead of inventing numbers."
      },
      {
        "q": "Before you publish a number or story the AI wrote about your impact, you should:",
        "options": [
          "Publish it if it sounds good",
          "Check that you can support it with your own records",
          "Ask the AI whether it is true"
        ],
        "answer": 1,
        "why": "AI can invent impressive numbers and stories. Only publish claims you can support."
      }
    ],
    "lastUpdated": "2026-11-12"
  },
  "ai-for-local-government": {
    "title": "Anatomy of a strong public-service prompt",
    "minutes": 10,
    "intro": "In this lesson you learn the five parts of a clear prompt by writing a short, accurate resident notice about a road closure, with the key details first and nothing invented.",
    "sections": [
      {
        "heading": "The scenario",
        "body": [
          "A water main repair will close part of Elm Street for two days. You need a short notice for residents, and the supervisor wants it today."
        ]
      },
      {
        "heading": "A weak prompt and a strong prompt",
        "body": [
          "Weak prompt: Write a notice about road work.",
          "The AI returns a vague notice with no dates, no affected streets and no contact information.",
          "Strong prompt, in five parts:"
        ],
        "bullets": [
          "Role: Act as a communications officer for a city public works department.",
          "Context: A water main repair will close Elm Street between 3rd and 6th Avenue from 7 AM on Monday, [DATE], to 6 PM on Tuesday, [DATE]. Residents can still reach their homes on foot. Buses on Route 12 will be diverted via Oak Street. Questions: call [PHONE].",
          "Task: Write a resident notice.",
          "Format: Under 120 words, with a clear headline, the dates and times first, what residents need to do, and the phone number.",
          "Limits: Plain language at about an 8th-grade reading level. Use only the facts above. Do not promise a completion time earlier than stated."
        ]
      },
      {
        "heading": "What the strong prompt returns",
        "body": [
          "The AI returns a short, accurate notice with the key details first."
        ]
      },
      {
        "heading": "Why it works",
        "body": [
          "Each part of the prompt does a different job."
        ],
        "bullets": [
          "Role sets the voice of the department.",
          "Context supplies true details, so nothing is invented.",
          "Format and Limits keep it short, readable and honest."
        ]
      },
      {
        "heading": "The five parts of a clear prompt",
        "body": [
          "A clear prompt has five parts: Role, Context, Task, Format and Limits. Together they tell the AI who it is writing as, what is true, what to produce, what shape it should take and what to avoid.",
          "The point of the structure is simple: the AI fills any gap you leave with a confident guess, so the more you supply, the less it invents."
        ],
        "bullets": [
          "Role: whose voice the AI writes in",
          "Context: the true facts it must work from",
          "Task: exactly what you want produced",
          "Format: length and structure",
          "Limits: tone, things to avoid, and \"use only the facts above\""
        ]
      },
      {
        "heading": "Watch out",
        "body": [
          "A wrong date or street in a public notice affects real people. Check every detail against the official source before it is published."
        ]
      }
    ],
    "tryIt": {
      "instruction": "Paste this into ChatGPT, Claude or your organization's approved AI tool and run it. Then change the facts to your own and run it again, and compare the two drafts.",
      "prompt": "Act as a communications officer for a city public works department.\nContext: A water main repair will close Elm Street between 3rd and 6th Avenue from 7 AM on Monday, [DATE], to 6 PM on Tuesday, [DATE]. Residents can still reach their homes on foot. Buses on Route 12 will be diverted via Oak Street. Questions: call [PHONE].\nTask: Write a resident notice.\nFormat: Under 120 words, with a clear headline, the dates and times first, what residents need to do, and the phone number.\nLimits: Plain language at about an 8th-grade reading level. Use only the facts above. Do not promise a completion time earlier than stated."
    },
    "check": [
      {
        "q": "Which of these is NOT one of the five parts of a clear prompt?",
        "options": [
          "Role",
          "Context",
          "Budget",
          "Limits"
        ],
        "answer": 2,
        "why": "The five parts are Role, Context, Task, Format and Limits."
      },
      {
        "q": "Why does the strong prompt include the closure dates, streets and phone number?",
        "options": [
          "So the AI can use true details instead of inventing them",
          "To make the prompt longer",
          "Because the AI cannot write notices without a phone number"
        ],
        "answer": 0,
        "why": "Context supplies the real facts. Without them the AI fills the gaps with guesses."
      },
      {
        "q": "What should you do before a public notice written with AI goes out?",
        "options": [
          "Send it, because AI is usually right",
          "Check every date, place and number against the official source",
          "Ask the AI to make it longer"
        ],
        "answer": 1,
        "why": "A wrong detail in a public notice affects real people, so every detail must be checked."
      }
    ],
    "lastUpdated": "2026-11-12"
  },
  "ai-for-hr": {
    "title": "Anatomy of a strong HR prompt",
    "minutes": 10,
    "intro": "In this lesson you learn the five parts of a clear prompt by rewriting a vague request into one that returns a short, specific welcome email for a new hire, with nothing invented.",
    "sections": [
      {
        "heading": "The scenario",
        "body": [
          "A new Software Engineer starts on Monday. You need a welcome email that feels personal, tells them where to be and when, and does not read like a form letter. You have ten minutes."
        ]
      },
      {
        "heading": "A weak prompt and a strong prompt",
        "body": [
          "Weak prompt: Write a welcome email for a new employee.",
          "The AI returns a generic email with no start time, no location and a tone that suits any company. You would have to rewrite most of it.",
          "Strong prompt, in five parts:"
        ],
        "bullets": [
          "Role: Act as a friendly HR manager at a 150-person software company.",
          "Context: Priya Nair joins as a Software Engineer on Monday at 9:30 AM at our Plano office. Her manager is Dan Lewis. She will get her laptop and badge at reception, and lunch with the team is on us.",
          "Task: Write a welcome email from me.",
          "Format: Under 150 words, with a short subject line and a three-item checklist of what to bring.",
          "Limits: Warm but professional. Do not promise anything not listed above."
        ]
      },
      {
        "heading": "What the strong prompt returns",
        "body": [
          "The AI returns a short, specific email you can send after a quick read, with the details you supplied and nothing invented."
        ]
      },
      {
        "heading": "Why it works",
        "body": [
          "Each part of the prompt does a different job."
        ],
        "bullets": [
          "Role tells the AI whose voice to write in.",
          "Context supplies the facts, so the AI does not guess.",
          "Task, Format and Limits say exactly what to produce, how long it should be, and what to avoid."
        ]
      },
      {
        "heading": "The five parts of a clear prompt",
        "body": [
          "A clear prompt has five parts: Role, Context, Task, Format and Limits. Together they tell the AI who it is writing as, what is true, what to produce, what shape it should take and what to avoid.",
          "The point of the structure is simple: the AI fills any gap you leave with a confident guess, so the more you supply, the less it invents."
        ],
        "bullets": [
          "Role: whose voice the AI writes in",
          "Context: the true facts it must work from",
          "Task: exactly what you want produced",
          "Format: length and structure",
          "Limits: tone, things to avoid, and \"use only the facts above\""
        ]
      },
      {
        "heading": "Watch out",
        "body": [
          "AI fills gaps with confident guesses. If you leave out a date, name or policy, it may invent one. Read every detail before you send, and never rely on the AI for facts you did not supply."
        ]
      }
    ],
    "tryIt": {
      "instruction": "Paste this into ChatGPT, Claude or your organization's approved AI tool and run it. Then change the facts to your own and run it again, and compare the two drafts.",
      "prompt": "Act as a friendly HR manager at a 150-person software company.\nContext: Priya Nair joins as a Software Engineer on Monday at 9:30 AM at our Plano office. Her manager is Dan Lewis. She will get her laptop and badge at reception, and lunch with the team is on us.\nTask: Write a welcome email from me.\nFormat: Under 150 words, with a short subject line and a three-item checklist of what to bring.\nLimits: Warm but professional. Do not promise anything not listed above."
    },
    "check": [
      {
        "q": "Which of these is NOT one of the five parts of a clear prompt?",
        "options": [
          "Role",
          "Context",
          "Budget",
          "Limits"
        ],
        "answer": 2,
        "why": "The five parts are Role, Context, Task, Format and Limits."
      },
      {
        "q": "What happens if you leave a date, name or policy out of your prompt?",
        "options": [
          "The AI may fill the gap with an invented one",
          "The AI refuses to answer",
          "The AI always asks you for it"
        ],
        "answer": 0,
        "why": "AI fills gaps with confident guesses, so you must supply the facts and check the result."
      },
      {
        "q": "What does the Limits part do in the welcome-email prompt?",
        "options": [
          "It says what to avoid, such as promising anything not listed",
          "It sets who the email is addressed to",
          "It lists the facts the AI must use"
        ],
        "answer": 0,
        "why": "Limits control tone and what to avoid. Here: warm but professional, and no promises beyond the facts given."
      }
    ],
    "lastUpdated": "2026-11-12"
  },
  "ai-for-business-analytics": {
    "title": "Anatomy of a strong analysis prompt",
    "minutes": 10,
    "intro": "In this lesson you learn the five parts of a clear prompt by asking a specific question of real practice data, and you see how \"show the calculation\" lets you check every number.",
    "sections": [
      {
        "heading": "The scenario",
        "body": [
          "Sales fell last month and your director asks, \"What happened?\" You have a small table of sales by region and product."
        ]
      },
      {
        "heading": "A weak prompt and a strong prompt",
        "body": [
          "Weak prompt: Analyze my sales data.",
          "The AI returns general statements such as \"sales varied by region\" that you could have written without data.",
          "Strong prompt, in five parts:"
        ],
        "bullets": [
          "Role: Act as a business analyst.",
          "Context: The table shows monthly sales by region and product for the last 3 months. Our target is growth of at least 2% per month.",
          "Task: Find where sales fell last month compared with the month before, and by how much.",
          "Format: A table of the three biggest decreases (Region, Product, Change in dollars, Change in percent), then two sentences describing the pattern.",
          "Limits: Use only the figures given. Show the calculation for each change. If the data cannot explain why, say so."
        ]
      },
      {
        "heading": "What the strong prompt returns",
        "body": [
          "The AI returns specific decreases with calculations you can check, and does not invent reasons it cannot know. With the practice data in the box below, the numbers should match this: Outdoor fell from $27,520 to $24,320 (-$3,200, -11.6%) and Footwear from $21,500 to $21,070 (-$430, -2.0%), while Apparel rose 4.9%. Your AI's wording will differ, but the numbers should not."
        ]
      },
      {
        "heading": "Why it works",
        "body": [
          "Each part of the prompt does a different job."
        ],
        "bullets": [
          "Role and context tell the AI what the data is and what matters.",
          "A specific question gives a specific answer.",
          "\"Show the calculation\" lets you verify every number."
        ]
      },
      {
        "heading": "The five parts of a clear prompt",
        "body": [
          "A clear prompt has five parts: Role, Context, Task, Format and Limits. Together they tell the AI who it is writing as, what is true, what to produce, what shape it should take and what to avoid.",
          "The point of the structure is simple: the AI fills any gap you leave with a confident guess, so the more you supply, the less it invents."
        ],
        "bullets": [
          "Role: whose voice the AI writes in",
          "Context: the true facts it must work from",
          "Task: exactly what you want produced",
          "Format: length and structure",
          "Limits: tone, things to avoid, and \"use only the facts above\""
        ]
      },
      {
        "heading": "Watch out",
        "body": [
          "AI can sound confident while getting a number wrong. Recalculate at least a couple of the changes in a spreadsheet before you trust them."
        ]
      }
    ],
    "tryIt": {
      "instruction": "Paste this into ChatGPT, Claude or your organization's approved AI tool and run it. Then change the facts to your own and run it again, and compare the two drafts.",
      "prompt": "Act as a business analyst.\nContext: The table below shows monthly units, revenue (US dollars), returns and average rating for three product lines, January to June 2026. Our target is growth of at least 2% per month.\nTask: Find every product line whose revenue fell from May to June, and by how much.\nFormat: A table (Product_Line, May revenue, June revenue, Change in dollars, Change in percent), then two sentences describing the pattern.\nLimits: Use only the figures given. Show the calculation for each change. If the data cannot explain why, say so.\n\nData:\nMonth,Product_Line,Units_Sold,Revenue_USD,Units_Returned,Avg_Rating\n2026-01,Outdoor,310,19220,14,4.4\n2026-01,Apparel,520,19760,31,4.5\n2026-01,Footwear,260,22100,21,4.2\n2026-02,Outdoor,340,21080,17,4.4\n2026-02,Apparel,540,20520,30,4.5\n2026-02,Footwear,255,21675,20,4.3\n2026-03,Outdoor,395,24885,22,4.3\n2026-03,Apparel,560,21280,34,4.5\n2026-03,Footwear,270,23220,22,4.2\n2026-04,Outdoor,450,28350,31,4.2\n2026-04,Apparel,590,23010,35,4.4\n2026-04,Footwear,280,24080,24,4.2\n2026-05,Outdoor,430,27520,46,3.9\n2026-05,Apparel,610,23790,36,4.5\n2026-05,Footwear,250,21500,22,4.1\n2026-06,Outdoor,380,24320,58,3.7\n2026-06,Apparel,640,24960,38,4.5\n2026-06,Footwear,245,21070,23,4.2"
    },
    "check": [
      {
        "q": "Which of these is NOT one of the five parts of a clear prompt?",
        "options": [
          "Role",
          "Context",
          "Budget",
          "Limits"
        ],
        "answer": 2,
        "why": "The five parts are Role, Context, Task, Format and Limits."
      },
      {
        "q": "Why does the strong prompt say \"Show the calculation for each change\"?",
        "options": [
          "So you can verify every number yourself",
          "To make the answer longer",
          "Because AI cannot do arithmetic without it"
        ],
        "answer": 0,
        "why": "Showing the calculation lets you check each result instead of trusting it."
      },
      {
        "q": "The data cannot explain why sales fell. What should a good prompt tell the AI to do?",
        "options": [
          "Guess the most likely reason",
          "Say that the data cannot explain it",
          "Leave the question out"
        ],
        "answer": 1,
        "why": "The Limits line says: if the data cannot explain why, say so. That blocks invented reasons."
      }
    ],
    "lastUpdated": "2026-11-12"
  },
  "ai-for-workflow-automation": {
    "title": "Anatomy of a strong automation prompt",
    "minutes": 10,
    "intro": "In this lesson you learn the five parts of a clear prompt by turning rough weekly notes into a status update with the same structure every time, flagging anything unclear instead of guessing.",
    "sections": [
      {
        "heading": "The scenario",
        "body": [
          "Every Friday you write a status update email for your manager from your own notes. It takes 40 minutes and always reads differently."
        ]
      },
      {
        "heading": "A weak prompt and a strong prompt",
        "body": [
          "Weak prompt: Write my weekly update.",
          "The AI invents progress you did not make, because you gave it nothing to work from.",
          "Strong prompt, in five parts:"
        ],
        "bullets": [
          "Role: Act as a project coordinator writing for a busy manager.",
          "Context: Below are my notes for this week. Audience: my manager, who reads for 30 seconds.",
          "Task: Turn the notes into a weekly status update.",
          "Format: Three headings: Done, In progress, Needs a decision. Maximum 120 words in total.",
          "Limits: Use only what is in the notes. If something is unclear, list it under \"Questions for me\"."
        ]
      },
      {
        "heading": "What the strong prompt returns",
        "body": [
          "The AI returns the same clean structure every week and asks you about anything unclear instead of guessing."
        ]
      },
      {
        "heading": "Why it works",
        "body": [
          "Each part of the prompt does a different job."
        ],
        "bullets": [
          "Role and audience shape the tone and the level of detail.",
          "A fixed format makes the output predictable, which is what automation needs.",
          "Limits stop the AI from inventing work that did not happen."
        ]
      },
      {
        "heading": "The five parts of a clear prompt",
        "body": [
          "A clear prompt has five parts: Role, Context, Task, Format and Limits. Together they tell the AI who it is writing as, what is true, what to produce, what shape it should take and what to avoid.",
          "The point of the structure is simple: the AI fills any gap you leave with a confident guess, so the more you supply, the less it invents."
        ],
        "bullets": [
          "Role: whose voice the AI writes in",
          "Context: the true facts it must work from",
          "Task: exactly what you want produced",
          "Format: length and structure",
          "Limits: tone, things to avoid, and \"use only the facts above\""
        ]
      },
      {
        "heading": "Watch out",
        "body": [
          "AI fills gaps with confident guesses. If your notes are thin, the output will contain invented details. Always read before you send."
        ]
      }
    ],
    "tryIt": {
      "instruction": "Paste this into ChatGPT, Claude or your organization's approved AI tool and run it. Then change the facts to your own and run it again, and compare the two drafts.",
      "prompt": "Act as a project coordinator writing for a busy manager.\nContext: Below are my notes for this week. Audience: my manager, who reads for 30 seconds.\nTask: Turn the notes into a weekly status update.\nFormat: Three headings: Done, In progress, Needs a decision. Maximum 120 words in total.\nLimits: Use only what is in the notes. If something is unclear, list it under 'Questions for me'.\nNotes:\n- Finished the supplier contract draft; legal has it\n- Started the Q1 budget; waiting on two team numbers\n- Customer onboarding checklist: not sure who owns the final sign-off\n- Office move date still not confirmed"
    },
    "check": [
      {
        "q": "Which of these is NOT one of the five parts of a clear prompt?",
        "options": [
          "Role",
          "Context",
          "Budget",
          "Limits"
        ],
        "answer": 2,
        "why": "The five parts are Role, Context, Task, Format and Limits."
      },
      {
        "q": "Why does a fixed format (the same headings each time) matter for automation?",
        "options": [
          "It makes the output predictable every time you run the prompt",
          "It makes the AI work faster",
          "It removes the need to read the result"
        ],
        "answer": 0,
        "why": "An automation is only useful if it gives the same structure each run. You still read the result before sending."
      },
      {
        "q": "What does the Limits line tell the AI to do when something in the notes is unclear?",
        "options": [
          "Make a sensible guess",
          "List it under \"Questions for me\"",
          "Skip it"
        ],
        "answer": 1,
        "why": "Listing unclear items stops the AI inventing details and tells you what to clarify."
      }
    ],
    "lastUpdated": "2026-11-12"
  },
  "ai-for-education": {
    "title": "Anatomy of a strong education prompt",
    "minutes": 10,
    "intro": "In this lesson you learn the five parts of a clear prompt by turning a vague request into one that returns a short, level-appropriate explanation with a comparison and questions you can use straight away.",
    "sections": [
      {
        "heading": "The scenario",
        "body": [
          "You teach Grade 7 science and need a short explanation of photosynthesis for students who struggled with last week's reading. You have ten minutes before class."
        ]
      },
      {
        "heading": "A weak prompt and a strong prompt",
        "body": [
          "Weak prompt: Explain photosynthesis.",
          "The AI returns a textbook-style explanation that is too long and too advanced, with no connection to your students or lesson.",
          "Strong prompt, in five parts:"
        ],
        "bullets": [
          "Role: Act as an experienced Grade 7 science teacher.",
          "Context: My students read at about a Grade 5 level and found last week's text confusing. They have already learned what plants need: sunlight, water and air.",
          "Task: Explain how photosynthesis turns those three things into food for the plant.",
          "Format: Under 150 words, one everyday comparison, and three questions at the end to check understanding.",
          "Limits: Simple words, no jargon without a short explanation, and no facts beyond what a Grade 7 science curriculum covers."
        ]
      },
      {
        "heading": "What the strong prompt returns",
        "body": [
          "The AI returns a short, level-appropriate explanation with a comparison your students can picture and questions you can use immediately."
        ]
      },
      {
        "heading": "Why it works",
        "body": [
          "Each part of the prompt does a different job."
        ],
        "bullets": [
          "Role sets the voice and level of expertise.",
          "Context tells the AI who the learners are and what they already know.",
          "Task, Format and Limits control what is produced, how long it is, and what to avoid."
        ]
      },
      {
        "heading": "The five parts of a clear prompt",
        "body": [
          "A clear prompt has five parts: Role, Context, Task, Format and Limits. Together they tell the AI who it is writing as, what is true, what to produce, what shape it should take and what to avoid.",
          "The point of the structure is simple: the AI fills any gap you leave with a confident guess, so the more you supply, the less it invents."
        ],
        "bullets": [
          "Role: whose voice the AI writes in",
          "Context: the true facts it must work from",
          "Task: exactly what you want produced",
          "Format: length and structure",
          "Limits: tone, things to avoid, and \"use only the facts above\""
        ]
      },
      {
        "heading": "Watch out",
        "body": [
          "AI can state wrong facts with great confidence. Always check content against a trusted source before it reaches students."
        ]
      }
    ],
    "tryIt": {
      "instruction": "Paste this into ChatGPT, Claude or your organization's approved AI tool and run it. Then change the facts to your own and run it again, and compare the two drafts.",
      "prompt": "Act as an experienced Grade 7 science teacher.\nContext: My students read at about a Grade 5 level and found last week's text confusing. They have already learned what plants need: sunlight, water and air.\nTask: Explain how photosynthesis turns those three things into food for the plant.\nFormat: Under 150 words, one everyday comparison, and three questions at the end to check understanding.\nLimits: Simple words, no jargon without a short explanation, and no facts beyond what a Grade 7 science curriculum covers."
    },
    "check": [
      {
        "q": "Which of these is NOT one of the five parts of a clear prompt?",
        "options": [
          "Role",
          "Context",
          "Budget",
          "Limits"
        ],
        "answer": 2,
        "why": "The five parts are Role, Context, Task, Format and Limits."
      },
      {
        "q": "What does the Context part tell the AI in the photosynthesis prompt?",
        "options": [
          "Who the learners are and what they already know",
          "How many words to write",
          "Which curriculum to ignore"
        ],
        "answer": 0,
        "why": "Context describes the learners (Grade 5 reading level, already know what plants need) so the explanation fits them."
      },
      {
        "q": "Before AI-written content reaches students, you should:",
        "options": [
          "Check it against a trusted source",
          "Trust it, because it sounds confident",
          "Ask the AI to make it longer"
        ],
        "answer": 0,
        "why": "AI can state wrong facts with great confidence, so content must be checked first."
      }
    ],
    "lastUpdated": "2026-11-12"
  }
};
