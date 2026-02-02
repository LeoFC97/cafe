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
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
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

      <section className="section expert">
        <h2>Entrar em contato com um especialista</h2>
        <div className="expert-card">
          <img
            src="/bruno-pestana.png"
            alt="Bruno Pestana"
            className="expert-photo"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = `https://ui-avatars.com/api/?name=Bruno+Pestana&size=200&background=c4a35a&color=fff`;
            }}
          />
          <div className="expert-info">
            <h3 className="expert-name">Bruno Pestana</h3>
            <p className="expert-role">Especialista em mercado de café</p>
            <div className="expert-contact">
              <a href="mailto:contato@paineldocafe.com.br" className="expert-link">
                contato@paineldocafe.com.br
              </a>
              <a href="https://wa.me/5522998670162" className="expert-link" target="_blank" rel="noopener noreferrer">
                WhatsApp: (22) 99867-0162
              </a>
              <button type="button" className="expert-btn-schedule" onClick={() => setScheduleModalOpen(true)}>
                Ver horários disponíveis
              </button>
            </div>
          </div>
        </div>
      </section>

      {scheduleModalOpen && (
        <div className="modal-overlay" onClick={() => setScheduleModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Horários disponíveis</h3>
              <button type="button" className="modal-close" onClick={() => setScheduleModalOpen(false)} aria-label="Fechar">
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-placeholder">Atendimento com Bruno Pestana</p>
              <ul className="modal-slots">
                <li>Segunda a Sexta: 9h às 12h e 14h às 18h</li>
                <li>Sábado: 9h às 13h (placeholder)</li>
              </ul>
              <p className="modal-note">Entre em contato pelo WhatsApp para agendar seu horário.</p>
            </div>
          </div>
        </div>
      )}

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
