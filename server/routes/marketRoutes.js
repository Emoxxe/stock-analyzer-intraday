/**
 * Market API Routes
 */

import { Router } from 'express';
import { marketService } from '../services/marketService.js';

const router = Router();

// GET /api/market/indices
router.get('/indices', async (req, res) => {
  try {
    const indices = await marketService.getIndices();
    res.json({ success: true, data: indices });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Market indices unavailable',
      quality: 'PROVIDER_ERROR',
    });
  }
});

// GET /api/market/movers
router.get('/movers', async (req, res) => {
  try {
    const { universe = 'NIFTY50' } = req.query;
    const movers = await marketService.getMovers(universe);
    res.json({ success: true, data: movers });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Market movers unavailable',
      quality: 'PROVIDER_ERROR',
    });
  }
});

// GET /api/market/status
router.get('/status', (req, res) => {
  try {
    const status = marketService.getTradingStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Trading status calculation failed',
    });
  }
});

export default router;
