"use client";

import { useEffect, useState } from "react";

type Headline = {
  title: string;
  link: string;
  source: string;
  pubDate: string | null;
  score: number;
  label: "positive" | "negative" | "neutral";
};

type Prediction = "INCREASE" | "DECREASE" | "NEUTRAL";

type Result = {
  company: string;
  prediction: Prediction;
  confidence: number;
  avgScore: number;
  analyzed: number;
  positives: number;
  negatives: number;
  neutrals: number;
  headlines: Headline[];
  generatedAt: string;
};

type Movement = {
  symbol: string;
  name: string;
  prediction: Prediction;
  confidence: number;
  avgScore: number;
  analyzed: number;
};

const ARROWS: Record<Prediction, string> = {
  INCREASE: "↑ INCREASE",
  DECREASE: "↓ DECREASE",
  NEUTRAL: "→ NEUTRAL",
};

const GLYPH: Record<Prediction, string> = {
  INCREASE: "↑",
  DECREASE: "↓",
  NEUTRAL: "→",
};

export default function Home() {
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const [movements, setMovements] = useState<Movement[] | null>(null);
  const [movementsLoading, setMovementsLoading] = useState(true);

  const [mode, setMode] = useState<"fancy" | "basic">("basic");

  // Pick up the theme the inline script already applied, then keep them in sync.
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setMode(current === "fancy" ? "fancy" : "basic");
  }, []);

  function changeMode(next: "fancy" | "basic") {
    setMode(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("nsp-theme", next);
    } catch {
      /* ignore storage errors */
    }
  }

  // Load today's predicted movements on first render.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/today");
        const data = await res.json();
        if (active) setMovements(data.movements ?? []);
      } catch {
        if (active) setMovements([]);
      } finally {
        if (active) setMovementsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function predict(name: string) {
    const q = name.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data as Result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="wrap">
      <div className="topbar">
        <div className="mode-select" role="group" aria-label="Theme mode">
          <button
            type="button"
            className={mode === "basic" ? "active" : ""}
            onClick={() => changeMode("basic")}
          >
            Basic
          </button>
          <button
            type="button"
            className={mode === "fancy" ? "active" : ""}
            onClick={() => changeMode("fancy")}
          >
            Fancy
          </button>
        </div>
      </div>

      <div className="hero">
        <span className="badge">Sentiment-driven forecast</span>
        <h1>News Stock Predictor</h1>
        <p className="subtitle">
          Enter a stock ticker or company. We scrape the latest news headlines, score their
          sentiment, and predict whether the stock should move up or down.
        </p>
      </div>

      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault();
          predict(company);
        }}
      >
        <input
          type="text"
          placeholder="Enter a stock ticker… e.g. AAPL, TSLA, NVDA"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          aria-label="Stock ticker or company name"
        />
        <button type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : "Predict"}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result">
          <div className="verdict">
            <div className="company">{result.company}</div>
            <div className={`arrow ${result.prediction}`}>{ARROWS[result.prediction]}</div>
            <div className="conf-label">
              {result.confidence}% confidence · avg sentiment {result.avgScore} ·{" "}
              {result.analyzed} headlines
            </div>
            <div className="bar">
              <div
                className={result.prediction}
                style={{ width: `${result.confidence}%` }}
              />
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="num pos">{result.positives}</div>
              <div className="lbl">Positive</div>
            </div>
            <div className="stat">
              <div className="num neu">{result.neutrals}</div>
              <div className="lbl">Neutral</div>
            </div>
            <div className="stat">
              <div className="num neg">{result.negatives}</div>
              <div className="lbl">Negative</div>
            </div>
          </div>

          <div className="headlines">
            <h3>Headlines analyzed</h3>
            {result.headlines.map((h, i) => (
              <a
                key={i}
                href={h.link}
                target="_blank"
                rel="noopener noreferrer"
                className="headline"
              >
                <span className={`dot ${h.label}`} />
                <span>
                  <span className="h-title">{h.title}</span>
                  <span className="h-meta">
                    {h.source}
                    {h.pubDate ? ` · ${new Date(h.pubDate).toLocaleDateString()}` : ""} ·
                    score {h.score > 0 ? `+${h.score}` : h.score}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <section className="today">
        <div className="today-head">
          <h2>Today&apos;s predicted movements</h2>
          <span className="today-date">{today}</span>
        </div>

        {movementsLoading ? (
          <div className="today-loading">
            <span className="spinner dark" /> Scraping the latest headlines…
          </div>
        ) : movements && movements.length > 0 ? (
          <div className="movements">
            {movements.map((m) => (
              <button
                key={m.symbol}
                className="movement"
                onClick={() => {
                  setCompany(m.name);
                  predict(m.name);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                title={`See full analysis for ${m.name}`}
              >
                <div className="m-top">
                  <span className="m-symbol">{m.symbol}</span>
                  <span className={`m-glyph ${m.prediction}`}>{GLYPH[m.prediction]}</span>
                </div>
                <div className="m-name">{m.name}</div>
                <div className={`m-pred ${m.prediction}`}>{m.prediction}</div>
                <div className="m-conf">{m.confidence}% confidence</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="today-loading">Couldn&apos;t load today&apos;s movements. Try refreshing.</div>
        )}
      </section>

      <p className="disclaimer">
        ⚠️ For educational and demonstration purposes only. Sentiment analysis of news
        headlines is <strong>not</strong> financial advice and does not reliably predict
        market movements. Do not make investment decisions based on this tool.
      </p>

      <footer>
        Built with Next.js · News via Google News RSS · Sentiment via AFINN
      </footer>
    </main>
  );
}
