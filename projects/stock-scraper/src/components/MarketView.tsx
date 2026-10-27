"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Search, X } from "lucide-react";
import type { OhlcvBar, QuoteSnapshot } from "@/lib/types";
import { formatChangePercent, formatCompact, formatPrice } from "@/lib/format";
import { useTheme } from "./ThemeProvider";

interface SearchHit {
  symbol: string;
  name: string;
  exchange: string;
}

interface MarketViewProps {
  symbol: string;
  onSymbolChange: (s: string) => void;
}

/** Pixel selection within the chart container (client coords converted to local x). */
interface PixelSel {
  x0: number;
  x1: number;
}

const RANGES = [
  { id: "1m", label: "1M" },
  { id: "3m", label: "3M" },
  { id: "6m", label: "6M" },
  { id: "1y", label: "1Y" },
  { id: "2y", label: "2Y" },
  { id: "5y", label: "5Y" },
];

const POPULAR = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "JPM", "SPY", "QQQ"];

/** Must match ComposedChart Y-axis widths + right margin. */
const PLOT_PAD = { left: 56, right: 52 };

const MIN_DRAG_PX = 4;

function formatDateLabel(date: string): string {
  if (date.length >= 10) {
    const d = new Date(`${date}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }
  return date;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** Local X (relative to chart container) → bar index. */
function indexFromLocalX(localX: number, containerWidth: number, barCount: number): number {
  if (barCount <= 1) return 0;
  const plotW = Math.max(1, containerWidth - PLOT_PAD.left - PLOT_PAD.right);
  const t = clamp((localX - PLOT_PAD.left) / plotW, 0, 1);
  return Math.round(t * (barCount - 1));
}

function localXFromEvent(clientX: number, el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  return clientX - rect.left;
}

export function MarketView({ symbol, onSymbolChange }: MarketViewProps) {
  const { theme } = useTheme();
  const [query, setQuery] = useState(symbol);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [showHits, setShowHits] = useState(false);
  const [quote, setQuote] = useState<QuoteSnapshot | null>(null);
  const [bars, setBars] = useState<OhlcvBar[]>([]);
  const [range, setRange] = useState("1y");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Drag state in refs (no stale closures) + state for render
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const chartWidthRef = useRef(0);
  const barsRef = useRef(bars);
  barsRef.current = bars;

  const [liveSel, setLiveSel] = useState<PixelSel | null>(null);
  const [committedSel, setCommittedSel] = useState<PixelSel | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  const grid = theme === "dark" ? "#2e3442" : "#e8e4da";
  const axis = theme === "dark" ? "#6b7385" : "#8a877c";
  const tipBg = theme === "dark" ? "#1e222c" : "#ffffff";
  const tipBorder = theme === "dark" ? "#2e3442" : "#e4e0d6";
  const selectFill = theme === "dark" ? "rgba(96, 165, 250, 0.28)" : "rgba(37, 99, 235, 0.2)";
  const selectStroke = theme === "dark" ? "rgba(96, 165, 250, 0.85)" : "rgba(37, 99, 235, 0.65)";

  useEffect(() => {
    setQuery(symbol);
  }, [symbol]);

  useEffect(() => {
    draggingRef.current = false;
    setLiveSel(null);
    setCommittedSel(null);
  }, [symbol, range]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowHits(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!query || query.length < 1) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/quotes?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setHits(data.results || []);
      } catch {
        setHits([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async (sym: string, r: string) => {
    if (!sym) return;
    setLoading(true);
    setError(null);
    try {
      const [hRes, qRes] = await Promise.all([
        fetch(`/api/history?symbol=${encodeURIComponent(sym)}&range=${r}`),
        fetch(`/api/quotes?symbol=${encodeURIComponent(sym)}`),
      ]);
      const hData = await hRes.json();
      const qData = await qRes.json();
      if (!hRes.ok) throw new Error(hData.error || "Failed to load history");
      setBars(hData.bars || []);
      setQuote(qData.quote || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setBars([]);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (symbol) load(symbol, range);
  }, [symbol, range, load]);

  const select = (sym: string) => {
    const s = sym.trim().toUpperCase();
    setQuery(s);
    setShowHits(false);
    onSymbolChange(s);
  };

  const beginDrag = useCallback((clientX: number) => {
    const el = chartRef.current;
    if (!el || barsRef.current.length === 0) return;
    const rect = el.getBoundingClientRect();
    chartWidthRef.current = rect.width;
    setChartWidth(rect.width);
    const x = clientX - rect.left;
    draggingRef.current = true;
    startXRef.current = x;
    setCommittedSel(null);
    setLiveSel({ x0: x, x1: x });
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  }, []);

  // Native listeners on the chart node (capture) — more reliable than React synthetic events over SVG
  useEffect(() => {
    const el = chartRef.current;
    if (!el || loading || bars.length === 0) return;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      // Ignore if user is interacting with a control inside (none currently)
      e.preventDefault();
      e.stopPropagation();
      beginDrag(e.clientX);
    };

    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const node = chartRef.current;
      if (!node) return;
      const x = localXFromEvent(e.clientX, node);
      setLiveSel({ x0: startXRef.current, x1: x });
    };

    const onUp = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      const node = chartRef.current;
      if (!node) {
        setLiveSel(null);
        return;
      }
      const x = localXFromEvent(e.clientX, node);
      const sel = { x0: startXRef.current, x1: x };
      setLiveSel(null);
      if (Math.abs(sel.x1 - sel.x0) < MIN_DRAG_PX) {
        setCommittedSel(null);
      } else {
        setCommittedSel(sel);
      }
      document.body.style.removeProperty("user-select");
      document.body.style.removeProperty("cursor");
    };

    el.addEventListener("mousedown", onDown, true);
    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("mouseup", onUp, true);
    // Touch
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      beginDrag(e.touches[0].clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!draggingRef.current || e.touches.length !== 1) return;
      e.preventDefault();
      const node = chartRef.current;
      if (!node) return;
      const x = localXFromEvent(e.touches[0].clientX, node);
      setLiveSel({ x0: startXRef.current, x1: x });
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!draggingRef.current) return;
      const touch = e.changedTouches[0];
      if (touch) {
        onUp({ clientX: touch.clientX, button: 0 } as MouseEvent);
      } else {
        draggingRef.current = false;
        setLiveSel(null);
      }
    };
    el.addEventListener("touchstart", onTouchStart, { passive: false, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("touchend", onTouchEnd, true);

    return () => {
      el.removeEventListener("mousedown", onDown, true);
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("mouseup", onUp, true);
      el.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("touchmove", onTouchMove, true);
      window.removeEventListener("touchend", onTouchEnd, true);
    };
  }, [bars.length, loading, beginDrag]);

  const clearSelection = () => {
    draggingRef.current = false;
    setLiveSel(null);
    setCommittedSel(null);
  };

  const activeSel = liveSel ?? committedSel;
  const isDragging = liveSel != null;

  const measure = useMemo(() => {
    if (!activeSel || bars.length < 2) return null;
    const width =
      chartWidth ||
      chartWidthRef.current ||
      chartRef.current?.clientWidth ||
      chartRef.current?.getBoundingClientRect().width ||
      0;
    if (!width) return null;

    const xLo = Math.min(activeSel.x0, activeSel.x1);
    const xHi = Math.max(activeSel.x0, activeSel.x1);
    if (xHi - xLo < MIN_DRAG_PX && !isDragging) return null;

    const i0 = indexFromLocalX(xLo, width, bars.length);
    const i1 = indexFromLocalX(xHi, width, bars.length);
    const lo = Math.min(i0, i1);
    const hi = Math.max(i0, i1);
    if (lo === hi) return null;

    const from = bars[lo];
    const to = bars[hi];
    if (from == null || to == null) return null;
    if (typeof from.close !== "number" || typeof to.close !== "number") return null;
    if (from.close === 0) return null;

    const abs = to.close - from.close;
    const pct = (abs / from.close) * 100;
    return {
      from,
      to,
      days: hi - lo,
      abs,
      pct,
    };
  }, [activeSel, bars, isDragging, chartWidth]);

  const first = bars[0]?.close;
  const last = bars[bars.length - 1]?.close;
  const periodRet = first && last ? ((last - first) / first) * 100 : null;
  const up = (periodRet ?? quote?.changePercent ?? 0) >= 0;
  const stroke = up ? "var(--green)" : "var(--red)";
  const measureUp = (measure?.pct ?? 0) >= 0;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="card">
        <div className="card-body">
          <div ref={wrapRef} className="relative mx-auto max-w-xl">
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Search any US stock or ETF
            </label>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-dim)" }}
              />
              <input
                className="input w-full py-2.5 pl-10 pr-4 text-base font-medium uppercase tracking-wide"
                placeholder="AAPL, Microsoft, NVDA…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowHits(true);
                }}
                onFocus={() => setShowHits(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    select(query);
                  }
                }}
              />
            </div>
            {showHits && hits.length > 0 && (
              <div className="search-dropdown">
                {hits.map((h) => (
                  <button
                    key={h.symbol}
                    type="button"
                    className="search-result"
                    onClick={() => select(h.symbol)}
                  >
                    <span>
                      <span className="font-semibold" style={{ color: "var(--accent)" }}>
                        {h.symbol}
                      </span>
                      <span className="ml-2" style={{ color: "var(--text-muted)" }}>
                        {h.name}
                      </span>
                    </span>
                    <span className="badge badge-muted">{h.exchange}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {POPULAR.map((s) => (
              <button
                key={s}
                type="button"
                className={`btn ${symbol === s ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem" }}
                onClick={() => select(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quote + chart */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-xl font-semibold tracking-tight">{symbol}</h2>
              {quote && (
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {quote.name}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-semibold tabular-nums">
                {formatPrice(quote?.price ?? last)}
              </span>
              {quote?.changePercent != null && (
                <span className={`badge ${quote.changePercent >= 0 ? "badge-green" : "badge-red"}`}>
                  {formatChangePercent(quote.changePercent)} today
                </span>
              )}
              {periodRet != null && (
                <span className={periodRet >= 0 ? "pos" : "neg"} style={{ fontSize: "0.875rem" }}>
                  {periodRet >= 0 ? "+" : ""}
                  {periodRet.toFixed(2)}% over range
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="tabs">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`tab ${range === r.id ? "active" : ""}`}
                  onClick={() => setRange(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <a
              className="btn btn-secondary"
              href={`/api/export?mode=history&symbol=${encodeURIComponent(symbol)}&range=${range}&format=xlsx`}
            >
              <Download size={14} /> OHLCV
            </a>
            <a
              className="btn btn-secondary"
              href={`/api/export?mode=history&symbol=${encodeURIComponent(symbol)}&range=${range}&closesOnly=1&format=csv`}
            >
              <Download size={14} /> Closes
            </a>
          </div>
        </div>

        <div className="card-body">
          {quote && (
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              <Mini label="Open" value={formatPrice(quote.open)} />
              <Mini label="Day high" value={formatPrice(quote.dayHigh)} />
              <Mini label="Day low" value={formatPrice(quote.dayLow)} />
              <Mini label="Volume" value={formatCompact(quote.volume)} />
              <Mini label="Mkt cap" value={formatCompact(quote.marketCap)} />
              <Mini label="P/E" value={quote.pe != null ? quote.pe.toFixed(1) : "—"} />
            </div>
          )}

          {error && (
            <div
              className="mb-3 rounded-lg px-3 py-2 text-sm"
              style={{
                background: "var(--red-soft)",
                color: "var(--red)",
                border: "1px solid var(--red)",
              }}
            >
              {error}
            </div>
          )}

          {measure && (
            <div
              className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2.5"
              style={{
                background: measureUp ? "var(--green-soft)" : "var(--red-soft)",
                border: `1px solid ${measureUp ? "var(--green)" : "var(--red)"}`,
              }}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="font-medium" style={{ color: "var(--text-muted)" }}>
                  Selected range
                </span>
                <span className="tabular-nums">
                  {formatDateLabel(measure.from.date)}
                  <span style={{ color: "var(--text-dim)" }}> → </span>
                  {formatDateLabel(measure.to.date)}
                </span>
                <span style={{ color: "var(--text-dim)" }}>·</span>
                <span style={{ color: "var(--text-muted)" }}>
                  {measure.days} trading day{measure.days === 1 ? "" : "s"}
                </span>
                <span style={{ color: "var(--text-dim)" }}>·</span>
                <span className="tabular-nums">
                  {formatPrice(measure.from.close)}
                  <span style={{ color: "var(--text-dim)" }}> → </span>
                  {formatPrice(measure.to.close)}
                </span>
                <span
                  className="text-base font-semibold tabular-nums"
                  style={{ color: measureUp ? "var(--green)" : "var(--red)" }}
                >
                  {measure.pct >= 0 ? "+" : ""}
                  {measure.pct.toFixed(2)}%
                </span>
                <span
                  className="tabular-nums text-sm"
                  style={{ color: measureUp ? "var(--green)" : "var(--red)" }}
                >
                  ({measure.abs >= 0 ? "+" : ""}
                  {formatPrice(measure.abs)})
                </span>
              </div>
              {!isDragging && committedSel && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                  onClick={clearSelection}
                  title="Clear selection"
                >
                  <X size={14} /> Clear
                </button>
              )}
            </div>
          )}

          {/* Chart container owns mouse events; SVG is pointer-events: none */}
          <div
            ref={chartRef}
            className="market-chart relative h-[380px] select-none"
            style={{
              cursor: bars.length && !loading ? (isDragging ? "col-resize" : "crosshair") : undefined,
              touchAction: "none",
            }}
            role="img"
            aria-label={`${symbol} price chart — click and drag to measure return`}
          >
            {loading ? (
              <div className="skeleton h-full w-full" />
            ) : bars.length === 0 ? (
              <div
                className="flex h-full items-center justify-center text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Search a ticker to load end-of-day prices
              </div>
            ) : (
              <div className="pointer-events-none h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={bars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                    <XAxis
                      dataKey="date"
                      stroke={axis}
                      fontSize={11}
                      minTickGap={40}
                      tickFormatter={(d) => String(d).slice(5)}
                    />
                    <YAxis
                      yAxisId="price"
                      domain={["auto", "auto"]}
                      stroke={axis}
                      fontSize={11}
                      tickFormatter={(v) => `$${v}`}
                      width={56}
                    />
                    <YAxis
                      yAxisId="vol"
                      orientation="right"
                      stroke={axis}
                      fontSize={10}
                      tickFormatter={(v) => formatCompact(v)}
                      width={44}
                    />
                    <Tooltip
                      // Tooltip is visual-only; parent owns pointer events
                      trigger="hover"
                      wrapperStyle={{ pointerEvents: "none" }}
                      contentStyle={{
                        background: tipBg,
                        border: `1px solid ${tipBorder}`,
                        borderRadius: 8,
                        fontSize: 12,
                        pointerEvents: "none",
                      }}
                      active={isDragging ? false : undefined}
                      formatter={(value, name) => {
                        if (name === "volume") return [formatCompact(Number(value)), "Volume"];
                        return [formatPrice(Number(value)), String(name)];
                      }}
                      labelFormatter={(label) => formatDateLabel(String(label))}
                    />
                    <Bar yAxisId="vol" dataKey="volume" fill={grid} opacity={0.7} barSize={3} />
                    <Area
                      yAxisId="price"
                      type="monotone"
                      dataKey="close"
                      stroke={stroke}
                      fill="url(#priceFill)"
                      strokeWidth={2}
                      name="Close"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Live / committed selection highlight (pixel-based, always visible while dragging) */}
            {activeSel && bars.length > 0 && !loading && (
              <div
                className="pointer-events-none absolute bottom-0 top-0 z-20"
                style={{
                  left: Math.min(activeSel.x0, activeSel.x1),
                  width: Math.max(Math.abs(activeSel.x1 - activeSel.x0), 2),
                  background: selectFill,
                  borderLeft: `2px solid ${selectStroke}`,
                  borderRight: `2px solid ${selectStroke}`,
                  boxSizing: "border-box",
                }}
              />
            )}
          </div>

          {bars.length > 0 && (
            <p className="mt-2 text-xs" style={{ color: "var(--text-dim)" }}>
              {bars.length} daily bars · Yahoo Finance (delayed / EOD)
              <span className="mx-1.5">·</span>
              <strong style={{ color: "var(--text-muted)" }}>Click and drag</strong> across the
              chart to measure % change
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric" style={{ padding: "0.6rem 0.75rem" }}>
      <div className="metric-label">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
