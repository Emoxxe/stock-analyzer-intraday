/**
 * Intraday Scanner API Routes
 * Provides real-time technical analysis for intraday trading setups.
 */

import { Router } from 'express';
import { intradayService } from '../services/intradayService.js';

const router = Router();

// GET /api/intraday/scan?universe=NIFTY50
router.get('/scan', async (req, res) => {
  try {
    const { universe = 'NIFTY50' } = req.query;
    const scan = await intradayService.scanUniverse(universe);
    res.json({ success: true, data: scan });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Intraday scan failed',
      quality: 'PROVIDER_ERROR',
    });
  }
});

// GET /api/intraday/stock/:symbol - Detailed analysis for one stock
router.get('/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const regime = await intradayService.getMarketRegime();
    const analysis = await intradayService.analyzeStock(symbol.toUpperCase(), regime);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Insufficient intraday data for this symbol',
        quality: 'UNAVAILABLE',
      });
    }
    res.json({ success: true, data: analysis });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Stock analysis failed',
      quality: 'PROVIDER_ERROR',
    });
  }
});

export default router;