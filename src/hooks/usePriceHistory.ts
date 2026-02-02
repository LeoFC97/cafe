import { useCallback, useEffect, useState } from "react";
import type { HomeInformation, PriceSnapshot } from "../types/api";

const STORAGE_KEY = "cafe-price-history";
const MAX_POINTS = 96; // ~1 point per 15min if refreshed every 15min for 24h

function loadHistory(): PriceSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PriceSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSnapshot(data: HomeInformation): void {
  const at = new Date().toISOString();
  const snapshot: PriceSnapshot = {
    at,
    stocks: data.stocks.map((s) => ({ symbol: s.symbol, name: s.name, price: s.price })),
    values: data.values.map((v) => ({ name: v.name, value: v.value })),
  };
  const history = loadHistory();
  const next = [snapshot, ...history].slice(0, MAX_POINTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function usePriceHistory() {
  const [history, setHistory] = useState<PriceSnapshot[]>(loadHistory);

  const append = useCallback((data: HomeInformation) => {
    saveSnapshot(data);
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  return { history, append };
}
