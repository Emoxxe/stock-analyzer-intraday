/**
 * Authentic API Client
 * Proxies requests directly to the verified backend endpoints.
 * Strictly zero fake data, no synthetic random values, no synthetic candles.
 */

export async function getCompanyProfile(symbol) {
  const res = await fetch(`/api/company/${encodeURIComponent(symbol)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch company profile for ${symbol} (HTTP ${res.status})`);
  }
  return res.json();
}

export async function getHistoricalChart(symbol, range = '1y', interval = '1d') {
  const res = await fetch(`/api/company/${encodeURIComponent(symbol)}/chart?range=${range}&interval=${interval}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch historical chart for ${symbol} (HTTP ${res.status})`);
  }
  return res.json();
}

export async function getMarketIndices() {
  const res = await fetch('/api/market/indices');
  if (!res.ok) {
    throw new Error(`Failed to fetch market indices (HTTP ${res.status})`);
  }
  return res.json();
}

export async function getMarketMovers(universe = 'NIFTY50') {
  const res = await fetch(`/api/market/movers?universe=${encodeURIComponent(universe)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch market movers (HTTP ${res.status})`);
  }
  return res.json();
}

export async function searchSecurities(query) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error(`Failed to execute security search (HTTP ${res.status})`);
  }
  return res.json();
}

export async function getSystemHealth() {
  const res = await fetch('/api/system/health');
  if (!res.ok) {
    throw new Error(`Failed to fetch system health (HTTP ${res.status})`);
  }
  return res.json();
}

export async function getSystemCoverage() {
  const res = await fetch('/api/system/coverage');
  if (!res.ok) {
    throw new Error(`Failed to fetch system coverage (HTTP ${res.status})`);
  }
  return res.json();
}
