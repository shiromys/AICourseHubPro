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
  "ai-for-nonprofits": {
    "outcome": "Write donor, volunteer and board communications, grant sections and impact reports with AI, using only your true facts and without overstating your impact.",
    "whoFor": [
      "Communications and fundraising staff at small and mid-size non-profits",
      "Program managers who write reports and funder updates",
      "Volunteer coordinators who send recruitment and thank-you messages",
      "Executive directors and board members who review AI-assisted drafts"
    ],
    "produces": [
      "A reusable prompt starter kit and a voice guide for your organization",
      "A volunteer and community communications pack",
      "A donor email series, a grant section and an impact report",
      "A one-page AI use policy for your organization",
      "A 90-day AI adoption plan"
    ],
    "workedExample": {
      "task": "Write a six-month progress summary for a board, including a missed target (example for a fictional organization, for illustration)",
      "input": "Act as a program evaluator writing for a board and funders.\nContext: Targets and results for January to June (Northside Food Pantry, a fictional example):\n- Households served: target 1,200, actual 1,310\n- Volunteer shifts filled: target 90%, actual 84%\n- Fresh produce share of food distributed: target 30%, actual 33%\n- Client survey responses collected: target 300, actual 212\nStaff notes on what helped and what did not: The Saturday distribution added in March helped reach working families. Two long-time volunteers moved away, and shift fill dropped in May and June. The survey was paper-only and few were returned.\nTask: Write a progress report.\nFormat: Summary, a table of targets versus results, what worked, what did not and why, what we will change.\nLimits: Use only my figures. Report the missed targets plainly. Do not use words like 'significant' unless I gave you a basis.",
      "result": "Summary\nIn the first six months we served more households and distributed more fresh produce than planned. We fell short on volunteer shift coverage and on collecting client survey responses.\n\nTargets and results\nMeasure | Target | Actual | Result\nHouseholds served | 1,200 | 1,310 | Met (109% of target)\nVolunteer shifts filled | 90% | 84% | Not met (6 points below)\nFresh produce share of food | 30% | 33% | Met (3 points above)\nClient survey responses | 300 | 212 | Not met (71% of target)\n\nWhat worked\nThe Saturday distribution added in March helped reach working families. Households served and the fresh produce share both exceeded their targets.\n\nWhat did not work, and why\nShift fill dropped in May and June after two long-time volunteers moved away. The client survey was paper-only and few copies were returned, so we collected 212 of the 300 responses we aimed for.\n\nWhat we will change\n[STAFF TO CONFIRM: the notes do not say what will change. Add the specific actions for volunteer recruitment and for the survey method.]",
      "check": "- Recalculate every percentage yourself (1,310 of 1,200 is 109.2%; 212 of 300 is 70.7%)\n- Check the table against your own figures line by line\n- Make sure the missed targets are stated plainly, not softened\n- Write the real \"what we will change\" actions yourself"
    },
    "modules": [
      {
        "summary": "Learn the five parts of a clear prompt, keep AI use aligned with your mission, and improve drafts with follow-ups."
      },
      {
        "summary": "Draft outreach, volunteer recruitment and program documents, and learn how to fix common prompting problems."
      },
      {
        "summary": "Write fundraising content, grant proposals and impact reports, with a clear view of the ethical limits of each."
      },
      {
        "summary": "Handle bias, the privacy of donors, volunteers and beneficiaries, and transparency, and write your own AI use policy."
      },
      {
        "summary": "Choose first uses for a small team, measure what works and plan how to scale."
      },
      {
        "summary": "Complete a campaign from start to finish, then take the final assessment."
      }
    ],
    "faq": [
      {
        "q": "Will AI invent impact figures or stories for my reports?",
        "a": "It can, if you let it. The course teaches you to give the AI only true facts, to tell it to use nothing else, and to check every figure and claim against your own records before anything is published."
      },
      {
        "q": "Can I paste donor or beneficiary details into an AI tool?",
        "a": "Module 4 covers this in detail: what is safe to share, what to remove or anonymize first, and how to write a policy so your whole team follows the same rules."
      },
      {
        "q": "Do I need to be a good writer or know about AI already?",
        "a": "No. Each lesson starts with a real situation, shows a weak prompt and a strong one, and gives you a template to copy and adapt."
      },
      {
        "q": "Is there any practice beyond reading?",
        "a": "Yes. Every module ends with a project, there is a simulation of engaging a hesitant donor, and the course finishes with a capstone and a final assessment."
      },
      {
        "q": "Do I need a paid AI tool?",
        "a": "No. The exercises work with a free account of ChatGPT, Claude or another assistant, or the tool your organization has approved. You paste the prompts from the lessons into the tool you already use, so the course does not depend on any one product."
      }
    ]
  },
  "ai-for-local-government": {
    "outcome": "Draft clear public notices, resident replies, meeting summaries and staff reports with AI in plain language, with every fact checked before it goes out.",
    "whoFor": [
      "Communications and public information staff in cities, counties and districts",
      "Clerks and administrators who write notices, minutes and reports",
      "Department staff who answer resident enquiries",
      "Managers responsible for AI use policy in a public body"
    ],
    "produces": [
      "A public-service prompt starter kit",
      "A plain-language notice and a resident FAQ",
      "A meeting minutes summary and a staff report draft",
      "A one-page AI use guideline for your department",
      "A 90-day AI adoption plan"
    ],
    "workedExample": {
      "task": "Reply to a resident asking whether a backyard shed needs a permit (example for a fictional organization, for illustration)",
      "input": "Act as a courteous customer-service officer for a city planning office.\nContext: Use ONLY the approved guidance below. The resident's question is: 'Do I need a permit for a backyard shed?'\nTask: Draft a reply of under 120 words.\nFormat: A friendly greeting, a direct answer based on the guidance, the next step, and who to contact.\nLimits: If the guidance does not answer the question, say so and refer the resident to the planning office at (555) 010-0142. Do not guess. Do not promise approval.\nGuidance (fictional example):\nSheds of 120 square feet or less and no taller than 10 feet do not need a building permit but must stay at least 5 feet from side and rear property lines. Sheds over 120 square feet need a building permit before construction starts. Permit applications are made through the Planning Office.",
      "result": "Hello, and thank you for your question.\n\nIt depends on the size of the shed. A shed of 120 square feet or less and no taller than 10 feet does not need a building permit, but it must stay at least 5 feet from your side and rear property lines. A shed over 120 square feet needs a building permit before construction starts.\n\nNext step: check the size of the shed you have in mind. If it is over 120 square feet, apply for a permit through the Planning Office before you build.\n\nIf you are not sure which case applies, please call the Planning Office at (555) 010-0142.\n\nKind regards,\nCity Planning Office",
      "check": "- Check every number (120 square feet, 10 feet, 5 feet) against the approved guidance\n- Make sure the reply promises no outcome, such as approval\n- Test it with a question the guidance does not answer; the reply should refer the resident to a person\n- Read it as a resident would: is the next step clear?"
    },
    "modules": [
      {
        "summary": "Learn the five parts of a clear prompt for public-service writing, what AI can and cannot do, and how to improve a draft in plain language."
      },
      {
        "summary": "Draft public notices and resident replies, build awareness content, and keep communication ethical and responsible."
      },
      {
        "summary": "Draft documents and reports, summarize policy and procedure, produce meeting minutes and support routine workflows."
      },
      {
        "summary": "Cover accuracy and reliability, bias and fairness, data privacy and public records, and transparency and accountability."
      },
      {
        "summary": "Choose first use cases, fit them into daily work, and measure impact."
      },
      {
        "summary": "Complete a service change from start to finish, then take the final assessment."
      }
    ],
    "faq": [
      {
        "q": "Is it safe to use AI for official notices?",
        "a": "AI should draft, and a person should approve. The course shows how to supply the official facts, tell the AI to use nothing else, and check every date, place and number against the source before publishing."
      },
      {
        "q": "What about public records and resident privacy?",
        "a": "Module 4 has a lesson on data privacy, public records and confidentiality, including what never to paste into an AI tool."
      },
      {
        "q": "Does the course cover plain language?",
        "a": "Yes. Writing at a level residents can read is built into the templates, and one lesson focuses on plain language and improving drafts."
      },
      {
        "q": "Is there practice for difficult situations?",
        "a": "Yes. A simulation lets you practice de-escalating a citizen complaint, and each module ends with a project."
      },
      {
        "q": "Do I need a paid AI tool?",
        "a": "No. The exercises work with a free account of ChatGPT, Claude or another assistant, or the tool your organization has approved. You paste the prompts from the lessons into the tool you already use, so the course does not depend on any one product."
      }
    ]
  },
  "ai-for-hr": {
    "outcome": "Draft job descriptions, outreach, onboarding plans, reviews and employee communications with AI, while keeping every people decision with a human.",
    "whoFor": [
      "HR generalists and people operations staff",
      "Recruiters and talent acquisition coordinators",
      "Managers who write job posts, onboarding plans and performance reviews",
      "Small-business owners who handle HR themselves"
    ],
    "produces": [
      "An HR prompt starter kit",
      "A complete hiring kit for one role",
      "A new-hire onboarding pack",
      "A review-cycle toolkit",
      "A one-page AI use guideline for your team and a 90-day adoption plan"
    ],
    "workedExample": {
      "task": "Turn a one-line hiring request into a job description (example for a fictional organization, for illustration)",
      "input": "Act as an experienced recruiter.\nContext: We are a 120-person B2B software company. The Customer Success Manager owns renewals for about 40 mid-size customers and reports to the Head of Customer Success. Remote within the US.\nTask: Write a job description.\nFormat: Sections for About the role, What you will achieve in the first year (3 outcomes), Must-have skills (max 4), Nice-to-have skills (max 3), and What we offer. Add the placeholder [SALARY RANGE].\nLimits: Plain, inclusive language. No jargon like \"rockstar\" or \"ninja\". Do not require a degree unless I say so.",
      "result": "Customer Success Manager (Remote, US)\n\nAbout the role\nYou will look after renewals for about 40 mid-size customers at a 120-person B2B software company. You report to the Head of Customer Success and work remotely from anywhere in the US.\n\nWhat you will achieve in the first year\n- Build a trusted relationship with each customer you look after\n- Keep your group of customers renewing, and spot any at risk early\n- Share what customers tell you with the rest of the company\n\nMust-have skills\n- Experience managing customer accounts or renewals\n- Clear written and spoken communication\n- Comfort working with customer data\n- Able to plan your own time while working remotely\n\nNice-to-have skills\n- Experience with B2B software\n- Familiarity with a customer success or CRM tool\n- Experience working with a remote team\n\nWhat we offer\n[SALARY RANGE]. Remote work within the US. [BENEFITS: HR TO ADD]",
      "check": "- Confirm every requirement is truly needed, and move at least one to nice-to-have\n- Replace the benefits placeholder with what you actually offer, and fill in the real salary range\n- Check that no vague buzzwords or exaggerated requirements crept in\n- Have the hiring manager confirm the final posting before it goes live"
    },
    "modules": [
      {
        "summary": "Learn the five parts of a clear prompt, how to improve answers with follow-ups, and what AI should draft versus what a human must decide."
      },
      {
        "summary": "Write job descriptions and outreach, apply clear screening criteria, and prepare interview questions and scorecards."
      },
      {
        "summary": "Build 30-60-90 day onboarding plans, announcements and difficult messages, and an employee FAQ."
      },
      {
        "summary": "Draft fair performance reviews, coach managers on feedback and find themes in survey comments."
      },
      {
        "summary": "Spot bias in prompts and outputs, know what never to paste into an AI tool, and draft policy with legal review."
      },
      {
        "summary": "Choose your first use cases, run a small pilot and measure results."
      },
      {
        "summary": "Take one hire from start to finish, then complete the final assessment."
      }
    ],
    "faq": [
      {
        "q": "Can AI decide who to hire or how to rate someone?",
        "a": "No, and the course says so plainly. It teaches what AI should draft and what a human must decide, and shows how to screen with clear written criteria rather than hand the decision to a tool."
      },
      {
        "q": "How does the course deal with bias?",
        "a": "Module 5 covers spotting bias in both prompts and outputs, and gives you checks to apply before anything is used."
      },
      {
        "q": "What employee information is safe to paste into an AI tool?",
        "a": "A whole lesson covers what never to paste, so you know what to remove or leave out first."
      },
      {
        "q": "Is there practice with a hard conversation?",
        "a": "Yes. A simulation has you screen a difficult candidate, and every module ends with a project."
      },
      {
        "q": "Do I need a paid AI tool?",
        "a": "No. The exercises work with a free account of ChatGPT, Claude or another assistant, or the tool your company has approved. You paste the prompts from the lessons into the tool you already use, so the course does not depend on any one product."
      }
    ]
  },
  "ai-for-business-analytics": {
    "outcome": "Turn spreadsheet data into checked summaries, KPI reports and executive briefings with AI, and verify every number before you share it.",
    "whoFor": [
      "Analysts and operations staff who report on business data",
      "Managers who write weekly KPI summaries",
      "Finance, sales and marketing staff who work in spreadsheets",
      "Anyone who must brief leaders on numbers"
    ],
    "produces": [
      "An analysis prompt starter kit",
      "A data-cleaning prompt kit",
      "A weekly KPI summary and an executive summary",
      "An analysis review checklist and guideline",
      "A 90-day analytics adoption plan"
    ],
    "workedExample": {
      "task": "Write a weekly KPI summary from two weeks of figures (example for a fictional organization, for illustration)",
      "input": "Act as a business analyst writing for senior leaders.\nContext: Use only the figures below, week ending 14 June and week ending 21 June 2026 (practice data from the course).\nTask: Write the weekly KPI summary.\nFormat: Headline (one sentence), a table of KPIs with change in value and percent, three things that went well or badly, one question for leaders.\nLimits: Do not add figures. For any reason you cannot support with the data, write [REASON NEEDED]. Under 200 words.\nFigures:\nWeek_Ending,Orders,Revenue_USD,Avg_Order_Value_USD,Return_Rate_Pct,Avg_Rating,Support_Tickets\n2026-06-14,262,16820,64.20,7.6,4.3,48\n2026-06-21,248,15940,64.27,9.2,4.2,61",
      "result": "Headline: Revenue fell 5.2% week on week, while returns and support tickets rose.\n\nKPI | 14 Jun | 21 Jun | Change\nOrders | 262 | 248 | -5.3%\nRevenue | $16,820 | $15,940 | -5.2%\nAvg order value | $64.20 | $64.27 | +0.1%\nReturn rate | 7.6% | 9.2% | +1.6 points\nAvg rating | 4.3 | 4.2 | -0.1\nSupport tickets | 48 | 61 | +27.1%\n\nWhat went badly\n- Orders and revenue both fell by about 5%. [REASON NEEDED]\n- Return rate rose from 7.6% to 9.2% and support tickets rose 27.1%. [REASON NEEDED]\nWhat went well\n- Average order value was roughly flat (+0.1%).\n\nQuestion for leaders: should we investigate the rise in returns and support tickets this week?",
      "check": "- Recalculate at least three of the changes yourself (for example 15,940 against 16,820 is -5.2%)\n- Resolve each [REASON NEEDED] with a real reason, or leave it flagged\n- Check that no figure appears that is not in your table\n- Keep the same structure every week so leaders know where to look"
    },
    "modules": [
      {
        "summary": "Learn the five parts of a clear analysis prompt, what AI can and cannot do with data, and how to improve analysis with follow-ups. A practice data pack is included."
      },
      {
        "summary": "Describe your data, turn business goals into questions, clean and prepare data with prompts, and avoid common mistakes."
      },
      {
        "summary": "Produce weekly KPI summaries, data narratives, stakeholder-specific reports and executive summaries."
      },
      {
        "summary": "Verify AI-generated insights, catch bias and misreading, protect data and use AI ethically in reporting."
      },
      {
        "summary": "Support decisions with AI insights, build analytics into workflows and measure impact."
      },
      {
        "summary": "Go from raw numbers to a decision, then complete the final assessment."
      }
    ],
    "faq": [
      {
        "q": "Can I trust the numbers AI gives me?",
        "a": "Not without checking. The course shows how to ask the AI to show each calculation, and how to recalculate a few results yourself. The practice data pack includes expected answers so you can see whether your results match."
      },
      {
        "q": "Do I need to know statistics or code?",
        "a": "No. The course works through prompts and ordinary spreadsheet data."
      },
      {
        "q": "Is practice data included?",
        "a": "Yes. A practice data pack with sample data and example reports is part of the first module, so you can run the exercises even without data of your own."
      },
      {
        "q": "Can I paste company data into an AI tool?",
        "a": "Module 4 has a lesson on data privacy and confidentiality, so you know what to remove or anonymize and when to use only your approved tools."
      },
      {
        "q": "Do I need a paid AI tool?",
        "a": "No. The exercises work with a free account of ChatGPT, Claude or another assistant that accepts pasted tables, or the tool your company has approved. You paste the prompts from the lessons into the tool you already use, so the course does not depend on any one product."
      }
    ]
  },
  "ai-for-workflow-automation": {
    "outcome": "Turn repeated writing and reporting tasks into reusable prompts and simple workflows, with checks that keep the output accurate and safe.",
    "whoFor": [
      "Office and operations staff with repeated reports, emails and updates",
      "Team leads who want consistent weekly and monthly outputs",
      "Project coordinators who run meetings and follow-ups",
      "Managers who need to introduce automation safely"
    ],
    "produces": [
      "An automation prompt starter kit",
      "A procedure turned into a prompt chain",
      "A meeting-to-actions workflow and an email triage set",
      "A one-page automation safety checklist",
      "A 90-day automation plan"
    ],
    "workedExample": {
      "task": "Write the monthly operations report from numbers and notes (example for a fictional organization, for illustration)",
      "input": "Act as an operations analyst writing a monthly report.\nContext: Use only the numbers and notes below (fictional warehouse example).\nTask: Write the report.\nFormat: Headline summary (2 sentences), Key numbers (table), What changed and why (3 bullets), Next month (3 bullets).\nLimits: Do not add any figure that is not provided. If a reason is missing, write [REASON NEEDED].\nNumbers:\nOrders shipped: October 4,820, September 4,610\nOn-time shipping: October 94.1%, September 95.6%\nAverage pick time: October 6.2 min, September 6.8 min\nDamage claims: October 31, September 24\nNotes:\nAisle re-slotting finished on 9 October. Peak-season hiring started in the second half of October and 11 temporary staff joined. No note on the cause of the rise in damage claims.",
      "result": "Headline summary\nWe shipped more orders in October and picked them faster, but on-time shipping slipped and damage claims rose.\n\nKey numbers\nMeasure | September | October | Change\nOrders shipped | 4,610 | 4,820 | +4.6%\nOn-time shipping | 95.6% | 94.1% | -1.5 points\nAverage pick time | 6.8 min | 6.2 min | -8.8%\nDamage claims | 24 | 31 | +29.2%\n\nWhat changed and why\n- Average pick time fell after aisle re-slotting finished on 9 October.\n- 11 temporary staff joined in the second half of October as peak-season hiring started.\n- Damage claims rose from 24 to 31. [REASON NEEDED]\n\nNext month\n- Continue onboarding the 11 temporary staff.\n- [INFORMATION NEEDED: plan to reduce damage claims]\n- [INFORMATION NEEDED: reason for the drop in on-time shipping and the plan to recover it]",
      "check": "- Check every figure against your source and recalculate the changes (for example 31 against 24 is +29.2%)\n- Resolve every [REASON NEEDED] and [INFORMATION NEEDED]\n- Run the same prompt with a different month to check the structure stays the same\n- Review the report before it is sent"
    },
    "modules": [
      {
        "summary": "Learn the five parts of a clear automation prompt, which tasks suit prompt-based automation, and how to build reusable prompts."
      },
      {
        "summary": "Spot opportunities, break workflows into steps, write clear and actionable prompts, and avoid common errors."
      },
      {
        "summary": "Automate documents, meetings and follow-ups, data handling, and email and cross-team requests."
      },
      {
        "summary": "Ensure accuracy and quality, protect privacy and security, and manage the risks of automation."
      },
      {
        "summary": "Fit automation into existing workflows, measure effectiveness and scale across teams."
      },
      {
        "summary": "Automate one team workflow from start to finish, then complete the final assessment."
      }
    ],
    "faq": [
      {
        "q": "Do I need to code or buy automation software?",
        "a": "No. The course is about prompts and clear workflows that you run in any AI assistant. It also shows how to prepare a process so it could be connected to other tools later."
      },
      {
        "q": "What if the AI gets something wrong in a report?",
        "a": "The templates tell the AI to use only the input you give it and to flag anything unclear. The quality lessons show how to check before anything is sent."
      },
      {
        "q": "Can I run the same prompt every week?",
        "a": "Yes. That is the point of the fixed format and reusable templates. You paste new notes or figures into the same prompt each time."
      },
      {
        "q": "Will I practice persuading my manager?",
        "a": "Yes. A simulation has you pitch automation to management, and each module ends with a project."
      },
      {
        "q": "Do I need a paid AI tool?",
        "a": "No. The exercises work with a free account of ChatGPT, Claude or another assistant, or the tool your company has approved. You paste the prompts from the lessons into the tool you already use, so the course does not depend on any one product."
      }
    ]
  },
  "ai-for-education": {
    "outcome": "Plan lessons, explain ideas at the right level, build assessments and write to families with AI, while you keep control of accuracy, privacy and integrity.",
    "whoFor": [
      "Primary, secondary and further-education teachers",
      "Instructional designers and learning-support staff",
      "Tutors and trainers",
      "School leaders who write AI guidance for classrooms"
    ],
    "produces": [
      "A teaching prompt starter kit",
      "A week of lesson plans",
      "A learner support pack",
      "A rubric and feedback bank",
      "A one-page classroom AI guideline and a 90-day adoption plan"
    ],
    "workedExample": {
      "task": "Plan a 45-minute Grade 6 science lesson on the water cycle (example for a fictional organization, for illustration)",
      "input": "Act as an experienced Grade 6 science teacher.\nContext: A 45-minute lesson on the water cycle. 26 students, mixed reading levels. They already know that water can be a liquid, a solid or a gas.\nTask: Write a lesson plan.\nFormat: Learning objective, a timed schedule (starter 5 minutes, teaching 12, group activity 18, wrap-up 10), materials needed, and one question to check understanding at the end.\nLimits: Use only well-established facts. Mark anything I should verify with [CHECK].",
      "result": "Learning objective\nStudents can describe the main stages of the water cycle (evaporation, condensation, precipitation, collection) in their own words.\n\nTimed schedule (45 minutes)\n- 0 to 5 min, starter: ask \"Where does a puddle go on a sunny day?\" and collect ideas.\n- 5 to 17 min, teaching: introduce the four stages with a simple diagram, linking each to what students know about liquid, solid and gas. [CHECK: wording of each stage for the Grade 6 curriculum]\n- 17 to 35 min, group activity: groups of four build a labeled water cycle poster and explain it to another group. Pair stronger readers with those who need support.\n- 35 to 45 min, wrap-up: each group shares one stage in a sentence; recap the cycle.\n\nMaterials needed\nDiagram handout, chart paper, markers, sentence starters for mixed reading levels.\n\nCheck for understanding\n\"Describe what happens to water from a puddle until it falls again as rain.\"\n\nFacts to verify\n[CHECK: ensure the diagram shows condensation forming clouds and that precipitation includes rain, snow and hail]",
      "check": "- Check that the timings add up to your real lesson length (5 + 12 + 18 + 10 = 45)\n- Resolve every [CHECK] item yourself against your curriculum\n- Change at least one activity so it suits your room, class and resources\n- Decide how you will check understanding, and whether the question fits your students"
    },
    "modules": [
      {
        "summary": "Learn the five parts of a clear prompt, improve answers with follow-ups, and understand what AI can and cannot do in the classroom."
      },
      {
        "summary": "Plan lessons, give explanations and examples at the right level, build activities, and make materials inclusive and accessible."
      },
      {
        "summary": "Create study guides and practice, use tutoring-style prompts, develop critical thinking, and communicate with students and parents."
      },
      {
        "summary": "Create quizzes, write rubrics and helpful feedback, and understand the limits of formative assessment."
      },
      {
        "summary": "Handle accuracy and bias, protect student data and support academic integrity."
      },
      {
        "summary": "Choose first use cases, run a pilot and measure the impact on learning."
      },
      {
        "summary": "Build one unit from start to finish, then complete the final assessment."
      }
    ],
    "faq": [
      {
        "q": "What if the AI states something wrong to my students?",
        "a": "It can. The course teaches you to check content against a trusted source and curriculum before it reaches learners, and covers accuracy and bias in a full lesson."
      },
      {
        "q": "Is student data safe to use in AI tools?",
        "a": "Module 5 has a lesson on student data privacy and security so you know what never to paste and how to anonymize what you need."
      },
      {
        "q": "Does the course address cheating and academic integrity?",
        "a": "Yes, there is a lesson on academic integrity and responsible learning, and a project to write your own classroom AI guideline."
      },
      {
        "q": "Is there practice with feedback conversations?",
        "a": "Yes. A simulation lets you practice a constructive feedback session, and each module ends with a project."
      },
      {
        "q": "Do I need a paid AI tool?",
        "a": "No. The exercises work with a free account of ChatGPT, Claude or another assistant, or the tool your school has approved. You paste the prompts from the lessons into the tool you already use, so the course does not depend on any one product."
      }
    ]
  }
};

export const marketingFor = (slug) => COURSE_MARKETING[slug] || {};
