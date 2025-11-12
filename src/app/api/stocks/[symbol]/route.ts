// src/app/api/stocks/[symbol]/route.ts
import { NextRequest, NextResponse } from '...';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

interface AlphaVantageResponse {
  "Global Quote": {
    "01. symbol": string;
    "05. price": string;
    "09. change": string;
    "10. change percent": string;
    "06. volume": string;
    "08. previous close": string;
  };
}

interface FinnhubQuote {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
  t: number; // timestamp
}

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } },
) {
  const symbol = params.symbol.toUpperCase();

  try {
    // Try Finnhub first (more reliable for real-time data)
    const finnhubUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const finnhubResponse = await fetch(finnhubUrl, {
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (finnhubResponse.ok) {
      const data: FinnhubQuote = await finnhubResponse.json();

      return NextResponse.json({
        symbol,
        price: data.c,
        changeAmount: data.d,
        changePercent: data.dp / 100, // Convert to decimal
        timestamp: new Date(data.t * 1000).toISOString(),
        open: data.o,
        high: data.h,
        low: data.l,
        previousClose: data.pc,
        volume: null, // Finnhub quote doesn't include volume
        source: "finnhub",
      });
    }

    // Fallback to Alpha Vantage
    const alphaVantageUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const alphaResponse = await fetch(alphaVantageUrl, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (alphaResponse.ok) {
      const data: AlphaVantageResponse = await alphaResponse.json();
      const quote = data["Global Quote"];

      if (!quote || !quote["05. price"]) {
        throw new Error("Invalid API response");
      }

      return NextResponse.json({
        symbol: quote["01. symbol"],
        price: parseFloat(quote["05. price"]),
        changeAmount: parseFloat(quote["09. change"]),
        changePercent:
          parseFloat(quote["10. change percent"].replace("%", "")) / 100,
        timestamp: new Date().toISOString(),
        volume: parseInt(quote["06. volume"]),
        previousClose: parseFloat(quote["08. previous close"]),
        source: "alpha-vantage",
      });
    }

    throw new Error("All API providers failed");
  } catch (error) {
    console.error("Stock API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 },
    );
  }
}
