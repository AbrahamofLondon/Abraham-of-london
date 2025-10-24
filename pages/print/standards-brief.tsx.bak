// pages/print/standards-brief.tsx

import Head from "next/head";
import React from "react";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark";

const Block = ({ n, title, items }: { n: number; title: string; items: string[] }) => (
  <section className="block">
    <h2>{n}) {title}</h2>
    <ul>{items.map((x, i) => <li key={i} dangerouslySetInnerHTML={{ __html: x }} />)}</ul>
  </section>
);

export default function Print_StandardsBrief() {
  return (
    <>
      <Head><title>Standards Brief — Print</title></Head>
      <main className="sheet">
        <header className="title relative">
          {/* --- Branding: Logo Top Left --- */}
          <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2">
              <EmbossedBrandMark
                  src="/assets/images/abraham-logo.jpg"
                  alt="Abraham of London Logo"
                  width={35}
                  height={35}
                  effect="emboss"/>
          </div>

          <h1>Standards Brief</h1>
          <p className="sub">Protect people, work, and name—especially under pressure.</p>
        </header>

        <section className="grid">
          <Block n={1} title="Decisions" items={[
            "<strong>Facts first:</strong> single source of truth; date every number.",
            "<strong>Owner & deadline:</strong> one accountable person; one explicit date.",
            "<strong>Reversible vs. irreversible:</strong> bias to speed on reversible calls.",
          ]} />
          <Block n={2} title="Cadence" items={[
            "<strong>Daily:</strong> status, blockers, risks (15m).",
            "<strong>Weekly:</strong> outcomes scored, lessons captured, next 3 (45m).",
            "<strong>Monthly:</strong> standards review, debt burn-down, runway check.",
          ]} />
          <Block n={3} title="Communication" items={[
            "<strong>Write it down:</strong> decisions, assumptions, follow-ups.",
            "<strong>No triangulation:</strong> speak to, not about.",
            "<strong>Plain English:</strong> short, dated, action-oriented notes.",
          ]} />
          <Block n={4} title="Workmanship" items={[
            "<strong>Definition of done:</strong> clear acceptance criteria, demoable.",
            "<strong>Durability:</strong> simple, testable, documented.",
            "<strong>Name:</strong> work that carries your name must be worth keeping.",
          ]} />
          <Block n={5} title="Security" items={[
            "<strong>Least privilege:</strong> access by role; revoke on exit same day.",
            "<strong>Keys & secrets:</strong> rotate quarterly; never in chat or code.",
            "<strong>Incident drill:</strong> who calls whom; first hour playbook.",
          ]} />
          <Block n={6} title="Release Discipline" items={[
            "<strong>Branch, test, tag:</strong> no ad-hoc deploys; rollback ready.",
            "<strong>Notes:</strong> concise change log with risks and smoke checks.",
            "<strong>Post-mortems:</strong> blameless, dated, with two preventions.",
          ]} />
        </section>

        <footer className="note flex justify-center items-center gap-3 border-t border-lightGrey/60 pt-4 mt-8">
            <span className="text-sm">Use in onboarding • quarterly reviews • incident retros.</span>
            <EmbossedBrandMark
                src="/assets/images/abraham-logo.jpg"
                alt="Abraham of London Certified Mark"
                width={25}
                height={25}
                effect="deboss"/>
        </footer>
      </main>

      <style jsx global>{`
        /* Defining CSS variables for color consistency */
        :root {
            --color-primary: #1a1a1a;
            --color-secondary: #004d40; /* Example forest green */
            --color-lightGrey: #dadada;
        }

        @page { size: A4; margin: 12mm; }
        html, body { background: white; }

        .sheet {
            width: 210mm;
            min-height: 273mm;
            margin: 0 auto;
            font-family: var(--font-sans, ui-sans-serif);
            color: var(--color-primary);
            padding: 10mm; /* Added padding for better content spacing */
        }

        .title {
            text-align: center;
            margin-bottom: 6mm;
            padding-top: 10mm; /* Space for the top-left logo */
        }

        h1 {
            font-family: var(--font-serif, Georgia);
            font-weight: 700;
            font-size: 20pt;
            margin: 0 0 2mm;
        }

        .sub {
            color: #555;
            font-size: 10pt;
            margin: 0;
        }

        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 7mm;
        }

        .block h2 {
            font-family: var(--font-serif, Georgia);
            font-weight: 700;
            font-size: 12pt;
            margin: 0 0 2mm;
            color: var(--color-secondary); /* Styling h2 with the primary/secondary color */
        }

        .block ul {
            margin: 0;
            padding-left: 4mm;
            font-size: 10.5pt;
            line-height: 1.5;
        }

        /* Updated footer styles to use flexbox for better alignment */
        .note {
            color: #667;
            font-size: 9.5pt;
            text-align: center;
            /* The flex properties are added inline in the component, but these base styles remain */
        }

        @media screen {
            body {
                background: #f6f6f6;
                padding: 2rem;
            }
            .sheet {
                background: #fff;
                box-shadow: 0 10px 30px rgba(0,0,0,.08);
                padding: 15mm;
            }
            /* Correcting logo placement in screen view */
            .title .absolute {
                top: 15mm;
                left: 15mm;
                transform: none;
            }
        }
      `}</style>
    </>
  );
}
