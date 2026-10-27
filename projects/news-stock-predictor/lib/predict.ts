import Parser from "rss-parser";
import Sentiment from "sentiment";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
  },
});

const sentiment = new Sentiment();

// A handful of finance-specific words the default AFINN lexicon doesn't score well.
const financeLexicon: Record<string, number> = {
  beat: 3,
  beats: 3,
  surge: 3,
  surged: 3,
  soar: 3,
  soared: 3,
  rally: 2,
  rallied: 2,
  upgrade: 3,
  upgraded: 3,
  bullish: 3,
  outperform: 3,
  record: 2,
  growth: 2,
  profit: 2,
  gains: 2,
  jumps: 2,
  jump: 2,
  miss: -3,
  missed: -3,
  plunge: -3,
  plunged: -3,
  slump: -3,
  slumped: -3,
  downgrade: -3,
  downgraded: -3,
  bearish: -3,
  underperform: -3,
  lawsuit: -2,
  recall: -2,
  layoffs: -3,
  loss: -2,
  losses: -2,
  drop: -2,
  drops: -2,
  falls: -2,
  fell: -2,
  crash: -3,
  probe: -2,
  fraud: -4,
  warning: -2,
  cuts: -2,
  slashes: -2,
};

export type Prediction = "INCREASE" | "DECREASE" | "NEUTRAL";

export type Headline = {
  title: string;
  link: string;
  source: string;
  pubDate: string | null;
  score: number;
  label: "positive" | "negative" | "neutral";
};

export type PredictionResult = {
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

export class PredictError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function predictCompany(company: string): Promise<PredictionResult> {
  const query = encodeURIComponent(`${company} stock`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

  let feed;
  try {
    feed = await parser.parseURL(url);
  } catch {
    throw new PredictError("Could not reach the news feed. Please try again.", 502);
  }

  const items = (feed.items ?? []).slice(0, 20);
  if (items.length === 0) {
    throw new PredictError(
      `No recent news found for "${company}". Try a different name or ticker.`,
      404
    );
  }

  const headlines: Headline[] = [];
  let totalScore = 0;

  for (const item of items) {
    const title = stripHtml(item.title ?? "");
    if (!title) continue;

    const result = sentiment.analyze(title, { extras: financeLexicon });
    const score = result.score;
    totalScore += score;

    headlines.push({
      title,
      link: item.link ?? "#",
      // Google News formats titles as "Headline - Source"; fall back to feed metadata.
      source:
        (item as { source?: { _?: string } }).source?._ ??
        title.split(" - ").slice(-1)[0] ??
        "Unknown",
      pubDate: item.pubDate ?? null,
      score,
      label: score > 0 ? "positive" : score < 0 ? "negative" : "neutral",
    });
  }

  const count = headlines.length;
  const avgScore = count > 0 ? totalScore / count : 0;
  const positives = headlines.filter((h) => h.label === "positive").length;
  const negatives = headlines.filter((h) => h.label === "negative").length;

  let prediction: Prediction;
  if (avgScore >= 0.6) prediction = "INCREASE";
  else if (avgScore <= -0.6) prediction = "DECREASE";
  else prediction = "NEUTRAL";

  // Confidence blends the strength of the signal with how much the headlines agree.
  const magnitude = Math.min(Math.abs(avgScore) / 3, 1);
  const directional = positives + negatives;
  const agreement = directional > 0 ? Math.abs(positives - negatives) / directional : 0;
  const confidence = Math.round((magnitude * 0.6 + agreement * 0.4) * 100);

  return {
    company,
    prediction,
    confidence:
      prediction === "NEUTRAL" ? Math.min(confidence, 50) : Math.max(confidence, 35),
    avgScore: Number(avgScore.toFixed(2)),
    analyzed: count,
    positives,
    negatives,
    neutrals: count - positives - negatives,
    headlines,
    generatedAt: new Date().toISOString(),
  };
}
