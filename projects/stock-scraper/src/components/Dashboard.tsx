"use client";

import { useState } from "react";
import { Header, type TabId } from "./Header";
import { MarketView } from "./MarketView";
import { ExportPanel } from "./ExportPanel";

export function Dashboard() {
  const [tab, setTab] = useState<TabId>("markets");
  const [symbol, setSymbol] = useState("AAPL");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header activeTab={tab} onTabChange={setTab} />

      <main className="mx-auto max-w-[1200px] space-y-4 px-4 py-5 sm:px-6">
        {tab === "markets" && (
          <>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Markets</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Search a ticker · view live quote · end-of-day price chart
              </p>
            </div>
            <MarketView symbol={symbol} onSymbolChange={setSymbol} />
          </>
        )}

        {tab === "export" && (
          <>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Download</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Spreadsheets of daily closes for one, many, or all tracked stocks
              </p>
            </div>
            <ExportPanel selectedSymbol={symbol} />
          </>
        )}

        <footer
          className="border-t py-6 text-center text-[0.7rem]"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-dim)" }}
        >
          Stock Scraper · Educational EOD data tool · Not investment advice
        </footer>
      </main>
    </div>
  );
}
