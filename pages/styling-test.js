// pages/styling-test.js
export default function StylingTest() {
  return (
    <div style={{ padding: '2rem', minHeight: '100vh' }}>
      <style jsx>{`
        .inline-box {
          background: #d6b26a;
          color: #15171c;
          padding: 1rem;
          margin: 1rem 0;
          border-radius: 8px;
        }
      `}</style>
      
      <h1>🎨 Styling Diagnostic</h1>
      
      <div className="inline-box">
        <h2>Test 1: Inline CSS via style tag</h2>
        <p>This should be gold if CSS works at all.</p>
      </div>
      
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-2">Test 2: Tailwind Classes</h2>
        <p className="text-slate-300">
          If this is styled, Tailwind is working.
        </p>
        <button className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 font-semibold rounded hover:bg-amber-400">
          Tailwind Button
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-slate-900 rounded">
        <h3 className="text-amber-300 mb-2">Current Issues:</h3>
        <ul className="text-slate-400 text-sm list-disc pl-5">
          <li>Built-in CSS disabled warning (postcss.config.js)</li>
          <li>Contentlayer Windows compatibility issues</li>
          <li>Permission error on .next/trace file</li>
        </ul>
      </div>
    </div>
  );
}
