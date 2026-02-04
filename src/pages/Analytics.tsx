import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { supabase } from "../lib/supabase";
import type { UserInventory, Product, MarketPrice } from "../types/database";
import "./Analytics.css";

type InventoryWithProduct = UserInventory & { product: Product };

type RevenueScenario = {
  product: string;
  scenario: "now" | "harvest";
  quantity: number;
  pricePerBag: number;
  totalRevenue: number;
};

const COLORS = ["#c4a35a", "#6b7280", "#22c55e", "#3b82f6"];

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function Analytics() {
  const [inventory, setInventory] = useState<InventoryWithProduct[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try {
        setError(null);
        const [invRes, pricesRes, prodRes] = await Promise.all([
          supabase
            .from("user_inventory")
            .select("*, product:products(*)")
            .eq("user_id", user.id)
            .order("harvest_season", { ascending: false }),
          supabase.from("market_prices").select("*"),
          supabase.from("products").select("*"),
        ]);
        if (invRes.error) throw invRes.error;
        if (pricesRes.error) throw pricesRes.error;
        if (prodRes.error) throw prodRes.error;
        setInventory((invRes.data ?? []) as InventoryWithProduct[]);
        setMarketPrices(pricesRes.data ?? []);
        setProducts(prodRes.data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentPrices = useMemo(() => {
    const latest = new Map<string, number>();
    marketPrices
      .filter((mp) => mp.scenario === "current")
      .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())
      .forEach((mp) => {
        if (!latest.has(mp.product_id)) latest.set(mp.product_id, mp.price_per_bag);
      });
    return latest;
  }, [marketPrices]);

  const harvestPrices = useMemo(() => {
    const byProduct = new Map<string, number>();
    marketPrices
      .filter((mp) => mp.scenario === "harvest")
      .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())
      .forEach((mp) => {
        if (!byProduct.has(mp.product_id)) byProduct.set(mp.product_id, mp.price_per_bag);
      });
    return byProduct;
  }, [marketPrices]);

  const inventoryEvolution = useMemo(() => {
    const bySeason = new Map<string, { season: string; [key: string]: string | number }>();
    inventory.forEach((item) => {
      const season = item.harvest_season;
      if (!bySeason.has(season)) {
        bySeason.set(season, { season });
      }
      const row = bySeason.get(season)!;
      const name = item.product?.name ?? "Outro";
      row[name] = ((row[name] as number) ?? 0) + item.quantity;
    });
    return Array.from(bySeason.values()).sort((a, b) =>
      String(a.season).localeCompare(String(b.season))
    );
  }, [inventory]);

  const productionByProduct = useMemo(() => {
    const byProduct = new Map<string, number>();
    inventory.forEach((item) => {
      const name = item.product?.name ?? "Outro";
      byProduct.set(name, (byProduct.get(name) ?? 0) + item.quantity);
    });
    return Array.from(byProduct.entries()).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  const revenueScenarios = useMemo((): RevenueScenario[] => {
    const scenarios: RevenueScenario[] = [];
    inventory.forEach((item) => {
      const productName = item.product?.name ?? "Outro";
      const currPrice = currentPrices.get(item.product_id) ?? 0;
      const harvPrice = harvestPrices.get(item.product_id) ?? currPrice * 1.1;

      scenarios.push({
        product: productName,
        scenario: "now",
        quantity: item.quantity,
        pricePerBag: currPrice,
        totalRevenue: item.quantity * currPrice,
      });
      scenarios.push({
        product: productName,
        scenario: "harvest",
        quantity: item.quantity,
        pricePerBag: harvPrice,
        totalRevenue: item.quantity * harvPrice,
      });
    });
    return scenarios;
  }, [inventory, currentPrices, harvestPrices]);

  const scenarioComparison = useMemo(() => {
    const byProduct = new Map<string, { product: string; venda_agora: number; venda_safra: number }>();
    revenueScenarios.forEach((s) => {
      if (!byProduct.has(s.product)) {
        byProduct.set(s.product, { product: s.product, venda_agora: 0, venda_safra: 0 });
      }
      const row = byProduct.get(s.product)!;
      if (s.scenario === "now") row.venda_agora = s.totalRevenue;
      else row.venda_safra = s.totalRevenue;
    });
    return Array.from(byProduct.values());
  }, [revenueScenarios]);

  const kpis = useMemo(() => {
    const totalBags = inventory.reduce((a, i) => a + i.quantity, 0);
    const totalNow = revenueScenarios.filter((s) => s.scenario === "now").reduce((a, s) => a + s.totalRevenue, 0);
    const totalHarvest = revenueScenarios.filter((s) => s.scenario === "harvest").reduce((a, s) => a + s.totalRevenue, 0);
    const seasons = new Set(inventory.map((i) => i.harvest_season)).size;
    return [
      { label: "Total de sacas", value: totalBags.toLocaleString("pt-BR") },
      { label: "Receita (venda agora)", value: formatCurrency(totalNow) },
      { label: "Receita (venda na safra)", value: formatCurrency(totalHarvest) },
      { label: "Safras cadastradas", value: seasons.toString() },
    ];
  }, [inventory, revenueScenarios]);

  if (loading) {
    return <div className="analytics-loading">Carregando analytics...</div>;
  }

  if (error) {
    return <div className="banner error">{error}</div>;
  }

  return (
    <div className="analytics-page">
      <h2>Analytics e previsões</h2>
      <p className="analytics-subtitle">Dashboards baseados no seu inventário e preços de mercado</p>

      <section className="analytics-kpis">
        {kpis.map((k) => (
          <div key={k.label} className="kpi-card">
            <span className="kpi-label">{k.label}</span>
            <span className="kpi-value">{k.value}</span>
          </div>
        ))}
      </section>

      {inventory.length === 0 ? (
        <div className="analytics-empty">
          <p>Adicione itens ao inventário para ver analytics e previsões de receita.</p>
        </div>
      ) : (
        <>
          <section className="analytics-section">
            <h3>Evolução do inventário por safra</h3>
            <div className="analytics-chart">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={inventoryEvolution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="season" stroke="var(--muted)" fontSize={12} />
                  <YAxis stroke="var(--muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                    }}
                    formatter={(value) => [value != null ? `${value} sacas` : "", ""]}
                  />
                  <Legend />
                  {products.map((p, i) => (
                    <Bar key={p.id} dataKey={p.name} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} stackId="a" />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="analytics-section">
            <h3>Produção total por produto</h3>
            <div className="analytics-chart analytics-chart--pie">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={productionByProduct}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {productionByProduct.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                    }}
                    formatter={(value) => [value != null ? `${value} sacas` : "", ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="analytics-section">
            <h3>Previsão de receita: vender agora vs. na safra</h3>
            <div className="analytics-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={scenarioComparison}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--muted)" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis type="category" dataKey="product" stroke="var(--muted)" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                    }}
                    formatter={(value) => [typeof value === "number" ? formatCurrency(value) : "", ""]}
                  />
                  <Legend />
                  <Bar dataKey="venda_agora" name="Vender agora" fill="#c4a35a" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="venda_safra" name="Vender na safra" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {inventoryEvolution.length > 1 && (
            <section className="analytics-section">
              <h3>Evolução ao longo do tempo</h3>
              <div className="analytics-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={inventoryEvolution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="season" stroke="var(--muted)" fontSize={12} />
                    <YAxis stroke="var(--muted)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card-bg)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    {products.map((p, i) => (
                      <Line
                        key={p.id}
                        type="monotone"
                        dataKey={p.name}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
