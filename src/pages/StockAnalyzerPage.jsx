import { useState, useEffect } from 'react';
import { getLiveStockQuote, getMarketWatchlist, generateCandles, computeTechnicalIndicators } from '../services/stockApi';
import './StockAnalyzerPage.css';

const QUICK_TICKERS = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'BTC', 'ETH', 'SOL'];
const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y'];

export default function StockAnalyzerPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('NVDA');
  const [searchInput, setSearchInput] = useState('');
  const [timeframe, setTimeframe] = useState('1M');
  const [chartType, setChartType] = useState('area'); // 'area' | 'candles'
  const [showIndicators, setShowIndicators] = useState({ sma: true, bollinger: false, volume: true });

  const [quote, setQuote] = useState(null);
  const [candles, setCandles] = useState([]);
  const [technicals, setTechnicals] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Position Calculator State
  const [calcInvestment, setCalcInvestment] = useState(1000);
  const [calcTargetPrice, setCalcTargetPrice] = useState(150);

  const loadStockData = async (symbolToLoad, force = false) => {
    const sym = (symbolToLoad || selectedSymbol).toUpperCase();
    if (force) setSyncing(true);
    else setLoading(true);

    try {
      const res = await getLiveStockQuote(sym, force);
      setQuote(res.data);
      const generated = generateCandles(sym, res.data.price, timeframe);
      setCandles(generated);
      const tech = computeTechnicalIndicators(generated);
      setTechnicals(tech || res.data.technicals);
      setCalcTargetPrice(Math.round(res.data.price * 1.15 * 100) / 100);
    } catch (err) {
      console.error('Failed to load stock data:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadStockData(selectedSymbol, false);
    getMarketWatchlist().then(setWatchlist);
  }, [selectedSymbol]);

  useEffect(() => {
    if (quote) {
      const generated = generateCandles(selectedSymbol, quote.price, timeframe);
      setCandles(generated);
      setTechnicals(computeTechnicalIndicators(generated) || quote.technicals);
    }
  }, [timeframe]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const sym = searchInput.trim().toUpperCase();
    setSelectedSymbol(sym);
    setSearchInput('');
  };

  // SVG Chart Calculations
  const renderChart = () => {
    if (!candles || candles.length === 0) return null;

    const width = 800;
    const height = 320;
    const padding = { top: 20, right: 30, bottom: 40, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);

    const minP = Math.min(...lows) * 0.995;
    const maxP = Math.max(...highs) * 1.005;
    const maxVol = Math.max(...volumes);

    const getX = (idx) => padding.left + (idx / (candles.length - 1)) * chartW;
    const getY = (val) => padding.top + chartH - ((val - minP) / (maxP - minP || 1)) * chartH;

    const isPositive = quote && quote.change24h >= 0;
    const strokeColor = isPositive ? '#00ff88' : '#fd4556';

    const pathD = candles.reduce((acc, c, idx) => {
      const x = getX(idx);
      const y = getY(c.close);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');

    const areaD = `${pathD} L ${getX(candles.length - 1)} ${padding.top + chartH} L ${getX(0)} ${padding.top + chartH} Z`;

    let sma20Path = '';
    if (showIndicators.sma && technicals) {
      sma20Path = candles.reduce((acc, _, idx) => {
        if (idx < 5) return '';
        const slice = candles.slice(Math.max(0, idx - 10), idx + 1);
        const avg = slice.reduce((sum, item) => sum + item.close, 0) / slice.length;
        const x = getX(idx);
        const y = getY(avg);
        return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
      }, '');
    }

    return (
      <svg className="stock-svg-chart" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="stockAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartH * ratio;
          const priceLabel = (maxP - ratio * (maxP - minP)).toFixed(2);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={y + 4} fill="#888" fontSize="10" textAnchor="end" fontFamily="monospace">${priceLabel}</text>
            </g>
          );
        })}

        {/* Volume Bars */}
        {showIndicators.volume && candles.map((c, idx) => {
          const x = getX(idx);
          const barW = Math.max(2, (chartW / candles.length) - 2);
          const barH = (c.volume / (maxVol || 1)) * (chartH * 0.25);
          const y = padding.top + chartH - barH;
          const barColor = c.close >= c.open ? 'rgba(0, 255, 136, 0.2)' : 'rgba(253, 69, 86, 0.2)';
          return (
            <rect key={`vol-${idx}`} x={x - barW / 2} y={y} width={barW} height={barH} fill={barColor} />
          );
        })}

        {/* Area View */}
        {chartType === 'area' && (
          <>
            <path d={areaD} fill="url(#stockAreaGrad)" />
            <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {/* Candlestick View */}
        {chartType === 'candles' && candles.map((c, idx) => {
          const x = getX(idx);
          const candleW = Math.max(3, (chartW / candles.length) - 3);
          const yOpen = getY(c.open);
          const yClose = getY(c.close);
          const yHigh = getY(c.high);
          const yLow = getY(c.low);
          const isGreen = c.close >= c.open;
          const color = isGreen ? '#00ff88' : '#fd4556';
          const top = Math.min(yOpen, yClose);
          const bodyH = Math.max(2, Math.abs(yClose - yOpen));

          return (
            <g key={`candle-${idx}`}>
              <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.2" />
              <rect x={x - candleW / 2} y={top} width={candleW} height={bodyH} fill={color} rx="1" />
            </g>
          );
        })}

        {/* SMA 20 Overlay Line */}
        {showIndicators.sma && sma20Path && (
          <path d={sma20Path} fill="none" stroke="#7c5cff" strokeWidth="2" strokeDasharray="4 2" />
        )}

        {/* Bollinger Upper / Lower Levels */}
        {showIndicators.bollinger && technicals && (
          <>
            <line x1={padding.left} y1={getY(technicals.bbUpper)} x2={width - padding.right} y2={getY(technicals.bbUpper)} stroke="#00d9ff" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
            <line x1={padding.left} y1={getY(technicals.bbLower)} x2={width - padding.right} y2={getY(technicals.bbLower)} stroke="#00d9ff" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
          </>
        )}

        {/* X Axis Time Labels */}
        {candles.filter((_, idx) => idx % Math.ceil(candles.length / 6) === 0).map((c, idx) => {
          const origIndex = candles.indexOf(c);
          const x = getX(origIndex);
          return (
            <text key={`x-${idx}`} x={x} y={height - 12} fill="#777" fontSize="10" textAnchor="middle" fontFamily="monospace">
              {c.time}
            </text>
          );
        })}
      </svg>
    );
  };

  const calcShares = quote ? (calcInvestment / quote.price) : 0;
  const calcProjectedValue = calcShares * calcTargetPrice;
  const calcProfitAmount = calcProjectedValue - calcInvestment;
  const calcRoiPercent = calcInvestment > 0 ? (calcProfitAmount / calcInvestment) * 100 : 0;

  return (
    <div className="stock-analyzer-page">
      {/* Live Marquee Ticker */}
      <div className="market-marquee-bar">
        <div className="marquee-track">
          {[...watchlist, ...watchlist].map((item, idx) => (
            <button
              key={`${item.symbol}-${idx}`}
              className="marquee-item"
              onClick={() => setSelectedSymbol(item.symbol)}
            >
              <span className="m-symbol">{item.symbol}</span>
              <span className="m-price">${item.price.toFixed(2)}</span>
              <span className={`m-change ${item.change24h >= 0 ? 'pos' : 'neg'}`}>
                {item.change24h >= 0 ? '+' : ''}{item.change24h}%
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="container">
        {/* Header Bar */}
        <div className="stock-hero-header">
          <div className="stock-hero-left">
            <div className="stock-badge">
              <span className="live-pulse" />
              <span>LIVE FINANCIAL TELEMETRY • AI SIGNALS ENGINE</span>
            </div>
            <h1 className="stock-main-title">
              Real-Time <span className="text-grad">Stock & Crypto Analyzer</span>
            </h1>
            <p className="stock-subtitle">
              Live algorithmic momentum analysis, RSI-14 oscillators, Bollinger volatility channels, and automated trade entry/exit target calculations.
            </p>
          </div>

          <div className="stock-search-wrap">
            <form onSubmit={handleSearch} className="stock-search-form">
              <span className="search-ico">🔍</span>
              <input
                type="text"
                placeholder="Search Ticker (e.g. NVDA, AAPL, BTC, TSLA)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="stock-search-input"
              />
              <button type="submit" className="btn-search-stock">Analyze</button>
            </form>

            <div className="quick-tickers">
              <span className="quick-label">Hot Tickers:</span>
              {QUICK_TICKERS.map(sym => (
                <button
                  key={sym}
                  className={`ticker-chip ${selectedSymbol === sym ? 'is-active' : ''}`}
                  onClick={() => setSelectedSymbol(sym)}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state-card">
            <div className="spinner-ring" />
            <p>Fetching real-time market data & computing technical momentum indicators...</p>
          </div>
        ) : quote && (
          <div className="stock-grid-main">
            {/* Main Interactive Chart Section */}
            <div className="chart-card-container">
              {/* Asset Hero Meta Header */}
              <div className="asset-meta-header">
                <div className="asset-main-info">
                  <div className="asset-name-row">
                    <span className="asset-type-tag">{quote.type.toUpperCase()}</span>
                    <h2 className="asset-symbol">{quote.symbol}</h2>
                    <span className="asset-full-name">{quote.name}</span>
                  </div>
                  <div className="asset-price-row">
                    <span className="asset-current-price">${quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className={`asset-change-pill ${quote.change24h >= 0 ? 'is-positive' : 'is-negative'}`}>
                      {quote.change24h >= 0 ? '▲ +' : '▼ '}{quote.change24h}% (${quote.changeAmount >= 0 ? '+' : ''}{quote.changeAmount})
                    </span>
                  </div>
                </div>

                <div className="chart-actions-bar">
                  <div className="timeframe-buttons">
                    {TIMEFRAMES.map(tf => (
                      <button
                        key={tf}
                        className={`tf-btn ${timeframe === tf ? 'is-active' : ''}`}
                        onClick={() => setTimeframe(tf)}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>

                  <div className="chart-view-toggle">
                    <button
                      className={`view-btn ${chartType === 'area' ? 'is-active' : ''}`}
                      onClick={() => setChartType('area')}
                      title="Line / Area Chart"
                    >
                      📈 Line
                    </button>
                    <button
                      className={`view-btn ${chartType === 'candles' ? 'is-active' : ''}`}
                      onClick={() => setChartType('candles')}
                      title="Candlestick Chart"
                    >
                      📊 Candles
                    </button>
                  </div>

                  <button
                    className="btn-sync-stock"
                    onClick={() => loadStockData(selectedSymbol, true)}
                    disabled={syncing}
                  >
                    {syncing ? '🔄 Syncing...' : '🔄 Re-Fetch Live Quote'}
                  </button>
                </div>
              </div>

              {/* Indicator Controls */}
              <div className="indicators-toolbar">
                <span className="indicator-label">Overlays:</span>
                <label className="indicator-toggle">
                  <input
                    type="checkbox"
                    checked={showIndicators.sma}
                    onChange={(e) => setShowIndicators(p => ({ ...p, sma: e.target.checked }))}
                  />
                  <span>SMA-20 (Trend)</span>
                </label>
                <label className="indicator-toggle">
                  <input
                    type="checkbox"
                    checked={showIndicators.bollinger}
                    onChange={(e) => setShowIndicators(p => ({ ...p, bollinger: e.target.checked }))}
                  />
                  <span>Bollinger Bands</span>
                </label>
                <label className="indicator-toggle">
                  <input
                    type="checkbox"
                    checked={showIndicators.volume}
                    onChange={(e) => setShowIndicators(p => ({ ...p, volume: e.target.checked }))}
                  />
                  <span>Volume Histogram</span>
                </label>
              </div>

              {/* The SVG Live Chart */}
              <div className="chart-render-wrapper">
                {renderChart()}
              </div>

              {/* Financial Fundamentals Bar */}
              <div className="fundamentals-grid">
                <div className="fund-box">
                  <span className="fund-label">Market Capitalization</span>
                  <span className="fund-val">{quote.mktCap}</span>
                </div>
                <div className="fund-box">
                  <span className="fund-label">P/E Valuation Ratio</span>
                  <span className="fund-val">{quote.pe}</span>
                </div>
                <div className="fund-box">
                  <span className="fund-label">52-Week Range</span>
                  <span className="fund-val">{quote.range52}</span>
                </div>
                <div className="fund-box">
                  <span className="fund-label">24H Trading Volume</span>
                  <span className="fund-val">{quote.volume24h}</span>
                </div>
              </div>
            </div>

            {/* Sidebar: AI Technical Intelligence & Trade Signals */}
            <div className="stock-sidebar">
              {/* Verdict Card */}
              {technicals && (
                <div className="ai-verdict-card">
                  <div className="verdict-header">
                    <span className="verdict-tag">AI ALGORITHMIC RATING</span>
                    <span className="confidence-pill">{technicals.confidence}% Confidence</span>
                  </div>

                  <div className="verdict-main" style={{ borderColor: technicals.signalColor }}>
                    <div className="verdict-title" style={{ color: technicals.signalColor }}>
                      {technicals.verdict}
                    </div>
                    <p className="verdict-desc">
                      Aggregated telemetry based on 14-period momentum, moving average crosses, and price channel breakouts.
                    </p>
                  </div>

                  {/* Indicator Gauges */}
                  <div className="gauges-list">
                    {/* RSI */}
                    <div className="gauge-item">
                      <div className="gauge-label-row">
                        <span className="g-title">RSI (14-Period)</span>
                        <span className={`g-val ${technicals.rsi > 70 ? 'neg' : technicals.rsi < 35 ? 'pos' : ''}`}>
                          {technicals.rsi} ({technicals.rsi > 70 ? 'Overbought' : technicals.rsi < 35 ? 'Oversold' : 'Neutral'})
                        </span>
                      </div>
                      <div className="gauge-bar-bg">
                        <div className="gauge-bar-fill" style={{ width: `${Math.min(100, Math.max(0, technicals.rsi))}%`, backgroundColor: technicals.rsi > 70 ? '#fd4556' : technicals.rsi < 35 ? '#00ff88' : '#7c5cff' }} />
                      </div>
                    </div>

                    {/* MACD */}
                    <div className="gauge-item">
                      <div className="gauge-label-row">
                        <span className="g-title">MACD Histogram</span>
                        <span className={`g-val ${technicals.macd.histogram >= 0 ? 'pos' : 'neg'}`}>
                          {technicals.macd.histogram >= 0 ? '+' : ''}{technicals.macd.histogram} ({technicals.macd.histogram >= 0 ? 'Bullish' : 'Bearish'})
                        </span>
                      </div>
                      <div className="gauge-bar-bg">
                        <div className="gauge-bar-fill" style={{ width: `${Math.min(100, Math.max(10, Math.abs(technicals.macd.histogram) * 30))}%`, backgroundColor: technicals.macd.histogram >= 0 ? '#00ff88' : '#fd4556' }} />
                      </div>
                    </div>

                    {/* SMA Cross */}
                    <div className="gauge-item">
                      <div className="gauge-label-row">
                        <span className="g-title">SMA 20 vs Price</span>
                        <span className={`g-val ${quote.price >= technicals.sma20 ? 'pos' : 'neg'}`}>
                          ${technicals.sma20} ({quote.price >= technicals.sma20 ? 'Above SMA' : 'Below SMA'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Key Levels */}
                  <div className="key-levels-box">
                    <div className="level-item">
                      <span className="level-lbl">Key Support:</span>
                      <span className="level-num text-green">${technicals.support}</span>
                    </div>
                    <div className="level-item">
                      <span className="level-lbl">Target Take-Profit:</span>
                      <span className="level-num text-blue">${technicals.targetPrice}</span>
                    </div>
                    <div className="level-item">
                      <span className="level-lbl">Key Resistance:</span>
                      <span className="level-num text-red">${technicals.resistance}</span>
                    </div>
                    <div className="level-item">
                      <span className="level-lbl">Recommended Stop:</span>
                      <span className="level-num text-red">${technicals.stopLoss}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Position ROI & Profit Calculator */}
              <div className="position-calc-card">
                <h3 className="calc-title">💡 Trade & ROI Simulator</h3>
                <div className="calc-inputs">
                  <div className="calc-field">
                    <label>Position Capital ($):</label>
                    <input
                      type="number"
                      value={calcInvestment}
                      onChange={(e) => setCalcInvestment(Math.max(1, Number(e.target.value)))}
                      className="calc-input"
                    />
                  </div>
                  <div className="calc-field">
                    <label>Target Sell Price ($):</label>
                    <input
                      type="number"
                      value={calcTargetPrice}
                      onChange={(e) => setCalcTargetPrice(Math.max(0.1, Number(e.target.value)))}
                      className="calc-input"
                    />
                  </div>
                </div>

                <div className="calc-results-box">
                  <div className="calc-res-row">
                    <span>Shares / Units:</span>
                    <strong>{calcShares.toFixed(3)}</strong>
                  </div>
                  <div className="calc-res-row">
                    <span>Estimated Total Return:</span>
                    <strong>${calcProjectedValue.toFixed(2)}</strong>
                  </div>
                  <div className="calc-res-row profit-row">
                    <span>Projected Profit:</span>
                    <strong className={calcProfitAmount >= 0 ? 'text-green' : 'text-red'}>
                      {calcProfitAmount >= 0 ? '+$' : '-$'}{Math.abs(calcProfitAmount).toFixed(2)} ({calcRoiPercent.toFixed(1)}%)
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Market Watchlist Table */}
        <div className="watchlist-section">
          <h3 className="watchlist-title">🌐 Live Market Equities & Crypto Watchlist</h3>
          <div className="watchlist-table-wrap">
            <table className="watchlist-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Sector</th>
                  <th>Live Price</th>
                  <th>24H Change</th>
                  <th>Market Cap</th>
                  <th>P/E Ratio</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item) => (
                  <tr
                    key={item.symbol}
                    className={selectedSymbol === item.symbol ? 'selected-row' : ''}
                    onClick={() => setSelectedSymbol(item.symbol)}
                  >
                    <td>
                      <div className="table-asset-col">
                        <span className="table-sym">{item.symbol}</span>
                        <span className="table-name">{item.name}</span>
                      </div>
                    </td>
                    <td><span className="sector-tag">{item.sector}</span></td>
                    <td><strong>${item.price.toFixed(2)}</strong></td>
                    <td>
                      <span className={`table-change ${item.change24h >= 0 ? 'pos' : 'neg'}`}>
                        {item.change24h >= 0 ? '+' : ''}{item.change24h}%
                      </span>
                    </td>
                    <td>{item.mktCap}</td>
                    <td>{item.pe}</td>
                    <td>
                      <button
                        className="btn-table-analyze"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSymbol(item.symbol);
                        }}
                      >
                        Inspect Chart →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
