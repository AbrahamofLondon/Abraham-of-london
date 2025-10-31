// src/app/dynamic/page.tsx

import React from 'react';
import { fetchRealtimeStock, type StockData } from '@/lib/finance-api';

// Explicitly ensure dynamic rendering for clarity
export const dynamic = 'force-dynamic';

// --- Presentational Component ---

function StockCard({ data }: { data: StockData }) {
  const priceColor =
    data.changePercent >= 0
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';

  const changeSign = data.changePercent >= 0 ? '+' : '';

  return (
    <div className="w-full max-w-lg p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 transition duration-300 hover:shadow-3xl">
      <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-2">
        Real-Time Market Data
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 border-b pb-4">
        This page is rendered **dynamically** (SSR) on every request.
      </p>

      <div className="flex items-center justify-between mb-6">
        <span className="text-6xl font-black text-gray-900 dark:text-white">{data.symbol}</span>
        <div className="text-right">
          <p className={`text-5xl font-extrabold ${priceColor}`}>
            ${data.price.toFixed(2)}
          </p>
          <p className={`text-xl font-medium ${priceColor} mt-1`}>
            {changeSign}{(data.changePercent * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="border-t pt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>Last Updated (Server Render Time):</p>
        <p className="font-mono text-gray-800 dark:text-white text-base">
          {new Date(data.timestamp).toLocaleTimeString('en-US', { timeZoneName: 'short' })}
        </p>
      </div>
    </div>
  );
}

// --- Dynamic Server Page Component ---

export default async function RealtimeStockPage() {
  const TICKER = 'TSLA';
  const data = await fetchRealtimeStock(TICKER);

  if (!data || data.price === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
        <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-red-300 dark:border-red-700 max-w-md text-center">
          <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">
            Data Unavailable ⚠️
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Could not retrieve reliable real-time data for **{TICKER}**.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-3">
            Attempted render at: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <StockCard data={data} />
    </div>
  );
}