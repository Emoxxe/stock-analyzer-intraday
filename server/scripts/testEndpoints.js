/**
 * Live Backend API Integration Test Script
 * Verifies genuine responses for target securities, historical charts, news, coverage, and edge cases.
 */

import http from 'http';
import app, { server } from '../index.js';

let BASE_URL = 'http://127.0.0.1:5000';

async function fetchJson(path) {
  const addr = server.address();
  const port = typeof addr === 'object' && addr !== null ? addr.port : process.env.PORT || 5000;
  BASE_URL = `http://127.0.0.1:${port}`;
  const res = await fetch(`${BASE_URL}${path}`);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { rawText: text };
  }
  console.log(`[DEBUG] ${path} -> Status ${res.status}:`, JSON.stringify(json).slice(0, 150));
  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  console.log('\n🔍 Starting Live Backend Endpoint Verification...\n');
  const results = [];

  const check = (name, pass, details) => {
    results.push({ name, pass, details });
    const mark = pass ? '✅' : '❌';
    console.log(`${mark} [${name}] ${details}`);
  };

  try {
    // 1. System Health & Providers
    const health = await fetchJson('/api/system/providers');
    check(
      'System Providers',
      health.ok && health.data?.data?.marketDataFallback?.status === 'operational',
      `Status: ${health.data?.data?.marketDataFallback?.status || 'Failed'}`
    );

    // 2. Dynamic Coverage Stats
    const coverage = await fetchJson('/api/system/coverage');
    check(
      'System Coverage',
      coverage.ok && coverage.data?.data?.companies > 0 && coverage.data?.data?.listings > 0,
      `Companies: ${coverage.data?.data?.companies}, Listings: ${coverage.data?.data?.listings}, NSE: ${coverage.data?.data?.nseListings}, BSE: ${coverage.data?.data?.bseListings}`
    );

    // 3. Market Indices
    const indices = await fetchJson('/api/market/indices');
    const nseIdx = indices.data?.data?.indices?.find(i => i.name === 'NIFTY 50');
    check(
      'Market Indices (NIFTY 50)',
      indices.ok && nseIdx && nseIdx.currentPrice?.value > 0,
      `NIFTY 50 Price: ${nseIdx?.currentPrice?.value}, Source: ${nseIdx?.source}, ProviderTime: ${nseIdx?.providerTimestamp}`
    );

    // 4. Market Movers (NIFTY 50 universe)
    const movers = await fetchJson('/api/market/movers?universe=NIFTY50');
    check(
      'NIFTY 50 Movers',
      movers.ok && movers.data?.data?.universe === 'NIFTY50' && movers.data?.data?.gainers?.length > 0,
      `Universe: ${movers.data?.data?.label}, Gainers: ${movers.data?.data?.gainers?.length}, Top: ${movers.data?.data?.gainers?.[0]?.symbol} (${movers.data?.data?.gainers?.[0]?.changePercent?.toFixed(2)}%)`
    );

    // 5. Search
    const search = await fetchJson('/api/search?q=RELIANCE');
    check(
      'Search Discovery (RELIANCE)',
      search.ok && search.data?.results?.length > 0,
      `Found: ${search.data?.count} results, First: ${search.data?.results?.[0]?.displayName} (${search.data?.results?.[0]?.legalName})`
    );

    // 6. Real Securities Verification
    const testSymbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'TATAMOTORS', 'ADANIENT', 'ZOMATO'];

    for (const sym of testSymbols) {
      const comp = await fetchJson(`/api/company/${sym}`);
      const cData = comp.data?.data;
      const pass = comp.ok && cData?.company?.legalName && cData?.quote?.currentPrice?.value > 0;
      check(
        `Company Profile: ${sym}`,
        pass,
        `Name: "${cData?.company?.legalName}", Price: ₹${cData?.quote?.currentPrice?.value}, PE: ${cData?.fundamentals?.peRatio?.value ?? 'N/A'} (${cData?.fundamentals?.peRatio?.period || 'N/A'}), Source: ${cData?.quote?.currentPrice?.source}`
      );
    }

    // 7. Historical Chart Data & Technicals
    const chart = await fetchJson('/api/company/RELIANCE/chart?range=1mo&interval=1d');
    const chData = chart.data?.data;
    const pointsCount = chData?.points?.length || 0;
    const lastPoint = chData?.points?.[pointsCount - 1];
    check(
      'Historical Chart & Technicals (RELIANCE)',
      chart.ok && pointsCount > 0 && lastPoint?.rsi14 !== undefined,
      `Points: ${pointsCount}, Last Close: ₹${lastPoint?.close}, RSI-14: ${lastPoint?.rsi14 ?? 'N/A'}, SMA-20: ${lastPoint?.sma20 ?? 'N/A'}, Indicator Source: "${chData?.indicatorSource}"`
    );

    // 8. Authentic News RSS
    const news = await fetchJson('/api/company/RELIANCE/news');
    const articles = news.data?.data?.articles || [];
    check(
      'Authentic News (RELIANCE)',
      news.ok && articles.length > 0 && articles[0].url && articles[0].publisher,
      `Articles: ${articles.length}, Top Headline: "${articles[0]?.headline?.slice(0, 50)}...", Publisher: "${articles[0]?.publisher}", URL: ${articles[0]?.url?.slice(0, 40)}...`
    );

    // 9. Provenance API
    const prov = await fetchJson('/api/company/TCS/provenance');
    const pData = prov.data?.data;
    check(
      'Data Provenance API (TCS)',
      prov.ok && pData?.quote?.provider && pData?.fundamentals?.provider,
      `Quote Provider: "${pData?.quote?.provider}", Quality: ${pData?.quote?.quality}, Freshness: ${pData?.quote?.freshness}`
    );

    // 10. Negative Case: Invalid Symbol
    const invalid = await fetchJson('/api/company/INVALID_TICKER_XYZ_999');
    check(
      'Negative Case (Invalid Symbol)',
      invalid.status === 404 && invalid.data?.quality === 'UNAVAILABLE',
      `Status: ${invalid.status}, Quality: ${invalid.data?.quality}, Error: "${invalid.data?.error}"`
    );

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close(() => {
      console.log('\n📊 Test Summary:');
      const passed = results.filter(r => r.pass).length;
      const total = results.length;
      console.log(`Passed: ${passed}/${total} (${((passed / total) * 100).toFixed(0)}%)\n`);
      process.exit(passed === total ? 0 : 1);
    });
  }
}

runTests();
