// pages/print/entrepreneur-survival-checklist.tsx

import Head from "next/head";
import * as React from "react";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark";
import EmbossedSign from "@/components/print/EmbossedSign";
/* --- Helper Components for Typography Styling --- */

interface PullLineProps {
 children: React.ReactNode;
 subtle?: boolean;
}
const PullLine = ({ children, subtle }: PullLineProps) => (
 <p className={`pull-line ${subtle ? "subtle" : ""}`}>{children}</p>
);

interface RuleProps {
 className?: string;
}
const Rule = ({ className }: RuleProps) => <hr className={`rule ${className || ""}`} />;

interface NoteProps {
 children: React.ReactNode;
 title?: string;
}
const Note = ({ children, title }: NoteProps) => (
 <div className="note-box">
  {title && <h3 className="note-title">{title}</h3>}
  {children}
 </div>
);

/* --- Main Component --- */

const EntrepreneurSurvivalChecklist = () => {
 const currentYear = new Date().getFullYear();
 const title = "Entrepreneur Survival Checklist";
 const subtitle =
  "A 20-point checklist for founders in cash-conservation mode. Triage and prioritise the mission.";

 return (
  <>
   <Head>
    <title>{title} — When the Week Turns</title>
    <meta name="robots" content="noindex" />
   </Head>

   <main className="sheet relative">
    <header className="title-area relative">
     {/* --- Branding: Logo Top Left --- */}
     <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2">
      <EmbossedBrandMark
       src="/assets/images/abraham-logo.jpg"
       alt="Abraham of London Logo"
       width={35}
       height={35}
       effect="emboss"
      />
     </div>

     <h1 className="title-h1">{title}</h1>
     <p className="subtitle-p">{subtitle}</p>
    </header>

    <section>
     <PullLine subtle>
      When the storm hits, focus on the three C's: Cash, Customers, Covenants. Everything
      else is secondary.
     </PullLine>

     <h2 className="mt-8">Triage</h2>
     <ol className="list-decimal pl-5 space-y-2 checklist-ol">
      <li>
       <strong>Cash today / this month / next month</strong>.
      </li>
      <li>
       <strong>Customers</strong> — who must not churn; call them.
      </li>
      <li>
       <strong>Covenants</strong> — bank, board, suppliers: align the story.
      </li>
     </ol>

     <Rule className="my-8" />

     <h2>Stabilise</h2>
     <ul className="list-disc pl-5 space-y-2 checklist-ul">
      <li>Freeze non-essential spend.</li>
      <li>One truth page for team + board.</li>
      <li>Daily 15-minute stand-to: risks, owners, decisions.</li>
     </ul>

     <Rule className="my-8" />

     <h2>Exit the Storm</h2>
     <ul className="list-disc pl-5 space-y-2 checklist-ul">
      <li>Retrospective: what mechanism failed?</li>
      <li>Add the missing guardrail to the playbook.</li>
     </ul>

     <Note title="Action">
      <p className="note-p">
       Printable checklist included in the full download. Use it to check your vitals daily.
      </p>
     </Note>
    </section>

    <footer className="footer-bar flex justify-between items-end">
     <p className="copyright">© {currentYear} Abraham of London • abrahamoflondon.org</p>

     {/* --- Branding: Signature Bottom Right --- */}
     <div className="flex flex-col items-end">
      <EmbossedSign
       src="/assets/images/signature/abraham-of-london-cursive.svg"
       alt="Abraham of London Signature"
       width={100}
       height={25}
       effect="deboss"
      />
      <span className="sign-label">A.o.L. Standards</span>
     </div>
    </footer>
   </main>

   <style jsx global>{`
    /* Defining CSS variables for color consistency */
    :root {
     --color-primary: #1a1a1a;
     --color-secondary: #004d40; /* Example forest green */
     --color-accent: #b8860b; /* Darker Gold */
     --color-text-muted: #555;
     --color-bg-note: #fffae0;
     --font-serif: Georgia, Cambria, "Times New Roman", Times, serif;
    }

    @page {
     size: A4;
     margin: 15mm;
    }

    /* Ensure exact colors for printing */
    @media print {
     * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
     }
    }

    html,
    body {
     background: white;
     margin: 0;
     padding: 0;
     /* Set base font for print consistency */
     font-family: ui-sans-serif, system-ui, sans-serif;
    }

    .sheet {
     width: 210mm;
     min-height: 277mm;
     margin: 0 auto;
     color: var(--color-primary);
     padding: 10mm;
     display: flex;
     flex-direction: column;
     justify-content: space-between;
     box-sizing: border-box; /* Crucial for print layout */
    }

    .title-area {
     text-align: center;
     margin-bottom: 8mm;
     padding-top: 10mm;
     position: relative;
    }

    .title-h1 {
     font-family: var(--font-serif);
     font-weight: 700;
     font-size: 20pt;
     margin: 0 0 2mm;
    }

    .subtitle-p {
     color: var(--color-text-muted);
     font-size: 11pt;
     margin: 0;
    }

    /* Component Styles */
    .pull-line {
     font-size: 12pt;
     font-style: italic;
     color: var(--color-accent);
     margin: 10mm 0;
     padding: 0 10mm;
     text-align: center;
    }
    .pull-line.subtle {
     font-size: 10.5pt;
     color: var(--color-text-muted);
     font-style: normal;
     border-left: 2px solid var(--color-accent);
     padding: 0 0 0 5mm;
     margin: 8mm 0;
     text-align: left;
    }

    .rule {
     border: none;
     height: 1px;
     background-color: #eee;
     margin: 8mm 0;
    }

    h2 {
     font-family: var(--font-serif);
     font-weight: 700;
     font-size: 14pt;
     margin: 8mm 0 3mm;
     color: var(--color-secondary);
    }

    .checklist-ol,
    .checklist-ul {
     font-size: 11pt;
     line-height: 1.6;
     margin: 0;
    }
    .checklist-ol li,
    .checklist-ul li {
     margin: 3mm 0;
    }

    .note-box {
     border: 1px solid var(--color-accent);
     background-color: var(--color-bg-note);
     padding: 6mm 8mm;
     border-radius: 4mm;
     margin-top: 10mm;
    }
    .note-title {
     font-family: var(--font-serif);
     font-weight: 700;
     font-size: 12pt;
     color: var(--color-accent);
     margin: 0 0 2mm;
    }
    .note-p {
     font-size: 10.5pt;
     margin: 0;
    }

    /* Footer Styles */
    .footer-bar {
     border-top: 1px solid #ddd;
     padding-top: 5mm;
     margin-top: 10mm;
     align-items: flex-end;
    }

    .copyright {
     font-size: 9.5pt;
     color: var(--color-text-muted);
     margin: 0;
    }

    .sign-label {
     font-size: 8.5pt;
     color: var(--color-text-muted);
     margin-top: 2px;
    }

    /* Screen View Overrides */
    @media screen {
     body {
      background: #f6f6f6;
      padding: 2rem;
     }
     .sheet {
      background: #fff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      padding: 15mm;
      min-height: auto;
      max-width: 210mm;
     }
     /* Correcting logo placement in screen view */
     .title-area .absolute {
      top: 15mm;
      left: 15mm;
      transform: none;
     }
    }
   `}</style>
  </>
 );
};

export default EntrepreneurSurvivalChecklist;