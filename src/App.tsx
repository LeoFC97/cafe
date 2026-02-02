import { useEffect, useState } from "react";
import { fetchHomeInformation } from "./api";
import { usePriceHistory } from "./hooks/usePriceHistory";
import { PriceChart } from "./components/PriceChart";
import type { HomeInformation, Stock, Value, Message } from "./types/api";
import "./App.css";

function formatPrice(n: number, decimals = 2): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatDate(s: string): string {
  const d = new Date(s);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function StockCard({ s }: { s: Stock }) {
  const isMoney = s.type === "money";
  return (
    <div className={`card stock ${s.movement}`}>
      <div className="stock-header">
        <span className="stock-name">{s.name}</span>
        {s.market_strip && <span className="stock-strip">{s.market_strip}</span>}
      </div>
      <div className="stock-price">{formatPrice(s.price, isMoney ? 2 : 0)}</div>
      <div className="stock-meta">
        <span className={`stock-change ${s.movement}`}>
          {s.movement === "up" ? "↑" : "↓"} {formatPrice(Math.abs(s.change), isMoney ? 2 : 2)}
        </span>
        <span className="stock-time">{formatDate(s.last_update)}</span>
      </div>
    </div>
  );
}

function ValueCard({ v }: { v: Value }) {
  return (
    <div className="card value-card">
      <span className="value-name">{v.name}</span>
      <span className="value-price">R$ {formatPrice(v.value)}</span>
    </div>
  );
}

function MessageItem({ m }: { m: Message }) {
  return (
    <article className="message">
      <time className="message-time">{formatDate(m.created_at)}</time>
      <p className="message-text">{m.text}</p>
    </article>
  );
}

export default function App() {
  const [data, setData] = useState<HomeInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { history, append } = usePriceHistory();

  const load = async () => {
    try {
      setError(null);
      const res = await fetchHomeInformation();
      setData(res);
      append(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [append]);

  if (loading && !data) {
    return (
      <div className="app">
        <header className="header">
          <h1>Painel do Café</h1>
        </header>
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Painel do Café</h1>
        <p className="tagline">Cotações e notícias do mercado</p>
      </header>

      {error && <div className="banner error">{error}</div>}

      {data && (
        <>
          <section className="section stocks">
            <h2>Cotações</h2>
            <div className="stocks-grid">
              {data.stocks.map((s) => (
                <StockCard key={s.id} s={s} />
              ))}
            </div>
          </section>

          <section className="section values">
            <h2>Preços físicos (R$/saca)</h2>
            <div className="values-grid">
              {data.values.map((v) => (
                <ValueCard key={v.name} v={v} />
              ))}
            </div>
          </section>

          {history.length >= 2 && (
            <section className="section history">
              <h2>Histórico (sessão)</h2>
              <p className="history-note">Dados acumulados nesta visita. Atualize a página para ver novos pontos.</p>
              <div className="charts">
                {data.stocks.filter((s) => s.type === "coffee").map((s) => (
                  <PriceChart
                    key={s.symbol}
                    history={history}
                    series="stock"
                    keyId={s.symbol}
                    label={s.name}
                    formatValue={(n) => formatPrice(n, 0)}
                  />
                ))}
                {data.values.map((v) => (
                  <PriceChart
                    key={v.name}
                    history={history}
                    series="value"
                    keyId={v.name}
                    label={v.name}
                    formatValue={(n) => `R$ ${formatPrice(n)}`}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="section messages">
            <h2>Notícias e alertas</h2>
            <div className="messages-list">
              {data.messages.slice(0, 30).map((m) => (
                <MessageItem key={m.id} m={m} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
