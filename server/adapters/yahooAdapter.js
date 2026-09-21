/**
 * Yahoo Finance Secondary Fallback Adapter
 * Connects to Yahoo Finance v8/v10 REST endpoints with cookie/crumb session handling.
 * Explicitly marked as Secondary Fallback in all provenance outputs.
 */

import { cacheService } from '../services/cacheService.js';

class YahooAdapter {
  constructor() {
    this.name = 'Yahoo Finance (Secondary Fallback)';
    this.cookie = null;
    this.crumb = null;
    this.cookieExpiry = 0;
    this.lastSuccessfulRequest = null;
    this.totalRequests = 0;
    this.errorCount = 0;
    this.averageLatencyMs = 0;
  }

  /**
   * Acquire session cookie and crumb for Yahoo Finance v10 endpoints
   */
  async ensureCrumb() {
    const now = Date.now();
    if (this.crumb && this.cookie && now < this.cookieExpiry) {
      return { cookie: this.cookie, crumb: this.crumb };
    }

    try {
      // 1. Get Cookie from fc.yahoo.com
      const cookieRes = await fetch('https://fc.yahoo.com', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'manual',
      });

      const setCookieHeader = cookieRes.headers.get('set-cookie');
      if (setCookieHeader) {
        this.cookie = setCookieHeader.split(';')[0];
      }

      // 2. Get Crumb
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': '*/*',
      };
      if (this.cookie) {
        headers['Cookie'] = this.cookie;
      }

      const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
        headers,
      });

      if (crumbRes.ok) {
        const crumbText = await crumbRes.text();
        if (crumbText && !crumbText.includes('<html') && crumbText.length < 100) {
          this.crumb = crumbText.trim();
          this.cookieExpiry = now + 12 * 60 * 60 * 1000; // 12 hours
          return { cookie: this.cookie, crumb: this.crumb };
        }
      }
    } catch (err) {
      console.warn('[YahooAdapter] Crumb initialization notice:', err.message);
    }

    return { cookie: this.cookie, crumb: this.crumb };
  }

  /**
   * Format Indian Ticker for Yahoo API (e.g. RELIANCE -> RELIANCE.NS)
   */
  toYahooSymbol(symbol) {
    if (!symbol) return '';
    const clean = symbol.trim().toUpperCase();
    if (clean.startsWith('^')) return clean; // Indices like ^NSEI, ^BSESN
    if (clean.endsWith('.NS') || clean.endsWith('.BO')) return clean;
    if (/^\d{6}$/.test(clean)) return `${clean}.BO`; // BSE Scrip Code
    return `${clean}.NS`; // Default to NSE
  }

  /**
   * Execute authenticated fetch with latency tracking
   */
  async fetchWithAuth(url, options = {}) {
    const startTime = Date.now();
    this.totalRequests++;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      ...(options.headers || {}),
    };

    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const latency = Date.now() - startTime;
      this.averageLatencyMs = Math.round(
        (this.averageLatencyMs * (this.totalRequests - 1) + latency) / this.totalRequests
      );

      if (!response.ok) {
        this.errorCount++;
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.lastSuccessfulRequest = new Date().toISOString();
      const json = await response.json();
      return { data: json, latency };
    } catch (err) {
      this.errorCount++;
      throw err;
    }
  }

  /**
   * Fetch Real Quote Summary from Yahoo Finance v10
   */
  async getQuoteSummary(symbol) {
    const yahooSym = this.toYahooSymbol(symbol);
    const cacheKey = `yahoo_quote_${yahooSym}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return { ...cached.data, isCacheHit: true, latency: 0 };

    await this.ensureCrumb();
    const modules = [
      'price',
      'summaryDetail',
      'financialData',
      'defaultKeyStatistics',
      'assetProfile',
      'incomeStatementHistory',
      'incomeStatementHistoryQuarterly',
      'balanceSheetHistory',
      'cashflowStatementHistory',
    ].join(',');

    let url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(yahooSym)}?modules=${modules}`;
    if (this.crumb) {
      url += `&crumb=${encodeURIComponent(this.crumb)}`;
    }

    const { data, latency } = await this.fetchWithAuth(url);
    const result = data?.quoteSummary?.result?.[0];

    if (!result) {
      throw new Error(`No quote data returned for symbol: ${symbol}`);
    }

    const providerTimestamp = result.price?.regularMarketTime
      ? new Date(result.price.regularMarketTime * 1000).toISOString()
      : null;

    const payload = {
      raw: result,
      source: this.name,
      providerSymbol: yahooSym,
      providerTimestamp,
      retrievedAt: new Date().toISOString(),
      latency,
    };

    cacheService.set(cacheKey, payload, 20, {
      providerTimestamp,
      source: this.name,
      freshness: 'DELAYED',
    });

    return payload;
  }

  /**
   * Fetch Real Historical Chart Time Series from Yahoo Finance v8
   */
  async getChart(symbol, range = '1mo', interval = '1d') {
    const yahooSym = this.toYahooSymbol(symbol);
    const cacheKey = `yahoo_chart_${yahooSym}_${range}_${interval}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return { ...cached.data, isCacheHit: true, latency: 0 };

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}&includePrePost=false&events=div%7Csplit`;
    const { data, latency } = await this.fetchWithAuth(url);

    const chartResult = data?.chart?.result?.[0];
    if (!chartResult) {
      throw new Error(`No chart data returned for symbol: ${symbol}`);
    }

    const meta = chartResult.meta || {};
    const timestamps = chartResult.timestamp || [];
    const quote = chartResult.indicators?.quote?.[0] || {};
    const opens = quote.open || [];
    const highs = quote.high || [];
    const lows = quote.low || [];
    const closes = quote.close || [];
    const volumes = quote.volume || [];

    const points = [];
    for (let i = 0; i < timestamps.length; i++) {
      const closeVal = closes[i];
      // Only include valid non-null numerical points
      if (closeVal !== null && closeVal !== undefined && !isNaN(closeVal)) {
        points.push({
          timestamp: timestamps[i] * 1000,
          date: new Date(timestamps[i] * 1000).toISOString(),
          open: opens[i] ?? closeVal,
          high: highs[i] ?? closeVal,
          low: lows[i] ?? closeVal,
          close: closeVal,
          volume: volumes[i] ?? 0,
        });
      }
    }

    const payload = {
      symbol: yahooSym,
      currency: meta.currency || 'INR',
      exchangeName: meta.exchangeName || 'NSE',
      instrumentType: meta.instrumentType || 'EQUITY',
      regularMarketPrice: meta.regularMarketPrice ?? null,
      previousClose: meta.chartPreviousClose ?? meta.previousClose ?? null,
      range,
      interval,
      dataPointsCount: points.length,
      points,
      source: this.name,
      retrievedAt: new Date().toISOString(),
      providerTimestamp: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
      latency,
    };

    // Cache chart for 60s
    cacheService.set(cacheKey, payload, 60, {
      providerTimestamp: payload.providerTimestamp,
      source: this.name,
      freshness: 'HISTORICAL',
    });

    return payload;
  }

  /**
   * Fetch Live Autocomplete Search Discovery
   */
  async search(query) {
    if (!query || query.trim().length === 0) return [];
    const cleanQuery = query.trim();
    const cacheKey = `yahoo_search_${cleanQuery.toUpperCase()}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached.data;

    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanQuery)}&quotesCount=15&newsCount=0&enableFuzzyQuery=true&quotesQueryId=tss_match_phrase_query`;
    const { data } = await this.fetchWithAuth(url);

    const quotes = data?.quotes || [];
    // Filter Indian exchange quotes (.NS or .BO) or relevant indices
    const indianQuotes = quotes.filter(q => {
      const s = q.symbol || '';
      return s.endsWith('.NS') || s.endsWith('.BO') || s.startsWith('^') || q.exchange === 'NSI' || q.exchange === 'BSE';
    });

    const payload = indianQuotes.map(q => ({
      symbol: q.symbol.replace(/\.(NS|BO)$/, ''),
      fullSymbol: q.symbol,
      name: q.shortname || q.longname || q.symbol,
      exchange: q.symbol.endsWith('.BO') || q.exchange === 'BSE' ? 'BSE' : 'NSE',
      type: q.quoteType || 'EQUITY',
      sector: q.sector || null,
      industry: q.industry || null,
      source: this.name,
    }));

    cacheService.set(cacheKey, payload, 300, {
      source: this.name,
      freshness: 'LATEST_AVAILABLE',
    });

    return payload;
  }

  /**
   * Fetch lightweight live quotes for a batch of symbols (v7 endpoint).
   * Used by search to enrich results with price/change without heavy quoteSummary calls.
   * Returns a map keyed by the raw (non-extension) symbol.
   */
  async getQuotes(symbols) {
    if (!symbols || symbols.length === 0) return {};
    const unique = [...new Set(symbols.map(s => String(s).trim().toUpperCase()).filter(Boolean))];
    if (unique.length === 0) return {};

    const yahooSyms = unique.map(s => this.toYahooSymbol(s)).join(',');
    const cacheKey = `yahoo_quotes_${unique.join('_')}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached.data;

    await this.ensureCrumb();
    let url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSyms)}`;
    if (this.crumb) {
      url += `&crumb=${encodeURIComponent(this.crumb)}`;
    }

    const { data, latency } = await this.fetchWithAuth(url);
    const quotes = data?.quoteResponse?.result || [];

    const map = {};
    for (const q of quotes) {
      const sym = (q.symbol || '').replace(/\.(NS|BO)$/, '');
      map[sym] = {
        symbol: sym,
        fullSymbol: q.symbol,
        name: q.shortName || q.longName || q.displayName || sym,
        exchange: (q.exchange || '').toUpperCase(),
        price: q.regularMarketPrice ?? null,
        previousClose: q.regularMarketPreviousClose ?? q.chartPreviousClose ?? null,
        change: q.regularMarketChange ?? null,
        changePercent: q.regularMarketChangePercent ?? null,
        currency: q.currency || 'INR',
        marketState: q.marketState || null,
        marketTime: q.regularMarketTime ? new Date(q.regularMarketTime * 1000).toISOString() : null,
        source: this.name,
      };
    }

    cacheService.set(cacheKey, map, 20, {
      source: this.name,
      freshness: 'DELAYED',
    });

    return map;
  }

  /**
   * Provider Health Status
   */
  getHealth() {
    return {
      provider: this.name,
      status: this.errorCount === 0 || this.lastSuccessfulRequest ? 'operational' : 'degraded',
      totalRequests: this.totalRequests,
      errorCount: this.errorCount,
      averageLatencyMs: this.averageLatencyMs,
      lastSuccessfulRequest: this.lastSuccessfulRequest,
      crumbAvailable: !!this.crumb,
    };
  }
}

export const yahooAdapter = new YahooAdapter();
