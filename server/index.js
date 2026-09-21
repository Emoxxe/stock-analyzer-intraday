/**
 * Express Server Entry Point
 * Production-Grade Indian Company & Stock Intelligence Platform Backend
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import companyRoutes from './routes/companyRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import intradayRoutes from './routes/intradayRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// Serve static frontend assets from Vite build in production
app.use(express.static(distPath));

// API Routes
app.use('/api/company', companyRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/intraday', intradayRoutes);

// Root Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Indian Company & Stock Intelligence API',
    version: '1.0.0',
  });
});

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route ${req.method} ${req.originalUrl} not found`,
    quality: 'UNAVAILABLE',
  });
});

// Single Page Application (SPA) fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    quality: 'PROVIDER_ERROR',
  });
});

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` 🚀 Indian Stock Intelligence Backend running on :${PORT}`);
  console.log(` 🇮🇳 Market Hours: 09:15 - 15:30 IST (Mon - Fri)`);
  console.log(` 🛡️  Policy: ZERO FAKE DATA & Strict Normalization`);
  console.log(`=======================================================`);
});

server.on('error', (err) => {
  console.error(`[Server Listen Error] Port ${PORT} error:`, err.message);
});

export default app;
export { server };
