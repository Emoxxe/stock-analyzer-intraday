# Intraday Trading Desk — added to StockAnalyzer

## What changed
- Added `/intraday` route and an **Intraday** navbar tab.
- Added a clean institutional intraday dashboard.
- NIFTY 50 scanner ranks ENTER / WATCH / WAIT setups.
- Uses 5-minute market data, 15-minute opening range, VWAP, EMA 9/20, RSI, ATR, relative volume and NIFTY regime.
- Each actionable setup exposes:
  - entry trigger
  - stop loss
  - target 1 / target 2
  - R:R
  - invalidation rule
  - exit plan / 15:20 IST square-off reminder
- Added a simple risk-budget calculator in the trade detail drawer.
- Auto-refreshes during the session.
- Detail endpoint now also uses the NIFTY market regime.
- UI intentionally distinguishes WATCH from ENTER; it does not claim certainty about future price movement.

## Data note
The current project uses Yahoo Finance as a secondary provider. The UI explicitly discloses provider/freshness limitations. For actual trading, a broker/exchange-grade real-time feed should replace or supplement Yahoo for low-latency execution decisions.

## Run
1. `npm install`
2. `npm run dev:all`
3. Open `/intraday`

The backend already mounts `/api/intraday`.
