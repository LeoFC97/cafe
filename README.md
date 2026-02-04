# Painel do Café

A simple, modern coffee market panel using the same API as [Painel do Café](https://www.paineldocafe.com.br/). Built with Vite + React + TypeScript.

## Features

- **Live quotes**: DÓLAR, LONDRES (Conilon), N.YORK (Arábica) with price and change
- **Physical prices**: Conilon 7/8 and Arábica RIO (R$/saca)
- **News & alerts**: Messages feed from the API
- **Session history**: Prices are stored in `localStorage` on each fetch; mini sparkline charts show recent trend (builds over time as you keep the page open or revisit)
- **Authenticated area** (login/signup): Track inventory (sacas) for coffee and pepper by harvest season, with analytics dashboards and revenue forecasts

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Supabase setup (for login and inventory)

1. Create a project at [supabase.com](https://supabase.com) (or use the existing project).
2. In Supabase Dashboard → **Authentication** → **Providers** → **Email**: disable **Confirm email** for simple signup.
3. Run the SQL schema in **SQL Editor**:
   ```bash
   # Copy contents of supabase/schema.sql and run in Supabase SQL Editor
   ```
4. Copy `.env.example` to `.env` and add your keys:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   Find the anon key in Supabase Dashboard → **Settings** → **API**.

## Build

```bash
npm run build
```

## Deploy on Vercel (free)

1. **Push the project to GitHub** (if you haven’t already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Deploy with Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
   - Click **Add New…** → **Project** and import your GitHub repo.
   - Leave the defaults (Vite is auto-detected; build: `npm run build`, output: `dist`).
   - Click **Deploy**. Your site will get a URL like `https://your-project.vercel.app`.

   **Or use the CLI:**
   ```bash
   npx vercel
   ```
   Follow the prompts (log in if needed). To deploy to production:
   ```bash
   npx vercel --prod
   ```

No env vars or extra config are required; the app only calls the public coffee API.

## API

Data is fetched from `https://api.coffee-panel.mitrix.online/api/home/information` (same as paineldocafe.com.br). The app refreshes every 60 seconds.

Historical data is **client-side only**: each time data is fetched, a snapshot is saved to `localStorage`. The “Histórico (sessão)” section shows sparklines for coffee stocks and physical values once at least 2 points exist (e.g. after the second refresh or a revisit).

**Weather:** Open-Meteo (no API key) provides a 5-day forecast for Vitória/ES. See **[docs/FONTES-DADOS.md](docs/FONTES-DADOS.md)** for where to get **historical coffee price data** (e.g. FRED API) and more details on data sources.
