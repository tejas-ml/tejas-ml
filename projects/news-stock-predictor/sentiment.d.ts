declare module "sentiment" {
  interface SentimentResult {
    score: number;
    comparative: number;
    calculation: Record<string, number>[];
    tokens: string[];
    words: string[];
    positive: string[];
    negative: string[];
  }
  interface SentimentOptions {
    extras?: Record<string, number>;
    language?: string;
  }
  export default class Sentiment {
    constructor(options?: SentimentOptions);
    analyze(phrase: string, options?: SentimentOptions): SentimentResult;
  }
}
