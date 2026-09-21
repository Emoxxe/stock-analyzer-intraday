/**
 * Search API Routes
 */

import { Router } from 'express';
import { securityMaster } from '../services/securityMasterService.js';
import { yahooAdapter } from '../adapters/yahooAdapter.js';

const router = Router();

// GET /api/search/universe
router.get('/universe', (req, res) => {
  try {
    const all = [];
    for (const companyId of securityMaster.companies.keys()) {
      const full = securityMaster.getFullCompany(companyId);
      if (full) {
        all.push({
          id: full.id,
          name: full.legalName || full.displayName,
          primarySymbol: full.primarySymbol,
          isin: full.isin,
          sector: full.sector || 'Diversified',
          industry: full.industry || 'Conglomerates',
        });
      }
    }
    res.json({
      success: true,
      data: {
        total: all.length,
        companies: all,
      },
      total: all.length,
      companies: all,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to retrieve security universe',
    });
  }
});

// GET /api/search?q={query}
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.json({ success: true, count: 0, results: [] });
    }

    const query = q.trim();
    // 1. Search in local Security Master
    const localMatches = securityMaster.search(query, 10);
    const results = [...localMatches];
    const seenSymbols = new Set(
      localMatches.map(m => m.listings?.map(l => l.symbol)).flat().filter(Boolean)
    );

    // 2. Supplementary Discovery from Provider
    if (results.length < 10) {
      try {
        const remoteQuotes = await yahooAdapter.search(query);
        for (const rq of remoteQuotes) {
          if (!seenSymbols.has(rq.symbol)) {
            // Dynamically register new discovered security into Security Master
            const registered = securityMaster.registerSecurity({
              legalName: rq.name,
              displayName: rq.name,
              isin: null,
              nseSymbol: rq.exchange === 'NSE' ? rq.symbol : null,
              bseScripCode: rq.exchange === 'BSE' ? rq.symbol : null,
              sector: rq.sector,
              industry: rq.industry,
              source: rq.source,
            });

            results.push(securityMaster.getFullCompany(registered.id));
            seenSymbols.add(rq.symbol);
            if (results.length >= 15) break;
          }
        }
      } catch (err) {
        console.warn('[SearchRoute] Supplementary search warning:', err.message);
      }
    }

    // 3. Enrich results with lightweight live quotes (cached, non-blocking on failure)
    let quoteMap = {};
    try {
      const symbols = results.map(r => r.primarySymbol).filter(Boolean);
      if (symbols.length > 0) {
        quoteMap = await yahooAdapter.getQuotes(symbols);
      }
    } catch (err) {
      console.warn('[SearchRoute] Quote enrichment warning:', err.message);
    }

    const enriched = results.map((r) => {
      const q = quoteMap[r.primarySymbol] || {};
      return {
        id: r.id,
        name: r.legalName || r.displayName,
        displayName: r.displayName,
        primarySymbol: r.primarySymbol,
        isin: r.isin,
        sector: r.sector || 'Diversified',
        industry: r.industry || 'Conglomerates',
        exchange: q.exchange || r.listings?.[0]?.exchange || null,
        quote: Object.keys(q).length
          ? {
              price: q.price,
              previousClose: q.previousClose,
              change: q.change,
              changePercent: q.changePercent,
              currency: q.currency || 'INR',
              marketState: q.marketState || null,
              marketTime: q.marketTime || null,
              source: q.source || null,
            }
          : null,
      };
    });

    res.json({
      success: true,
      query,
      count: enriched.length,
      results: enriched,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Search failed',
    });
  }
});

export default router;
