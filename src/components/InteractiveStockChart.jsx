/**
 * InteractiveStockChart — pure SVG price chart with real OHLCV series.
 * Line / candlestick, volume sub-pane, SMA-20 / EMA-50 / Bollinger toggles.
 * Restyled for the design system: segmented ranges, tabular numbers, skeleton loading.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { formatPriceCompact, formatSigned, formatShortDate } from '../utils/formatters';
import { glassCardStyle, panelHeaderStyle, panelTitleStyle, panelSubStyle, Segmented } from '../utils/ui.jsx';
import Skeleton from './Skeleton';
import FreshnessPill from './FreshnessPill';

const RANGES = [
  { id: '1d', label: '1D', interval: '5m' },
  { id: '5d', label: '5D', interval: '15m' },
  { id: '1mo', label: '1M', interval: '1d' },
  { id: '6mo', label: '6M', interval: '1d' },
  { id: 'ytd', label: 'YTD', interval: '1d' },
  { id: '1y', label: '1Y', interval: '1d' },
  { id: '5y', label: '5Y', interval: '1wk' },
  { id: 'max', label: 'MAX', interval: '1mo' },
];

const PADDING = { top: 18, right: 66, bottom: 26, left: 8 };

export default function InteractiveStockChart({ symbol = 'RELIANCE', currentPrice = null }) {
  const [rangeId, setRangeId] = useState('1y');
  const [chartType, setChartType] = useState('line');
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [hoverIndex, setHoverIndex] = useState(null);

  const containerRef = useRef(null);
  const [width, setWidth] = useState(900);

  const { data, loading, error } = useChartData(symbol, rangeId);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth || 900));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points = data?.points || [];

  const series = useMemo(() => computeSeries(points, chartType), [points, chartType]);

  const chartHeight = 360;
  const hasVolumePane = showVolume && chartType === 'line' && points.length > 0;
  const priceH = hasVolumePane ? chartHeight * 0.76 : chartHeight;
  const volH = chartHeight - priceH - 18;
  const volTop = PADDING.top + priceH + 18;

  const xToPx = useMemo(() => {
    const cw = Math.max(width - PADDING.left - PADDING.right, 80);
    return (i) => {
      const n = points.length;
      if (n <= 1) return PADDING.left;
      return PADDING.left + (i / (n - 1)) * cw;
    };
  }, [width, points.length]);

  const { yToPx, voltToPx, minPrice, maxPrice } = useMemo(() => {
    if (series.length === 0) return { yToPx: () => 0, voltToPx: () => 0, minPrice: 0, maxPrice: 1 };
    let lo = Infinity, hi = -Infinity, maxV = 1;
    for (const p of series) {
      if (p.low != null) lo = Math.min(lo, p.low);
      if (p.high != null) hi = Math.max(hi, p.high);
      if (p.volume != null) maxV = Math.max(maxV, p.volume);
    }
    if (!isFinite(lo)) lo = series[0].close;
    if (!isFinite(hi)) hi = series[0].close;
    const range = (hi - lo) || 1;
    const padRatio = 0.06;
    let loP = lo - range * padRatio;
    let hiP = hi + range * padRatio;
    if (currentPrice != null && currentPrice > hiP) {
      hiP = currentPrice + range * padRatio;
    }
    if (currentPrice != null && loP < 0) {
      loP = lo;
    }
    const r = (hiP - loP) || 1;
    const y2px = (v) => PADDING.top + priceH - ((v - loP) / r) * priceH;
    const v2px = (v) => {
      if (!v || maxV === 0) return volTop + volH;
      return volTop + volH - (v / maxV) * volH;
    };
    return { yToPx: y2px, voltToPx: v2px, minPrice: loP, maxPrice: hiP, maxVolume: maxV };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, priceH, volH, currentPrice]);

  const paths = useMemo(() => buildPaths(series, xToPx, yToPx, PADDING, priceH), [series, xToPx, yToPx, priceH]);

  const anchor = hoverIndex != null && series[hoverIndex] ? series[hoverIndex] : series[series.length - 1] || null;
  const isUp = (anchor?.close ?? 0) >= (anchor?.open ?? 0);
  const downDx = series.length > 1 ? (anchor?.close ?? 0) - (lastSeriesOpen(series) ?? 0) : null;

  const activePrice = anchor?.close;
  const activeDate = anchor?.time || anchor?.date;

  const stroke = isUp ? 'var(--positive)' : 'var(--negative)';
  const rangeLabel = RANGES.find((r) => r.id === rangeId)?.label || '';

  return (
    <div ref={containerRef} style={{ ...glassCardStyle, margin: 0 }}>
      <div style={{ ...panelHeaderStyle }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={panelTitleStyle}>Price History</span>
            <FreshnessPill status="HISTORICAL" size="small" />
          </div>
          <div style={panelSubStyle}>
            {points.length > 0 ? `${points.length} verified bars · ${rangeLabel}` : 'Real Yahoo Finance historical series'}
          </div>
        </div>
        <Segmented options={RANGES.map((r) => ({ value: r.id, label: r.label }))} value={rangeId} onChange={setRangeId} size="sm" />
      </div>

      {/* Value readout */}
      <div style={{ padding: 'var(--s3) var(--s4) 0', display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span className="tnum" style={{ fontSize: 'var(--fs-h2)', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
          {activePrice != null ? formatPriceCompact(activePrice) : '—'}
        </span>
        {activePrice != null && (
          <span className="tnum" style={{ fontSize: 'var(--num)', fontWeight: 600, color: isUp ? 'var(--positive-strong)' : 'var(--negative-strong)', fontFamily: 'var(--font-mono)' }}>
            {isUp ? '▲' : '▼'} {formatSigned(Math.abs(anchor.open != null ? (anchor.close - anchor.open) : 0))}
          </span>
        )}
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {activeDate ? formatShortDate(activeDate) : ''}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-disabled)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {chartType === 'candle' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <i style={{ width: 9, height: 9, background: 'var(--positive)', display: 'inline-block', borderRadius: 1 }} /> up
              <i style={{ width: 9, height: 9, background: 'var(--negative)', display: 'inline-block', borderRadius: 1 }} /> down
            </span>
          ) : null}
        </span>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: 'var(--s2) var(--s4) var(--s3)' }}>
        <div style={{ display: 'inline-flex', gap: 4, borderRadius: 'var(--r-md)', padding: 2, background: 'var(--surface-inset)', border: '1px solid var(--border)' }}>
          {[
            { id: 'line', label: 'Line', dot: false },
            { id: 'candle', label: 'Candles', dot: false },
          ].map((t) => {
            const active = chartType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setChartType(t.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: '4px',
                  background: active ? 'var(--surface-active)' : 'transparent',
                  border: active ? '1px solid var(--border-strong)' : '1px solid transparent',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <IndicatorToggle label="SMA 20" color="var(--warning)" active={showSMA} onChange={setShowSMA} />
          <IndicatorToggle label="EMA 50" color="var(--info)" active={showEMA} onChange={setShowEMA} />
          <IndicatorToggle label="Volume" color="var(--text-secondary)" active={showVolume} onChange={setShowVolume} />
        </div>
      </div>

      {/* Chart body */}
      {loading ? (
        <div style={{ padding: 'var(--s4)' }}>
          <Skeleton height={chartHeight} radius={6} />
        </div>
      ) : error ? (
        <div style={{ padding: 'var(--s4)', borderTop: '1px solid var(--border)' }}>
          <div style={{ ...glassCardStyle, padding: '36px', textAlign: 'center', background: 'var(--surface-inset)' }}>
            <div style={{ fontSize: 13, color: 'var(--negative-strong)' }}>Couldn't load chart data</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{error}</div>
          </div>
        </div>
      ) : series.length === 0 ? (
        <div style={{ padding: 'var(--s4)', borderTop: '1px solid var(--border)' }}>
          <div style={{ ...glassCardStyle, padding: '36px', textAlign: 'center', background: 'var(--surface-inset)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No historical data for this range</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Try a different range</div>
          </div>
        </div>
      ) : (
        <div
          style={{ position: 'relative', padding: `0 var(--s2) var(--s2)` }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const innerW = rect.width - PADDING.left - PADDING.right;
            const ratio = (e.clientX - rect.left - PADDING.left) / innerW;
            const idx = Math.round(Math.max(0, Math.min(1, ratio)) * (series.length - 1));
            setHoverIndex(idx);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <svg width="100%" height={chartHeight} role="img" aria-label={`${symbol} price chart ${rangeLabel}`}>
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
                <stop offset="100%" stopColor={stroke} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
              const y = PADDING.top + r * priceH;
              const price = maxPrice - r * (maxPrice - minPrice);
              return (
                <g key={i}>
                  <line x1={PADDING.left} y1={y} x2={width - PADDING.right} y2={y} stroke="var(--border)" strokeDasharray="3 4" />
                  <text x={width - PADDING.right + 6} y={y + 3.5} fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)" fontVariantNumeric="tabular-nums">
                    {formatCompactPrice(price)}
                  </text>
                </g>
              );
            })}
            {hasVolumePane && (
              <line x1={PADDING.left} y1={volTop} x2={width - PADDING.right} y2={volTop} stroke="var(--border)" strokeDasharray="3 4" />
            )}

            {/* volume */}
            {hasVolumePane &&
              series.map((p, i) => {
                const bw = Math.max(1, (width / series.length) * 0.65);
                const x = xToPx(i);
                const y = voltToPx(p.volume);
                const upC = p.close >= p.open;
                return <rect key={`v${i}`} x={x - bw / 2} y={y} width={bw} height={Math.max(1, volTop + volH - y)} fill={upC ? 'var(--positive-soft)' : 'var(--negative-soft)'} />;
              })}

            {/* price: line or candlesticks */}
            {chartType === 'line' ? (
              <>
                <path d={paths.area} fill="url(#chartFill)" />
                <path d={paths.line} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" />
              </>
            ) : (
              series.map((p, i) => {
                const x = xToPx(i);
                const cw = Math.max(1.5, (width / series.length) * 0.65);
                const upC = p.close >= p.open;
                const c = upC ? 'var(--positive)' : 'var(--negative)';
                const oy = yToPx(p.open);
                const cy = yToPx(p.close);
                const top = Math.min(oy, cy);
                const h = Math.max(1, Math.abs(oy - cy));
                return (
                  <g key={`c${i}`}>
                    <line x1={x} y1={yToPx(p.high)} x2={x} y2={yToPx(p.low)} stroke={c} strokeWidth="1" />
                    <rect x={x - cw / 2} y={top} width={cw} height={h} fill={c} />
                  </g>
                );
              })
            )}

            {/* SMA / EMA overlays (line mode only) */}
            {chartType === 'line' && showSMA && <path d={paths.sma} fill="none" stroke="var(--warning)" strokeWidth="1.25" strokeDasharray="4 3" />}
            {chartType === 'line' && showEMA && <path d={paths.ema} fill="none" stroke="var(--info)" strokeWidth="1.25" />}

            {/* crosshair */}
            {hoverIndex != null && anchor && (
              <g>
                <line x1={xToPx(hoverIndex)} y1={PADDING.top} x2={xToPx(hoverIndex)} y2={PADDING.top + priceH + (hasVolumePane ? 18 + volH : 0)} stroke="var(--border-strong)" strokeDasharray="2 3" />
                <circle cx={xToPx(hoverIndex)} cy={yToPx(anchor.close)} r="3.5" fill="var(--accent)" stroke="var(--bg)" strokeWidth="1.5" />
              </g>
            )}
          </svg>
        </div>
      )}

      {/* footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px var(--s4)', borderTop: '1px solid var(--border)', fontSize: 10.5, color: 'var(--text-disabled)' }}>
        <span>Yahoo Finance · real OHLCV series</span>
        <span className="tnum">{points.length} bars</span>
      </div>
    </div>
  );
}

/* ---------- small helpers ---------- */

function lastSeriesOpen(series) {
  if (series.length === 0) return null;
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].open != null) return series[i].open;
  }
  return null;
}

function formatCompactPrice(v) {
  if (v == null) return '—';
  if (Math.abs(v) >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`;
  if (Math.abs(v) >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toFixed(1);
}

/** Compute SMA/EMA + prepped points once per data+type change. */
function computeSeries(points, chartType) {
  if (!points || points.length === 0) return [];
  const closes = points.map((p) => p.close);
  const sma = smaOf(closes, 20);
  const ema = emaOf(closes, 50);
  return points.map((p, i) => ({
    ...p,
    sma: sma[i],
    ema: ema[i],
    anchor: chartType === 'candle' ? p.close : p.close,
  }));
}

function smaOf(values, n) {
  const out = Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= n) sum -= values[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}

function emaOf(values, n) {
  const out = Array(values.length).fill(null);
  if (values.length < n) return out;
  const k = 2 / (n + 1);
  let prev = values.slice(0, n).reduce((a, b) => a + b, 0) / n;
  out[n - 1] = prev;
  for (let i = n; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** Precompute all SVG path d-strings. */
function buildPaths(series, xToPx, yToPx, pad, priceH) {
  if (series.length === 0) return { line: '', area: '', sma: '', ema: '' };
  const linePts = [];
  const smaPts = [];
  const emaPts = [];
  for (let i = 0; i < series.length; i++) {
    const p = series[i];
    if (p.close != null) linePts.push(`${xToPx(i).toFixed(1)} ${yToPx(p.close).toFixed(1)}`);
    if (p.sma != null) smaPts.push(`${xToPx(i).toFixed(1)} ${yToPx(p.sma).toFixed(1)}`);
    if (p.ema != null) emaPts.push(`${xToPx(i).toFixed(1)} ${yToPx(p.ema).toFixed(1)}`);
  }
  const line = linePts.length ? `M ${linePts.join(' L ')}` : '';
  const base = (pad.top + priceH).toFixed(1);
  const area = linePts.length ? `${line} L ${xToPx(series.length - 1).toFixed(1)} ${base} L ${xToPx(0).toFixed(1)} ${base} Z` : '';
  return {
    line,
    area,
    sma: smaPts.length ? `M ${smaPts.join(' L ')}` : '',
    ema: emaPts.length ? `M ${emaPts.join(' L ')}` : '',
  };
}

/** Fetch with tiny cache (charts cache server-side already). */
function useChartData(symbol, rangeId) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const { id, interval } = RANGES.find((r) => r.id === rangeId) || RANGES[5];
  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fetch(`/api/company/${encodeURIComponent(symbol)}/chart?range=${id}&interval=${interval}`, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setState({ loading: false, error: null, data: json.data || json }))
      .catch((e) => {
        if (e.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error: e.message }));
      });
    return () => ctrl.abort();
  }, [symbol, id, interval]);
  return state;
}

/** Small toggle chip for indicators. */
function IndicatorToggle({ label, color, active, onChange }) {
  return (
    <label
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 9px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
        background: active ? 'var(--surface-hover)' : 'transparent',
        border: active ? `1px solid ${color}55` : '1px solid transparent',
      }}
    >
      <input type="checkbox" checked={active} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: color, width: 11, height: 11, margin: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--text)' : 'var(--text-muted)' }}>{label}</span>
    </label>
  );
}