// app/stocks/page.tsx
import LiveStockTracker from "@/components/stocks/LiveStockTracker";

export default function StocksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <LiveStockTracker 
          symbols={["AAPL", "TSLA", "MSFT"]}
          showConnectionStatus={true}
          maxStocks={15}
          autoConnect={true}
        />
      </div>
    </div>
  );
}