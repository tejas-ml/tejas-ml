import YahooFinance from "yahoo-finance2";
import type { OhlcvBar, QuoteSnapshot, StockMeta } from "./types";
import { getStockMeta, UNIQUE_UNIVERSE } from "./universe";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey", "ripHistorical"],
});

function num(v: unknown): number | null {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return null;
  return Number(v);
}

function mapQuote(symbol: string, raw: Record<string, unknown>, meta?: StockMeta): QuoteSnapshot {
  const m = meta ?? getStockMeta(symbol);
  const price = num(raw.regularMarketPrice);
  const prev = num(raw.regularMarketPreviousClose);
  const change = num(raw.regularMarketChange) ?? (price != null && prev != null ? price - prev : null);
  const changePercent =
    num(raw.regularMarketChangePercent) ??
    (change != null && prev != null && prev !== 0 ? (change / prev) * 100 : null);

  return {
    symbol,
    name: (raw.longName as string) || (raw.shortName as string) || m?.name || symbol,
    exchange: m?.exchange ?? "OTHER",
    sector: m?.sector ?? "Other",
    price,
    previousClose: prev,
    change,
    changePercent,
    open: num(raw.regularMarketOpen),
    dayHigh: num(raw.regularMarketDayHigh),
    dayLow: num(raw.regularMarketDayLow),
    volume: num(raw.regularMarketVolume),
    avgVolume: num(raw.averageDailyVolume3Month) ?? num(raw.averageVolume),
    marketCap: num(raw.marketCap),
    pe: num(raw.trailingPE) ?? num(raw.forwardPE),
    fiftyTwoWeekHigh: num(raw.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: num(raw.fiftyTwoWeekLow),
    currency: (raw.currency as string) || "USD",
    marketState: (raw.marketState as string) || "UNKNOWN",
    updatedAt: new Date().toISOString(),
  };
}

/** Fetch a single quote */
export async function fetchQuote(symbol: string): Promise<QuoteSnapshot | null> {
  try {
    const result = await yahooFinance.quote(symbol);
    if (!result) return null;
    return mapQuote(symbol, result as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Fetch quotes in batches to stay polite with Yahoo */
export async function fetchQuotes(
  symbols: string[],
  batchSize = 40
): Promise<QuoteSnapshot[]> {
  const out: QuoteSnapshot[] = [];

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    try {
      const results = await yahooFinance.quote(batch);
      const list = Array.isArray(results) ? results : [results];
      for (const r of list) {
        if (!r || !(r as { symbol?: string }).symbol) continue;
        const sym = (r as { symbol: string }).symbol;
        out.push(mapQuote(sym, r as unknown as Record<string, unknown>));
      }
    } catch {
      // Fall back to individual fetches for this batch
      const settled = await Promise.allSettled(batch.map((s) => fetchQuote(s)));
      for (const s of settled) {
        if (s.status === "fulfilled" && s.value) out.push(s.value);
      }
    }
  }

  return out;
}

/** Fetch EOD historical bars */
export async function fetchHistory(
  symbol: string,
  period1: Date | string,
  period2: Date | string = new Date(),
  interval: "1d" | "1wk" | "1mo" = "1d"
): Promise<OhlcvBar[]> {
  try {
    const result = await yahooFinance.historical(symbol, {
      period1,
      period2,
      interval,
    });

    return (result || [])
      .filter((r) => r.close != null)
      .map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        open: Number(r.open),
        high: Number(r.high),
        low: Number(r.low),
        close: Number(r.close),
        volume: Number(r.volume ?? 0),
        adjClose: Number(r.adjClose ?? r.close),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

/** Search symbols via Yahoo */
export async function searchSymbols(query: string, limit = 15) {
  try {
    const result = await yahooFinance.search(query, { quotesCount: limit, newsCount: 0 });
    return (result.quotes || [])
      .filter((q) => {
        const qq = q as { quoteType?: string; symbol?: string };
        return (
          qq.symbol &&
          (qq.quoteType === "EQUITY" || qq.quoteType === "ETF")
        );
      })
      .map((q) => {
        const qq = q as {
          symbol: string;
          shortname?: string;
          longname?: string;
          exchange?: string;
        };
        return {
          symbol: qq.symbol,
          name: qq.longname || qq.shortname || qq.symbol,
          exchange: qq.exchange || "OTHER",
        };
      });
  } catch {
    return [];
  }
}

/** Full universe symbols */
export function getUniverseSymbols(): string[] {
  return UNIQUE_UNIVERSE.map((s) => s.symbol);
}

/** Simple in-memory cache for quotes (serverless-friendly short TTL) */
const quoteCache = new Map<string, { data: QuoteSnapshot[]; expires: number }>();
const QUOTE_TTL_MS = 60_000; // 1 minute

export async function getCachedUniverseQuotes(
  symbols?: string[]
): Promise<QuoteSnapshot[]> {
  const list = symbols ?? getUniverseSymbols();
  const key = list.length === getUniverseSymbols().length ? "ALL" : list.join(",");
  const hit = quoteCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;

  const data = await fetchQuotes(list);
  quoteCache.set(key, { data, expires: Date.now() + QUOTE_TTL_MS });
  return data;
}
