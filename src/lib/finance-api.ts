// src/lib/finance-api.ts

// --- Data Model for the API response ---
export interface StockData {
  symbol: string;
  price: number;
  changePercent: number;
  timestamp: string;
}

/**
 * Generates mock real-time stock data to simulate an API response.
 * @param ticker The stock symbol.
 * @returns Mock StockData.
 */
function generateMockStockData(ticker: string): StockData {
  return {
    symbol: ticker,
    // Generate a price between $10.00 and $200.00
    price: Math.floor(Math.random() * (20000 - 1000 + 1) + 1000) / 100, 
    // Generate a change percent between -10% and +10%
    changePercent: Math.floor(Math.random() * (100 - (-100) + 1) + (-100)) / 1000, 
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetches real-time market data for a stock, forcing dynamic (SSR) rendering.
 * NOTE: Replace the placeholder URL with a functional, production API endpoint.
 * @param ticker The stock ticker symbol (e.g., 'TSLA').
 * @returns A promise that resolves to StockData or null on failure.
 */
export async function fetchRealtimeStock(ticker: string): Promise<StockData | null> {
  // Use a secure environment variable for the base URL in production
  const apiBaseUrl = process.env.FINANCE_API_BASE_URL || 'https://api.example-finance.com';
  const apiUrl = `${apiBaseUrl}/realtime/${ticker}`;

  try {
    // IMPORTANT: 'cache: 'no-store'' forces a fresh fetch on every request, ensuring dynamic rendering.
    const res = await fetch(apiUrl, { cache: 'no-store' });

    if (!res.ok) {
      console.error(`API fetch failed for ${ticker} with status: ${res.status}`);
      // Fallback: Use mock data structure but with null values for price/change if API fails
      return generateMockStockData(ticker); 
    }

    // --- Placeholder for actual API call ---
    // const data = await res.json() as StockData;
    // return data;

    // --- Mock Data Simulation for structure illustration ---
    const mockData = generateMockStockData(ticker);
    return mockData;

  } catch (error) {
    console.error("Error fetching stock data:", error);
    // Return null on critical network/parsing failure
    return null;
  }
}