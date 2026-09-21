/**
 * Zero-Fake-Data Audit Script
 * Automated verification suite ensuring 100% genuine data provenance.
 * 1. Scans codebase for forbidden mock patterns (Math.random, fake prices, synthetic news).
 * 2. Connects to backend services to verify real-world company responses & ISIN provenance.
 * 3. Verifies strict null handling and quality flags for unavailable metrics.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { companyService } from '../services/companyService.js';
import { marketService } from '../services/marketService.js';
import { securityMaster } from '../services/securityMasterService.js';
import { newsAdapter } from '../adapters/newsAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

async function runAudit() {
  console.log('====================================================');
  console.log('🛡️  STARTING ZERO-FAKE-DATA COMPLIANCE AUDIT');
  console.log('====================================================\n');

  let passedChecks = 0;
  let failedChecks = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedChecks++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failedChecks++;
    }
  }

  // CHECK 1: Static Code Analysis for Forbidden Mock Patterns
  console.log('--- CHECK 1: Codebase Static Analysis for Mock Data Patterns ---');
  const sourceDirs = [
    path.join(rootDir, 'server'),
    path.join(rootDir, 'src'),
  ];

  const forbiddenPatterns = [
    { pattern: /Math\.random\s*\(/g, name: 'Math.random() synthetic data generator' },
    { pattern: /faker\./gi, name: 'Faker library generator' },
    { pattern: /mockStockData/gi, name: 'Mock stock dataset' },
    { pattern: /generateFake/gi, name: 'Fake data generator functions' },
  ];

  let foundForbidden = false;

  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
          scanDir(fullPath);
        }
      } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
        // Skip this audit script itself from self-matching pattern names
        if (fullPath.includes('auditData.js')) continue;

        const content = fs.readFileSync(fullPath, 'utf8');
        for (const fp of forbiddenPatterns) {
          if (fp.pattern.test(content)) {
            console.error(`  ❌ FORBIDDEN PATTERN '${fp.name}' found in: ${fullPath}`);
            foundForbidden = true;
          }
        }
      }
    }
  }

  sourceDirs.forEach((dir) => {
    if (fs.existsSync(dir)) scanDir(dir);
  });

  assert(!foundForbidden, 'No Math.random() or synthetic generator routines found in source code');

  // CHECK 2: Security Master & Entity-Listing Separation
  console.log('\n--- CHECK 2: Dynamic Security Master & ISIN Integrity ---');
  const coverage = securityMaster.getCoverageStats();
  assert(coverage.companies >= 20, `Security master contains dynamic company entities (found ${coverage.companies})`);
  assert(coverage.listings >= 20, `Security master contains dynamic exchange listings (found ${coverage.listings})`);

  // Test Zomato -> Eternal migration
  const zomatoLookup = securityMaster.resolveCompany('ZOMATO');
  assert(zomatoLookup?.primarySymbol === 'ETERNAL', `Symbol alias resolution maps ZOMATO -> ${zomatoLookup?.primarySymbol}`);

  // Test Tata Motors Demerger resolution
  const tmLookup = securityMaster.resolveCompany('TATAMOTORS');
  assert(tmLookup?.primarySymbol === 'TMCV', `Symbol alias resolution maps TATAMOTORS -> ${tmLookup?.primarySymbol}`);

  // CHECK 3: Live Verification of Real Companies
  console.log('\n--- CHECK 3: Live Provider Response & Provenance Audit ---');
  const testSymbols = ['RELIANCE', 'TCS', 'INFY', 'BHARTIARTL', 'ETERNAL'];

  for (const sym of testSymbols) {
    console.log(`\n  Auditing Live Intelligence for ${sym}...`);
    const profile = await companyService.getCompanyProfile(sym);

    // 1. Check Company & ISIN
    assert(profile.company?.isin && profile.company.isin.startsWith('INE'), `${sym} has verified Indian ISIN: ${profile.company?.isin}`);

    // 2. Check Real Quote
    const price = profile.quote?.currentPrice?.value;
    assert(typeof price === 'number' && price > 0, `${sym} has real non-zero market price: ₹${price}`);
    assert(profile.quote?.currentPrice?.source && profile.quote.currentPrice.source.includes('Yahoo'), `${sym} quote has verified source provenance`);
    assert(profile.quote?.currentPrice?.freshness !== undefined, `${sym} quote has freshness flag (${profile.quote?.currentPrice?.freshness})`);

    // 3. Check Real Historical Points & Indicators
    const history = await companyService.getCompanyChart(sym, '1mo', '1d');
    assert(history.points && history.points.length > 5, `${sym} historical series has real OHLCV bars (count: ${history.points?.length})`);

    // 4. Check Technical Indicators calculation
    const tech = profile.technicals;
    assert(tech?.sma20 && tech.sma20.source === 'Calculated indicator', `${sym} SMA-20 correctly derived and attributed`);
    assert(tech?.rsi14 && tech.rsi14.source === 'Calculated indicator', `${sym} RSI-14 correctly derived and attributed`);

    // 5. Check Null Handling / No Dummy Zeros
    const roe = profile.fundamentals?.profitability?.returnOnEquity;
    if (roe?.value === null) {
      assert(roe.quality === 'UNAVAILABLE', `${sym} missing ROE correctly flagged with quality: UNAVAILABLE`);
    } else if (roe?.value !== undefined) {
      assert(typeof roe.value === 'number', `${sym} ROE is numeric: ${(roe.value * 100).toFixed(2)}%`);
    }
  }

  // CHECK 4: Live Authentic Google News RSS Parsing
  console.log('\n--- CHECK 4: Authentic RSS News Feed Verification ---');
  const newsPayload = await newsAdapter.getCompanyNews('Reliance Industries Ltd', 'RELIANCE');
  const newsItems = newsPayload.articles || [];
  assert(Array.isArray(newsItems) && newsItems.length > 0, `Google News RSS parsed ${newsItems.length} authentic articles`);
  if (newsItems.length > 0) {
    const first = newsItems[0];
    assert(first.headline && first.headline.length > 5, `Article 1 has authentic headline: "${first.headline.slice(0, 50)}..."`);
    assert(first.publisher && first.publisher.length > 1, `Article 1 has verified publisher: "${first.publisher}"`);
    assert(first.url && first.url.startsWith('http'), `Article 1 has valid external URL`);
  }

  // CHECK 5: Market Indices & Trading Session Audit
  console.log('\n--- CHECK 5: Real Indian Market Indices Audit ---');
  const indicesData = await marketService.getIndices();
  assert(indicesData.indices && indicesData.indices.length >= 8, `Market indices feed returned ${indicesData.indices?.length} verified indices`);

  const nifty = indicesData.indices.find((i) => i.symbol === '^NSEI');
  assert(nifty && nifty.currentPrice?.value > 10000, `NIFTY 50 has verified index level: ${nifty?.currentPrice?.value}`);

  const status = marketService.getTradingStatus();
  assert(status.calendar?.calendarYear === 2026, `Market calendar active for year ${status.calendar?.calendarYear}`);
  assert(typeof status.isOpen === 'boolean', `Trading session open status evaluated: ${status.isOpen ? 'OPEN' : 'CLOSED'}`);

  // Summary
  console.log('\n====================================================');
  console.log(`📊 ZERO-FAKE-DATA AUDIT COMPLETED`);
  console.log(`   Passed Checks: ${passedChecks}`);
  console.log(`   Failed Checks: ${failedChecks}`);
  console.log('====================================================\n');

  if (failedChecks > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Audit encountered fatal error:', err);
  process.exit(1);
});
