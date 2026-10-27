import { NextRequest, NextResponse } from "next/server";
import { getCachedUniverseQuotes, fetchQuotes, searchSymbols, fetchQuote } from "@/lib/yahoo";
import { UNIQUE_UNIVERSE } from "@/lib/universe";
import { LIQUID_SYMBOLS } from "@/lib/liquid";
import type { QuoteSnapshot, StockFilters } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function applyFilters(quotes: QuoteSnapshot[], filters: StockFilters): QuoteSnapshot[] {
  let result = [...quotes];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.symbol.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q)
    );
  }

  if (filters.exchange && filters.exchange !== "ALL") {
    result = result.filter((r) => r.exchange === filters.exchange);
  }

  if (filters.sector && filters.sector !== "ALL") {
    result = result.filter((r) => r.sector === filters.sector);
  }

  if (filters.minPrice != null) {
    result = result.filter((r) => r.price != null && r.price >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    result = result.filter((r) => r.price != null && r.price <= filters.maxPrice!);
  }
  if (filters.minMarketCap != null) {
    result = result.filter(
      (r) => r.marketCap != null && r.marketCap >= filters.minMarketCap!
    );
  }
  if (filters.maxMarketCap != null) {
    result = result.filter(
      (r) => r.marketCap != null && r.marketCap <= filters.maxMarketCap!
    );
  }
  if (filters.minChangePercent != null) {
    result = result.filter(
      (r) => r.changePercent != null && r.changePercent >= filters.minChangePercent!
    );
  }
  if (filters.maxChangePercent != null) {
    result = result.filter(
      (r) => r.changePercent != null && r.changePercent <= filters.maxChangePercent!
    );
  }
  if (filters.minVolume != null) {
    result = result.filter((r) => r.volume != null && r.volume >= filters.minVolume!);
  }

  const sortBy = filters.sortBy ?? "marketCap";
  const sortDir = filters.sortDir ?? "desc";
  result.sort((a, b) => {
    const av = a[sortBy] as number | string | null;
    const bv = b[sortBy] as number | string | null;
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    let cmp = 0;
    if (typeof av === "string" && typeof bv === "string") cmp = av.localeCompare(bv);
    else cmp = Number(av) - Number(bv);
    return sortDir === "asc" ? cmp : -cmp;
  });

  return result;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const symbolsParam = sp.get("symbols");
    const search = sp.get("search") || undefined;
    const limit = Math.min(Number(sp.get("limit") || 500), 500);

    // Single symbol detail
    if (sp.get("symbol")) {
      const q = await fetchQuote(sp.get("symbol")!.toUpperCase());
      if (!q) return NextResponse.json({ error: "Symbol not found" }, { status: 404 });
      return NextResponse.json({ quote: q });
    }

    // Yahoo search
    if (sp.get("q")) {
      const results = await searchSymbols(sp.get("q")!, 20);
      return NextResponse.json({ results });
    }

    let quotes: QuoteSnapshot[];

    if (symbolsParam) {
      const symbols = symbolsParam
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 200);
      quotes = await fetchQuotes(symbols);
    } else {
      // Universe quotes — optionally limit for faster first paint
      const subset = sp.get("subset");
      if (subset === "top") {
        quotes = await fetchQuotes([...LIQUID_SYMBOLS]);
      } else {
        quotes = await getCachedUniverseQuotes();
      }
    }

    const filters: StockFilters = {
      search,
      exchange: (sp.get("exchange") as StockFilters["exchange"]) || "ALL",
      sector: (sp.get("sector") as StockFilters["sector"]) || "ALL",
      minPrice: sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined,
      maxPrice: sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
      minMarketCap: sp.get("minMarketCap") ? Number(sp.get("minMarketCap")) : undefined,
      maxMarketCap: sp.get("maxMarketCap") ? Number(sp.get("maxMarketCap")) : undefined,
      minChangePercent: sp.get("minChangePercent")
        ? Number(sp.get("minChangePercent"))
        : undefined,
      maxChangePercent: sp.get("maxChangePercent")
        ? Number(sp.get("maxChangePercent"))
        : undefined,
      minVolume: sp.get("minVolume") ? Number(sp.get("minVolume")) : undefined,
      sortBy: (sp.get("sortBy") as StockFilters["sortBy"]) || "marketCap",
      sortDir: (sp.get("sortDir") as StockFilters["sortDir"]) || "desc",
    };

    const filtered = applyFilters(quotes, filters).slice(0, limit);

    return NextResponse.json({
      count: filtered.length,
      totalFetched: quotes.length,
      universeSize: UNIQUE_UNIVERSE.length,
      updatedAt: new Date().toISOString(),
      quotes: filtered,
    });
  } catch (err) {
    console.error("quotes error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}
