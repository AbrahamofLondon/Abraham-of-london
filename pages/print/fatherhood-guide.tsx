// pages/print/fatherhood-guide.tsx
import Head from "next/head";

export default function FatherhoodGuide() {
  return (
    <main className="prose mx-auto my-8 print:mx-0 print:my-0">
      <Head>
        <title>Fatherhood Guide — Print</title>
      </Head>
      <h1>Fatherhood Guide</h1>
      <p className="lead">
        A concise field guide for dads: presence, standards, and steady love.
      </p>

      <h2>1. Presence</h2>
      <ul>
        <li>Daily touchpoints: eye contact, listen, encourage.</li>
        <li>Weekly one-on-one: 30–60 minutes minimum.</li>
        <li>Monthly adventure: stretch, learn, celebrate.</li>
      </ul>

      <h2>2. Standards</h2>
      <ul>
        <li>House rules: respect, honesty, responsibility.</li>
        <li>Boundaries: tech, bedtime, table, tone.</li>
        <li>Consequences are clear, calm, consistent.</li>
      </ul>

      <h2>3. Formation</h2>
      <ul>
        <li>Scripture track: John 14 + Proverbs.</li>
        <li>Service: one act of quiet service a week.</li>
        <li>Stewardship: money, time, and words.</li>
      </ul>

      <hr />
      <p className="text-sm">
        © {new Date().getFullYear()} Abraham of London • abrahamoflondon.org
      </p>
    </main>
  );
}
