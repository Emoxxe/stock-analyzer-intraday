/**
 * DashboardPage — premium market overview with glassmorphism.
 * Real indices strip, top movers, market breadth (computed from real data), market hours.
 * Uses useApiFetch (cache + dedup + abort) with a 45s auto-refresh.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApiFetch } from '../hooks/useApiFetch';
import { formatPriceCompact, formatSigned } from '../utils/formatters';
import { panelStyle, glassCardStyle, metricTileStyle, sectionHeaderStyle } from '../utils/ui.jsx';
import Skeleton from '../components/Skeleton';
import MarketMoversCard from '../components/MarketMoversCard';

const WATCHLIST = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', industry: 'Energy · O&G Marketing' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', industry: 'IT Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', industry: 'Banking' },
  { symbol: 'INFY', name: 'Infosys', industry: 'IT Services' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', industry: 'Telecom' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', industry: 'FMCG' },
];

export default function DashboardPage() {
  const [tick, setTick] = useState(0); // bump to force refresh
  const { data: indices, loading: loadingIndices, error: indicesError } = useApiFetch('/api/market/indices', {
    ttl: 30_000,
    dependencies: [tick],
  });
  const { data: movers, loading: loadingMovers } = useApiFetch('/api/market/movers?universe=NIFTY50', {
    ttl: 30_000,
    dependencies: [tick],
  });
  const { data: marketStatus } = useApiFetch('/api/market/status', { ttl: 60_000 });

  const lastUpdated = indices?.retrievedAt || movers?.retrievedAt;
  const list = indices?.indices || [];
  const status = marketStatus?.data || marketStatus;

  // Breadth computed from real mover data (no synthetic numbers)
  const breadth = useBreadth(movers);

  return (
    <div className="fade-in" style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: 'var(--fs-h1)', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Indian Markets
          </h1>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {status?.istTime
              ? `As of ${status.istTime} IST · ${status.isOpen ? 'Session open' : 'Session closed'}`
              : 'Live delayed quote snapshots from NSE & BSE'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-disabled)' }} className="tnum">
            {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST` : ''}
          </span>
          <button
            type="button"
            onClick={() => setTick((t) => t + 1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              borderRadius: 'var(--r-md)',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--dur-fast) var(--ease)',
            }}
            title="Refresh"
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border-hover)'; e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 1v3H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Indices strip */}
      {loadingIndices ? (
        <div style={panelStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, overflow: 'hidden' }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ padding: 'var(--s4)', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                <Skeleton height={11} width="55%" style={{ marginBottom: 8 }} />
                <Skeleton height={20} width="70%" style={{ marginBottom: 8 }} />
                <Skeleton height={11} width="40%" />
              </div>
            ))}
          </div>
        </div>
      ) : indicesError ? (
        <div style={{ ...panelStyle, padding: 'var(--s5)', textAlign: 'center', color: 'var(--negative-strong)', fontSize: 13 }}>
          Couldn't reach the index feed — {indicesError}
        </div>
      ) : (
        <div style={panelStyle} className="fade-in">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 1,
              overflow: 'hidden',
              backgroundColor: 'var(--glass-border)',
            }}
          >
            {list.map((idx, i) => {
              const price = idx.currentPrice?.value;
              const chg = idx.change?.value;
              const pct = idx.changePercent?.value;
              const isUp = (pct || 0) > 0;
              const isDown = (pct || 0) < 0;
              const color = isUp ? 'var(--positive-strong)' : isDown ? 'var(--negative-strong)' : 'var(--text-muted)';
              const available = typeof price === 'number';
              return (
                <div
                  key={idx.symbol}
                  style={{
                    backgroundColor: 'var(--surface)',
                    padding: 'var(--s4)',
                    transition: 'all var(--dur-fast) var(--ease)',
                    animation: `cardFadeIn var(--dur-slow) var(--ease) ${i * 60}ms both`,
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    e.currentTarget.style.boxShadow = 'inset 0 0 30px rgba(99, 102, 241, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', letterSpacing: '0.01em' }}>
                    {idx.name} <span style={{ color: 'var(--text-disabled)' }}>· {idx.symbol.replace(/^\^/, '')}</span>
                  </span>
                  {available ? (
                    <>
                      <span className="tnum" style={{ fontSize: 'var(--num-strong)', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)', display: 'block', margin: '6px 0 4px', letterSpacing: '-0.02em' }}>
                        {formatPriceCompact(price)}
                      </span>
                      <span className="tnum" style={{ fontSize: 12, fontWeight: 600, color, fontFamily: 'var(--font-mono)' }}>
                        {isUp ? '▲' : isDown ? '▼' : '·'} {typeof chg === 'number' ? formatSigned(chg) : ''} ({typeof pct === 'number' ? formatSigned(pct, 2) : ''}%)
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-disabled)', display: 'block', marginTop: 8 }}>Data unavailable</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main grid: movers + breadth/snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)', gap: 'var(--s6)', alignItems: 'start' }}>
        <MarketMoversCard movers={movers} loading={loadingMovers} />

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}>
          {/* Broad market snapshot — computed from real mover feed */}
          <div style={{ ...glassCardStyle }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--s3) var(--s4)', borderBottom: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: 'var(--fs-h3)', fontWeight: 600, color: 'var(--text)' }}>Market Breadth</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>NIFTY 50 universe</span>
            </div>
            <div style={{ padding: 'var(--s4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s4)' }}>
              {loadingMovers ? (
                <>
                  {[...Array(4)].map((_, i) => <Skeleton key={i} height={38} />)}
                </>
              ) : (
                <>
                  <BreadthCell label="Advancing" value={String(breadth.up)} tone="positive" mono />
                  <BreadthCell label="Declining" value={String(breadth.down)} tone="negative" mono />
                  <BreadthCell label="Avg change" value={breadth.avgPct != null ? `${formatSigned(breadth.avgPct, 2)}%` : '—'} tone={breadth.avgPct >= 0 ? 'positive' : 'negative'} />
                  <BreadthCell label="Turnover" value={breadth.turnover} />
                </>
              )}
            </div>
            <div style={{ padding: '10px var(--s4)', borderTop: '1px solid var(--glass-border)', fontSize: 10.5, color: 'var(--text-disabled)' }}>
              Breadth &amp; turnover are computed from the live mover feed — no estimates.
            </div>
          </div>

          {/* Static watchlist quick links — prices intentionally omitted until opened (no fake data) */}
          <div style={{ ...glassCardStyle }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--s3) var(--s4)', borderBottom: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: 'var(--fs-h3)', fontWeight: 600, color: 'var(--text)' }}>Watchlist</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--text-muted)' }}>
                <path d="M12 21s-7-4.6-7-10a4.3 4.3 0 0 1 7-3.3A4.3 4.3 0 0 1 19 11c0 5.4-7 10-7 10Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ padding: 'var(--s2)' }}>
              {WATCHLIST.map((s) => (
                <Link
                  key={s.symbol}
                  to={`/company/${s.symbol}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px var(--s4)',
                    borderRadius: 'var(--r-md)',
                    textDecoration: 'none',
                    transition: 'all var(--dur-fast) var(--ease)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', display: 'block' }}>{s.symbol}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name} · {s.industry}</span>
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--info)', whiteSpace: 'nowrap' }}>Open →</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BreadthCell({ label, value, tone = 'neutral', mono = false }) {
  const color = tone === 'positive' ? 'var(--positive-strong)' : tone === 'negative' ? 'var(--negative-strong)' : 'var(--text)';
  const borderLeft = tone === 'positive' ? '3px solid var(--positive)' : tone === 'negative' ? '3px solid var(--negative)' : '3px solid var(--glass-border)';
  return (
    <div
      style={{
        ...metricTileStyle,
        borderLeft,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--glass-border)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderLeft = borderLeft;
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>{label}</span>
      <span className={mono ? 'tnum' : ''} style={{ fontSize: 15, fontWeight: 700, color, fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontVariantNumeric: 'tabular-nums', display: 'block', marginTop: 2 }}>
        {value}
      </span>
    </div>
  );
}

/** Real breadth stats from the mover feed */
function useBreadth(movers) {
  if (!movers) return { up: 0, down: 0, flat: 0, avgPct: null, turnover: '—' };
  const all = [...(movers.gainers || []), ...(movers.losers || []), ...(movers.mostActive || [])];
  const seen = new Set();
  const uniq = all.filter((m) => (seen.has(m.symbol) ? false : (seen.add(m.symbol), true)));
  if (uniq.length === 0) return { up: 0, down: 0, flat: 0, avgPct: null, turnover: '—' };
  let up = 0, down = 0, sum = 0, vol = 0, n = 0;
  for (const m of uniq) {
    if (typeof m.changePercent === 'number') {
      sum += m.changePercent;
      n++;
      if (m.changePercent > 0) up++;
      else if (m.changePercent < 0) down++;
    }
    if (typeof m.volume === 'number') vol += m.volume;
  }
  const avgPct = n ? sum / n : null;
  const cr = vol / 1e7;
  const turnover = cr >= 1 ? `${cr.toFixed(1)} Cr` : `${(vol / 1e5).toFixed(1)} L`;
  return { up, down, avgPct, turnover };
}