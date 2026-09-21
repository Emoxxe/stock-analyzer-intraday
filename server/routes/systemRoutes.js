/**
 * System Health & Coverage Routes
 */

import { Router } from 'express';
import { securityMaster } from '../services/securityMasterService.js';
import { yahooAdapter } from '../adapters/yahooAdapter.js';
import { nseOfficialAdapter } from '../adapters/nseOfficialAdapter.js';
import { newsAdapter } from '../adapters/newsAdapter.js';
import { wikiAdapter } from '../adapters/wikiAdapter.js';
import { cacheService } from '../services/cacheService.js';

const router = Router();

// GET /api/system/health
router.get('/health', (req, res) => {
  try {
    const providers = {
      marketDataFallback: yahooAdapter.getHealth(),
      officialNSE: nseOfficialAdapter.getHealth(),
      news: newsAdapter.getHealth(),
      supplementaryWiki: wikiAdapter.getHealth(),
      cache: cacheService.getStats(),
    };

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Indian Company & Stock Intelligence API',
      version: '1.0.0',
      data: {
        providers,
        coverage: securityMaster.getCoverageStats(),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to retrieve system health',
    });
  }
});

// GET /api/system/provenance
router.get('/provenance', (req, res) => {
  try {
    res.json({
      success: true,
      policy: 'STRICT_ZERO_FAKE_DATA',
      description: 'All financial data is sourced from real-world providers or flagged as UNAVAILABLE.',
      providers: [
        {
          id: 'NSE_OFFICIAL',
          name: 'National Stock Exchange (NSE India)',
          role: 'Official Primary Feed (Standby / Production API Ready)',
          status: nseOfficialAdapter.getHealth().status,
          compliance: 'Zero unauthorized scraping policy. Ready for production API key.',
        },
        {
          id: 'YAHOO_FINANCE',
          name: 'Yahoo Finance Feed Adapter',
          role: 'Secondary Market & Fundamentals Fallback',
          status: yahooAdapter.getHealth().status,
          compliance: 'Real quotes and audited historical OHLCV series with active session crumb auth.',
        },
        {
          id: 'GOOGLE_NEWS_RSS',
          name: 'Google News RSS XML Parser',
          role: 'Authentic Financial News Feed',
          status: newsAdapter.getHealth().status,
          compliance: 'Genuine articles with verified publishers and external URLs.',
        },
        {
          id: 'WIKIPEDIA_API',
          name: 'Wikipedia REST API',
          role: 'Supplementary Corporate Overviews',
          status: wikiAdapter.getHealth().status,
          compliance: 'Reference summary and corporate background only.',
        },
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to retrieve provenance policy',
    });
  }
});

// GET /api/system/coverage
router.get('/coverage', (req, res) => {
  try {
    const stats = securityMaster.getCoverageStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to retrieve coverage statistics',
    });
  }
});

// GET /api/system/providers
router.get('/providers', (req, res) => {
  try {
    const providers = {
      marketDataFallback: yahooAdapter.getHealth(),
      officialNSE: nseOfficialAdapter.getHealth(),
      news: newsAdapter.getHealth(),
      supplementaryWiki: wikiAdapter.getHealth(),
      cache: cacheService.getStats(),
    };

    res.json({
      success: true,
      data: providers,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to retrieve provider health',
    });
  }
});

export default router;
