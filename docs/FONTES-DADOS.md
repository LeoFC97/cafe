# Fontes de dados: café e clima

## Preço histórico do café

O site já exibe **histórico de sessão** (dados acumulados no navegador via `localStorage`). Para histórico de longo prazo, você pode usar:

### 1. FRED (Federal Reserve Economic Data) — gratuito, com API

- **Site:** [fred.stlouisfed.org](https://fred.stlouisfed.org)
- **Registro:** [Criar conta](https://fredaccount.stlouisfed.org/login) (e-mail e senha) e gerar uma API key em [API Keys](https://fredaccount.stlouisfed.org/apikeys).
- **Séries de café (IMF):**
  - **Arábica (Other Mild):** `PCOFFOTMUSDM` — preço global em centavos de USD/libra, mensal, desde 1990.
  - **Robusta:** `PCOFFROBUSDM` — preço global em centavos de USD/libra, mensal, desde 1990.
- **Exemplo de URL da API:**  
  `https://api.stlouisfed.org/fred/series/observations?series_id=PCOFFOTMUSDM&api_key=SUA_CHAVE&file_type=json`

### 2. Cotação do Café (Cepea/Esalq)

- **Site:** [cotacaodocafe.com – Histórico](https://cotacaodocafe.com/historico/)
- Dados históricos de café Arábica e Conilon (últimos 30 dias úteis), extraídos do Cepea/Esalq. Verifique no site se há API ou export (CSV/JSON) para uso programático.

### 3. Outras opções

- **Commodities-API / Financial Modeling Prep:** APIs pagas ou em freemium com histórico de café; útil se precisar de dados prontos em JSON.
- **Investing.com, Barchart:** Gráficos e tabelas; em geral não oferecem API pública gratuita.

---

## Previsão do tempo

O site usa a **Open-Meteo** para a previsão dos próximos dias:

- **Site:** [open-meteo.com](https://open-meteo.com)
- **Documentação:** [Weather Forecast API](https://open-meteo.com/en/docs)
- **Sem necessidade de API key** (uso não comercial).
- **Exemplo:** previsão diária (máx., mín., chuva, código do tempo) para uma coordenada (ex.: região cafeeira no ES).

A previsão exibida no site pode ser configurada para uma cidade/região fixa (por exemplo, Vitória/ES ou outra zona produtora de café).
