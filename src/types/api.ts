export interface Message {
  id: number;
  text: string;
  title: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: number;
  name: string;
  symbol: string;
  price: number;
  change: number;
  movement: "up" | "down";
  type: "coffee" | "money";
  last_update: string;
  market_strip: string | null;
}

export interface Value {
  name: string;
  value: number;
}

export interface HomeInformation {
  messages: Message[];
  stocks: Stock[];
  values: Value[];
}

export interface PriceSnapshot {
  at: string;
  stocks: { symbol: string; name: string; price: number }[];
  values: { name: string; value: number }[];
}
