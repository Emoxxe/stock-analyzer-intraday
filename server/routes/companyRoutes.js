/**
 * Company API Routes
 */

import { Router } from 'express';
import { companyService } from '../services/companyService.js';
import { newsAdapter } from '../adapters/newsAdapter.js';

const router = Router();

// GET /api/company/:symbol
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const profile = await companyService.getCompanyProfile(symbol);
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err.message || 'Company not found',
      quality: 'UNAVAILABLE',
    });
  }
});

// GET /api/company/:symbol/chart
router.get('/:symbol/chart', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { range = '1mo', interval = '1d' } = req.query;
    const chart = await companyService.getCompanyChart(symbol, range, interval);
    res.json({ success: true, data: chart });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err.message || 'Historical chart data unavailable',
      quality: 'UNAVAILABLE',
    });
  }
});

// GET /api/company/:symbol/news
router.get('/:symbol/news', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { name } = req.query;
    const news = await newsAdapter.getCompanyNews(name || symbol, symbol);
    res.json({ success: true, data: news });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'News service unavailable',
      quality: 'UNAVAILABLE',
    });
  }
});

// GET /api/company/:symbol/provenance
router.get('/:symbol/provenance', async (req, res) => {
  try {
    const { symbol } = req.params;
    const profile = await companyService.getCompanyProfile(symbol);
    res.json({ success: true, data: profile.provenance });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err.message || 'Provenance unavailable',
      quality: 'UNAVAILABLE',
    });
  }
});

// GET /api/company/:symbol/trace
router.get('/:symbol/trace', async (req, res) => {
  try {
    const { symbol } = req.params;
    const profile = await companyService.getCompanyProfile(symbol);
    res.json({ success: true, data: profile.trace });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err.message || 'Trace unavailable',
      quality: 'UNAVAILABLE',
    });
  }
});

export default router;
