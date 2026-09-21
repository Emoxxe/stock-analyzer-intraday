import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import IntradayChart from '../components/IntradayChart';
import './IntradayPage.css';

const formatINR = (n) => n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const pct = (n) => n == null ? '—' : `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;

function handleCardTilt(e) {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  const rotateY = ((x - 50) / 50) * 6;
  const rotateX = ((50 - y) / 50) * 6;
  card.style.setProperty('--mx', `${x}%`);
  card.style.setProperty('--my', `${y}%`);
  card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
}

function handleCardReset(e) {
  e.currentTarget.style.transform = '';
}

function SignalBadge({ status }) {
  const label = status === 'ENTER' ? 'ENTER' : status === 'WATCH' ? 'WATCH' : 'WAIT';
  return <span className={`signal-badge signal-${status?.toLowerCase() || 'wait'}`}>{label}</span>;
}

function Metric({ label, value, tone = '' }) {
  return (
    <div className="intraday-metric">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
    </div>
  );
}

const CountdownTimer = memo(function CountdownTimer({ resetKey }) {
  const [countdown, setCountdown] = useState(20);
  
  useEffect(() => {
    setCountdown(20);
  }, [resetKey]);

  useEffect(() => {
    const tick = setInterval(() => setCountdown(v => v > 0 ? v - 1 : 0), 1000);
    return () => clearInterval(tick);
  }, []);

  return <span>next refresh {countdown}s</span>;
});

export default function IntradayPage() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [universe, setUniverse] = useState('NIFTY50');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [countdown, setCountdown] = useState(20);
  const [riskBudget, setRiskBudget] = useState(1000);
  const prevActionableRef = useRef([]);

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/intraday/scan?universe=${encodeURIComponent(universe)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Intraday scan failed');
      
      const newData = json.data;
      
      // Check for new ENTER states
      if ('Notification' in window && Notification.permission === 'granted') {
        const newEnterSymbols = newData?.actionable
          ?.filter(row => row.plan.status === 'ENTER')
          ?.map(row => row.symbol) || [];
          
        const oldEnterSymbols = prevActionableRef.current
          ?.filter(row => row.plan.status === 'ENTER')
          ?.map(row => row.symbol) || [];

        const newlyEntered = newEnterSymbols.filter(sym => !oldEnterSymbols.includes(sym));
        
        newlyEntered.forEach(sym => {
          const row = newData.actionable.find(r => r.symbol === sym);
          new Notification(`Trade Alert: ${sym} (${row.plan.direction})`, {
            body: `${row.plan.setup.replaceAll('_', ' ')} detected. Entry near ${formatINR(row.plan.entry)}.`,
            icon: '/vite.svg'
          });
        });
      }
      
      prevActionableRef.current = newData?.actionable || [];
      setData(newData);
      setLastRefresh(new Date());
      setError('');
    } catch (e) {
      setError(e.message || 'Unable to load intraday scanner');
    } finally {
      setLoading(false);
    }
  }, [universe]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const refresh = setInterval(() => load(true), 20_000);
    return () => clearInterval(refresh);
  }, [load]);

  const actionable = data?.actionable || [];
  const selectedRow = useMemo(
    () => selected ? data?.setups?.find(x => x.symbol === selected) : null,
    [data, selected]
  );

  return (
    <div className="intraday-page">
      <div className="intraday-wrap">
        <header className="intraday-header">
          <div>
            <div className="eyebrow">INTRADAY DESK · NSE EQUITIES</div>
            <h1>Find the trade, then wait for the trigger.</h1>
            <p>
              A rules-based scanner that ranks live intraday setups using opening range, VWAP,
              momentum, volume and NIFTY regime. <b>ENTER</b> means the conditions are currently aligned;
              it is not a prediction or guarantee.
            </p>
          </div>
          <div className="scanner-controls">
            <select value={universe} onChange={e => setUniverse(e.target.value)} aria-label="Universe">
              <option value="NIFTY50">NIFTY 50</option>
            </select>
            <button className="refresh-btn" onClick={() => load()} disabled={loading}>
              <span className={loading ? 'spin' : ''}>↻</span> Refresh
            </button>
          </div>
        </header>

        {error && <div className="intraday-alert">Could not refresh scanner: {error}</div>}

        <section className="market-strip">
          <div className="market-state">
            <span className={`status-dot ${data?.marketState === 'LIVE' ? 'live' : ''}`} />
            <div>
              <small>MARKET</small>
              <strong>{data?.marketState || 'LOADING'}</strong>
            </div>
          </div>
          <div className="regime">
            <small>NIFTY REGIME</small>
            <strong className={`regime-${data?.marketRegime?.regime?.toLowerCase() || 'unknown'}`}>
              {data?.marketRegime?.regime || '—'}
            </strong>
          </div>
          <div>
            <small>NIFTY 50</small>
            <strong>{formatINR(data?.marketRegime?.index?.price)}</strong>
            <em className={data?.marketRegime?.index?.changePercent >= 0 ? 'up' : 'down'}>
              {pct(data?.marketRegime?.index?.changePercent)}
            </em>
          </div>
          <div>
            <small>REGIME SCORE</small>
            <strong>{data?.marketRegime?.score ?? '—'}<span className="muted">/100</span></strong>
          </div>
          <div className="strip-right">
            <small>SCANNED</small>
            <strong>{data?.scannedCount ?? '—'} stocks</strong>
            <CountdownTimer resetKey={lastRefresh?.getTime()} />
          </div>
        </section>

        <section className="section-heading">
          <div>
            <h2>Best setups right now</h2>
            <p>Sorted by actionable state first, then setup quality.</p>
          </div>
          {lastRefresh && <span className="freshness">Updated {lastRefresh.toLocaleTimeString('en-IN')}</span>}
        </section>

        {loading && !data ? (
          <div className="scanner-grid">
            {[1,2,3].map(i => <div className="setup-card loading-card" key={i}><div/><div/><div/><div/></div>)}
          </div>
        ) : actionable.length ? (
          <div className="scanner-grid">
            {actionable.map((row, index) => (
              <button
                className={`setup-card ${row.plan.status === 'ENTER' ? 'is-enter' : row.plan.status === 'WATCH' ? 'is-watch' : ''}`}
                key={row.symbol}
                onClick={() => setSelected(row.symbol)}
                onMouseMove={handleCardTilt}
                onMouseLeave={handleCardReset}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="card-top">
                  <div>
                    <span className="rank">#{index + 1}</span>
                    <strong>{row.symbol}</strong>
                    <span className={row.plan.direction === 'LONG' ? 'direction long' : 'direction short'}>
                      {row.plan.direction === 'LONG' ? 'LONG' : 'SHORT'}
                    </span>
                  </div>
                  <SignalBadge status={row.plan.status} />
                </div>
                <div className="price-line">
                  <strong>{formatINR(row.currentPrice)}</strong>
                  <span className={row.changePercent >= 0 ? 'up' : 'down'}>{pct(row.changePercent)}</span>
                </div>
                <div className="setup-name">{row.plan.setup.replaceAll('_', ' ')}</div>
                <div className="trade-levels">
                  <Metric label="ENTRY" value={formatINR(row.plan.entry)} />
                  <Metric label="STOP" value={formatINR(row.plan.stop)} tone="down-text" />
                  <Metric label="T1" value={formatINR(row.plan.target1)} tone="up-text" />
                  <Metric label="T2" value={formatINR(row.plan.target2)} tone="up-text" />
                </div>
                <div className="card-foot">
                  <span>Score <b>{row.plan.score}</b></span>
                  <span>R:R <b>{row.plan.rrRatio}</b></span>
                  <span>RVOL <b>{row.relativeVolume ? `${row.relativeVolume}×` : '—'}</b></span>
                </div>
                <p className="reason">{row.plan.reason}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="no-trade">
            <div className="no-trade-icon">—</div>
            <div>
              <strong>No high-quality entry right now</strong>
              <p>The scanner is intentionally refusing weak setups. Wait for an opening-range break with confirmation instead of forcing a trade.</p>
            </div>
          </div>
        )}

        <section className="scanner-lower">
          <div className="table-panel">
            <div className="panel-title">
              <div><h2>Full scanner</h2><p>Every scanned stock, including WAIT states.</p></div>
              <span>5-minute data</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Stock</th><th>State</th><th>Price</th><th>Change</th><th>VWAP</th><th>RSI</th><th>RVOL</th><th>Setup</th><th>Score</th></tr></thead>
                <tbody>
                  {(data?.setups || []).map(row => (
                    <tr key={row.symbol} onClick={() => setSelected(row.symbol)}>
                      <td><b>{row.symbol}</b><small>{row.plan.direction}</small></td>
                      <td><SignalBadge status={row.plan.status} /></td>
                      <td className="mono">{formatINR(row.currentPrice)}</td>
                      <td className={row.changePercent >= 0 ? 'up mono' : 'down mono'}>{pct(row.changePercent)}</td>
                      <td className="mono">{formatINR(row.vwap)}</td>
                      <td className="mono">{row.rsi ?? '—'}</td>
                      <td className="mono">{row.relativeVolume ? `${row.relativeVolume}×` : '—'}</td>
                      <td>{row.plan.setup.replaceAll('_', ' ')}</td>
                      <td className="mono"><b>{row.plan.score}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rules-panel">
            <div className="panel-title"><div><h2>How the signal works</h2><p>Transparent rules, no black-box “prediction”.</p></div></div>
            <div className="rule"><span>01</span><div><b>Opening range</b><p>First 15 minutes define the initial high/low. A break becomes the primary trigger.</p></div></div>
            <div className="rule"><span>02</span><div><b>VWAP + EMA</b><p>Direction is favored only when price, VWAP and 9/20 EMA structure agree.</p></div></div>
            <div className="rule"><span>03</span><div><b>Volume confirmation</b><p>Relative volume helps reject breakouts that lack participation.</p></div></div>
            <div className="rule"><span>04</span><div><b>Exit discipline</b><p>Every entry has a predefined stop, 2R first target and a 15:20 IST square-off rule.</p></div></div>
          </aside>
        </section>

        <div className="data-disclaimer">
          <b>Data & execution:</b> {data?.dataNote || 'Signals are decision-support only. Verify the live quote, liquidity, spread and order status with your broker before entering a position.'}
        </div>
      </div>

      {selectedRow && (
        <div className="detail-backdrop" onClick={() => setSelected(null)}>
          <aside className="trade-drawer" onClick={e => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setSelected(null)}>×</button>
            <div className="eyebrow">{selectedRow.symbol} · INTRADAY PLAN</div>
            <div className="drawer-title">
              <div><h2>{selectedRow.symbol}</h2><span className={selectedRow.plan.direction === 'LONG' ? 'direction long' : 'direction short'}>{selectedRow.plan.direction}</span></div>
              <SignalBadge status={selectedRow.plan.status} />
            </div>
            <div className="drawer-price">{formatINR(selectedRow.currentPrice)} <span className={selectedRow.changePercent >= 0 ? 'up' : 'down'}>{pct(selectedRow.changePercent)}</span></div>
            <div className="drawer-grid">
              <Metric label="ENTRY TRIGGER" value={formatINR(selectedRow.plan.entry)} />
              <Metric label="STOP LOSS" value={formatINR(selectedRow.plan.stop)} tone="down-text" />
              <Metric label="TARGET 1" value={formatINR(selectedRow.plan.target1)} tone="up-text" />
              <Metric label="TARGET 2" value={formatINR(selectedRow.plan.target2)} tone="up-text" />
            </div>
            
            <IntradayChart 
              symbol={selectedRow.symbol} 
              vwap={selectedRow.vwap} 
              openingRangeHigh={selectedRow.openingRangeHigh} 
              openingRangeLow={selectedRow.openingRangeLow} 
            />

            <div className="drawer-section"><small>WHY THIS SETUP</small><p>{selectedRow.plan.reason}</p></div>
            <div className="drawer-section"><small>INVALIDATION</small><p>{selectedRow.plan.invalidation}</p></div>
            <div className="drawer-section"><small>EXIT PLAN</small><p>{selectedRow.plan.exitPlan}</p></div>
            <div className="risk-box">
              <div><small>RISK BUDGET</small><input value={riskBudget} onChange={e => setRiskBudget(Math.max(0, Number(e.target.value) || 0))} inputMode="decimal" /></div>
              <div><small>EST. SHARES</small><strong>{selectedRow.plan.riskPerShare ? Math.floor(riskBudget / selectedRow.plan.riskPerShare) : '—'}</strong></div>
              <div><small>RISK / SHARE</small><strong>{formatINR(selectedRow.plan.riskPerShare)}</strong></div>
            </div>
            <div className="drawer-stats">
              <Metric label="SCORE" value={`${selectedRow.plan.score}/99`} />
              <Metric label="R:R" value={selectedRow.plan.rrRatio} />
              <Metric label="VWAP" value={formatINR(selectedRow.vwap)} />
              <Metric label="RVOL" value={selectedRow.relativeVolume ? `${selectedRow.relativeVolume}×` : '—'} />
            </div>
            <Link className="company-link" to={`/company/${selectedRow.symbol}`}>Open full stock analysis →</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
