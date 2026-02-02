import type { PriceSnapshot } from "../types/api";

interface PriceChartProps {
  history: PriceSnapshot[];
  series: "stock" | "value";
  keyId: string; // e.g. "KC" or "Conilon 7/8"
  label: string;
  formatValue: (n: number) => string;
}

export function PriceChart({ history, series, keyId, label, formatValue }: PriceChartProps) {
  const points = series === "stock"
    ? history.map((h) => h.stocks.find((s) => s.symbol === keyId)?.price).filter((v): v is number => v != null)
    : history.map((h) => h.values.find((v) => v.name === keyId)?.value).filter((v): v is number => v != null);

  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 200;
  const h = 48;
  const step = (w - 2) / (points.length - 1);
  const y = (v: number) => h - 4 - ((v - min) / range) * (h - 8);
  const pointsStr = points.map((v, i) => `${i * step},${y(v)}`).join(" ");

  return (
    <div className="price-chart">
      <span className="price-chart-label">{label}</span>
      <svg viewBox={`0 0 ${w} ${h}`} className="price-chart-svg" preserveAspectRatio="none">
        <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={pointsStr} />
      </svg>
      <span className="price-chart-value">{formatValue(points[0])}</span>
    </div>
  );
}
