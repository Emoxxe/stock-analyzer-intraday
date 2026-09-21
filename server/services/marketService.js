/**
 * Market Service
 * Fetches real Indian Market Indices, Universe-Aware Top Movers, and Trading Session Status.
 * Strictly adheres to universe disclosure (e.g. NIFTY 50 Movers, NOT generic Indian Market Gainers).
 */

import { yahooAdapter } from '../adapters/yahooAdapter.js';
import { getMarketStatus } from '../config/marketCalendar.js';
import { normalizeField } from './normalizationService.js';
import { cacheService } from './cacheService.js';

// Verified Universe Constituents for universe-scoped mover calculations
const UNIVERSE_CONSTITUENTS = {
  NIFTY50: [
    'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
    'SBIN.NS', 'BHARTIARTL.NS', 'TMCV.NS', 'ADANIENT.NS', 'LT.NS',
    'ITC.NS', 'HINDUNILVR.NS', 'SUNPHARMA.NS', 'TATASTEEL.NS', 'BAJFINANCE.NS',
    'MARUTI.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'M&M.NS', 'NTPC.NS',
  ],
};

const MAJOR_INDICES = [
  { symbol: '^NSEI', name: 'NIFTY 50', exchange: 'NSE' },
  { symbol: '^BSESN', name: 'SENSEX', exchange: 'BSE' },
  { symbol: '^NSEBANK', name: 'NIFTY BANK', exchange: 'NSE' },
  { symbol: '^INDIAVIX', name: 'INDIA VIX', exchange: 'NSE' },
  { symbol: '^CNXIT', name: 'NIFTY IT', exchange: 'NSE' },
  { symbol: '^CNXAUTO', name: 'NIFTY AUTO', exchange: 'NSE' },
  { symbol: '^CNXPHARMA', name: 'NIFTY PHARMA', exchange: 'NSE' },
  { symbol: '^CNXFMCG', name: 'NIFTY FMCG', exchange: 'NSE' },
  { symbol: '^CNXMETAL', name: 'NIFTY METAL', exchange: 'NSE' },
  { symbol: '^CNXREALTY', name: 'NIFTY REALTY', exchange: 'NSE' },
];

class MarketService {
  /**
   * Get Real Indian Market Indices
   */
  async getIndices() {
    const cacheKey = 'market_indices_quotes';
    const cached = cacheService.get(cacheKey);
    if (cached) return cached.data;

    const results = await Promise.allSettled(
      MAJOR_INDICES.map(async (idx) => {
        try {
          const chart = await yahooAdapter.getChart(idx.symbol, '1d', '5m');
          const lastPoint = chart.points?.[chart.points.length - 1];
          const prevClose = chart.previousClose;
          const current = lastPoint ? lastPoint.close : chart.regularMarketPrice;

          const change = current !== null && prevClose !== null ? current - prevClose : null;
          const changePercent = current !== null && prevClose && prevClose !== 0 ? (change / prevClose) * 100 : null;

          return {
            symbol: idx.symbol,
            name: idx.name,
            exchange: idx.exchange,
            currentPrice: normalizeField(current, { unit: 'None', currency: 'INR', source: chart.source, providerTimestamp: chart.providerTimestamp, freshness: 'DELAYED' }),
            previousClose: normalizeField(prevClose, { unit: 'None', currency: 'INR', source: chart.source, providerTimestamp: chart.providerTimestamp, freshness: 'DELAYED' }),
            change: normalizeField(change, { unit: 'None', currency: 'INR', source: chart.source, providerTimestamp: chart.providerTimestamp, freshness: 'DELAYED' }),
            changePercent: normalizeField(changePercent, { unit: 'Percent', source: chart.source, providerTimestamp: chart.providerTimestamp, freshness: 'DELAYED' }),
            source: chart.source,
            providerTimestamp: chart.providerTimestamp,
            quality: current !== null ? 'AVAILABLE' : 'UNAVAILABLE',
          };
        } catch (err) {
          return {
            symbol: idx.symbol,
            name: idx.name,
            exchange: idx.exchange,
            currentPrice: normalizeField(null),
            previousClose: normalizeField(null),
            change: normalizeField(null),
            changePercent: normalizeField(null),
            source: 'Unavailable',
            quality: 'UNAVAILABLE',
            error: err.message,
          };
        }
      })
    );

    const payload = {
      indices: results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean),
      retrievedAt: new Date().toISOString(),
      marketStatus: getMarketStatus(),
    };

    cacheService.set(cacheKey, payload, 20, {
      source: 'Yahoo Finance (Secondary Fallback)',
      freshness: 'DELAYED',
    });

    return payload;
  }

  /**
   * Get Real Universe-Scoped Movers
   */
  async getMovers(universeKey = 'NIFTY50') {
    const key = universeKey.toUpperCase();
    const symbols = UNIVERSE_CONSTITUENTS[key] || UNIVERSE_CONSTITUENTS.NIFTY50;
    const label = key === 'NIFTY50' ? 'NIFTY 50 Constituents' : `${key} Constituents`;

    const cacheKey = `market_movers_${key}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached.data;

    const quotes = await Promise.allSettled(
      symbols.map(async (sym) => {
        try {
          const chart = await yahooAdapter.getChart(sym, '1d', '5m');
          const lastPoint = chart.points?.[chart.points.length - 1];
          const prevClose = chart.previousClose;
          const current = lastPoint ? lastPoint.close : chart.regularMarketPrice;

          const change = current !== null && prevClose !== null ? current - prevClose : null;
          const changePercent = current !== null && prevClose && prevClose !== 0 ? (change / prevClose) * 100 : null;

          return {
            symbol: sym.replace('.NS', ''),
            fullSymbol: sym,
            price: current,
            change,
            changePercent,
            volume: lastPoint?.volume || 0,
            source: chart.source,
            providerTimestamp: chart.providerTimestamp,
            quality: current !== null ? 'AVAILABLE' : 'UNAVAILABLE',
          };
        } catch {
          return null;
        }
      })
    );

    const validQuotes = quotes
      .map(q => q.status === 'fulfilled' ? q.value : null)
      .filter(q => q && q.price !== null && q.changePercent !== null);

    // Sort Gainers (descending changePercent)
    const gainers = [...validQuotes]
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);

    // Sort Losers (ascending changePercent)
    const losers = [...validQuotes]
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);

    // Sort Most Active by Volume
    const mostActive = [...validQuotes]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

    const payload = {
      universe: key,
      label,
      coverageCount: symbols.length,
      scannedCount: validQuotes.length,
      gainers,
      losers,
      mostActive,
      retrievedAt: new Date().toISOString(),
      source: 'Yahoo Finance (Secondary Fallback)',
    };

    cacheService.set(cacheKey, payload, 30, {
      source: 'Yahoo Finance (Secondary Fallback)',
      freshness: 'DELAYED',
    });

    return payload;
  }

  /**
   * Get Market Status
   */
  getTradingStatus() {
    return getMarketStatus();
  }
}

export const marketService = new MarketService();
