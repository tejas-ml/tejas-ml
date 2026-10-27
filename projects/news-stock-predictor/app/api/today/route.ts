import { NextResponse } from "next/server";
import { predictCompany, type Prediction } from "@/lib/predict";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The default watchlist shown as "today's predicted movements".
const WATCHLIST: { symbol: string; name: string }[] = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "META", name: "Meta Platforms" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "NFLX", name: "Netflix" },
];

type Movement = {
  symbol: string;
  name: string;
  prediction: Prediction;
  confidence: number;
  avgScore: number;
  analyzed: number;
};

// Cache results in the warm serverless instance for a few minutes so every
// page load doesn't re-scrape eight feeds.
const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { at: number; payload: unknown } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json(cache.payload);
  }

  const settled = await Promise.allSettled(
    WATCHLIST.map(async (stock) => {
      const r = await predictCompany(stock.name);
      return {
        symbol: stock.symbol,
        name: stock.name,
        prediction: r.prediction,
        confidence: r.confidence,
        avgScore: r.avgScore,
        analyzed: r.analyzed,
      } satisfies Movement;
    })
  );

  const movements = settled
    .filter((s): s is PromiseFulfilledResult<Movement> => s.status === "fulfilled")
    .map((s) => s.value);

  const payload = { movements, generatedAt: new Date().toISOString() };

  // Only cache when we actually got results, so a transient failure isn't sticky.
  if (movements.length > 0) {
    cache = { at: Date.now(), payload };
  }

  return NextResponse.json(payload);
}
