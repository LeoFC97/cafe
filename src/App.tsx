import { useEffect, useState } from "react";
import { fetchHomeInformation } from "./api";
import { WeatherForecast } from "./components/WeatherForecast";
import { expertsByRegion } from "./data/experts";
import { partners } from "./data/partners";
import type { Expert } from "./data/experts";
import type { Partner } from "./data/partners";
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

function PartnerCard({ partner }: { partner: Partner }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = partner.logo && !logoFailed;
  const content = (
    <>
      <div className="partner-card-header">
        {showLogo ? (
          <img
            src={partner.logo}
            alt={partner.name}
            className="partner-logo"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className="partner-name">{partner.name}</span>
        )}
      </div>
      <p className="partner-description">{partner.description}</p>
    </>
  );

  if (partner.url) {
    return (
      <a
        href={partner.url}
        className="partner-card"
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }
  return <div className="partner-card partner-card--no-link">{content}</div>;
}

function ExpertCard({
  expert,
  onScheduleClick,
}: {
  expert: Expert;
  onScheduleClick: (expert: Expert) => void;
}) {
  const isPlaceholder = expert.whatsapp === "#";
  const photoSrc = expert.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&size=200&background=2a2a2a&color=888`;

  return (
    <div className="expert-card">
      <img
        src={expert.photo || photoSrc}
        alt={expert.name}
        className="expert-photo"
        onError={(e) => {
          const target = e.currentTarget;
          target.onerror = null;
          target.src = photoSrc;
        }}
      />
      <div className="expert-info">
        <h3 className="expert-name">{expert.name}</h3>
        <p className="expert-role">{expert.role}</p>
        <div className="expert-contact">
          {!isPlaceholder && (
            <>
              <a href={`mailto:${expert.email}`} className="expert-link">
                {expert.email}
              </a>
              <a
                href={expert.whatsapp.startsWith("55") ? `https://wa.me/${expert.whatsapp}` : expert.whatsapp}
                className="expert-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp: {expert.whatsappDisplay}
              </a>
              <button type="button" className="expert-btn-schedule" onClick={() => onScheduleClick(expert)}>
                Ver horários disponíveis
              </button>
            </>
          )}
          {isPlaceholder && <span className="expert-soon">Contato em breve</span>}
        </div>
      </div>
    </div>
  );
}

type TabId = "mercado" | "clima" | "noticias" | "especialistas" | "parceiros";

const TABS: { id: TabId; label: string }[] = [
  { id: "mercado", label: "Mercado" },
  { id: "clima", label: "Previsão do tempo" },
  { id: "noticias", label: "Notícias" },
  { id: "especialistas", label: "Contato com especialista" },
  { id: "parceiros", label: "Marcas parceiras" },
];

export default function App() {
  const [data, setData] = useState<HomeInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("mercado");
  const [scheduleModalExpert, setScheduleModalExpert] = useState<Expert | null>(null);

  const load = async () => {
    try {
      setError(null);
      const res = await fetchHomeInformation();
      setData(res);
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
  }, []);

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
        <nav className="tabs" role="tablist">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              className={`tabs-btn ${activeTab === id ? "tabs-btn--active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {error && <div className="banner error">{error}</div>}

      {activeTab === "mercado" && (
        <>
          {data && (
            <section className="section section--highlight stocks">
              <h2 className="stocks-heading">Cotações</h2>
              <div className="stocks-grid">
                {data.stocks.map((s) => (
                  <StockCard key={s.id} s={s} />
                ))}
              </div>
            </section>
          )}

          {data && (
            <>
              <section className="section values">
                <h2>Preços físicos (R$/saca)</h2>
                <div className="values-grid">
                  {data.values.map((v) => (
                    <ValueCard key={v.name} v={v} />
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}

      {activeTab === "clima" && (
        <WeatherForecast />
      )}

      {activeTab === "noticias" && (
        <section className="section messages">
          <h2>Notícias e alertas</h2>
          {data ? (
            <div className="messages-list">
              {data.messages.slice(0, 30).map((m) => (
                <MessageItem key={m.id} m={m} />
              ))}
            </div>
          ) : (
            <p className="weather-loading">Carregando notícias...</p>
          )}
        </section>
      )}

      {activeTab === "especialistas" && (
        <section className="section experts">
          <h2>Contato com especialista</h2>
          <p className="experts-intro">Encontre um consultor por região:</p>
          {expertsByRegion.map(({ region, specialists }) => (
            <div key={region} className="expert-region">
              <h3 className="expert-region-title">{region}</h3>
              <div className="experts-grid">
                {specialists.map((expert) => (
                  <ExpertCard
                    key={expert.id}
                    expert={expert}
                    onScheduleClick={setScheduleModalExpert}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {activeTab === "parceiros" && (
        <section className="section partners">
          <h2>Marcas parceiras</h2>
          <p className="partners-intro">Empresas que apoiam o Painel do Café.</p>
          <div className="partners-grid">
            {partners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </section>
      )}

      {scheduleModalExpert && (
        <div className="modal-overlay" onClick={() => setScheduleModalExpert(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Horários disponíveis</h3>
              <button type="button" className="modal-close" onClick={() => setScheduleModalExpert(null)} aria-label="Fechar">
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-placeholder">Atendimento com {scheduleModalExpert.name}</p>
              <ul className="modal-slots">
                <li>Segunda a Sexta: 9h às 12h e 14h às 18h</li>
                <li>Sábado: 9h às 13h (placeholder)</li>
              </ul>
              <p className="modal-note">Entre em contato pelo WhatsApp para agendar seu horário.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
