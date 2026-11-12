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
  "grant-proposal-first-draft": {
    "title": "How to write a first draft of a grant proposal with AI",
    "shortAnswer": "Give the AI the funder's own instructions and your real facts, and tell it to mark every claim that needs a source. You get a first draft you can check and finish in minutes, with the gaps visible instead of hidden.",
    "whoFor": [
      "Grant writers and development staff at small and mid-size nonprofits",
      "Executive directors who write proposals themselves",
      "Volunteers helping a charity with a funding application"
    ],
    "beforeYouStart": [
      "The funder's guidelines and scoring criteria for the section you are writing",
      "Your own facts, data and sources (for example programme numbers and where they come from)",
      "An AI assistant your organization allows (ChatGPT, Claude or similar)"
    ],
    "example": {
      "task": "Draft a Statement of Need from the funder's criteria and your own facts",
      "input": "Act as an experienced grant writer.\nContext: Funder guidelines for this section: Statement of Need. Describe the need, who is affected, the evidence, and why your approach fits. Scored on clarity of need (40%), evidence (40%) and fit (20%). Our facts: Riverside Reading Partners (a fictional example) runs an after-school reading programme in two elementary schools. In the 2025-26 school year 118 children in Grades 2 to 4 took part. The schools' own spring assessment (Appendix B) found 41 of those 118 children reading below grade level at the start of the year. Each child is paired with a trained volunteer for two 40-minute sessions a week. No city-wide figure has been supplied.\nTask: Draft the Statement of Need in about 150 words (shortened for this example).\nFormat: Opening that states the need, evidence with sources, who is affected, and why our approach fits.\nLimits: Use only the facts and sources I gave. For any claim needing a source, write [SOURCE NEEDED]. Follow the funder's word limit and criteria.",
      "output": "Statement of Need\n\nMany children in our community start the school year without the reading skills they need to keep up. [SOURCE NEEDED: local or city-wide figure for children reading below grade level]\n\nIn the 2025-26 school year, 118 children in Grades 2 to 4 took part in Riverside Reading Partners at two elementary schools. The schools' own spring assessment (Appendix B) found that 41 of those 118 children, about 35 percent, were reading below grade level at the start of the year.\n\nThese children are affected most directly: without extra support early on, falling behind can make every other subject harder. [SOURCE NEEDED: research linking early reading level to later outcomes]\n\nOur approach fits this need. Each child is paired with a trained volunteer for two 40-minute sessions a week, giving steady one-to-one reading practice in the school setting.",
      "check": [
        "Check 118 and 41 against your records, and recalculate the percentage yourself (41 of 118 is 34.7%)",
        "Fill each [SOURCE NEEDED] with a real source, or delete the claim",
        "Compare the draft with the funder's word limit and scoring criteria",
        "Ask a colleague to check the facts before anything is submitted"
      ]
    },
    "template": {
      "file": "grant-proposal-first-draft-template.docx",
      "label": "Grant proposal section prompt and checklist (Word)",
      "format": "DOCX"
    },
    "cautions": [
      "Read the funder's guidelines: some require you to disclose AI use or limit it.",
      "Never submit a statistic or claim you cannot source. Leave [SOURCE NEEDED] marks visible until you have resolved each one.",
      "Do not paste personal details about the people you serve into a public AI tool."
    ],
    "faq": [
      {
        "q": "Can AI write a whole grant proposal for me?",
        "a": "It can draft one section at a time from your facts, which is faster and safer. A person still decides the strategy and checks every fact before it goes to a funder."
      },
      {
        "q": "Why does the prompt tell the AI to write [SOURCE NEEDED]?",
        "a": "Without that rule, AI tends to fill gaps with statistics that sound plausible but are not supported. The mark makes each gap visible so you can add a real source or delete the claim."
      },
      {
        "q": "Do funders accept AI-assisted proposals?",
        "a": "It depends on the funder. Some ask you to disclose AI use and some limit it. Check each funder's guidelines, and only submit text you have verified and can stand behind."
      }
    ],
    "reviewer": {
      "name": "AICourseHubPro"
    },
    "lastUpdated": "2026-11-12"
  },
  "donor-thank-you-and-outreach-messages": {
    "title": "How to write donor appeal letters and emails with AI",
    "shortAnswer": "Give the AI only true facts, a real quote you have permission to use, and one specific ask, then forbid invented stories. You get a year-end appeal or donor email that is honest, specific and easy to check.",
    "whoFor": [
      "Fundraisers and development coordinators",
      "Small nonprofit teams where one person writes all donor communications",
      "Volunteers who help with appeals and thank-you notes"
    ],
    "beforeYouStart": [
      "Your voice guide or a short description of how your organization sounds",
      "True figures from your own records",
      "A real story or quote, with permission and a changed name if needed",
      "What a specific gift pays for"
    ],
    "example": {
      "task": "Write a 200-word year-end appeal from true facts",
      "input": "[PASTE YOUR VOICE GUIDE]\nContext: We run a youth mentoring program. This year 85 young people had a mentor, and 62 finished the program. One mentee, with permission and a changed name, 'Sam', says: \"I never thought I could finish school.\" A gift of $50 pays for one month of a mentor match.\nTask: Write a 200-word year-end appeal letter.\nFormat: Greeting, one story paragraph, what donations make possible, one clear ask, thank you.\nLimits: Use only the facts and quote given. Do not invent stories, statistics or outcomes. No pity language.",
      "output": "Dear friend,\n\nThis year, 85 young people in our mentoring program had a mentor beside them. 62 of them finished the program.\n\nOne of them, Sam (a changed name, shared with permission), put it in his own words: \"I never thought I could finish school.\" Those words are why this work matters to us. Every young person we meet deserves someone who believes they can.\n\nYour gift makes that belief practical. $50 pays for one month of a mentor match, which means one young person gets steady, trusted support for a whole month.\n\nWill you give $50 today to fund one month of a mentor match?\n\nThank you for standing with the young people in our program, and for everything you make possible.\n\nWith gratitude,\n[NAME AND TITLE]",
      "check": [
        "Check 85, 62 and the $50 figure against your records",
        "Confirm you have permission to use the story, and that the name is changed if needed",
        "Make sure there is one clear ask and no invented outcome (the quote says what Sam felt, not what happened)",
        "Add your signature and read the letter as a donor would"
      ]
    },
    "template": {
      "file": "donor-thank-you-and-outreach-messages-template.docx",
      "label": "Donor appeal prompt and checklist (Word)",
      "format": "DOCX"
    },
    "cautions": [
      "Use only true, permitted material. Invented stories and exaggerated results damage trust and can break fundraising rules.",
      "Get permission before using anyone's story, and change the name if needed.",
      "Do not paste donor names, addresses or giving history into an AI tool unless your organization has approved it for that data."
    ],
    "faq": [
      {
        "q": "Can AI write the story for my appeal?",
        "a": "No. Give it a real story or quote that you have permission to use. If you let AI invent a story, you risk misleading donors and breaking fundraising rules."
      },
      {
        "q": "How long should a donor appeal be?",
        "a": "The example asks for about 200 words with one story, what a gift does and one clear ask. Change the number in the prompt to fit a letter, an email or a social post."
      },
      {
        "q": "How do I keep the appeal sounding like my organization?",
        "a": "Paste your voice guide at the top of the prompt. The AI then writes in your tone instead of generic fundraising language."
      }
    ],
    "reviewer": {
      "name": "AICourseHubPro"
    },
    "lastUpdated": "2026-11-12"
  },
  "impact-report-summary-for-board": {
    "title": "How to write an impact report summary for your board with AI",
    "shortAnswer": "Paste your targets, your actual figures and your staff notes, and ask for a short report that keeps any missed target visible. You get an honest summary a board or funder can read quickly, with a table of targets against results.",
    "whoFor": [
      "Programme managers and executive directors",
      "Development and reporting staff who write for funders and boards",
      "Small teams that prepare a six-month or annual progress summary"
    ],
    "beforeYouStart": [
      "Your targets and your actual results for the period",
      "Short notes from staff on what helped and what did not",
      "An AI assistant your organization allows",
      "A spreadsheet to recalculate any percentages"
    ],
    "example": {
      "task": "Write a six-month progress summary for a board, including a missed target",
      "input": "Act as a program evaluator writing for a board and funders.\nContext: Targets and results for January to June (Northside Food Pantry, a fictional example):\n- Households served: target 1,200, actual 1,310\n- Volunteer shifts filled: target 90%, actual 84%\n- Fresh produce share of food distributed: target 30%, actual 33%\n- Client survey responses collected: target 300, actual 212\nStaff notes on what helped and what did not: The Saturday distribution added in March helped reach working families. Two long-time volunteers moved away, and shift fill dropped in May and June. The survey was paper-only and few were returned.\nTask: Write a progress report.\nFormat: Summary, a table of targets versus results, what worked, what did not and why, what we will change.\nLimits: Use only my figures. Report the missed targets plainly. Do not use words like 'significant' unless I gave you a basis.",
      "output": "Summary\nIn the first six months we served more households and distributed more fresh produce than planned. We fell short on volunteer shift coverage and on collecting client survey responses.\n\nTargets and results\nMeasure | Target | Actual | Result\nHouseholds served | 1,200 | 1,310 | Met (109% of target)\nVolunteer shifts filled | 90% | 84% | Not met (6 points below)\nFresh produce share of food | 30% | 33% | Met (3 points above)\nClient survey responses | 300 | 212 | Not met (71% of target)\n\nWhat worked\nThe Saturday distribution added in March helped reach working families. Households served and the fresh produce share both exceeded their targets.\n\nWhat did not work, and why\nShift fill dropped in May and June after two long-time volunteers moved away. The client survey was paper-only and few copies were returned, so we collected 212 of the 300 responses we aimed for.\n\nWhat we will change\n[STAFF TO CONFIRM: the notes do not say what will change. Add the specific actions for volunteer recruitment and for the survey method.]",
      "check": [
        "Recalculate every percentage yourself (1,310 of 1,200 is 109.2%; 212 of 300 is 70.7%)",
        "Check the table against your own figures line by line",
        "Make sure the missed targets are stated plainly, not softened",
        "Write the real \"what we will change\" actions yourself"
      ]
    },
    "template": {
      "file": "impact-report-summary-for-board-template.docx",
      "label": "Impact report prompt and checklist (Word)",
      "format": "DOCX"
    },
    "cautions": [
      "AI can quietly round up or reword a result. Compare the report with your data line by line.",
      "Keep missed targets visible. Honest reporting builds trust with a board or funder.",
      "Do not paste beneficiary names or other personal details into an AI tool unless your organization has approved it."
    ],
    "faq": [
      {
        "q": "Why include the targets that were missed?",
        "a": "Boards and funders trust a report that states what did not work and why. The prompt tells the AI to report missed targets plainly so a good result cannot hide them."
      },
      {
        "q": "Why not let the AI write words like \"significant\"?",
        "a": "Words like that claim a level of importance you may not be able to support. The prompt allows them only when you give a basis, such as a statistical test."
      },
      {
        "q": "Can I use this for a funder report as well as a board summary?",
        "a": "Yes. Change the audience in the first line, for example \"writing for a funder\", and keep the same structure and rules."
      }
    ],
    "reviewer": {
      "name": "AICourseHubPro"
    },
    "lastUpdated": "2026-11-12"
  },
  "replies-to-resident-enquiries": {
    "title": "How to draft replies to resident enquiries with AI",
    "shortAnswer": "Give the AI your approved guidance and tell it to answer only from that text. You get a short, polite reply with a direct answer and a next step, and the AI says so when the guidance does not answer the question.",
    "whoFor": [
      "Customer-service and front-desk staff in city, county or town offices",
      "Planning, permits and public works staff who answer the same questions every week",
      "Communications staff who write public replies"
    ],
    "beforeYouStart": [
      "Your department's approved guidance on the topic (copy the text in)",
      "The resident's question with the name, address and case details removed",
      "The office and phone number to refer people to",
      "An AI tool approved for use with this kind of material"
    ],
    "example": {
      "task": "Reply to a resident asking whether a backyard shed needs a permit",
      "input": "Act as a courteous customer-service officer for a city planning office.\nContext: Use ONLY the approved guidance below. The resident's question is: 'Do I need a permit for a backyard shed?'\nTask: Draft a reply of under 120 words.\nFormat: A friendly greeting, a direct answer based on the guidance, the next step, and who to contact.\nLimits: If the guidance does not answer the question, say so and refer the resident to the planning office at (555) 010-0142. Do not guess. Do not promise approval.\nGuidance (fictional example):\nSheds of 120 square feet or less and no taller than 10 feet do not need a building permit but must stay at least 5 feet from side and rear property lines. Sheds over 120 square feet need a building permit before construction starts. Permit applications are made through the Planning Office.",
      "output": "Hello, and thank you for your question.\n\nIt depends on the size of the shed. A shed of 120 square feet or less and no taller than 10 feet does not need a building permit, but it must stay at least 5 feet from your side and rear property lines. A shed over 120 square feet needs a building permit before construction starts.\n\nNext step: check the size of the shed you have in mind. If it is over 120 square feet, apply for a permit through the Planning Office before you build.\n\nIf you are not sure which case applies, please call the Planning Office at (555) 010-0142.\n\nKind regards,\nCity Planning Office",
      "check": [
        "Check every number (120 square feet, 10 feet, 5 feet) against the approved guidance",
        "Make sure the reply promises no outcome, such as approval",
        "Test it with a question the guidance does not answer; the reply should refer the resident to a person",
        "Read it as a resident would: is the next step clear?"
      ]
    },
    "template": {
      "file": "replies-to-resident-enquiries-template.docx",
      "label": "Resident reply prompt and checklist (Word)",
      "format": "DOCX"
    },
    "cautions": [
      "Never paste a resident's name, address or case details into an AI tool unless it is approved for that data.",
      "Replies are often public records. Check the wording carefully before sending.",
      "Use only your approved guidance. Without it the AI answers from general knowledge, which may be wrong for your city."
    ],
    "faq": [
      {
        "q": "Why paste the guidance into the prompt?",
        "a": "Without it the AI answers from general knowledge, which may not match your city's rules. Telling it to use only your approved guidance keeps the reply accurate."
      },
      {
        "q": "What if the guidance does not answer the question?",
        "a": "The prompt tells the AI to say so and refer the resident to a named office and phone number, instead of guessing."
      },
      {
        "q": "Should a person still read every reply?",
        "a": "Yes. The AI writes a draft; a staff member checks it against the guidance and sends it."
      }
    ],
    "reviewer": {
      "name": "AICourseHubPro"
    },
    "lastUpdated": "2026-11-12"
  },
  "policy-brief-from-research-notes": {
    "title": "How to turn research notes into a policy brief or staff report with AI",
    "shortAnswer": "Paste only your own facts (inspection notes, cost quotes, budget) and ask for a standard structure with the recommendation left blank for staff. You get a draft report with gaps flagged, and the decision stays with a person.",
    "whoFor": [
      "Policy analysts and staff who write council or board reports",
      "Department heads who need an options memo from notes and quotes",
      "Staff who spend hours on the structure of a report instead of the analysis"
    ],
    "beforeYouStart": [
      "The facts you will use: notes, quotes, figures and the available budget",
      "Your organization's report sections or template",
      "An AI tool approved for your material"
    ],
    "example": {
      "task": "Draft a staff report on replacing playground structures from inspection notes and quotes",
      "input": "Act as a policy analyst writing a staff report.\nContext: Use only the facts below (fictional example): inspection summary, three cost quotes and the available budget.\nTask: Draft a staff report.\nFormat: Purpose, Background, Options (with cost and pros and cons for each), Fiscal impact, Recommendation placeholder.\nLimits: Do not add figures. Do not make a recommendation. Write [STAFF TO DECIDE] where the recommendation goes. Mark any gap with [INFORMATION NEEDED].\nFacts:\nInspection summary for Cedar Park: Structure A (installed 2001) rated 'replace' because of failed surfacing and rusted supports. Structure B (2004) rated 'repair'. Structure C (2009) rated 'monitor'.\nQuote 1: replace all three structures, $186,000.\nQuote 2: replace Structure A and repair Structure B, $94,500; Structure C monitored.\nQuote 3: replace Structure A only, $61,000.\nCapital budget available: $120,000.",
      "output": "Purpose\nTo present options for the three aging playground structures at Cedar Park.\n\nBackground\nThe inspection rated Structure A (installed 2001) 'replace' because of failed surfacing and rusted supports, Structure B (2004) 'repair', and Structure C (2009) 'monitor'. The capital budget available is $120,000.\n\nOptions\nOption 1: Replace all three structures. Cost: $186,000. Pro: addresses all three structures. Con: exceeds the available budget.\nOption 2: Replace Structure A and repair Structure B. Cost: $94,500. Structure C is monitored. Pro: covers the 'replace' and 'repair' ratings within budget. Con: Structure C is not replaced.\nOption 3: Replace Structure A only. Cost: $61,000. Pro: lowest cost and addresses the 'replace' rating. Con: Structure B's 'repair' rating is not addressed.\n\nFiscal impact\nOption 1 is $66,000 over the $120,000 budget. Option 2 is $25,500 under budget. Option 3 is $59,000 under budget.\n\nRecommendation\n[STAFF TO DECIDE]\n\nGaps\n[INFORMATION NEEDED: timeline for each option, and any ongoing maintenance cost. The facts do not include them.]",
      "check": [
        "Check every figure against the quotes and recalculate the differences from the budget yourself",
        "Resolve every [INFORMATION NEEDED] or remove the gap",
        "Write the recommendation yourself: the AI was told not to",
        "Fit the draft to your own report template before it goes to elected officials"
      ]
    },
    "template": {
      "file": "policy-brief-from-research-notes-template.docx",
      "label": "Staff report prompt and checklist (Word)",
      "format": "DOCX"
    },
    "cautions": [
      "A draft that looks complete can still contain an invented number. Recheck every figure against its source before it goes to elected officials.",
      "Keep the recommendation human. The prompt leaves it blank on purpose because a person is accountable for it.",
      "Paste only information your tool is approved to handle. Do not include confidential or personal data."
    ],
    "faq": [
      {
        "q": "Is this a policy brief or a staff report?",
        "a": "The method is the same. You give the AI the facts and a fixed list of sections, and it drafts the structure. Change the sections in the prompt to match a brief, a memo or a staff report."
      },
      {
        "q": "Why leave the recommendation blank?",
        "a": "The recommendation is a decision with consequences. The prompt tells the AI not to make one so a person writes it and is accountable for it."
      },
      {
        "q": "How do I stop the AI inventing figures?",
        "a": "Tell it to use only the facts you paste and to write [INFORMATION NEEDED] for any gap, then check every figure against the source before sharing the draft."
      }
    ],
    "reviewer": {
      "name": "AICourseHubPro"
    },
    "lastUpdated": "2026-11-12"
  },
  "public-meeting-summary": {
    "title": "How to write draft meeting minutes from rough notes with AI",
    "shortAnswer": "Give the AI your agenda and your notes, and tell it to write [NOT RECORDED] wherever a name, motion or vote is missing. You get draft minutes in the standard format, with the gaps flagged for the clerk to fill from the official record.",
    "whoFor": [
      "Clerks and administrative staff who prepare minutes",
      "Council, board or commission staff who take notes during long meetings",
      "Anyone who must publish a meeting summary quickly and accurately"
    ],
    "beforeYouStart": [
      "The official agenda",
      "Your rough notes, with names and votes as you recorded them",
      "Your minutes format (call to order, items, motions, votes, action items)",
      "An AI tool approved for meeting material"
    ],
    "example": {
      "task": "Draft minutes from rough notes and flag what was not recorded",
      "input": "Act as a clerk preparing draft minutes.\nContext: Below are my notes and the official agenda (fictional example). Names and votes are as I recorded them.\nTask: Draft the minutes.\nFormat: Call to order, items in agenda order, for each item the discussion in two sentences, motions with who moved and seconded, vote results, and action items with owner and due date.\nLimits: Use only my notes. Where a name, motion or vote is not recorded, write [NOT RECORDED]. Do not summarize anyone's position beyond what is noted.\nAgenda:\n1. Approval of previous minutes. 2. Proposal to extend library hours. 3. Park fee schedule.\nNotes:\nCalled to order 7:02 pm. Item 1: Cooper moved to approve, Diaz seconded, passed unanimously. Item 2: staff presented a proposal to open the library until 8 pm on weekdays. Discussion about staffing cost. Cooper moved to approve, Patel seconded. Passed 5-2, names of the two no votes not noted. Staff to bring cost estimate to next meeting, owner Lopez. Item 3: park fee schedule discussed, no decision, tabled to next meeting. Adjourned 9:41 pm.",
      "output": "Draft Minutes\n\nCall to order: 7:02 pm.\n\nItem 1: Approval of previous minutes. Motion to approve by Cooper, seconded by Diaz. Passed unanimously.\n\nItem 2: Proposal to extend library hours. Staff presented a proposal to open the library until 8 pm on weekdays, and the commission discussed the staffing cost. Motion to approve by Cooper, seconded by Patel. Vote: passed 5-2. Members voting no: [NOT RECORDED].\nAction item: bring a cost estimate to the next meeting. Owner: Lopez. Due date: [NOT RECORDED].\n\nItem 3: Park fee schedule. The fee schedule was discussed and no decision was made. Tabled to the next meeting. Motion to table: [NOT RECORDED].\n\nAdjournment: 9:41 pm.",
      "check": [
        "Check every name, motion and vote against the official record",
        "Resolve every [NOT RECORDED] or leave it blank, never guess",
        "Make sure nothing appears that is not in your notes",
        "Have the responsible clerk approve the minutes before publication"
      ]
    },
    "template": {
      "file": "public-meeting-summary-template.docx",
      "label": "Meeting minutes prompt and checklist (Word)",
      "format": "DOCX"
    },
    "cautions": [
      "Minutes are official records. A mistake in who voted how can create legal and political problems.",
      "The clerk must verify every motion and vote against the official record.",
      "Remove confidential or closed-session material before pasting notes into an AI tool."
    ],
    "faq": [
      {
        "q": "Why does the prompt use [NOT RECORDED]?",
        "a": "Without a rule, AI invents motions, votes and names to make the minutes look complete. The mark shows exactly what your notes did not capture."
      },
      {
        "q": "Can AI replace the clerk?",
        "a": "No. It drafts the structure from your notes. The clerk checks every name, motion and vote and approves the final minutes."
      },
      {
        "q": "Can I use my own minutes format?",
        "a": "Yes. Replace the format line in the prompt with your own sections, such as call to order, items, motions with mover and seconder, votes and action items."
      }
    ],
    "reviewer": {
      "name": "AICourseHubPro"
    },
    "lastUpdated": "2026-11-12"
  },
  "job-description": {
    "title": "How to write a job description with AI",
    "shortAnswer": "Describe the company, the role and what success looks like in year one, and set limits on requirements and jargon. You get a focused job description with outcomes, a short must-have list and inclusive wording, ready for the hiring manager to confirm.",
    "whoFor": [
      "HR generalists and recruiters who turn a hiring request into a posting",
      "Hiring managers who write their own job descriptions",
      "Small businesses hiring without a dedicated HR team"
    ],
    "beforeYouStart": [
      "Company size and type, and where the role is based",
      "What the person will be responsible for and who they report to",
      "Three outcomes you expect in the first year",
      "An AI tool your organization allows"
    ],
    "example": {
      "task": "Turn a one-line hiring request into a job description",
      "input": "Act as an experienced recruiter.\nContext: We are a 120-person B2B software company. The Customer Success Manager owns renewals for about 40 mid-size customers and reports to the Head of Customer Success. Remote within the US.\nTask: Write a job description.\nFormat: Sections for About the role, What you will achieve in the first year (3 outcomes), Must-have skills (max 4), Nice-to-have skills (max 3), and What we offer. Add the placeholder [SALARY RANGE].\nLimits: Plain, inclusive language. No jargon like \"rockstar\" or \"ninja\". Do not require a degree unless I say so.",
      "output": "Customer Success Manager (Remote, US)\n\nAbout the role\nYou will look after renewals for about 40 mid-size customers at a 120-person B2B software company. You report to the Head of Customer Success and work remotely from anywhere in the US.\n\nWhat you will achieve in the first year\n- Build a trusted relationship with each customer you look after\n- Keep your group of customers renewing, and spot any at risk early\n- Share what customers tell you with the rest of the company\n\nMust-have skills\n- Experience managing customer accounts or renewals\n- Clear written and spoken communication\n- Comfort working with customer data\n- Able to plan your own time while working remotely\n\nNice-to-have skills\n- Experience with B2B software\n- Familiarity with a customer success or CRM tool\n- Experience working with a remote team\n\nWhat we offer\n[SALARY RANGE]. Remote work within the US. [BENEFITS: HR TO ADD]",
      "check": [
        "Confirm every requirement is truly needed, and move at least one to nice-to-have",
        "Replace the benefits placeholder with what you actually offer, and fill in the real salary range",
        "Check that no vague buzzwords or exaggerated requirements crept in",
        "Have the hiring manager confirm the final posting before it goes live"
      ]
    },
    "template": {
      "file": "job-description-template.docx",
      "label": "Job description prompt and checklist (Word)",
      "format": "DOCX"
    },
    "cautions": [
      "AI tends to inflate requirements and may copy outdated wording. Check that every requirement is truly needed.",
      "Have the hiring manager confirm the final posting before it goes live.",
      "Check pay-transparency and equal-opportunity rules that apply where you hire."
    ],
    "faq": [
      {
        "q": "Why limit the must-have skills to four?",
        "a": "A shorter list brings in more qualified applicants. Long requirement lists put off good candidates and inflate the role."
      },
      {
        "q": "Why describe outcomes instead of duties?",
        "a": "Outcomes show candidates what they would achieve in the role, which helps the right people decide whether to apply."
      },
      {
        "q": "How do I keep the wording inclusive?",
        "a": "Set it as a limit in the prompt: plain language, no jargon, and no degree requirement unless you say so. Then read the result yourself."
      }
    ],
    "reviewer": {
      "name": "AICourseHubPro"
    },
    "lastUpdated": "2026-11-12"
  },
  "performance-review": {
    "title": "How to write a fair performance review with AI",
    "shortAnswer": "Give the AI the manager's notes and the role expectations, and require an example for every point. You get a structured review that separates opinions with no evidence, so the manager must support them or drop them.",
    "whoFor": [
      "Managers who write reviews at the last minute",
      "HR partners who help managers prepare reviews",
      "Small teams that want every employee judged by the same standard"
    ],
    "beforeYouStart": [
      "The manager's notes for the review period, with names removed",
      "The role expectations or goals",
      "An AI tool your organization has approved for HR material"
    ],
    "example": {
      "task": "Draft a six-month review from notes that mix facts with opinions",
      "input": "Act as an HR partner helping a manager write a fair review.\nContext: Notes about the employee's last six months (fictional example, no names): Resolved an average of 52 tickets a week against a goal of 45. Wrote 6 help-centre articles in March after a spike in password-reset tickets; those tickets fell from 38 to 21 a month. Customer satisfaction score 91% against a goal of 90%. Missed 3 of 6 weekly stand-ups in April without notice. Helped train two new hires in May. Has an attitude. Not a team player. Role expectations: resolve 45 tickets a week, keep satisfaction at or above 90%, attend team stand-ups, document recurring issues.\nTask: Draft a review with four sections: Strengths, Results against goals, Areas to develop, and Goals for the next six months.\nFormat: For every point, include a specific example from the notes. If a note is an opinion without an example, list it separately under \"Needs evidence before use\".\nLimits: Describe behavior and results, not personality. Use the same standard you would apply to anyone in the role.",
      "output": "Strengths\n- Documents recurring issues: wrote 6 help-centre articles in March after a spike in password-reset tickets; those tickets fell from 38 to 21 a month.\n- Supports colleagues: helped train two new hires in May.\n\nResults against goals\n- Tickets: averaged 52 a week against a goal of 45.\n- Customer satisfaction: 91% against a goal of 90%.\n- Team stand-ups: missed 3 of 6 weekly stand-ups in April without notice, against the expectation to attend.\n\nAreas to develop\n- Attendance at weekly stand-ups, or giving notice when unable to attend.\n\nGoals for the next six months\n- Keep ticket volume and satisfaction at or above current levels.\n- Attend stand-ups, or give notice in advance.\n- Continue documenting recurring issues.\n\nNeeds evidence before use\n- \"Has an attitude\": no example given.\n- \"Not a team player\": no example given. (The notes show the employee helped train two new hires, so this needs specific examples before it can be used.)",
      "check": [
        "Check every example and figure with the manager and the records",
        "Make sure the opinions listed under \"Needs evidence\" are either supported with specific behavior or dropped",
        "Check the wording describes actions and results, not character",
        "Ask yourself whether you would be comfortable if the employee read it"
      ]
    },
    "template": {
      "file": "performance-review-template.docx",
      "label": "Performance review prompt and checklist (Word)",
      "format": "DOCX"
    },
    "cautions": [
      "Never paste real names or sensitive details into an AI tool unless your organization has approved that use.",
      "The manager owns the review. Read every line and change anything that is not accurate.",
      "Check your local employment rules and your own policy before a review is shared with the employee."
    ],
    "faq": [
      {
        "q": "Why does the review separate opinions from evidence?",
        "a": "An opinion such as \"has an attitude\" gives the employee nothing to act on and can be unfair. The prompt flags it so the manager adds a specific example or drops it."
      },
      {
        "q": "Can AI write the whole review?",
        "a": "It drafts the structure from the manager's notes. The manager remains responsible for the content and must check every line."
      },
      {
        "q": "How does this help fairness?",
        "a": "The same structure and the same evidence rule apply to every employee, so reviews are judged by one standard."
      }
    ],
    "reviewer": {
      "name": "AICourseHubPro"
    },
    "lastUpdated": "2026-11-12"
  },
  "onboarding-plan": {
    "title": "How to build a 30-60-90 day onboarding plan with AI",
    "shortAnswer": "Tell the AI the role, the manager, the tools and the first-quarter goal, and ask it to flag anything the manager must confirm. You get a practical 30-60-90 day plan with a Week 1 checklist that a new hire can follow.",
    "whoFor": [
      "HR business partners and people-operations staff",
      "Managers with a new hire starting soon and no onboarding plan",
      "Small companies that have no standard onboarding"
    ],
    "beforeYouStart": [
      "The role, team and start date",
      "The manager's name and the tools the new hire will use",
      "The first-quarter goal",
      "An AI tool your organization allows"
    ],
    "example": {
      "task": "Draft a 30-60-90 day plan for a new Data Analyst",
      "input": "Act as an HR business partner.\nContext: A Data Analyst joins our marketing team on Monday 7 December (fictional example). Manager: Sam Ortiz. Tools they will use: SQL, Looker, Google Sheets. First-quarter goal: build the weekly campaign performance report.\nTask: Draft a 30-60-90 day onboarding plan.\nFormat: Three sections, one for each period, each with 3 to 4 concrete actions and one success measure. Add a Week 1 checklist.\nLimits: Keep it practical. Mark anything the manager must confirm with [CONFIRM].",
      "output": "First 30 days: learn the tools and the data\n- Get access to SQL, Looker and Google Sheets [CONFIRM: who grants access, and by what date]\n- Meet Sam Ortiz weekly and meet the marketing team\n- Review the current campaign reports and where their data comes from\n- Shadow the person who builds the report today [CONFIRM: who this is]\nSuccess measure: can explain how the current weekly campaign report is built.\n\nDays 31 to 60: build the report\n- Draft the weekly campaign performance report in Looker\n- Agree the key measures with Sam Ortiz\n- Check the draft against the existing numbers\n- Present a draft to the marketing team [CONFIRM: date and audience]\nSuccess measure: a draft report that matches the existing numbers.\n\nDays 61 to 90: run it\n- Publish the weekly report on schedule\n- Collect feedback from the team and improve the report\n- Document how the report is built\nSuccess measure: the weekly campaign performance report is published every week without help.\n\nWeek 1 checklist\n- Laptop and accounts ready [CONFIRM]\n- Welcome meeting with Sam Ortiz\n- Introductions to the marketing team\n- Access to SQL, Looker and Google Sheets\n- Read the first-quarter goal and the current report",
      "check": [
        "Resolve every [CONFIRM] with the manager, or assign it to someone",
        "Check every tool, name and date against your real systems",
        "Make sure each period has actions and one success measure",
        "Show the plan to the manager before it goes to the new hire"
      ]
    },
    "template": {
      "file": "onboarding-plan-template.docx",
      "label": "30-60-90 day plan prompt and checklist (Word)",
      "format": "DOCX"
    },
    "cautions": [
      "The AI does not know your systems, access rules or team norms. Check every tool, name and date.",
      "Do not send the plan to a new hire until the manager has reviewed it.",
      "Do not paste personal details about the new hire into a public AI tool."
    ],
    "faq": [
      {
        "q": "Why does the prompt ask for [CONFIRM] marks?",
        "a": "The AI cannot know who grants access or what your team does. The marks show the manager exactly what to check instead of leaving guesses in the plan."
      },
      {
        "q": "Why give each period a success measure?",
        "a": "A measure tells everyone what good looks like at 30, 60 and 90 days, so progress is not a matter of opinion."
      },
      {
        "q": "Can I use this for any role?",
        "a": "Yes. Replace the role, team, tools and goal in the prompt. The structure stays the same."
      }
    ],
    "reviewer": {
      "name": "AICourseHubPro"
    },
    "lastUpdated": "2026-11-12"
  },
  "spreadsheet-to-executive-report": {
    "title": "How to turn a spreadsheet into an executive report with AI",
    "shortAnswer": "Paste your figures for two periods and ask for a fixed structure: headline, table, three points and one question, with [REASON NEEDED] wherever the data cannot explain a change. You get a short report leaders can read, and you recalculate the changes before sending.",
    "whoFor": [
      "Analysts and operations staff who write a weekly or monthly summary",
      "Managers who report key numbers to senior leaders",
      "Small businesses that track results in a spreadsheet"
    ],
    "beforeYouStart": [
      "Two periods of your key figures (for example this week and last week)",
      "Your audience and the word limit you want",
      "A spreadsheet to recalculate the changes",
      "An AI tool your organization allows"
    ],
    "example": {
      "task": "Write a weekly KPI summary from two weeks of figures",
      "input": "Act as a business analyst writing for senior leaders.\nContext: Use only the figures below, week ending 14 June and week ending 21 June 2026 (practice data from the course).\nTask: Write the weekly KPI summary.\nFormat: Headline (one sentence), a table of KPIs with change in value and percent, three things that went well or badly, one question for leaders.\nLimits: Do not add figures. For any reason you cannot support with the data, write [REASON NEEDED]. Under 200 words.\nFigures:\nWeek_Ending,Orders,Revenue_USD,Avg_Order_Value_USD,Return_Rate_Pct,Avg_Rating,Support_Tickets\n2026-06-14,262,16820,64.20,7.6,4.3,48\n2026-06-21,248,15940,64.27,9.2,4.2,61",
      "output": "Headline: Revenue fell 5.2% week on week, while returns and support tickets rose.\n\nKPI | 14 Jun | 21 Jun | Change\nOrders | 262 | 248 | -5.3%\nRevenue | $16,820 | $15,940 | -5.2%\nAvg order value | $64.20 | $64.27 | +0.1%\nReturn rate | 7.6% | 9.2% | +1.6 points\nAvg rating | 4.3 | 4.2 | -0.1\nSupport tickets | 48 | 61 | +27.1%\n\nWhat went badly\n- Orders and revenue both fell by about 5%. [REASON NEEDED]\n- Return rate rose from 7.6% to 9.2% and support tickets rose 27.1%. [REASON NEEDED]\nWhat went well\n- Average order value was roughly flat (+0.1%).\n\nQuestion for leaders: should we investigate the rise in returns and support tickets this week?",
      "check": [
        "Recalculate at least three of the changes yourself (for example 15,940 against 16,820 is -5.2%)",
        "Resolve each [REASON NEEDED] with a real reason, or leave it flagged",
        "Check that no figure appears that is not in your table",
        "Keep the same structure every week so leaders know where to look"
      ]
    },
    "template": {
      "file": "spreadsheet-to-executive-report-template.docx",
      "label": "Executive KPI report prompt and checklist (Word)",
      "format": "DOCX"
    },
    "cautions": [
      "A summary that looks polished can still contain a wrong percentage. Recalculate the changes before you send.",
      "Do not paste customer names, emails or confidential data into an AI tool unless it is approved for that data.",
      "Do not let the AI explain a change the data cannot support. Keep the [REASON NEEDED] marks until you have a real reason."
    ],
    "faq": [
      {
        "q": "Why use a fixed structure each week?",
        "a": "Leaders learn where to look, and you save time. The prompt repeats the same sections every period."
      },
      {
        "q": "Why does the prompt say not to add figures?",
        "a": "AI may add numbers or reasons that are not in your table. The rule keeps the report to your data and the flag shows where context is missing."
      },
      {
        "q": "Can I use this for a monthly report?",
        "a": "Yes. Change the period names and the word limit in the prompt. The structure and rules stay the same."
      }
    ],
    "reviewer": {
      "name": "AICourseHubPro"
    },
    "lastUpdated": "2026-11-12"
  },
  "lesson-plan": {
    "title": "How to write a lesson plan with AI",
    "shortAnswer": "Describe the lesson length, topic, class size and level, and what students already know, then set a timed format and ask for [CHECK] marks on facts. You get a lesson plan with a clear objective, timings that add up and an understanding check, and you adapt it to your class.",
    "whoFor": [
      "Classroom teachers who spend hours planning",
      "Teachers planning a lesson on an unfamiliar topic",
      "School leaders who want a consistent planning structure"
    ],
    "beforeYouStart": [
      "The topic, grade or subject, and lesson length",
      "Class size and a short description of the level",
      "What students already know",
      "An AI tool your school allows"
    ],
    "example": {
      "task": "Plan a 45-minute Grade 6 science lesson on the water cycle",
      "input": "Act as an experienced Grade 6 science teacher.\nContext: A 45-minute lesson on the water cycle. 26 students, mixed reading levels. They already know that water can be a liquid, a solid or a gas.\nTask: Write a lesson plan.\nFormat: Learning objective, a timed schedule (starter 5 minutes, teaching 12, group activity 18, wrap-up 10), materials needed, and one question to check understanding at the end.\nLimits: Use only well-established facts. Mark anything I should verify with [CHECK].",
      "output": "Learning objective\nStudents can describe the main stages of the water cycle (evaporation, condensation, precipitation, collection) in their own words.\n\nTimed schedule (45 minutes)\n- 0 to 5 min, starter: ask \"Where does a puddle go on a sunny day?\" and collect ideas.\n- 5 to 17 min, teaching: introduce the four stages with a simple diagram, linking each to what students know about liquid, solid and gas. [CHECK: wording of each stage for the Grade 6 curriculum]\n- 17 to 35 min, group activity: groups of four build a labeled water cycle poster and explain it to another group. Pair stronger readers with those who need support.\n- 35 to 45 min, wrap-up: each group shares one stage in a sentence; recap the cycle.\n\nMaterials needed\nDiagram handout, chart paper, markers, sentence starters for mixed reading levels.\n\nCheck for understanding\n\"Describe what happens to water from a puddle until it falls again as rain.\"\n\nFacts to verify\n[CHECK: ensure the diagram shows condensation forming clouds and that precipitation includes rain, snow and hail]",
      "check": [
        "Check that the timings add up to your real lesson length (5 + 12 + 18 + 10 = 45)",
        "Resolve every [CHECK] item yourself against your curriculum",
        "Change at least one activity so it suits your room, class and resources",
        "Decide how you will check understanding, and whether the question fits your students"
      ]
    },
    "template": {
      "file": "lesson-plan-template.docx",
      "label": "Lesson plan prompt and checklist (Word)",
      "format": "DOCX"
    },
    "cautions": [
      "AI plans can look polished and still be unrealistic for your room, time or curriculum. Treat the plan as a draft you adapt.",
      "Verify facts yourself, especially anything the AI marked [CHECK].",
      "Do not paste student names or other personal data into an AI tool."
    ],
    "faq": [
      {
        "q": "Why give the AI the lesson timings?",
        "a": "With timings in the prompt, the plan fits your real lesson instead of a generic outline."
      },
      {
        "q": "Why describe my class?",
        "a": "Class size and reading levels shape which activities work. Without them the AI gives a generic plan."
      },
      {
        "q": "Do I still need to check the facts?",
        "a": "Yes. The prompt asks the AI to mark facts to verify with [CHECK], and you confirm each one against your curriculum."
      }
    ],
    "reviewer": {
      "name": "AICourseHubPro"
    },
    "lastUpdated": "2026-11-12"
  },
  "automate-weekly-report": {
    "title": "How to automate a recurring weekly or monthly report with AI",
    "shortAnswer": "Turn the report you write every period into a reusable prompt with fixed sections, then paste in only that period's numbers and notes. You get the same report structure each time, with any missing reason flagged so nothing is invented.",
    "whoFor": [
      "Operations and admin staff who write the same report every week or month",
      "Team leads who summarize numbers and notes for managers",
      "Anyone who wants to save time on repeated documents"
    ],
    "beforeYouStart": [
      "A report you already write regularly, with its usual sections",
      "This period's numbers and a few bullet notes",
      "An AI tool your organization allows"
    ],
    "example": {
      "task": "Write the monthly operations report from numbers and notes",
      "input": "Act as an operations analyst writing a monthly report.\nContext: Use only the numbers and notes below (fictional warehouse example).\nTask: Write the report.\nFormat: Headline summary (2 sentences), Key numbers (table), What changed and why (3 bullets), Next month (3 bullets).\nLimits: Do not add any figure that is not provided. If a reason is missing, write [REASON NEEDED].\nNumbers:\nOrders shipped: October 4,820, September 4,610\nOn-time shipping: October 94.1%, September 95.6%\nAverage pick time: October 6.2 min, September 6.8 min\nDamage claims: October 31, September 24\nNotes:\nAisle re-slotting finished on 9 October. Peak-season hiring started in the second half of October and 11 temporary staff joined. No note on the cause of the rise in damage claims.",
      "output": "Headline summary\nWe shipped more orders in October and picked them faster, but on-time shipping slipped and damage claims rose.\n\nKey numbers\nMeasure | September | October | Change\nOrders shipped | 4,610 | 4,820 | +4.6%\nOn-time shipping | 95.6% | 94.1% | -1.5 points\nAverage pick time | 6.8 min | 6.2 min | -8.8%\nDamage claims | 24 | 31 | +29.2%\n\nWhat changed and why\n- Average pick time fell after aisle re-slotting finished on 9 October.\n- 11 temporary staff joined in the second half of October as peak-season hiring started.\n- Damage claims rose from 24 to 31. [REASON NEEDED]\n\nNext month\n- Continue onboarding the 11 temporary staff.\n- [INFORMATION NEEDED: plan to reduce damage claims]\n- [INFORMATION NEEDED: reason for the drop in on-time shipping and the plan to recover it]",
      "check": [
        "Check every figure against your source and recalculate the changes (for example 31 against 24 is +29.2%)",
        "Resolve every [REASON NEEDED] and [INFORMATION NEEDED]",
        "Run the same prompt with a different month to check the structure stays the same",
        "Review the report before it is sent"
      ]
    },
    "template": {
      "file": "automate-weekly-report-template.docx",
      "label": "Recurring report prompt and checklist (Word)",
      "format": "DOCX"
    },
    "cautions": [
      "Check every figure against your source. A report that looks professional but has a wrong number is worse than a slow one.",
      "Do not paste confidential or personal data into an AI tool that is not approved for it.",
      "Keep a person responsible for reviewing the report before it goes out."
    ],
    "faq": [
      {
        "q": "What makes this \"automation\"?",
        "a": "You write the prompt once with fixed sections. Each period you paste only the new numbers and notes, which turns an hour of writing into minutes of checking."
      },
      {
        "q": "Why does the structure stay the same every month?",
        "a": "The format line in the prompt fixes the sections, so the report looks the same each time."
      },
      {
        "q": "What stops the AI inventing numbers?",
        "a": "The prompt says to add no figure that is not provided and to write a flag when something is missing. You then fill or remove each flag yourself."
      }
    ],
    "reviewer": {
      "name": "AICourseHubPro"
    },
    "lastUpdated": "2026-11-12"
  }
};
