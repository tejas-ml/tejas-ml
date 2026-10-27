# Stock Scraper

US equity **end-of-day** prices: search a ticker, chart it, and download spreadsheets.

**Live demo:** [https://stock-scraper-mu.vercel.app](https://stock-scraper-mu.vercel.app)

## Features

- **Markets** — search any US stock/ETF, live quote, EOD chart
- **Download** — one ticker, multi-ticker close matrices, liquid universe, full universe in batches
- **Light / dark** theme (soft off-white by default)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Download modes

| Mode | What you get |
|------|----------------|
| Multi-ticker | Custom list, wide or long daily closes |
| Single OHLCV / closes | One symbol history |
| Liquid matrix | ~80 mega-caps Date×Symbol closes |
| Universe batch | Full curated list in chunks of 50 |
| Quote snapshot | Latest prices for the universe |

## Stack

Next.js · TypeScript · Tailwind · Recharts · SheetJS · yahoo-finance2

## Deploy

Hosted on **Vercel**: [https://stock-scraper-mu.vercel.app](https://stock-scraper-mu.vercel.app)

```bash
npx vercel login
npx vercel --prod
```

No API keys required. Data is delayed Yahoo Finance EOD — educational only, not investment advice.
