export const aiHrCourseData = {
  id: "ai-hr-101",
  title: "AI for Human Resources / Talent / People Ops",
  modules: [
    // === MODULE 1 ===
    {
      title: "Module 1: Foundations of AI in HR",
      lessons: [
        {
          title: "1.1 Introduction to AI & Prompt Tools",
          content: `
            <h3>The Power of Prompts</h3>
            <p>AI doesn't just "know" what to do. It needs specific instructions called <strong>Prompts</strong>. Think of a prompt as delegating a task to a very smart intern.</p>
            
            <div class="prompt-box">
              <strong>🎯 Basic Prompt Example:</strong><br/>
              "Act as a Senior HR Manager. Draft a welcome email for a new Software Engineer joining on Monday. Tone: Professional but warm."
            </div>

            <ul>
              <li><strong>AI Capabilities:</strong> AI can generate text, summaries, and recommendations.</li>
              <li><strong>Human in the Loop:</strong> AI supports HR work but does not replace HR professionals.</li>
            </ul>
          `
        },
        {
          title: "1.2 Role of AI in Modern HR",
          content: `
            <h3>Why use AI?</h3>
            <p>AI helps reduce repetitive tasks, allowing HR teams to focus on strategic work.</p>
            <div class="tip-box">
              <strong>💡 Pro Tip:</strong> AI is excellent for consistency. Use it to ensure all candidate rejection emails sound equally polite and constructive.
            </div>
            <ul>
              <li>Supports faster hiring and screening.</li>
              <li>Helps manage employee info efficiently.</li>
            </ul>
          `
        },
        {
          title: "1.3 Understanding HR Prompts",
          content: `
            <h3>Context is King</h3>
            <p>HR prompts must be clear and unbiased. Always specify the <strong>Job Role</strong>, <strong>Company Policy</strong>, and <strong>Desired Outcome</strong>.</p>
            <div class="tip-box">
              <strong>⚠️ Warning:</strong> Poor prompts lead to misleading outputs. Always test your prompts before relying on the results.
            </div>
          `
        }
      ]
    },

    // === MODULE 2 ===
    {
      title: "Module 2: Recruitment & Talent Acquisition",
      lessons: [
        {
          title: "2.1 Job Descriptions",
          content: `
            <h3>Drafting JDs with AI</h3>
            <p>AI helps draft job descriptions quickly by defining skills, experience, and responsibilities.</p>
            
            <div class="prompt-box">
              <strong>📝 Try this Prompt:</strong><br/>
              "Draft a Job Description for a Senior Marketing Manager. <br/>
              <strong>Requirements:</strong> 5+ years experience, SEO knowledge, team leadership.<br/>
              <strong>Tone:</strong> Exciting and inclusive. Avoid gender-biased language."
            </div>
            
            <p><strong>Note:</strong> Always review for biased or exclusionary language before publishing.</p>
          `
        },
        {
          title: "2.2 Resume Screening",
          content: `
            <h3>Efficiency in Screening</h3>
            <p>AI can summarize resumes and highlight key skills/experience to speed up initial screening.</p>
            <div class="tip-box">
              <strong>⚖️ Ethics Check:</strong> AI can highlight skills, but the final selection must be done by recruiters to ensure fairness.
            </div>
          `
        },
        {
          title: "2.3 Interview Support",
          content: `
            <h3>Structured Interviews</h3>
            <p>AI helps create structured, role-specific interview questions (behavioral and technical).</p>
            
            <div class="prompt-box">
              <strong>🎤 Interview Prompt:</strong><br/>
              "Generate 5 behavioral interview questions for a Project Manager role. Focus on conflict resolution and time management. Include a scoring guide for 'Poor', 'Average', and 'Great' answers."
            </div>
          `
        }
      ]
    },

    // === MODULE 3 ===
    {
      title: "Module 3: Employee Lifecycle",
      lessons: [
        {
          title: "3.1 Onboarding & Communication",
          content: `
            <p>AI can draft onboarding emails, checklists, and explain policies to ensure consistent communication.</p>
            <div class="prompt-box">
              <strong>📧 Onboarding Prompt:</strong><br/>
              "Create a Day 1 Onboarding Checklist for a new remote employee. Include setup steps for Slack, Zoom, and HR portal login."
            </div>
          `
        },
        {
          title: "3.2 Performance Reviews",
          content: `
            <p>AI helps summarize performance data and draft feedback templates, encouraging structured evaluations.</p>
            <div class="tip-box">
              <strong>💡 Best Practice:</strong> Use AI to remove subjective language from feedback. Ask it to "Rewrite this feedback to be more objective and actionable."
            </div>
          `
        },
        {
          title: "3.3 Engagement & Surveys",
          content: `
            <p>AI assists in creating engagement surveys and analyzing employee feedback to identify trends.</p>
            <div class="prompt-box">
              <strong>📊 Survey Prompt:</strong><br/>
              "Draft a 5-question anonymous survey to measure employee satisfaction with the new Hybrid Work Policy."
            </div>
          `
        }
      ]
    },

    // === MODULE 4 ===
    {
      title: "Module 4: Ethics, Compliance & Data",
      lessons: [
        {
          title: "4.1 Policy Drafting",
          content: `
            <p>AI supports drafting HR policies and manuals, ensuring consistent formatting and tone.</p>
            <div class="tip-box">
              <strong>🛡️ Legal Warning:</strong> AI is not a lawyer. All generated policies must be reviewed by legal counsel.
            </div>
          `
        },
        {
          title: "4.2 Bias & Fairness",
          content: `
            <h3>The Risk of Bias</h3>
            <p>AI can reflect bias if prompts are poorly designed. This affects hiring and evaluations.</p>
            <ul>
              <li><strong>Rule #1:</strong> HR must review AI outputs carefully.</li>
              <li>Fairness and inclusion are critical.</li>
            </ul>
          `
        },
        {
          title: "4.3 Data Privacy",
          content: `
            <h3>Protecting Employee Data</h3>
            <p>HR handles sensitive data. AI tools must comply with data protection laws.</p>
            <div class="prompt-box" style="border-left-color: #f59e0b;">
              <strong>🔒 Security Rule:</strong> Never input real names, SSNs, or salaries into public AI tools. Use anonymized data only.
            </div>
          `
        }
      ]
    },

    // === MODULE 5 ===
    {
      title: "Module 5: Implementation Strategy",
      lessons: [
        {
          title: "5.1 Integrating AI",
          content: `
            <p>Identify HR tasks suitable for AI support and train HR staff on prompt usage.</p>
            <div class="tip-box">
              <strong>🚀 Start Small:</strong> Introduce AI gradually to avoid overwhelming the team.
            </div>
          `
        },
        {
          title: "5.2 Measuring Success",
          content: `
            <p>Track time saved and review output quality regularly. Continuously improve your prompts based on results.</p>
          `
        }
      ]
    },

    // === FINAL ASSESSMENT (ALL 10 QUESTIONS) ===
    {
      title: "Final Assessment",
      lessons: [
        {
          title: "Certification Exam",
          type: "quiz",
          questions: [
            {
              question: "What is the main purpose of using prompt-based AI in HR?",
              options: [
                "To replace HR professionals",
                "To support HR tasks using instructions",
                "To make legal decisions",
                "To eliminate human judgment"
              ],
              answer: 1 // Answer: B
            },
            {
              question: "In HR, a 'prompt' is best described as:",
              options: [
                "An employee record",
                "A policy document",
                "An instruction given to an AI system",
                "A payroll report"
              ],
              answer: 2 // Answer: C
            },
            {
              question: "Which HR activity can AI assist with using prompts?",
              options: [
                "Final hiring decisions",
                "Legal dispute resolution",
                "Drafting job descriptions",
                "Employee termination approvals"
              ],
              answer: 2 // Answer: C
            },
            {
              question: "Why must AI-generated job descriptions be reviewed by HR?",
              options: [
                "AI writes very slowly",
                "AI may introduce bias or errors",
                "AI cannot generate text",
                "AI does not follow formatting"
              ],
              answer: 1 // Answer: B
            },
            {
              question: "How can AI support resume screening?",
              options: [
                "By rejecting all candidates",
                "By conducting interviews",
                "By summarizing and highlighting key skills",
                "By making final hiring decisions"
              ],
              answer: 2 // Answer: C
            },
            {
              question: "Which task should always remain a human responsibility?",
              options: [
                "Drafting emails",
                "Creating interview questions",
                "Final performance evaluation decisions",
                "Summarizing feedback"
              ],
              answer: 2 // Answer: C
            },
            {
              question: "What is a key ethical concern when using AI in HR?",
              options: [
                "Faster processing",
                "Reduced paperwork",
                "Bias and fairness",
                "Improved documentation"
              ],
              answer: 2 // Answer: C
            },
            {
              question: "What type of data must be handled carefully?",
              options: [
                "Marketing data",
                "Financial stock data",
                "Employee personal and sensitive data",
                "Website analytics"
              ],
              answer: 2 // Answer: C
            },
            {
              question: "How can AI help in employee engagement?",
              options: [
                "Monitoring employees secretly",
                "Automatically promoting employees",
                "Creating and summarizing engagement surveys",
                "Issuing warnings"
              ],
              answer: 2 // Answer: C
            },
            {
              question: "What is important for successful AI adoption?",
              options: [
                "Full automation without oversight",
                "No employee communication",
                "Training HR staff and continuous monitoring",
                "Avoiding policies"
              ],
              answer: 2 // Answer: C
            }
          ]
        }
      ]
    }
  ]
};