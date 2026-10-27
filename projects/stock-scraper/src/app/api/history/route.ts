import { NextRequest, NextResponse } from "next/server";
import { fetchHistory } from "@/lib/yahoo";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const symbol = (sp.get("symbol") || "").toUpperCase();
    if (!symbol) {
      return NextResponse.json({ error: "symbol is required" }, { status: 400 });
    }

    const range = sp.get("range") || "1y"; // 1m, 3m, 6m, 1y, 2y, 5y
    const interval = (sp.get("interval") || "1d") as "1d" | "1wk" | "1mo";

    const now = new Date();
    const period2 = now;
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

    const bars = await fetchHistory(symbol, period1, period2, interval);

    return NextResponse.json({
      symbol,
      range,
      interval,
      count: bars.length,
      bars,
    });
  } catch (err) {
    console.error("history error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch history" },
      { status: 500 }
    );
  }
}
