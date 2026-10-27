import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { fetchQuotes, fetchHistory, getCachedUniverseQuotes } from "@/lib/yahoo";
import { LIQUID_SYMBOLS } from "@/lib/liquid";
import { getAllSymbols } from "@/lib/universe";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function rangeToPeriod1(range: string): Date {
  const now = new Date();
  const period1 = new Date(now);
  switch (range) {
    case "1m":
      period1.setMonth(period1.getMonth() - 1);
      break;
    case "3m":
      period1.setMonth(period1.getMonth() - 3);
      break;
    case "6m":
      period1.setMonth(period1.getMonth() - 6);
      break;
    case "2y":
      period1.setFullYear(period1.getFullYear() - 2);
      break;
    case "5y":
      period1.setFullYear(period1.getFullYear() - 5);
      break;
    case "1y":
    default:
      period1.setFullYear(period1.getFullYear() - 1);
      break;
  }
  return period1;
}

function sheetResponse(
  wb: XLSX.WorkBook,
  filename: string,
  format: "xlsx" | "csv"
) {
  if (format === "csv") {
    const first = wb.SheetNames[0];
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[first]);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename.replace(/\.xlsx$/, ".csv")}"`,
      },
    });
  }
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/** Long format: Date, Symbol, Close, ... */
async function multiHistoryLong(
  symbols: string[],
  range: string,
  closesOnly: boolean
) {
  const period1 = rangeToPeriod1(range);
  const now = new Date();
  const rows: Record<string, string | number>[] = [];

  // sequential batches to stay polite
  for (const symbol of symbols) {
    const bars = await fetchHistory(symbol, period1, now, "1d");
    for (const b of bars) {
      if (closesOnly) {
        rows.push({ Date: b.date, Symbol: symbol, Close: b.close, AdjClose: b.adjClose });
      } else {
        rows.push({
          Date: b.date,
          Symbol: symbol,
          Open: b.open,
          High: b.high,
          Low: b.low,
          Close: b.close,
          AdjClose: b.adjClose,
          Volume: b.volume,
        });
      }
    }
  }
  return rows;
}

/** Wide format: Date as rows, symbols as columns of Close */
async function multiHistoryWide(symbols: string[], range: string) {
  const period1 = rangeToPeriod1(range);
  const now = new Date();
  const byDate = new Map<string, Record<string, string | number>>();

  for (const symbol of symbols) {
    const bars = await fetchHistory(symbol, period1, now, "1d");
    for (const b of bars) {
      const row = byDate.get(b.date) || { Date: b.date };
      row[symbol] = b.close;
      byDate.set(b.date, row);
    }
  }

  return Array.from(byDate.values()).sort((a, b) =>
    String(a.Date).localeCompare(String(b.Date))
  );
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const format = (sp.get("format") || "xlsx") as "xlsx" | "csv";
    const mode = sp.get("mode") || "quotes";
    // modes: quotes | history | multi_history | closes_matrix | liquid_closes | universe_closes
    const symbolsParam = sp.get("symbols");
    const symbol = sp.get("symbol")?.toUpperCase();
    const range = sp.get("range") || "1y";
    const layout = sp.get("layout") || "long"; // long | wide
    const closesOnly = sp.get("closesOnly") === "1" || sp.get("closesOnly") === "true";

    // --- Single ticker full OHLCV ---
    if (mode === "history") {
      if (!symbol) {
        return NextResponse.json({ error: "symbol required" }, { status: 400 });
      }
      const bars = await fetchHistory(symbol, rangeToPeriod1(range), new Date(), "1d");
      const rows = bars.map((b) =>
        closesOnly
          ? { Date: b.date, Close: b.close, AdjClose: b.adjClose }
          : {
              Date: b.date,
              Open: b.open,
              High: b.high,
              Low: b.low,
              Close: b.close,
              AdjClose: b.adjClose,
              Volume: b.volume,
            }
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), symbol.slice(0, 31));
      return sheetResponse(wb, `${symbol}_eod_${range}.xlsx`, format);
    }

    // --- Multi ticker history ---
    if (mode === "multi_history" || mode === "closes_matrix") {
      let symbols: string[] = [];
      if (symbolsParam) {
        symbols = symbolsParam
          .split(/[,;\s]+/)
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
      }
      // de-dupe & cap
      symbols = Array.from(new Set(symbols)).slice(0, 40);
      if (symbols.length === 0) {
        return NextResponse.json(
          { error: "symbols required (comma-separated, max 40)" },
          { status: 400 }
        );
      }

      const isMatrix = mode === "closes_matrix";
      const useWide = isMatrix || layout === "wide";
      const rows = useWide
        ? await multiHistoryWide(symbols, range)
        : await multiHistoryLong(symbols, range, closesOnly || isMatrix);

      const wb = XLSX.utils.book_new();
      const sheetName = useWide ? "Closes" : "EOD";
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheetName);
      const meta = XLSX.utils.json_to_sheet([
        { Field: "Symbols", Value: symbols.join(", ") },
        { Field: "Range", Value: range },
        { Field: "Layout", Value: useWide ? "wide (dates × symbols)" : "long" },
        { Field: "Generated", Value: new Date().toISOString() },
        { Field: "Source", Value: "Yahoo Finance EOD" },
      ]);
      XLSX.utils.book_append_sheet(wb, meta, "Meta");
      const tag = symbols.length <= 3 ? symbols.join("_") : `${symbols.length}tickers`;
      return sheetResponse(wb, `closes_${tag}_${range}.xlsx`, format);
    }

    // --- Liquid universe daily closes (wide matrix) ---
    if (mode === "liquid_closes") {
      const symbols = [...LIQUID_SYMBOLS].slice(0, 40);
      const rows = await multiHistoryWide(symbols, range);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Daily Closes");
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet([
          { Field: "Count", Value: symbols.length },
          { Field: "Range", Value: range },
          { Field: "Generated", Value: new Date().toISOString() },
        ]),
        "Meta"
      );
      return sheetResponse(wb, `liquid_daily_closes_${range}.xlsx`, format);
    }

    // --- Full curated universe: long format closes (batched, capped for serverless) ---
    if (mode === "universe_closes") {
      const all = getAllSymbols();
      // Cap for Vercel timeout — client can request "page" of symbols
      const offset = Math.max(0, Number(sp.get("offset") || 0));
      const limit = Math.min(Number(sp.get("limit") || 50), 50);
      const symbols = all.slice(offset, offset + limit);
      if (symbols.length === 0) {
        return NextResponse.json({ error: "No symbols in range" }, { status: 400 });
      }
      const rows = await multiHistoryLong(symbols, range, true);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Closes");
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet([
          { Field: "Offset", Value: offset },
          { Field: "Limit", Value: limit },
          { Field: "Batch size", Value: symbols.length },
          { Field: "Universe total", Value: all.length },
          { Field: "Symbols", Value: symbols.join(", ") },
          { Field: "Range", Value: range },
          { Field: "Generated", Value: new Date().toISOString() },
          {
            Field: "Note",
            Value: `Download batches with offset=0,50,100… until offset >= ${all.length}`,
          },
        ]),
        "Meta"
      );
      return sheetResponse(
        wb,
        `universe_closes_${range}_o${offset}_n${symbols.length}.xlsx`,
        format
      );
    }

    // --- Snapshot quotes ---
    let quotes;
    if (symbolsParam) {
      const symbols = symbolsParam
        .split(/[,;\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 300);
      quotes = await fetchQuotes(symbols);
    } else if (sp.get("subset") === "top") {
      quotes = await fetchQuotes([...LIQUID_SYMBOLS]);
    } else {
      quotes = await getCachedUniverseQuotes();
    }

    const rows = quotes.map((q) => ({
      Symbol: q.symbol,
      Name: q.name,
      Exchange: q.exchange,
      Sector: q.sector,
      Price: q.price,
      PreviousClose: q.previousClose,
      Change: q.change,
      ChangePercent: q.changePercent,
      Open: q.open,
      DayHigh: q.dayHigh,
      DayLow: q.dayLow,
      Volume: q.volume,
      AvgVolume: q.avgVolume,
      MarketCap: q.marketCap,
      PE: q.pe,
      "52WHigh": q.fiftyTwoWeekHigh,
      "52WLow": q.fiftyTwoWeekLow,
      Currency: q.currency,
      MarketState: q.marketState,
      UpdatedAt: q.updatedAt,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Quotes");
    return sheetResponse(
      wb,
      `us_stocks_quotes_${new Date().toISOString().slice(0, 10)}.xlsx`,
      format
    );
  } catch (err) {
    console.error("export error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Export failed" },
      { status: 500 }
    );
  }
}
