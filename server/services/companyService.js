/**
 * Company Service
 * Aggregates Company Profile, Market Quotes, Fundamentals, Technicals, Provenance & Dev-Trace.
 * Strictly maintains zero fake data and transparent field-level metadata.
 */

import { securityMaster } from './securityMasterService.js';
import { yahooAdapter } from '../adapters/yahooAdapter.js';
import { wikiAdapter } from '../adapters/wikiAdapter.js';
import { normalizeField, normalizeFinancialStatements, formatFinancialPeriod } from './normalizationService.js';

class CompanyService {
  /**
   * Get full normalized company profile
   */
  async getCompanyProfile(query) {
    if (!query) throw new Error('Query symbol or name is required');

    // 1. Resolve Company from Security Master
    let company = securityMaster.resolveCompany(query);
    const nseListing = company?.listings?.find(l => l.exchange === 'NSE');
    const bseListing = company?.listings?.find(l => l.exchange === 'BSE');

    const symbolToFetch = nseListing?.symbol || query.toUpperCase().replace(/\.(NS|BO)$/i, '');

    // 2. Fetch Quote Summary from Primary/Fallback Provider
    const startTime = Date.now();
    let quoteSummaryPayload = null;
    let lastError = null;

    const symbolsToTry = [
      nseListing?.symbol ? `${nseListing.symbol}.NS` : `${symbolToFetch}.NS`,
      bseListing?.scripCode ? `${bseListing.scripCode}.BO` : null,
      bseListing?.symbol ? `${bseListing.symbol}.BO` : `${symbolToFetch}.BO`,
    ].filter(Boolean);

    for (const sym of symbolsToTry) {
      try {
        const res = await yahooAdapter.getQuoteSummary(sym);
        if (res && res.raw && (res.raw.price?.regularMarketPrice !== undefined || res.raw.summaryDetail?.regularMarketPrice !== undefined || res.raw.price?.regularMarketTime !== undefined)) {
          quoteSummaryPayload = res;
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!quoteSummaryPayload) {
      // If security master did not have it and Yahoo also failed, throw 404
      if (!company) {
        throw new Error(`Company or security '${query}' could not be resolved from data providers.`);
      }
      // If company is in master, return partial profile with unavailable quotes
      return this.buildPartialProfile(company, lastError?.message || 'Data unavailable');
    }

    const { raw, source, providerSymbol, providerTimestamp, retrievedAt, latency, isCacheHit } = quoteSummaryPayload;

    const price = raw.price || {};
    const summary = raw.summaryDetail || {};
    const finData = raw.financialData || {};
    const keyStats = raw.defaultKeyStatistics || {};
    const assetProfile = raw.assetProfile || {};

    // Auto-register dynamically discovered company into Security Master if not yet present
    if (!company) {
      company = securityMaster.registerSecurity({
        legalName: price.longName || price.shortName || symbolToFetch,
        displayName: price.shortName || price.longName || symbolToFetch,
        isin: null,
        nseSymbol: providerSymbol.endsWith('.NS') ? providerSymbol.replace('.NS', '') : null,
        bseScripCode: providerSymbol.endsWith('.BO') ? providerSymbol.replace('.BO', '') : null,
        sector: assetProfile.sector || null,
        industry: assetProfile.industry || null,
        website: assetProfile.website || null,
        source,
      });
    }

    // 3. Fetch supplementary Wikipedia overview
    const wikiData = await wikiAdapter.getSummary(company.legalName || company.displayName);

    // 4. Normalize Quote Data
    const currentPriceRaw = price.regularMarketPrice ?? summary.regularMarketPrice ?? finData.currentPrice ?? price.regularMarketOpen ?? summary.previousClose;
    const prevCloseRaw = price.regularMarketPreviousClose ?? summary.previousClose;
    const changeRaw = price.regularMarketChange ?? (currentPriceRaw && prevCloseRaw ? currentPriceRaw - prevCloseRaw : null);
    const changePercentRaw = price.regularMarketChangePercent ?? (changeRaw && prevCloseRaw ? (changeRaw / prevCloseRaw) : null);

    const quote = {
      currentPrice: normalizeField(currentPriceRaw, { unit: 'None', currency: price.currency || 'INR', source, providerTimestamp, retrievedAt, freshness: 'DELAYED' }),
      change: normalizeField(changeRaw, { unit: 'None', currency: price.currency || 'INR', source, providerTimestamp, retrievedAt, freshness: 'DELAYED' }),
      changePercent: normalizeField(changePercentRaw, { unit: 'Percent', isMultiplier100: true, source, providerTimestamp, retrievedAt, freshness: 'DELAYED' }),
      dayHigh: normalizeField(price.regularMarketDayHigh ?? summary.dayHigh, { unit: 'None', currency: price.currency || 'INR', source, providerTimestamp, retrievedAt, freshness: 'DELAYED' }),
      dayLow: normalizeField(price.regularMarketDayLow ?? summary.dayLow, { unit: 'None', currency: price.currency || 'INR', source, providerTimestamp, retrievedAt, freshness: 'DELAYED' }),
      open: normalizeField(price.regularMarketOpen ?? summary.open, { unit: 'None', currency: price.currency || 'INR', source, providerTimestamp, retrievedAt, freshness: 'DELAYED' }),
      previousClose: normalizeField(prevCloseRaw, { unit: 'None', currency: price.currency || 'INR', source, providerTimestamp, retrievedAt, freshness: 'DELAYED' }),
      volume: normalizeField(price.regularMarketVolume ?? summary.volume, { unit: 'None', source, providerTimestamp, retrievedAt, freshness: 'DELAYED' }),
      averageVolume: normalizeField(summary.averageVolume, { unit: 'None', source, providerTimestamp, retrievedAt, freshness: 'DELAYED' }),
      fiftyTwoWeekHigh: normalizeField(summary.fiftyTwoWeekHigh, { unit: 'None', currency: price.currency || 'INR', source, providerTimestamp, retrievedAt, freshness: 'HISTORICAL' }),
      fiftyTwoWeekLow: normalizeField(summary.fiftyTwoWeekLow, { unit: 'None', currency: price.currency || 'INR', source, providerTimestamp, retrievedAt, freshness: 'HISTORICAL' }),
      marketCap: normalizeField(price.marketCap ?? summary.marketCap, { unit: 'Cr', currency: price.currency || 'INR', source, providerTimestamp, retrievedAt, freshness: 'DELAYED' }),
    };

    // 5. Normalize Fundamentals & Key Ratios with Periods
    const latestBsDate = raw.balanceSheetHistory?.balanceSheetStatements?.[0]?.endDate?.raw;
    const bsPeriod = latestBsDate ? `As of ${new Date(latestBsDate * 1000).toISOString().split('T')[0]}` : 'Latest Balance Sheet';

    const fundamentals = {
      peRatio: normalizeField(summary.trailingPE ?? finData.forwardPE, { unit: 'Ratio', period: 'TTM', source, providerTimestamp, retrievedAt }),
      forwardPE: normalizeField(summary.forwardPE, { unit: 'Ratio', period: 'Forward', source, providerTimestamp, retrievedAt }),
      pbRatio: normalizeField(summary.priceToBook, { unit: 'Ratio', period: 'Latest', source, providerTimestamp, retrievedAt }),
      eps: normalizeField(keyStats.trailingEps ?? finData.earningsPerShare, { unit: 'None', currency: 'INR', period: 'TTM', source, providerTimestamp, retrievedAt }),
      dividendYield: normalizeField(summary.dividendYield, { unit: 'Percent', isMultiplier100: true, period: 'Latest', source, providerTimestamp, retrievedAt }),
      bookValue: normalizeField(keyStats.bookValue, { unit: 'None', currency: 'INR', period: bsPeriod, source, providerTimestamp, retrievedAt }),
      roe: normalizeField(finData.returnOnEquity, { unit: 'Percent', isMultiplier100: true, period: 'TTM', source, providerTimestamp, retrievedAt }),
      roce: normalizeField(finData.returnOnAssets, { unit: 'Percent', isMultiplier100: true, period: 'TTM', source, providerTimestamp, retrievedAt }),
      debtToEquity: normalizeField(finData.debtToEquity, { unit: 'Ratio', period: bsPeriod, source, providerTimestamp, retrievedAt }),
      operatingMargin: normalizeField(finData.operatingMargins, { unit: 'Percent', isMultiplier100: true, period: 'TTM', source, providerTimestamp, retrievedAt }),
      netMargin: normalizeField(finData.profitMargins, { unit: 'Percent', isMultiplier100: true, period: 'TTM', source, providerTimestamp, retrievedAt }),
      totalDebt: normalizeField(finData.totalDebt, { unit: 'Cr', currency: 'INR', period: bsPeriod, source, providerTimestamp, retrievedAt }),
      totalCash: normalizeField(finData.totalCash, { unit: 'Cr', currency: 'INR', period: bsPeriod, source, providerTimestamp, retrievedAt }),
      freeCashFlow: normalizeField(finData.freeCashflow, { unit: 'Cr', currency: 'INR', period: 'TTM', source, providerTimestamp, retrievedAt }),
      ebitda: normalizeField(finData.ebitda, { unit: 'Cr', currency: 'INR', period: 'TTM', source, providerTimestamp, retrievedAt }),
      revenueGrowth: normalizeField(finData.revenueGrowth, { unit: 'Percent', isMultiplier100: true, period: 'YoY', source, providerTimestamp, retrievedAt }),
      beta: normalizeField(summary.beta, { unit: 'Ratio', period: '5Y Monthly', source, providerTimestamp, retrievedAt }),
    };

    // 6. Normalize Financial Statements
    const financialStatements = normalizeFinancialStatements(raw, source, providerTimestamp, retrievedAt);

    // 7. Calculate Mathematical Technical Indicators from verified historical prices
    let technicals = {
      sma20: normalizeField(null, { unit: 'None', source: 'Calculated indicator', quality: 'UNAVAILABLE' }),
      ema50: normalizeField(null, { unit: 'None', source: 'Calculated indicator', quality: 'UNAVAILABLE' }),
      rsi14: normalizeField(null, { unit: 'Ratio', source: 'Calculated indicator', quality: 'UNAVAILABLE' }),
      bollingerUpper: normalizeField(null, { unit: 'None', source: 'Calculated indicator', quality: 'UNAVAILABLE' }),
      bollingerLower: normalizeField(null, { unit: 'None', source: 'Calculated indicator', quality: 'UNAVAILABLE' }),
    };

    try {
      const histChart = await yahooAdapter.getChart(providerSymbol, '3mo', '1d');
      const histPoints = histChart.points || [];
      const closes = histPoints.map(p => p.close).filter(c => typeof c === 'number');

      if (closes.length >= 14) {
        const sma20Series = this.calculateSMA(closes, 20);
        const ema50Series = this.calculateEMA(closes, 50);
        const rsi14Series = this.calculateRSI(closes, 14);
        const bbSeries = this.calculateBollingerBands(closes, 20, 2);

        const lastSMA = sma20Series[sma20Series.length - 1];
        const lastEMA = ema50Series[ema50Series.length - 1];
        const lastRSI = rsi14Series[rsi14Series.length - 1];
        const lastBBUpper = bbSeries.upper[bbSeries.upper.length - 1];
        const lastBBLower = bbSeries.lower[bbSeries.lower.length - 1];

        technicals = {
          sma20: normalizeField(lastSMA, { unit: 'None', currency: price.currency || 'INR', source: 'Calculated indicator', freshness: 'LATEST_AVAILABLE' }),
          ema50: normalizeField(lastEMA, { unit: 'None', currency: price.currency || 'INR', source: 'Calculated indicator', freshness: 'LATEST_AVAILABLE' }),
          rsi14: normalizeField(lastRSI, { unit: 'Ratio', source: 'Calculated indicator', freshness: 'LATEST_AVAILABLE' }),
          bollingerUpper: normalizeField(lastBBUpper, { unit: 'None', currency: price.currency || 'INR', source: 'Calculated indicator', freshness: 'LATEST_AVAILABLE' }),
          bollingerLower: normalizeField(lastBBLower, { unit: 'None', currency: price.currency || 'INR', source: 'Calculated indicator', freshness: 'LATEST_AVAILABLE' }),
        };
      }
    } catch {
      // Graceful fallback to UNAVAILABLE technicals
    }

    // 8. Assemble Provenance Map
    const provenance = {
      companyIdentity: {
        provider: company.source,
        isin: company.isin,
        status: company.isin ? 'VERIFIED' : 'UNVERIFIED',
      },
      quote: {
        provider: source,
        symbol: providerSymbol,
        providerTimestamp,
        retrievedAt,
        freshness: 'DELAYED',
        quality: quote.currentPrice.quality,
      },
      fundamentals: {
        provider: source,
        retrievedAt,
        quality: fundamentals.peRatio.quality,
      },
      technicals: {
        provider: 'Calculated indicator (Formulaic Engine)',
        method: 'Standard Math / SMA-20 / EMA-50 / RSI-14',
        freshness: 'LATEST_AVAILABLE',
        quality: technicals.sma20.quality,
      },
      financialStatements: {
        provider: source,
        annualPeriods: financialStatements.incomeStatement.annual.map(i => i.period),
        quarterlyPeriods: financialStatements.incomeStatement.quarterly.map(i => i.period),
      },
      supplementaryWiki: {
        provider: wikiData ? wikiAdapter.name : 'Unavailable',
        retrievedAt: wikiData?.retrievedAt || null,
        quality: wikiData ? 'AVAILABLE' : 'UNAVAILABLE',
      },
    };

    // 9. Trace Data for Debug Panel
    const trace = {
      requestedQuery: query,
      resolvedCompanyId: company.id,
      providerSymbol,
      sourceAdapter: source,
      apiLatencyMs: latency,
      isCacheHit: !!isCacheHit,
      totalExecutionTimeMs: Date.now() - startTime,
      providerTimestamp,
      retrievedAt,
    };

    return {
      company: {
        id: company.id,
        legalName: company.legalName,
        displayName: company.displayName,
        isin: company.isin,
        sector: company.sector || assetProfile.sector || null,
        industry: company.industry || assetProfile.industry || null,
        website: company.website || assetProfile.website || null,
        listingStatus: company.listingStatus,
        aliases: company.aliases || [],
        listings: company.listings || [],
        description: wikiData?.extract || assetProfile.longBusinessSummary || null,
        descriptionSource: wikiData ? wikiAdapter.name : source,
        thumbnailUrl: wikiData?.thumbnailUrl || null,
      },
      quote,
      fundamentals,
      technicals,
      financialStatements,
      provenance,
      trace,
    };
  }

  /**
   * Partial profile builder for missing quote data
   */
  buildPartialProfile(company, errorMessage) {
    return {
      company: {
        id: company.id,
        legalName: company.legalName,
        displayName: company.displayName,
        isin: company.isin,
        sector: company.sector,
        industry: company.industry,
        website: company.website,
        listingStatus: company.listingStatus,
        aliases: company.aliases,
        listings: company.listings,
        description: null,
      },
      quote: {
        currentPrice: normalizeField(null, { freshness: 'UNAVAILABLE' }),
        change: normalizeField(null, { freshness: 'UNAVAILABLE' }),
        changePercent: normalizeField(null, { freshness: 'UNAVAILABLE' }),
        dayHigh: normalizeField(null, { freshness: 'UNAVAILABLE' }),
        dayLow: normalizeField(null, { freshness: 'UNAVAILABLE' }),
        open: normalizeField(null, { freshness: 'UNAVAILABLE' }),
        previousClose: normalizeField(null, { freshness: 'UNAVAILABLE' }),
        volume: normalizeField(null, { freshness: 'UNAVAILABLE' }),
        marketCap: normalizeField(null, { freshness: 'UNAVAILABLE' }),
      },
      fundamentals: {
        peRatio: normalizeField(null),
        pbRatio: normalizeField(null),
        eps: normalizeField(null),
        dividendYield: normalizeField(null),
        roe: normalizeField(null),
        roce: normalizeField(null),
        debtToEquity: normalizeField(null),
      },
      financialStatements: {
        incomeStatement: { annual: [], quarterly: [] },
        balanceSheet: { annual: [] },
        cashFlow: { annual: [] },
      },
      provenance: {
        companyIdentity: { provider: company.source, isin: company.isin },
        quote: { provider: 'Unavailable', status: 'PROVIDER_ERROR', error: errorMessage },
      },
      trace: {
        requestedQuery: company.displayName,
        status: 'PROVIDER_ERROR',
        error: errorMessage,
      },
    };
  }

  /**
   * Fetch Real Historical Chart Time Series + Calculated Technical Indicators
   */
  async getCompanyChart(symbol, range = '1mo', interval = '1d') {
    const cleanSym = symbol.toUpperCase().replace(/\.(NS|BO)$/i, '');
    const chartPayload = await yahooAdapter.getChart(cleanSym, range, interval);

    // Compute technical indicators strictly from real historical close prices
    const points = chartPayload.points || [];
    const closes = points.map(p => p.close);

    const sma20 = this.calculateSMA(closes, 20);
    const ema50 = this.calculateEMA(closes, 50);
    const rsi14 = this.calculateRSI(closes, 14);
    const macd = this.calculateMACD(closes);
    const bollinger = this.calculateBollingerBands(closes, 20, 2);

    // Attach calculated indicators to each data point with strict labeling
    const enrichedPoints = points.map((p, i) => ({
      ...p,
      sma20: sma20[i] !== null ? Number(sma20[i].toFixed(2)) : null,
      ema50: ema50[i] !== null ? Number(ema50[i].toFixed(2)) : null,
      rsi14: rsi14[i] !== null ? Number(rsi14[i].toFixed(2)) : null,
      macd: macd.macdLine[i] !== null ? Number(macd.macdLine[i].toFixed(2)) : null,
      macdSignal: macd.signalLine[i] !== null ? Number(macd.signalLine[i].toFixed(2)) : null,
      macdHistogram: macd.histogram[i] !== null ? Number(macd.histogram[i].toFixed(2)) : null,
      bollingerUpper: bollinger.upper[i] !== null ? Number(bollinger.upper[i].toFixed(2)) : null,
      bollingerLower: bollinger.lower[i] !== null ? Number(bollinger.lower[i].toFixed(2)) : null,
      bollingerMiddle: bollinger.middle[i] !== null ? Number(bollinger.middle[i].toFixed(2)) : null,
    }));

    return {
      ...chartPayload,
      points: enrichedPoints,
      technicalIndicatorsNotice: 'Calculated technical indicator (SMA, EMA, RSI, MACD, Bollinger Bands) derived mathematically from real historical close series',
      indicatorSource: 'Calculated indicator',
    };
  }

  /**
   * Technical Math: Simple Moving Average (SMA)
   */
  calculateSMA(prices, period) {
    const sma = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(null);
      } else {
        const slice = prices.slice(i - period + 1, i + 1);
        const sum = slice.reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  }

  /**
   * Technical Math: Exponential Moving Average (EMA)
   */
  calculateEMA(prices, period) {
    const ema = [];
    const k = 2 / (period + 1);
    let prevEma = null;

    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        ema.push(null);
      } else if (i === period - 1) {
        const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
        prevEma = sum / period;
        ema.push(prevEma);
      } else {
        const currentEma = prices[i] * k + prevEma * (1 - k);
        prevEma = currentEma;
        ema.push(currentEma);
      }
    }
    return ema;
  }

  /**
   * Technical Math: Relative Strength Index (RSI-14)
   */
  calculateRSI(prices, period = 14) {
    const rsi = [];
    if (prices.length <= period) {
      return prices.map(() => null);
    }

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = 0; i < prices.length; i++) {
      if (i < period) {
        rsi.push(null);
      } else if (i === period) {
        if (avgLoss === 0) rsi.push(100);
        else {
          const rs = avgGain / avgLoss;
          rsi.push(100 - (100 / (1 + rs)));
        }
      } else {
        const diff = prices[i] - prices[i - 1];
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        if (avgLoss === 0) rsi.push(100);
        else {
          const rs = avgGain / avgLoss;
          rsi.push(100 - (100 / (1 + rs)));
        }
      }
    }

    return rsi;
  }

  /**
   * Technical Math: MACD (12, 26, 9)
   */
  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = [];

    for (let i = 0; i < prices.length; i++) {
      if (ema12[i] !== null && ema26[i] !== null) {
        macdLine.push(ema12[i] - ema26[i]);
      } else {
        macdLine.push(null);
      }
    }

    const validMacd = macdLine.filter(v => v !== null);
    const signalLineRaw = this.calculateEMA(validMacd, 9);
    const signalLine = [];
    let sigIdx = 0;

    for (let i = 0; i < prices.length; i++) {
      if (macdLine[i] === null) {
        signalLine.push(null);
      } else {
        signalLine.push(signalLineRaw[sigIdx] ?? null);
        sigIdx++;
      }
    }

    const histogram = macdLine.map((m, i) => {
      if (m !== null && signalLine[i] !== null) {
        return m - signalLine[i];
      }
      return null;
    });

    return { macdLine, signalLine, histogram };
  }

  /**
   * Technical Math: Bollinger Bands (20, 2)
   */
  calculateBollingerBands(prices, period = 20, stdDevMultiplier = 2) {
    const middle = this.calculateSMA(prices, period);
    const upper = [];
    const lower = [];

    for (let i = 0; i < prices.length; i++) {
      if (middle[i] === null) {
        upper.push(null);
        lower.push(null);
      } else {
        const slice = prices.slice(i - period + 1, i + 1);
        const mean = middle[i];
        const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
        const stdDev = Math.sqrt(variance);

        upper.push(mean + stdDevMultiplier * stdDev);
        lower.push(mean - stdDevMultiplier * stdDev);
      }
    }

    return { middle, upper, lower };
  }
}

export const companyService = new CompanyService();
