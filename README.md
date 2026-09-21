# Indian Stock & Intraday Intelligence Terminal

A full-stack, real-data Indian Equity analysis and Intraday Trading terminal built with React 19, Vite, Express, and Lightweight Charts.

![Platform Preview](https://img.shields.io/badge/Status-Active-22c55e)
![License](https://img.shields.io/badge/License-MIT-blue)
![Market](https://img.shields.io/badge/Market-NSE%20%7C%20BSE-orange)

---

## ⚡ Features

- **Intraday Strategy Scanner**: Real-time intraday scanner scanning NIFTY 50 universe with automated detection of:
  - Opening Range Breakouts (ORB)
  - VWAP Pullbacks & Trend Continuations
  - Momentum & Multi-timeframe EMA Alignments (9 EMA & 20 EMA)
  - Relative Volume (RVOL) spikes and day range calculations
- **Interactive Technical Candlestick Charts**: Canvas-accelerated financial charts powered by TradingView's Lightweight Charts v5 with dynamic VWAP, Opening Range High (ORH), and Opening Range Low (ORL) lines.
- **Market Hours Engine**: Built-in awareness of official NSE/BSE trading sessions:
  - Pre-Open: 09:00 - 09:15 IST
  - Regular Trading: 09:15 - 15:30 IST
  - Post-Close: 15:30 - 16:00 IST
  - Annual NSE/BSE holiday calendar validation & Muhurat trading support.
- **Deep Fundamental Analysis**: Annual & Quarterly balance sheets, cash flows, key ratios (P/E, P/B, ROE, ROCE, Debt/Equity), and verified company news.
- **Zero Fake Data & Provenance**: Every metric carries field-level provenance, timestamps, quality flags, and source attribution badges.
- **Glassmorphism Terminal UI**: High-contrast, dark-mode terminal with smooth animations, spring transitions, and responsive mobile layout.

---

## 🏗️ Architecture

- **Frontend**: React 19, Vite 8, React Router 7, Lightweight Charts v5, Motion.
- **Backend API**: Node.js & Express 5 running on port `5001`.
- **Data Adapters**: Official market feeds, Yahoo Finance fallback adapter, Google News RSS, and Wikipedia corporate summaries.
- **Caching**: In-memory TTL cache with automatic request deduplication and rate-limit mitigation.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Installation

```bash
git clone <your-github-repo-url>
cd stock-analyzer-intraday
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configuration options:
```env
SERVER_PORT=5001
NODE_ENV=development

# Optional licensed feeds (Leave disabled to use default public fallback)
NSE_DATA_ENABLED=false
NSE_DATA_API_KEY=
NSE_DATA_USERNAME=
```

### 3. Run Locally

To start both the Express backend API (`:5001`) and the Vite dev server (`:5200`) concurrently:

```bash
npm run dev:all
```

Open your browser at **http://localhost:5200**.

### Other Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev:all` | Runs both backend and frontend concurrently |
| `npm run dev` | Runs frontend Vite dev server only (`:5200`) |
| `npm run server` | Runs backend Express server only (`:5001`) |
| `npm run build` | Builds production bundle for deployment |
| `npm run preview` | Previews production build locally |

---

## 🔒 Security

- **No Hardcoded Secrets**: All configuration is loaded dynamically via environment variables.
- **Strict `.gitignore`**: Sensitive `.env` files, certificates, and runtime build artifacts are completely excluded from source control.
- **Data Integrity**: Zero synthetic/fake numbers. Out-of-hours states and delayed timestamps are explicitly tagged and declared.

---

## 📄 License

MIT License. See `LICENSE` for details.
