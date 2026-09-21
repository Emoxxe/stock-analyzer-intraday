/**
 * Navbar — compact institutional top navigation.
 * - 52px height, sticky
 * - Brand mark + wordmark
 * - Command-search trigger (Ctrl+K)
 * - Market status pill (live)
 * - Minimal nav tabs
 */
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { openModalEvent } from './SearchModal';
import { tagStyle } from '../utils/ui.jsx';

const NAV_LINKS = [
  { to: '/', label: 'Markets', match: (p) => p === '/' || p.startsWith('/company') },
  { to: '/sectors', label: 'Sectors', match: (p) => p.startsWith('/sectors') },
  { to: '/intraday', label: 'Intraday', match: (p) => p.startsWith('/intraday') },
  { to: '/coverage', label: 'Transparency', match: (p) => p.startsWith('/coverage') },
];

export default function Navbar() {
  const location = useLocation();
  const [marketStatus, setMarketStatus] = useState(null);
  const [istTime, setIstTime] = useState(new Date());

  // Market status (60s refresh)
  useEffect(() => {
    let cancelled = false;
    async function fetchStatus() {
      try {
        const res = await fetch('/api/market/status');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setMarketStatus(data);
        }
      } catch {
        /* graceful */
      }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // IST clock (1s)
  useEffect(() => {
    const timer = setInterval(() => setIstTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isOpen = Boolean(marketStatus?.success ? marketStatus.data?.isOpen : marketStatus?.isOpen);

  const clockTime = istTime.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        height: 'var(--header-height)',
        background: 'var(--glass-bg-strong)',
        backdropFilter: 'blur(var(--glass-blur-strong))',
        WebkitBackdropFilter: 'blur(var(--glass-blur-strong))',
        borderBottom: '1px solid var(--glass-border)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--content-max)',
          margin: '0 auto',
          height: '100%',
          padding: '0 var(--s6)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--s6)',
        }}
      >
        {/* Brand */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent), #4338CA)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.25)',
              transition: 'box-shadow var(--dur-base) var(--ease)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 24px rgba(99, 102, 241, 0.45)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 16px rgba(99, 102, 241, 0.25)'}
          >
            ▲
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', display: 'block' }}>
              StockAnalyzer
            </span>
            <span style={{ fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
              NSE · BSE · India
            </span>
          </div>
        </Link>

        {/* Search trigger */}
        <button
          type="button"
          onClick={openModalEvent}
          style={{
            flex: '1 1 320px',
            maxWidth: 520,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 36,
            padding: '0 12px',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--r-md)',
            color: 'var(--text-muted)',
            fontSize: '12.5px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all var(--dur-fast) var(--ease)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
            e.currentTarget.style.background = 'var(--glass-bg-strong)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.background = 'var(--glass-bg)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Search stocks, symbols, ISIN…</span>
          <span style={{ display: 'inline-flex', gap: 3, flexShrink: 0 }}>
            <kbd style={kbdStyle}>Ctrl</kbd>
            <kbd style={kbdStyle}>K</kbd>
          </span>
        </button>

        {/* Nav tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {NAV_LINKS.map((link) => {
            const active = link.match(location.pathname);
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: '6px 12px',
                  fontSize: '12.5px',
                  fontWeight: active ? 600 : 500,
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  background: active ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  border: active ? '1px solid var(--glass-border-hover)' : '1px solid transparent',
                  borderRadius: 'var(--r-md)',
                  textDecoration: 'none',
                  transition: 'all var(--dur-fast) var(--ease)',
                  position: 'relative',
                }}
              >
                {link.label}
                {active && <span style={{
                  position: 'absolute',
                  bottom: -1,
                  left: '20%',
                  right: '20%',
                  height: 2,
                  background: 'var(--accent-strong)',
                  borderRadius: 2,
                  boxShadow: '0 0 8px rgba(99, 102, 241, 0.4)',
                }} />}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster: market status + clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)', flexShrink: 0 }}>
          <span
            style={{
              ...tagStyle,
              color: isOpen ? 'var(--positive-strong)' : 'var(--text-muted)',
              background: isOpen ? 'var(--positive-soft)' : 'transparent',
              border: isOpen ? '1px solid rgba(34,197,94,0.25)' : '1px solid var(--border)',
              gap: 6,
            }}
            title={marketStatus?.sessionNote || 'NSE / BSE trading session'}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isOpen ? 'var(--positive-strong)' : 'var(--text-disabled)',
                boxShadow: isOpen ? '0 0 0 3px var(--positive-soft)' : 'none',
                animation: isOpen ? 'pulseDot 2s var(--ease) infinite' : 'none',
              }}
            />
            {isOpen ? 'Market Open' : 'Market Closed'}
          </span>
          <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
            <span style={{ fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>
              IST
            </span>
            <span className="tnum" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {clockTime}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

const kbdStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9.5,
  color: 'var(--text-muted)',
  border: '1px solid var(--border-strong)',
  borderRadius: 3,
  padding: '1px 4px',
  background: 'var(--surface)',
};

/* Pulse animation for market open dot */
/**/