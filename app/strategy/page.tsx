// app/strategy/page.tsx

export const metadata = {
  title: "Strategy | Abraham of London",
  description:
    "High-level strategy insights for founders, boards, and market builders.",
};

export default function StrategyPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h1 className="text-4xl font-bold text-deepCharcoal mb-4">
          Strategy Hub
        </h1>
        <p className="text-lg text-gray-700 mb-8 max-w-3xl">
          This section will curate long-form strategy memos, board-ready
          briefings, and playbooks for founders and market builders.
        </p>

        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Coming online shortly
          </h2>
          <p className="text-gray-600 mb-3">
            The underlying content engine is being refactored for stability and
            export performance.
          </p>
          <p className="text-gray-500 text-sm">
            In the meantime, you can access{" "}
            <a
              href="/blog"
              className="text-blue-600 underline underline-offset-4"
            >
              Insights
            </a>{" "}
            and{" "}
            <a
              href="/downloads"
              className="text-blue-600 underline underline-offset-4"
            >
              Downloadable Playbooks
            </a>{" "}
            for strategy material.
          </p>
        </div>
      </section>
    </main>
  );
}