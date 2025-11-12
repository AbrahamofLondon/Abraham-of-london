// pages/api/stocks/[symbol].ts

import { NextApiRequest, NextApiResponse } from 'next';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface StockApiResponse {
  symbol: string;
  price: number;
  changeAmount: number;
  changePercent: number;
  timestamp: string;
  volume?: number;
  previousClose?: number;
  high?: number;
  low?: number;
  open?: number;
  source: string;
}

// Mock data generator for development
const generateMockStockData = (symbol: string): StockApiResponse => {
  const basePrice = 100 + Math.random() * 200;
  const changePercent = (Math.random() - 0.5) * 0.1; // -5% to +5%
  const changeAmount = basePrice * changePercent;
  
  return {
    symbol: symbol.toUpperCase(),
    price: Number(basePrice.toFixed(2)),
    changeAmount: Number(changeAmount.toFixed(2)),
    changePercent: Number(changePercent.toFixed(4)),
    timestamp: new Date().toISOString(),
    volume: Math.floor(Math.random() * 10000000),
    previousClose: Number((basePrice - changeAmount).toFixed(2)),
    high: Number((basePrice * (1 + Math.random() * 0.02)).toFixed(2)),
    low: Number((basePrice * (1 - Math.random() * 0.02)).toFixed(2)),
    open: Number((basePrice * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2)),
    source: 'mock',
  };
};

// Real API integration would go here
const fetchRealStockData = async (symbol: string): Promise<StockApiResponse | null> => {
  try {
    // Example with Alpha Vantage (you'd need an API key)
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      return null; // Fall back to mock data
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data['Global Quote']) {
      const quote = data['Global Quote'];
      return {
        symbol: quote['01. symbol'],
        price: Number(quote['05. price']),
        changeAmount: Number(quote['09. change']),
        changePercent: Number(quote['10. change percent'].replace('%', '')) / 100,
        timestamp: new Date().toISOString(),
        volume: Number(quote['06. volume']),
        previousClose: Number(quote['08. previous close']),
        high: Number(quote['03. high']),
        low: Number(quote['04. low']),
        open: Number(quote['02. open']),
        source: 'alpha-vantage',
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching real stock data:', error);
    return null;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StockApiResponse | { error: string }>
) {
  const { symbol } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (typeof symbol !== 'string' || !symbol.trim()) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  try {
    // Try to fetch real data first, fall back to mock data
    let stockData = await fetchRealStockData(symbol);
    
    if (!stockData) {
      stockData = generateMockStockData(symbol);
    }

    // Cache control headers
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    
    return res.status(200).json(stockData);
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error);
    
    // Fallback to mock data on error
    const mockData = generateMockStockData(symbol);
    return res.status(200).json(mockData);
  }
}