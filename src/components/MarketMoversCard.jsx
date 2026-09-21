/**
 * MarketMoversCard — universe-scoped gainers / losers / most-active.
 * Premium glass panel with accent bars, smooth hover transitions.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPriceCompact, formatSigned, formatVolume } from '../utils/formatters';
import { glassCardStyle, panelHeaderStyle, panelTitleStyle, panelSubStyle, Segmented } from '../utils/ui.jsx';
import Skeleton from './Skeleton';

const TABS = [
  { value: 'gainers', label: 'Gainers' },
  { value: 'losers', label: 'Losers' },
  { value: 'active', label: 'Most Active' },
];

export default function MarketMoversCard({ movers = {}, loading = false }) {
  const [activeTab, setActiveTab] = useState('gainers');

  const {
    universe = 'NIFTY50',
    label = 'NIFTY 50 Constituents',
    scannedCount = 20,
    gainers = [],
    losers = [],
    mostActive = [],
    source = 'Yahoo Finance (Secondary Fallback)',
    retrievedAt = null,
  } = movers || {};

  const currentList = activeTab === 'gainers' ? gainers : activeTab === 'losers' ? losers : mostActive;

  return (
    <div style={{ ...glassCardStyle, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ ...panelHeaderStyle }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={panelTitleStyle}>Top Movers</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-muted)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--r-sm)',
                padding: '1px 6px',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </div>
          <div style={panelSubStyle}>Scanned {scannedCount} liquid constituents</div>
        </div>
        <Segmented options={TABS} value={activeTab} onChange={setActiveTab} size="sm" />
      </div>

      <div style={{ padding: 'var(--s2) var(--s4) var(--s4)', flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 10 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, marginRight: 12 }}>
                  <Skeleton height={12} width="36%" style={{ marginBottom: 6 }} />
                  <Skeleton height={10} width="22%" />
                </div>
                <Skeleton height={12} width="70px" />
              </div>
            ))}
          </div>
        ) : currentList.length === 0 ? (
          <div style={{ padding: '44px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No mover data available right now</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>The feed will retry automatically</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 12,
                padding: '6px 8px',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--text-disabled)',
              }}
            >
              <span>Company</span>
              <span style={{ textAlign: 'right', minWidth: 76 }}>Price</span>
              <span style={{ textAlign: 'right', minWidth: 66 }}>Chg %</span>
            </div>

            {currentList.map((item, idx) => {
              const isUp = (item.changePercent || 0) > 0;
              const isDown = (item.changePercent || 0) < 0;
              const pct = typeof item.changePercent === 'number' ? formatSigned(item.changePercent, 2) : '—';
              const accentColor = isUp ? 'var(--positive)' : isDown ? 'var(--negative)' : 'transparent';
              return (
                <Link
                  key={item.symbol || idx}
                  to={`/company/${item.symbol}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: 12,
                    alignItems: 'center',
                    padding: '8px',
                    borderRadius: 'var(--r-md)',
                    textDecoration: 'none',
                    transition: 'all var(--dur-fast) var(--ease)',
                    borderLeft: '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                    e.currentTarget.style.borderLeftColor = accentColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderLeftColor = 'transparent';
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.symbol}
                    </span>
                    {item.volume > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>Vol {formatVolume(item.volume)}</span>
                    )}
                  </div>
                  <span className="tnum" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-mono)', textAlign: 'right', minWidth: 76 }}>
                    {typeof item.price === 'number' ? formatPriceCompact(item.price) : '·'}
                  </span>
                  <span
                    className="tnum"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      textAlign: 'right',
                      minWidth: 66,
                      color: isUp ? 'var(--positive-strong)' : isDown ? 'var(--negative-strong)' : 'var(--text-muted)',
                    }}
                  >
                    {isUp ? '▲' : isDown ? '▼' : ''} {pct}%
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 'auto',
          padding: '8px 16px',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 10.5,
          color: 'var(--text-disabled)',
        }}
      >
        <span className="tnum">Updated {retrievedAt ? new Date(retrievedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) + ' IST' : '—'}</span>
        <span>{source.split(' ')[0]} · Delayed</span>
      </div>
    </div>
  );
}