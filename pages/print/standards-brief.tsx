// pages/print/standards-brief.tsx
import Head from "next/head";

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
        <header className="title">
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

        <footer className="note">Use in onboarding • quarterly reviews • incident retros.</footer>
      </main>

      <style jsx global>{`
        @page { size: A4; margin: 12mm; }
        html, body { background: white; }
        .sheet { width: 210mm; min-height: 273mm; margin: 0 auto; font-family: var(--font-sans, ui-sans-serif); color: #1a1a1a; }
        .title { text-align: center; margin-bottom: 6mm; }
        h1 { font-family: var(--font-serif, Georgia); font-weight: 700; font-size: 20pt; margin: 0 0 2mm; }
        .sub { color: #555; font-size: 10pt; margin: 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; }
        .block h2 { font-family: var(--font-serif, Georgia); font-weight: 700; font-size: 12pt; margin: 0 0 2mm; }
        .block ul { margin: 0; padding-left: 4mm; font-size: 10.5pt; line-height: 1.5; }
        .note { color: #667; font-size: 9.5pt; margin-top: 8mm; text-align: center; }
        @media screen { body { background: #f6f6f6; padding: 2rem; } .sheet { background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.08); padding: 10mm; } }
      `}</style>
    </>
  );
}
