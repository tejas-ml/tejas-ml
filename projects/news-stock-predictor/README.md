# 📈 News Stock Predictor

Enter a company or ticker and get a **directional stock prediction** (↑ increase / ↓ decrease / → neutral) derived from the sentiment of the latest news headlines about that company.

### 🔗 Live demo: **[news-stock-predictor.vercel.app](https://news-stock-predictor.vercel.app)**

---

## How it works

1. **Scrape** — The app queries the free [Google News RSS](https://news.google.com/) feed for the most recent headlines mentioning the company (no API key required).
2. **Score** — Each headline is scored with the [AFINN](https://github.com/thisandagain/sentiment) sentiment lexicon, extended with a finance-specific word list (`beat`, `surge`, `downgrade`, `plunge`, `lawsuit`, …).
3. **Predict** — Headline scores are aggregated into an average sentiment. The sign of that average maps to a direction, and the **confidence** blends the *strength* of the signal with how much the headlines *agree* with each other.

```
avg sentiment ≥ +0.6  →  ↑ INCREASE
avg sentiment ≤ −0.6  →  ↓ DECREASE
otherwise             →  → NEUTRAL
```

The UI shows the verdict, a confidence bar, a positive/neutral/negative breakdown, and every headline that was analyzed (each linked to its source and colour-coded by sentiment).

## Tech stack

| Layer      | Choice                                        |
| ---------- | --------------------------------------------- |
| Framework  | [Next.js 14](https://nextjs.org/) (App Router, TypeScript) |
| News data  | Google News RSS via [`rss-parser`](https://www.npmjs.com/package/rss-parser) |
| Sentiment  | [`sentiment`](https://www.npmjs.com/package/sentiment) (AFINN) |
| Hosting    | [Vercel](https://vercel.com/) serverless functions |

No external API keys are required — the app works out of the box.

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Build for production:

```bash
npm run build
npm run start
```

## API

`POST /api/predict`

```jsonc
// request
{ "company": "Apple" }

// response
{
  "company": "Apple",
  "prediction": "INCREASE",   // INCREASE | DECREASE | NEUTRAL
  "confidence": 62,           // 0–100
  "avgScore": 0.9,
  "analyzed": 20,
  "positives": 11,
  "negatives": 3,
  "neutrals": 6,
  "headlines": [ { "title": "...", "link": "...", "source": "...", "score": 3, "label": "positive" } ]
}
```

## ⚠️ Disclaimer

This project is for **educational and demonstration purposes only**. Sentiment analysis of news headlines is a naive signal and does **not** reliably predict market movements. **This is not financial advice.** Do not make investment decisions based on this tool.
