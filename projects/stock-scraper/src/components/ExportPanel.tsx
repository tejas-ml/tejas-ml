"use client";

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { getAllSymbols } from "@/lib/universe";

interface ExportPanelProps {
  selectedSymbol?: string | null;
}

const RANGES = [
  { id: "3m", label: "3 months" },
  { id: "6m", label: "6 months" },
  { id: "1y", label: "1 year" },
  { id: "2y", label: "2 years" },
  { id: "5y", label: "5 years" },
];

export function ExportPanel({ selectedSymbol }: ExportPanelProps) {
  const [tickers, setTickers] = useState(
    selectedSymbol ? selectedSymbol : "AAPL, MSFT, NVDA, SPY"
  );
  const [range, setRange] = useState("1y");
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");
  const [layout, setLayout] = useState<"wide" | "long">("wide");
  const [batchOffset, setBatchOffset] = useState(0);

  const universeSize = useMemo(() => getAllSymbols().length, []);
  const batchSize = 50;
  const maxOffset = Math.max(0, universeSize - batchSize);

  const symbolsClean = tickers
    .split(/[,;\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 40)
    .join(",");

  const multiHref = `/api/export?mode=multi_history&symbols=${encodeURIComponent(symbolsClean)}&range=${range}&layout=${layout}&closesOnly=1&format=${format}`;
  const singleHref = `/api/export?mode=history&symbol=${encodeURIComponent(
    (selectedSymbol || tickers.split(/[,;\s]+/)[0] || "AAPL").toUpperCase()
  )}&range=${range}&format=${format}`;
  const singleClosesHref = `/api/export?mode=history&symbol=${encodeURIComponent(
    (selectedSymbol || "AAPL").toUpperCase()
  )}&range=${range}&closesOnly=1&format=${format}`;
  const liquidHref = `/api/export?mode=liquid_closes&range=${range}&format=${format}`;
  const universeHref = `/api/export?mode=universe_closes&range=${range}&offset=${batchOffset}&limit=${batchSize}&format=${format}`;
  const quotesHref = `/api/export?mode=quotes&format=${format}`;

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="text-sm font-semibold">Download options</h3>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
              Daily closing prices for one ticker, many tickers, or the full universe in batches
            </p>
          </div>
        </div>
        <div className="card-body space-y-5">
          {/* Shared controls */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-[0.7rem] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Date range
              </label>
              <select className="select" value={range} onChange={(e) => setRange(e.target.value)}>
                {RANGES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[0.7rem] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                File format
              </label>
              <select
                className="select"
                value={format}
                onChange={(e) => setFormat(e.target.value as "xlsx" | "csv")}
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[0.7rem] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Multi-ticker layout
              </label>
              <select
                className="select"
                value={layout}
                onChange={(e) => setLayout(e.target.value as "wide" | "long")}
              >
                <option value="wide">Wide (Date × symbols as columns)</option>
                <option value="long">Long (Date, Symbol, Close rows)</option>
              </select>
            </div>
          </div>

          {/* Multi ticker */}
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
          >
            <div className="flex items-start gap-3">
              <FileSpreadsheet size={20} style={{ color: "var(--accent)", marginTop: 2 }} />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold">Multiple tickers — daily closes</h4>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  Paste symbols separated by commas or spaces (max 40). Great for a custom watchlist.
                </p>
                <textarea
                  className="input mt-3 w-full font-mono text-sm"
                  rows={3}
                  value={tickers}
                  onChange={(e) => setTickers(e.target.value)}
                  placeholder="AAPL, MSFT, NVDA, GOOGL, SPY"
                />
                <a className="btn btn-success mt-3" href={symbolsClean ? multiHref : undefined}>
                  <Download size={14} /> Download multi-ticker ({range})
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ExportCard
              title="One ticker — full OHLCV"
              description={`${selectedSymbol || "Current symbol"} open/high/low/close/volume for ${range}`}
              href={singleHref}
              label="Download OHLCV"
            />
            <ExportCard
              title="One ticker — closes only"
              description={`Just date + close for ${selectedSymbol || "selected symbol"}`}
              href={singleClosesHref}
              label="Download closes"
            />
            <ExportCard
              title="Liquid mega-caps — close matrix"
              description={`~80 large liquid names as a Date × Symbol close matrix (${range})`}
              href={liquidHref}
              label="Download liquid matrix"
            />
            <ExportCard
              title="Live quote snapshot"
              description="Latest prices, change %, volume, market cap for the universe"
              href={quotesHref}
              label="Download quotes"
            />
          </div>

          {/* Universe batches */}
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
          >
            <h4 className="text-sm font-semibold">Full universe — daily closes (batched)</h4>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {universeSize} curated US tickers. Downloads come in batches of {batchSize} (server
              time limits). Step through offsets to get everything: 0, {batchSize},{" "}
              {batchSize * 2}…
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-[0.7rem] uppercase" style={{ color: "var(--text-muted)" }}>
                  Batch offset
                </label>
                <input
                  type="number"
                  className="input w-28"
                  min={0}
                  max={maxOffset}
                  step={batchSize}
                  value={batchOffset}
                  onChange={(e) => setBatchOffset(Number(e.target.value))}
                />
              </div>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                Symbols {batchOffset + 1}–{Math.min(batchOffset + batchSize, universeSize)} of{" "}
                {universeSize}
              </p>
              <a className="btn btn-primary" href={universeHref}>
                <Download size={14} /> Download batch
              </a>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={batchOffset + batchSize >= universeSize}
                onClick={() =>
                  setBatchOffset((o) => Math.min(o + batchSize, maxOffset))
                }
              >
                Next batch →
              </button>
            </div>
          </div>

          <p className="text-xs" style={{ color: "var(--text-dim)" }}>
            Source: Yahoo Finance delayed / EOD. Educational use only — not investment advice.
          </p>
        </div>
      </div>
    </div>
  );
}

function ExportCard({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <div
      className="flex flex-col rounded-xl border p-4"
      style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
    >
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="mt-1 flex-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
      <a className="btn btn-success mt-4 self-start" href={href}>
        <Download size={14} /> {label}
      </a>
    </div>
  );
}
