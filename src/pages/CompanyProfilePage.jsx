/**
 * CompanyProfilePage — premium company intelligence view with glassmorphism.
 * Persistent tabs: every pane stays mounted (hidden via CSS), so switching
 * tabs never refetches or loses scroll/state. Loading uses skeletons.
 */
import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApiFetch } from '../hooks/useApiFetch';
import { formatINR, formatVolume, formatISTDateTime, formatPercent } from '../utils/formatters';
import { panelStyle, glassCardStyle, panelHeaderStyle, panelTitleStyle, metricLabelStyle, metricTileStyle } from '../utils/ui.jsx';
import Skeleton, { SkeletonRow } from '../components/Skeleton';
import InteractiveStockChart from '../components/InteractiveStockChart';
import KeyRatiosGrid from '../components/KeyRatiosGrid';
import FinancialStatementsTable from '../components/FinancialStatementsTable';
import CompanyNewsFeed from '../components/CompanyNewsFeed';
import DevTracePanel from '../components/DevTracePanel';
import FreshnessPill from '../components/FreshnessPill';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'chart', label: 'Chart' },
  { id: 'financials', label: 'Financials' },
  { id: 'technicals', label: 'Technicals' },
  { id: 'news', label: 'News' },
];

export default function CompanyProfilePage() {
  const { symbol } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const tabBarRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  const { data, loading, error } = useApiFetch(`/api/company/${encodeURIComponent(symbol)}`, {
    ttl: 45_000,
    dependencies: [symbol],
  });

  // Sliding active tab indicator
  useEffect(() => {
    if (!tabBarRef.current) return;
    const activeBtn = tabBarRef.current.querySelector(`[data-tab="${activeTab}"]`);
    if (activeBtn) {
      const barRect = tabBarRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - barRect.left,
        width: btnRect.width,
      });
    }
  }, [activeTab]);

  if (loading && !data) {
    return <CompanySkeleton symbol={symbol} />;
  }

  if (error && !data) {
    return (
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: 'var(--s16) var(--s6)', textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ margin: '0 auto 16px', color: 'var(--warning)' }}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="16.2" r="0.9" fill="currentColor" />
        </svg>
        <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 700, color: 'var(--text)' }}>Couldn't load {symbol}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{error}</p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            marginTop: 18,
            padding: '8px 16px',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--r-md)',
            color: 'var(--text)',
            fontSize: 13,
            textDecoration: 'none',
            transition: 'all var(--dur-fast) var(--ease)',
          }}
        >
          ← Back to Markets
        </Link>
      </div>
    );
  }

  const payload = data || {};
  const {
    company = {},
    quote = {},
    fundamentals = {},
    financialStatements = {},
    statements = financialStatements,
    technicals = {},
    news = [],
    trace = {},
    debugTrace = trace,
  } = payload;

  const priceVal = quote.currentPrice?.value;
  const changeVal = quote.change?.value;
  const changePercentVal = quote.changePercent?.value;
  const isUp = (changePercentVal || 0) > 0;
  const isDown = (changePercentVal || 0) < 0;
  const pctColor = isUp ? 'var(--positive-strong)' : isDown ? 'var(--negative-strong)' : 'var(--text-muted)';
  const arrow = isUp ? '▲' : isDown ? '▼' : '·';
  const isPriceUnavailable = priceVal === null || priceVal === undefined;
  const sym = quote.symbol || symbol;

  return (
    <div className="fade-in" style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
      {/* Header card */}
      <div style={glassCardStyle}>
        <div style={{ padding: 'var(--s4) var(--s5)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--s5)' }}>
          {/* Identity */}
          <div style={{ minWidth: 0 }}>
            <Link to="/" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }} className="go-back">
              ← Markets
            </Link>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <h1 className="gradient-text" style={{ margin: 0, fontSize: 'var(--fs-h1)', fontWeight: 700, letterSpacing: '-0.02em' }}>
                {company.name || company.displayName || symbol}
              </h1>
              <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--info)', background: 'var(--info-soft)', borderRadius: 'var(--r-sm)', padding: '2px 8px' }}>
                {sym}
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-sm)', padding: '2px 6px', letterSpacing: '0.03em' }}>
                {quote.exchange || 'NSE'}
              </span>
              {company.isin && (
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>ISIN {company.isin}</span>
              )}
              {company.bseScrip && (
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>BSE {company.bseScrip}</span>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s3)', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              {company.sector && <span>{company.sector}</span>}
              {company.industry && <span>· {company.industry}</span>}
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--info)', textDecoration: 'none' }}>
                  Company site ↗
                </a>
              )}
            </div>
          </div>

          {/* Price block */}
          <div style={{ textAlign: 'right' }}>
            {isPriceUnavailable ? (
              <div style={{ fontSize: 'var(--fs-h1)', fontWeight: 700, color: 'var(--text-muted)' }}>Data unavailable</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 10 }}>
                  <span className="tnum" style={{ fontSize: 'var(--fs-hero)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                    {formatINR(priceVal)}
                  </span>
                  <span className="tnum" style={{ fontSize: 'var(--num)', fontWeight: 700, color: pctColor, fontFamily: 'var(--font-mono)' }}>
                    {arrow} {typeof changeVal === 'number' ? formatINR(changeVal, '') : ''} ({typeof changePercentVal === 'number' ? formatPercent(changePercentVal) : ''})
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 4, fontSize: 10.5, color: 'var(--text-muted)' }}>
                  <FreshnessPill status={quote.currentPrice?.freshness || 'DELAYED'} size="small" />
                  <span className="tnum">As of {quote.currentPrice?.providerTimestamp ? formatISTDateTime(quote.currentPrice.providerTimestamp) : 'delayed'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tab bar with sliding indicator */}
        <div
          ref={tabBarRef}
          style={{
            display: 'flex',
            gap: 2,
            padding: '0 var(--s4)',
            borderTop: '1px solid var(--glass-border)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            position: 'relative',
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-tab={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '11px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: '2px solid transparent',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 12.5,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color var(--dur-fast) var(--ease)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {tab.label}
              </button>
            );
          })}
          {/* Sliding indicator */}
          <span
            style={{
              position: 'absolute',
              bottom: 0,
              height: 2,
              background: 'var(--accent-strong)',
              borderRadius: 2,
              boxShadow: '0 0 8px rgba(99, 102, 241, 0.4)',
              transition: 'left var(--dur-base) var(--ease-spring), width var(--dur-base) var(--ease-spring)',
              left: indicatorStyle.left || 0,
              width: indicatorStyle.width || 0,
            }}
          />
        </div>
      </div>

      {/* Persistent panes — all mounted, only active visible */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
        <div style={{ display: activeTab === 'overview' ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--s4)' }}>
          {/* Stat pills */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 'var(--s3)' }}>
            <StatPill label="Day Range" value={quote.dayLow?.value != null && quote.dayHigh?.value != null ? `${formatINR(quote.dayLow.value, '')} – ${formatINR(quote.dayHigh.value, '')}` : null} mono small />
            <StatPill label="52W Range" value={quote.fiftyTwoWeekLow?.value != null && quote.fiftyTwoWeekHigh?.value != null ? `${formatINR(quote.fiftyTwoWeekLow.value, '')} – ${formatINR(quote.fiftyTwoWeekHigh.value, '')}` : null} mono small />
            <StatPill label="Volume / Prev Close" value={`${formatVolume(quote.volume?.value)} · ${formatINR(quote.previousClose?.value)}`} single />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 'var(--s4)', alignItems: 'start' }}>
            <KeyRatiosGrid fundamentals={fundamentals} quote={quote} />
            {/* Corporate background */}
            <div style={glassCardStyle}>
              <div style={{ ...panelHeaderStyle }}>
                <span style={panelTitleStyle}>Company Background</span>
              </div>
              <div style={{ padding: 'var(--s4)' }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                  {company.description || 'Verified summary currently unavailable for this listing.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: activeTab === 'chart' ? 'block' : 'none' }}>
          <InteractiveStockChart symbol={sym} currentPrice={priceVal} previousClose={quote.previousClose?.value} />
        </div>

        <div style={{ display: activeTab === 'financials' ? 'block' : 'none' }}>
          <FinancialStatementsTable statements={statements} periodInfo={fundamentals?.periodInfo} />
        </div>

        <div style={{ display: activeTab === 'technicals' ? 'block' : 'none' }}>
          <TechnicalsGrid technicals={technicals} />
        </div>

        <div style={{ display: activeTab === 'news' ? 'block' : 'none' }}>
          <CompanyNewsFeed news={news} companyName={company.name} symbol={sym} />
        </div>
      </div>

      {/* Provenance trace — always available at the bottom */}
      <DevTracePanel debugTrace={debugTrace} rawData={payload} />
    </div>
  );
}

function StatPill({ label, value, mono = false, single = false }) {
  return (
    <div
      style={{ ...metricTileStyle }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--glass-border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span style={metricLabelStyle}>{label}</span>
      <span
        className={mono ? 'tnum' : ''}
        style={{
          fontSize: 'var(--num)',
          fontWeight: 600,
          color: 'var(--text)',
          fontFamily: value && mono ? 'var(--font-mono)' : 'inherit',
          display: 'block',
          marginTop: 4,
          whiteSpace: single ? 'nowrap' : 'normal',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value || 'Data unavailable'}
      </span>
    </div>
  );
}

function TechnicalsGrid({ technicals = {} }) {
  const rows = [
    { label: 'SMA (20-day)', key: 'sma20', fmt: (v) => formatINR(v) },
    { label: 'EMA (50-day)', key: 'ema50', fmt: (v) => formatINR(v) },
    { label: 'RSI (14-day)', key: 'rsi14', fmt: (v) => Number(v).toFixed(2) },
    { label: 'Bollinger Upper (20, 2)', key: 'bollingerUpper', fmt: (v) => formatINR(v) },
    { label: 'Bollinger Lower (20, 2)', key: 'bollingerLower', fmt: (v) => formatINR(v) },
    { label: 'MACD', key: 'macd', fmt: (v) => (typeof v === 'number' ? formatINR(v) : v) },
  ];
  return (
    <div style={glassCardStyle}>
      <div style={{ ...panelHeaderStyle }}>
        <span style={panelTitleStyle}>Technical Indicators</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Derived from verified daily closes</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--s3)', padding: 'var(--s4)' }}>
        {rows.map((r) => {
          const v = technicals?.[r.key]?.value;
          return (
            <div
              key={r.key}
              style={{ ...metricTileStyle }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={metricLabelStyle}>{r.label}</span>
              <span className="tnum" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-mono)', display: 'block', marginTop: 3 }}>
                {v != null ? r.fmt(v) : 'Data unavailable'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Skeleton loading state — page-shaped placeholders. */
function CompanySkeleton({ symbol }) {
  return (
    <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
      <div style={{ ...glassCardStyle, padding: 'var(--s5)' }}>
        <Skeleton width={120} height={11} radius={3} style={{ marginBottom: 10 }} />
        <Skeleton width={260} height={22} radius={4} />
        <Skeleton width={180} height={11} radius={3} style={{ marginTop: 10 }} />
        <div style={{ display: 'flex', gap: 'var(--s4)', marginTop: 'var(--s4)', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Skeleton width={'60%'} height={28} radius={4} />
          <Skeleton width={140} height={24} radius={4} />
        </div>
      </div>
      <div style={{ ...glassCardStyle, padding: 'var(--s4)' }}>
        {/* tabs */}
        <Skeleton width={'100%'} height={34} radius={4} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 'var(--s3)' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ ...glassCardStyle, padding: '12px 14px' }}>
            <Skeleton width="55%" height={10} style={{ marginBottom: 8 }} />
            <Skeleton width="75%" height={15} />
          </div>
        ))}
      </div>
      <div style={{ ...glassCardStyle, padding: 'var(--s4)' }}>
        <SkeletonRow lines={5} height={13} lastWidth="45%" gap={12} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>Loading verified data for {symbol}…</span>
    </div>
  );
}