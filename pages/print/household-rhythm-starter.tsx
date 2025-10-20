// pages/print/household-rhythm-starter.tsx
import Head from "next/head";

export default function HouseholdRhythmStarter() {
  return (
    <main className="prose mx-auto my-8 print:mx-0 print:my-0">
      <Head>
        <title>Household Rhythm Starter — Print</title>
      </Head>

      <h1>Household Rhythm Starter</h1>
      <p className="lead">
        A simple weekly cadence for clarity, connection, and care.
      </p>

      <h2>Weekly Rhythm</h2>
      <ul>
        <li><strong>Sun PM:</strong> Family huddle — calendar, meals, highlights.</li>
        <li><strong>Mon–Fri:</strong> Morning blessing + shared table.</li>
        <li><strong>Wed:</strong> Mid-week reset — tidy + encouragement.</li>
        <li><strong>Fri PM:</strong> Gratitude + fun night.</li>
        <li><strong>Sat:</strong> Adventure / rest / errands.</li>
      </ul>

      <h2>30•60•90 Focus</h2>
      <ul>
        <li>30: One habit we’ll shape this month.</li>
        <li>60: One room or system we’ll improve.</li>
        <li>90: One shared goal we’ll celebrate.</li>
      </ul>

      <hr />
      <p className="text-sm">
        © {new Date().getFullYear()} Abraham of London • abrahamoflondon.org
      </p>
    </main>
  );
}
