// scripts/email-sequence-generator.ts
import fs from 'fs';
import path from 'path';

interface EmailTemplate {
  id: string;
  subject: string;
  preheader: string;
  daysFromStart: number;
  content: string;
  cta: {
    text: string;
    url: string;
  };
  tags: string[];
}

export class EmailSequenceGenerator {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(process.cwd(), 'email-templates');
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }
  }

  generate30DayChallenge(): void {
    const sequence: EmailTemplate[] = [
      {
        id: 'day-1-welcome',
        subject: 'Your 30-Day Surrender Journey Begins',
        preheader: 'The most important distinction you\'ll make this year',
        daysFromStart: 0,
        content: `# Welcome to the Surrender Challenge

For the next 30 days, we're not adding more to your life. We're practicing releasing what doesn't serve you through conscious surrender.

**Today's Practice:** Identify one area where you're submitting. Just notice it. Don't change it yet.

## Your Starting Point

Take 5 minutes right now to answer:
1. Where do I feel compelled rather than called?
2. What outcome am I trying to control?
3. What principle might be inviting my surrender?

Don't overthink it. Just notice.

## Today's Download

Get your [Surrender Starter Kit]({{download_link}}) to begin.

**Remember:** Surrender feels like loss until you experience the freedom it brings.

We'll check in tomorrow.`,
        cta: {
          text: 'Download Starter Kit',
          url: '{{download_link}}'
        },
        tags: ['welcome', 'day-1', 'surrender-challenge']
      },
      {
        id: 'day-7-discern-practice',
        subject: 'Week 1 Review: What Have You Discerned?',
        preheader: 'Applying the first D of the framework',
        daysFromStart: 7,
        content: `# Week 1: The DISCERN Practice

One week in. What patterns are emerging?

**This Week's Focus:** Apply the DISCERN step to 3 key decisions.

Ask yourself: "Am I facing a rule requiring submission, or a principle inviting surrender?"

## The Submission Test

Use this 4-question test for any situation:
1. Is this coming from external authority?
2. Is there a penalty for non-compliance?
3. Does this limit my agency?
4. Would compliance feel like constraint?

**Score:** More than 2 "yes" = Likely submission scenario

## Your Week 1 Challenge

Identify one area where you've been submitting. Now, find the principle that invites surrender instead.

Example:
- Submitting to: "I must work late every day"
- Surrendering to: "I honor sustainable work rhythms"

## This Week's Download

Use the [DISCERN Worksheet]({{worksheet_link}}) to practice.`,
        cta: {
          text: 'Get DISCERN Worksheet',
          url: '{{worksheet_link}}'
        },
        tags: ['week-1', 'discern', 'submission-test']
      },
      // ... add more days (14, 21, 30)
    ];

    this.saveSequence('30-day-surrender-challenge', sequence);
    console.log('✅ Generated 30-day email challenge sequence');
  }

  generateWelcomeSequence(): void {
    const sequence: EmailTemplate[] = [
      {
        id: 'welcome-1',
        subject: 'Welcome to Abraham of London',
        preheader: 'Surrender, not submission',
        daysFromStart: 0,
        content: `# Welcome

You've joined a community committed to substantive living.

Our core principle: **Surrender, not submission.**

This distinction determines the quality of your relationships, work, and legacy.

## Your First Step

Download the [Submission vs. Surrender Diagnostic]({{diagnostic_link}}) to assess your current orientation.

This isn't about scoring "well." It's about honest assessment.

## What to Expect

1. Weekly insights on surrender principles
2. Practical frameworks you can apply immediately
3. Resources for going deeper
4. Community discussions (optional)

We don't do motivational fluff. We do operational truth.

Ready to begin?`,
        cta: {
          text: 'Take the Diagnostic',
          url: '{{diagnostic_link}}'
        },
        tags: ['welcome', 'diagnostic', 'introduction']
      }
    ];

    this.saveSequence('welcome-sequence', sequence);
    console.log('✅ Generated welcome email sequence');
  }

  private saveSequence(name: string, sequence: EmailTemplate[]): void {
    const sequenceDir = path.join(this.templatesDir, name);
    if (!fs.existsSync(sequenceDir)) {
      fs.mkdirSync(sequenceDir, { recursive: true });
    }

    sequence.forEach(email => {
      const filePath = path.join(sequenceDir, `${email.id}.md`);
      
      const content = `---
subject: "${email.subject}"
preheader: "${email.preheader}"
daysFromStart: ${email.daysFromStart}
tags: ${JSON.stringify(email.tags)}
cta:
  text: "${email.cta.text}"
  url: "${email.cta.url}"
---

${email.content}`;

      fs.writeFileSync(filePath, content, 'utf-8');
    });

    // Create index file
    const index = {
      name,
      totalEmails: sequence.length,
      totalDays: Math.max(...sequence.map(e => e.daysFromStart)),
      emails: sequence.map(e => ({
        id: e.id,
        subject: e.subject,
        daysFromStart: e.daysFromStart
      }))
    };

    fs.writeFileSync(
      path.join(sequenceDir, 'index.json'),
      JSON.stringify(index, null, 2),
      'utf-8'
    );
  }
}