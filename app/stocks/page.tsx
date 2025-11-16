// app/stocks/page.tsx
import dynamic from "next/dynamic";

const LiveStockTracker = dynamic(
  () => import("@/components/stocks/LiveStockTracker"),
  {
    ssr: false,
    loading: () => (
      <div className="py-16 text-center text-gray-600">
        Connecting to live market data…
      </div>
    ),
  },
);

export const metadata = {
  title: "Live Stock Tracker | Abraham of London",
  description: "Experimental real-time WebSocket stock tracker.",
};

export default function StocksPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Live Stock Tracker
        </h1>
        <p className="text-gray-600 mb-8 max-w-2xl">
          Experimental live WebSocket feed for stock prices. This is a demo
          feature and may be unavailable or throttled in production.
        </p>
        <LiveStockTracker />
      </section>
    </main>
  );
}