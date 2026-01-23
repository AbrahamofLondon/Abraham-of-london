// components/dashboard/LiveDataDashboard.tsx - FIXED VERSION
import React, { useState, useEffect } from "react";

interface LiveDataDashboardProps {
  theme?: "light" | "dark";
  onPDFSelect?: (pdfId: string) => void;
}

export const LiveDataDashboard: React.FC<LiveDataDashboardProps> = ({
  theme = "light",
  onPDFSelect,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Simulate loading live data
    const timer = setTimeout(() => {
      setData([
        { id: "1", title: "Live Report 1", updatedAt: new Date().toISOString() },
        { id: "2", title: "Live Report 2", updatedAt: new Date().toISOString() },
        { id: "3", title: "Live Report 3", updatedAt: new Date().toISOString() },
      ]);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSelect = (pdfId: string) => {
    onPDFSelect?.(pdfId);
  };

  if (isLoading) {
    return (
      <div className={`p-8 ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"} rounded-lg`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-500">Loading live data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"} shadow-lg`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
          Live Data Dashboard
        </h2>
        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
          Live
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                : "bg-gray-50 border-gray-200 hover:bg-white"
            }`}
            onClick={() => handleSelect(item.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                {item.title}
              </h3>
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              Updated: {new Date(item.updatedAt).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
          Real-time data updates every 30 seconds
        </p>
      </div>
    </div>
  );
};

// Export as default (remove the duplicate export { LiveDataDashboard })
export default LiveDataDashboard;