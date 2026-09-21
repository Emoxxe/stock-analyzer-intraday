/**
 * Intraday Technical Analysis Engine
 * Real-data, rules-based scanner for NSE cash intraday setups.
 *
 * Important: this is a decision-support engine, not a guarantee of future price movement.
 * The UI deliberately separates WATCH from ENTER and always exposes the invalidation/exit rules.
 */
import { yahooAdapter } from '../adapters/yahooAdapter.js';
import { cacheService } from './cacheService.js';
import { getMarketStatus } from '../config/marketCalendar.js';

const SCAN_UNIVERSES = {
  NIFTY50: [
    'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'TMCV', 'ADANIENT', 'LT',
    'ITC', 'HINDUNILVR', 'SUNPHARMA', 'TATASTEEL', 'BAJFINANCE', 'MARUTI', 'KOTAKBANK', 'AXISBANK', 'M&M', 'NTPC',
    'TITAN', 'ULTRACEMCO', 'BAJAJFINSV', 'ASIANPAINT', 'POWERGRID', 'COALINDIA', 'TATAMOTORS', 'HCLTECH', 'ONGC', 'WIPRO',
    'JSWSTEEL', 'BRITANNIA', 'HEROMOTOCO', 'HINDALCO', 'GRASIM', 'TECHM', 'EICHERMOT', 'CIPLA', 'BAJAJ-AUTO', 'APOLLOHOSP',
    'BPCL', 'TATACONSUM', 'DRREDDY', 'DIVISLAB', 'INDUSINDBK', 'ADANIPORTS', 'NESTLEIND', 'LTIM', 'UPL', 'SBILIFE'
  ]
};

const MARKET_INDEX = '^NSEI';

function istParts(timestamp) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(timestamp));
  const out = {};
  for (const p of parts) if (p.type !== 'literal') out[p.type] = Number(p.value);
  return out;
}

function isTradingPoint(p) {
  const { hour, minute } = istParts(p.timestamp);
  const mins = hour * 60 + minute;
  return mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30;
}

function sameISTDate(a, b) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(new Date(a)) === fmt.format(new Date(b));
}

function round(value, digits = 2) {
  if (value == null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

class IntradayService {
  constructor() {
    this.scanLocks = new Map();
    this.staleCache = new Map();
  }

  calculateEMA(prices, period) {
    if (prices.length < period) return null;
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) ema = prices[i] * k + ema * (1 - k);
    return ema;
  }

  calculateATR(points, period = 14) {
    if (points.length < period + 1) return null;
    const trs = [];
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const prevClose = points[i - 1].close;
      trs.push(Math.max(p.high - p.low, Math.abs(p.high - prevClose), Math.abs(p.low - prevClose)));
    }
    const recent = trs.slice(-period);
    return recent.reduce((a, b) => a + b, 0) / recent.length;
  }

  calculateRSI(closes, period = 14) {
    if (closes.length <= period) return null;
    let gains = 0, losses = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
      const delta = closes[i] - closes[i - 1];
      if (delta >= 0) gains += delta;
      else losses += Math.abs(delta);
    }
    if (losses === 0) return 100;
    const rs = (gains / period) / (losses / period);
    return 100 - (100 / (1 + rs));
  }

  calculateVWAP(points) {
    let cumulativeVolume = 0;
    let cumulativeTPV = 0;
    return points.map(p => {
      const typical = (p.high + p.low + p.close) / 3;
      const volume = p.volume || 0;
      cumulativeVolume += volume;
      cumulativeTPV += typical * volume;
      return cumulativeVolume ? cumulativeTPV / cumulativeVolume : typical;
    });
  }

  async getMarketRegime() {
    const cacheKey = 'intraday_market_regime';
    const cached = cacheService.get(cacheKey);
    if (cached) return cached.data;

    try {
      const chart = await yahooAdapter.getChart(MARKET_INDEX, '5d', '5m');
      const all = (chart.points || []).filter(isTradingPoint);
      const today = all.filter(p => sameISTDate(p.timestamp, Date.now()));
      const points = today.length ? today : all.slice(-78);
      if (points.length < 10) return { regime: 'UNKNOWN', score: 50, index: null };

      const closes = points.map(p => p.close);
      const ema9 = this.calculateEMA(closes, 9);
      const ema20 = this.calculateEMA(closes, Math.min(20, closes.length));
      const vwap = this.calculateVWAP(points).at(-1);
      const last = closes.at(-1);
      const first = closes[0];
      const move = ((last - first) / first) * 100;

      let score = 50;
      if (last > vwap) score += 12;
      if (ema9 && ema20 && ema9 > ema20) score += 12;
      if (move > 0.25) score += 10;
      if (move < -0.25) score -= 10;
      if (last < vwap) score -= 12;
      if (ema9 && ema20 && ema9 < ema20) score -= 12;
      score = Math.max(0, Math.min(100, score));

      const regime = score >= 62 ? 'BULLISH' : score <= 38 ? 'BEARISH' : 'MIXED';
      const payload = {
        regime,
        score,
        index: {
          symbol: 'NIFTY 50',
          price: round(last),
          changePercent: round(((last - (chart.previousClose || first)) / (chart.previousClose || first)) * 100, 2),
          vwap: round(vwap),
          ema9: round(ema9),
          ema20: round(ema20),
          moveFromOpen: round(move, 2)
        }
      };
      cacheService.set(cacheKey, payload, 30);
      return payload;
    } catch (err) {
      return { regime: 'UNKNOWN', score: 50, index: null, error: err.message };
    }
  }

  async analyzeStock(symbol, marketRegime = null) {
    try {
      const chart = await yahooAdapter.getChart(symbol, '5d', '5m');
      const all = (chart.points || []).filter(isTradingPoint);
      if (!all.length) return null;

      const latestTimestamp = all.at(-1).timestamp;
      const today = all.filter(p => sameISTDate(p.timestamp, latestTimestamp));
      if (!today.length) return null;

      const current = today.at(-1);
      const currentPrice = current.close;
      const prevClose = chart.previousClose;
      if (!Number.isFinite(currentPrice) || !Number.isFinite(prevClose)) return null;

      // 15-minute opening range = first three 5-minute candles, available by ~09:30 IST.
      const openingCandles = today.slice(0, 3);
      const openingRangeReady = openingCandles.length >= 3;
      const openingRangeHigh = Math.max(...openingCandles.map(c => c.high));
      const openingRangeLow = Math.min(...openingCandles.map(c => c.low));

      const vwapSeries = this.calculateVWAP(today);
      const vwap = vwapSeries.at(-1);
      const closes = today.map(p => p.close);
      const ema9 = this.calculateEMA(closes, 9);
      const ema20 = this.calculateEMA(closes, 20);
      const rsi = this.calculateRSI(closes);
      const atr = this.calculateATR(all, 14) || Math.max(currentPrice * 0.004, 0.05);

      const dayHigh = Math.max(...today.map(p => p.high));
      const dayLow = Math.min(...today.map(p => p.low));
      const dayVolume = today.reduce((sum, p) => sum + (p.volume || 0), 0);

      // Compare the same opening/elapsed 5-minute slots against the prior trading days.
      const todaySlots = today.map(p => {
        const { hour, minute } = istParts(p.timestamp);
        return `${hour}:${minute}`;
      });
      const priorDays = all.filter(p => !sameISTDate(p.timestamp, latestTimestamp));
      
      const priorVolumesBySlot = {};
      for (const p of priorDays) {
        if (!p.volume || p.volume <= 0) continue;
        const { hour, minute } = istParts(p.timestamp);
        const slot = `${hour}:${minute}`;
        if (!priorVolumesBySlot[slot]) priorVolumesBySlot[slot] = [];
        priorVolumesBySlot[slot].push(p.volume);
      }

      const slotVolumes = todaySlots.map(slot => {
        const values = priorVolumesBySlot[slot] || [];
        return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      });
      const comparableExpectedVolume = slotVolumes.reduce((a, b) => a + b, 0);
      const relativeVolume = comparableExpectedVolume > 0 ? dayVolume / comparableExpectedVolume : null;

      const gapPercent = ((today[0].open - prevClose) / prevClose) * 100;
      const changePercent = ((currentPrice - prevClose) / prevClose) * 100;
      const rangeWidth = openingRangeHigh - openingRangeLow;
      const distanceToORHigh = ((openingRangeHigh - currentPrice) / currentPrice) * 100;
      const distanceToORLow = ((currentPrice - openingRangeLow) / currentPrice) * 100;

      let longScore = 0;
      let shortScore = 0;
      const longReasons = [];
      const shortReasons = [];

      if (currentPrice > vwap) { longScore += 15; longReasons.push('above VWAP'); }
      if (currentPrice < vwap) { shortScore += 15; shortReasons.push('below VWAP'); }
      if (ema9 && ema20 && ema9 > ema20) { longScore += 15; longReasons.push('9 EMA above 20 EMA'); }
      if (ema9 && ema20 && ema9 < ema20) { shortScore += 15; shortReasons.push('9 EMA below 20 EMA'); }
      if (relativeVolume != null && relativeVolume >= 1.2) {
        longScore += 12; shortScore += 12;
        longReasons.push(`${round(relativeVolume, 1)}× relative volume`);
        shortReasons.push(`${round(relativeVolume, 1)}× relative volume`);
      }
      if (changePercent > 0) { longScore += 8; longReasons.push('positive day momentum'); }
      if (changePercent < 0) { shortScore += 8; shortReasons.push('negative day momentum'); }
      if (rsi != null && rsi >= 52 && rsi <= 72) { longScore += 8; longReasons.push(`RSI ${round(rsi, 0)}`); }
      if (rsi != null && rsi <= 48 && rsi >= 28) { shortScore += 8; shortReasons.push(`RSI ${round(rsi, 0)}`); }

      if (marketRegime?.regime === 'BULLISH') {
        longScore += 12; shortScore -= 8;
        longReasons.push('NIFTY regime bullish');
      } else if (marketRegime?.regime === 'BEARISH') {
        shortScore += 12; longScore -= 8;
        shortReasons.push('NIFTY regime bearish');
      }

      let direction = longScore >= shortScore ? 'LONG' : 'SHORT';
      let score = Math.max(longScore, shortScore);
      let setup = 'NO_SETUP';
      let status = 'WAIT';
      let entry = null, stop = null, target1 = null, target2 = null;

      const buffer = Math.max(atr * 0.08, currentPrice * 0.0006);
      const breakoutLong = openingRangeReady && currentPrice > openingRangeHigh + buffer;
      const breakoutShort = openingRangeReady && currentPrice < openingRangeLow - buffer;
      const nearLongTrigger = openingRangeReady && currentPrice <= openingRangeHigh + buffer && currentPrice >= openingRangeHigh - Math.max(atr * 0.25, currentPrice * 0.0015);
      const nearShortTrigger = openingRangeReady && currentPrice >= openingRangeLow - buffer && currentPrice <= openingRangeLow + Math.max(atr * 0.25, currentPrice * 0.0015);

      if (breakoutLong && longScore >= 58 && currentPrice > vwap) {
        direction = 'LONG';
        setup = 'ORB_BREAKOUT';
        status = 'ENTER';
        entry = Math.max(currentPrice, openingRangeHigh + buffer);
        stop = Math.max(vwap, openingRangeHigh - atr * 0.65);
        if (stop >= entry) stop = entry - Math.max(atr * 0.65, currentPrice * 0.002);
        const risk = entry - stop;
        target1 = entry + risk * 2;
        target2 = entry + risk * 3;
        score += 18;
      } else if (breakoutShort && shortScore >= 58 && currentPrice < vwap) {
        direction = 'SHORT';
        setup = 'ORB_BREAKDOWN';
        status = 'ENTER';
        entry = Math.min(currentPrice, openingRangeLow - buffer);
        stop = Math.min(vwap, openingRangeLow + atr * 0.65);
        if (stop <= entry) stop = entry + Math.max(atr * 0.65, currentPrice * 0.002);
        const risk = stop - entry;
        target1 = entry - risk * 2;
        target2 = entry - risk * 3;
        score += 18;
      } else if (nearLongTrigger && longScore >= 55 && currentPrice >= vwap) {
        direction = 'LONG';
        setup = 'ORB_WATCH';
        status = 'WATCH';
        entry = openingRangeHigh + buffer;
        stop = Math.max(vwap, openingRangeHigh - atr * 0.65);
        const risk = Math.max(entry - stop, atr * 0.5);
        target1 = entry + risk * 2;
        target2 = entry + risk * 3;
      } else if (nearShortTrigger && shortScore >= 55 && currentPrice <= vwap) {
        direction = 'SHORT';
        setup = 'ORB_WATCH';
        status = 'WATCH';
        entry = openingRangeLow - buffer;
        stop = Math.min(vwap, openingRangeLow + atr * 0.65);
        const risk = Math.max(stop - entry, atr * 0.5);
        target1 = entry - risk * 2;
        target2 = entry - risk * 3;
      }

      score = Math.max(0, Math.min(99, Math.round(score)));
      const riskPerShare = entry && stop ? Math.abs(entry - stop) : null;
      const rr = riskPerShare && target1 ? Math.abs(target1 - entry) / riskPerShare : null;

      let reason = direction === 'LONG' ? longReasons.slice(0, 4).join(' · ') : shortReasons.slice(0, 4).join(' · ');
      if (!reason) reason = 'No aligned momentum signals yet.';

      const invalidation = direction === 'LONG'
        ? `Exit if price closes below ₹${round(stop)} or loses VWAP with momentum.`
        : `Exit if price closes above ₹${round(stop)} or reclaims VWAP with momentum.`;

      const exitPlan = entry
        ? `Book partial at ₹${round(target1)}; trail the remainder toward ₹${round(target2)}. Square off before 15:20 IST.`
        : 'No position: wait for the trigger.';

      return {
        symbol: symbol.replace('.NS', ''),
        fullSymbol: symbol,
        currentPrice: round(currentPrice),
        previousClose: round(prevClose),
        changePercent: round(changePercent, 2),
        gapPercent: round(gapPercent, 2),
        volume: dayVolume,
        relativeVolume: relativeVolume == null ? null : round(relativeVolume, 2),
        vwap: round(vwap),
        dayHigh: round(dayHigh),
        dayLow: round(dayLow),
        openingRangeHigh: round(openingRangeHigh),
        openingRangeLow: round(openingRangeLow),
        openingRangeReady,
        ema9: round(ema9),
        ema20: round(ema20),
        rsi: round(rsi, 0),
        atr: round(atr),
        plan: {
          setup,
          direction,
          score,
          entry: round(entry),
          stop: round(stop),
          target1: round(target1),
          target2: round(target2),
          rrRatio: rr ? `1:${round(rr, 1)}` : '—',
          riskPerShare: round(riskPerShare),
          status,
          reason,
          invalidation,
          exitPlan
        }
      };
    } catch (err) {
      console.warn(`[IntradayService] Error scanning ${symbol}:`, err.message);
      return null;
    }
  }

  async scanUniverse(universeKey = 'NIFTY50') {
    const cacheKey = `intraday_scan_v2_${universeKey}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached.data;

    const stale = this.staleCache.get(cacheKey);
    if (stale && !this.scanLocks.get(cacheKey)) {
      // Fire and forget background refresh
      this.backgroundRefresh(universeKey, cacheKey).catch(err => console.warn('[IntradayService] background refresh error:', err.message));
      return stale;
    }

    // First time load or refresh already in progress: await it
    return await this.backgroundRefresh(universeKey, cacheKey);
  }

  async backgroundRefresh(universeKey, cacheKey) {
    if (this.scanLocks.get(cacheKey)) return this.scanLocks.get(cacheKey);

    const promise = (async () => {
      try {
        const symbols = SCAN_UNIVERSES[universeKey] || SCAN_UNIVERSES.NIFTY50;
        const marketStatus = getMarketStatus();
        const marketRegime = await this.getMarketRegime();

        const results = [];
        const chunkSize = 10;
        for (let i = 0; i < symbols.length; i += chunkSize) {
          const chunk = symbols.slice(i, i + chunkSize);
          const chunkResults = await Promise.allSettled(
            chunk.map(sym => this.analyzeStock(`${sym}.NS`, marketRegime))
          );
          results.push(...chunkResults);
        }

        const setups = results
          .map(r => r.status === 'fulfilled' ? r.value : null)
          .filter(Boolean)
          .sort((a, b) => {
            const statusRank = { ENTER: 2, WATCH: 1, WAIT: 0 };
            return (statusRank[b.plan.status] - statusRank[a.plan.status]) || (b.plan.score - a.plan.score);
          });

        const actionable = setups.filter(x => x.plan.status !== 'WAIT').slice(0, 5);

        const payload = {
          universe: universeKey,
          marketState: marketStatus.isOpen ? 'LIVE' : 'CLOSED',
          marketRegime,
          scannedCount: setups.length,
          actionable,
          setups,
          retrievedAt: new Date().toISOString(),
          dataNote: 'Yahoo Finance is a secondary/delayed provider. Verify live price and execution with your broker before trading.'
        };

        cacheService.set(cacheKey, payload, marketStatus.isOpen ? 20 : 60);
        this.staleCache.set(cacheKey, payload);
        return payload;
      } finally {
        this.scanLocks.delete(cacheKey);
      }
    })();

    this.scanLocks.set(cacheKey, promise);
    return promise;
  }
}

export const intradayService = new IntradayService();
