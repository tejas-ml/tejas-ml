export type Exchange = "NYSE" | "NASDAQ" | "AMEX" | "OTHER";

export type Sector =
  | "Technology"
  | "Healthcare"
  | "Financials"
  | "Consumer Cyclical"
  | "Consumer Defensive"
  | "Energy"
  | "Industrials"
  | "Utilities"
  | "Real Estate"
  | "Basic Materials"
  | "Communication Services"
  | "Other";

export interface StockMeta {
  symbol: string;
  name: string;
  exchange: Exchange;
  sector: Sector;
  industry?: string;
}

export interface QuoteSnapshot {
  symbol: string;
  name: string;
  exchange: Exchange;
  sector: Sector;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  avgVolume: number | null;
  marketCap: number | null;
  pe: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  currency: string;
  marketState: string;
  updatedAt: string;
}

export interface OhlcvBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

export interface StockFilters {
  search?: string;
  exchange?: Exchange | "ALL";
  sector?: Sector | "ALL";
  minPrice?: number;
  maxPrice?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minChangePercent?: number;
  maxChangePercent?: number;
  minVolume?: number;
  sortBy?: "symbol" | "price" | "changePercent" | "volume" | "marketCap" | "name";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
