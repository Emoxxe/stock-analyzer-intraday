/**
 * SearchModal — premium command-style stock search.
 * Opens with Ctrl+K (or "/") and from the navbar trigger.
 * Debounced + cached searches, keyboard navigation, rich result rows.
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cacheService } from '../services/apiCache';
import { useDebouncedValue } from '../hooks/useApiFetch';
import { formatPriceCompact, formatSigned, formatPercent } from '../utils/formatters';

const RECENT_KEY = 'stock_recent_searches';
const CACHE_TTL = 30_000;

function openModalEvent() {
  window.dispatchEvent(new CustomEvent('stock:open-search'));
}

export { openModalEvent };

function getRecents() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 6);
  } catch {
    return [];
  }
}

function saveRecent(symbol, name) {
  try {
    const recents = getRecents().filter((r) => r.symbol !== symbol);
    recents.unshift({ symbol, name, ts: Date.now() });
    localStorage.setItem(RECENT_KEY, JSON.stringify(recents.slice(0, 6)));
  } catch {
    /* ignore */
  }
}

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const showRecents = !debouncedQuery && !loading;
  const recents = useMemo(getRecents, [isOpen]);

  // Global keyboard shortcut: Ctrl+K or "/" (when not typing in a field)
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      const inField = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuery('');
        setResults([]);
        setError(null);
        setIsOpen((v) => !v);
      } else if (e.key === '/' && !inField) {
        e.preventDefault();
        setQuery('');
        setResults([]);
        setError(null);
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Open from navbar trigger
  useEffect(() => {
    const onOpen = () => {
      setQuery('');
      setResults([]);
      setError(null);
      setIsOpen(true);
    };
    window.addEventListener('stock:open-search', onOpen);
    return () => window.removeEventListener('stock:open-search', onOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // small delay so the transition doesn't fight the browser focus
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      document.body.style.overflow = 'hidden';
      return () => {
        clearTimeout(t);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Debounced + cached search
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const key = `search_${debouncedQuery.toLowerCase()}`;
    const cached = cacheService.get(key);
    if (cached) {
      setResults(cached);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.success === false) throw new Error(json.error || 'Search failed');
        const list = json.results || [];
        cacheService.set(key, list, CACHE_TTL);
        setResults(list);
        setActiveIndex(0);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedQuery]);

  // Keyboard navigation
  const onKeyDown = (e) => {
    const count = results.length;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (count ? (i + 1) % count : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (count ? (i - 1 + count) % count : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) select(item);
    }
  };

  const select = (item) => {
    const symbol = item.primarySymbol || item.symbol;
    saveRecent(symbol, item.displayName || item.name);
    close();
    navigate(`/company/${encodeURIComponent(symbol)}`);
  };

  const close = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const selectRecent = (r) => {
    saveRecent(r.symbol, r.name);
    close();
    navigate(`/company/${encodeURIComponent(r.symbol)}`);
  };

  if (!isOpen) return null;

  const activeItem = results[activeIndex];

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(4, 6, 8, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 5000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '9vh',
        animation: 'fadeIn var(--dur-base) var(--ease)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(620px, calc(100vw - 32px))',
          backgroundColor: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(var(--glass-blur-strong))',
          WebkitBackdropFilter: 'blur(var(--glass-blur-strong))',
          border: '1px solid var(--glass-border-hover)',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-overlay)',
          overflow: 'hidden',
          animation: 'modalPop var(--dur-base) var(--ease-spring)',
        }}
      >
        {/* Input row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search stocks, symbols, ISIN… (try RELIANCE, TCS, 500325)"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: '15px',
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          />
          <kbd
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--r-sm)',
              padding: '2px 6px',
              background: 'var(--surface-inset)',
              flexShrink: 0,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Body */}
        <div style={{ maxHeight: 'min(460px, 60vh)', overflowY: 'auto' }} ref={listRef}>
          {loading && (
            <div style={{ padding: '20px 16px' }}>
              <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 14, width: '50%' }} />
            </div>
          )}

          {error && (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: 'var(--negative-strong)' }}>Couldn't reach the quote service</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{error}</div>
            </div>
          )}

          {!loading && !error && debouncedQuery.length >= 2 && results.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>No matches for “{debouncedQuery}”</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Try a symbol (TATAMOTORS), company name, or ISIN
              </div>
            </div>
          )}

          {!loading && !error && results.map((item, idx) => {
            const quote = item.quote;
            const isActive = idx === activeIndex;
            const price = quote ? formatPriceCompact(quote.price) : null;
            const pct = quote && typeof quote.changePercent === 'number' ? formatSigned(quote.changePercent, 2) : null;
            const isUp = quote && typeof quote.changePercent === 'number' && quote.changePercent > 0;
            const isDown = quote && typeof quote.changePercent === 'number' && quote.changePercent < 0;
            const sym = item.primarySymbol || item.symbol;
            return (
              <button
                key={sym}
                type="button"
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => select(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  gap: '12px',
                  padding: '10px 16px',
                  background: isActive ? 'var(--surface-hover)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em' }}>
                      {sym}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        background: 'var(--surface-inset)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r-sm)',
                        padding: '1px 5px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {item.exchange || 'NSE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.displayName || item.name}
                    {item.industry ? <span style={{ color: 'var(--text-muted)' }}> · {item.industry}</span> : null}
                  </div>
                </div>
                {quote && typeof quote.price === 'number' ? (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="tnum" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                      {price}
                    </div>
                    <div className="tnum" style={{ fontSize: '11px', fontWeight: 600, color: isUp ? 'var(--positive-strong)' : isDown ? 'var(--negative-strong)' : 'var(--text-muted)' }}>
                      {isUp ? '▲' : isDown ? '▼' : ''} {pct}%
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>no quote</span>
                )}
              </button>
            );
          })}

          {!loading && !error && showRecents && recents.length > 0 && (
            <div>
              <div
                style={{
                  padding: '10px 16px 6px',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                Recent
              </div>
              {recents.map((r) => (
                <button
                  key={r.symbol}
                  type="button"
                  onClick={() => selectRecent(r)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    gap: 10,
                    padding: '8px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {r.symbol}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>
                    ↖ recall
                  </span>
                </button>
              ))}
            </div>
          )}

          {!loading && !error && showRecents && recents.length === 0 && (
            <div style={{ padding: '36px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Search the Indian market</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', border: '1px solid var(--border-strong)', borderRadius: 3, padding: '1px 5px' }}>Ctrl</kbd>{' '}
                <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', border: '1px solid var(--border-strong)', borderRadius: 3, padding: '1px 5px' }}>K</kbd>{' '}
                anytime to search symbol, name or ISIN
              </div>
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            padding: '8px 16px',
            borderTop: '1px solid var(--border)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <span><kbd style={kbdStyle}>↑</kbd> <kbd style={kbdStyle}>↓</kbd> navigate</span>
          <span><kbd style={kbdStyle}>Enter</kbd> open</span>
          {activeItem ? (
            <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              → {(activeItem.primarySymbol || activeItem.symbol)} · {(activeItem.displayName || activeItem.name)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const kbdStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--text-muted)',
  border: '1px solid var(--border-strong)',
  borderRadius: 3,
  padding: '1px 4px',
  background: 'var(--surface-inset)',
};