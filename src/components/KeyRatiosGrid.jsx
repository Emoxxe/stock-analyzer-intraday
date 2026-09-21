/**
 * KeyRatiosGrid Component — glass metric tiles with hover lift.
 * Displays fundamental financial metrics and valuation multiples.
 */
import { formatCrores, formatRatio } from '../utils/formatters';
import SourceBadge from './SourceBadge';

function fmtPct(val) {
  if (val === null || val === undefined) return 'Data unavailable';
  return `${Number(val).toFixed(2)}%`;
}

function fmtCr(val) {
  if (val === null || val === undefined) return 'Data unavailable';
  return formatCrores(val);
}

function fmtRatio(val) {
  if (val === null || val === undefined) return 'Data unavailable';
  return formatRatio(val);
}

export default function KeyRatiosGrid({ fundamentals = {}, quote = {} }) {
  const marketCapField = quote.marketCap || null;

  const items = [
    { label: 'Market Capitalization', field: marketCapField, formatter: fmtCr },
    { label: 'P/E (Trailing TTM)', field: fundamentals.peRatio, formatter: fmtRatio, period: fundamentals.peRatio?.period || 'TTM' },
    { label: 'P/E (Forward)', field: fundamentals.forwardPE, formatter: fmtRatio, period: fundamentals.forwardPE?.period || 'Forward' },
    { label: 'Price to Book (P/B)', field: fundamentals.pbRatio, formatter: fmtRatio },
    { label: 'EPS (Earnings Per Share)', field: fundamentals.eps, formatter: (val) => val != null ? `₹${Number(val).toFixed(2)}` : 'Data unavailable', period: fundamentals.eps?.period || 'TTM' },
    { label: 'Book Value', field: fundamentals.bookValue, formatter: (val) => val != null ? `₹${Number(val).toFixed(2)}` : 'Data unavailable' },
    { label: 'Return on Equity (ROE)', field: fundamentals.roe, formatter: fmtPct, period: fundamentals.roe?.period || 'TTM' },
    { label: 'Return on Capital (ROCE)', field: fundamentals.roce, formatter: fmtPct, period: fundamentals.roce?.period || 'TTM' },
    { label: 'Operating Margin', field: fundamentals.operatingMargin, formatter: fmtPct, period: fundamentals.operatingMargin?.period || 'TTM' },
    { label: 'Profit Margin (Net)', field: fundamentals.netMargin, formatter: fmtPct, period: fundamentals.netMargin?.period || 'TTM' },
    { label: 'EBITDA', field: fundamentals.ebitda, formatter: fmtCr, period: fundamentals.ebitda?.period || 'TTM' },
    { label: 'Total Debt', field: fundamentals.totalDebt, formatter: fmtCr, period: fundamentals.totalDebt?.period || 'Latest Qtr' },
    { label: 'Total Cash & Equivalents', field: fundamentals.totalCash, formatter: fmtCr, period: fundamentals.totalCash?.period || 'Latest Qtr' },
    { label: 'Debt to Equity', field: fundamentals.debtToEquity, formatter: (val) => val != null ? `${Number(val).toFixed(2)}%` : 'Data unavailable', period: fundamentals.debtToEquity?.period || 'Latest' },
    { label: 'Free Cash Flow', field: fundamentals.freeCashFlow, formatter: fmtCr, period: fundamentals.freeCashFlow?.period || 'TTM' },
    { label: 'Dividend Yield', field: fundamentals.dividendYield, formatter: fmtPct },
    { label: 'Revenue Growth (YoY)', field: fundamentals.revenueGrowth, formatter: fmtPct, period: fundamentals.revenueGrowth?.period || 'YoY' },
    { label: 'Beta', field: fundamentals.beta, formatter: (val) => val != null ? Number(val).toFixed(3) : 'Data unavailable', period: fundamentals.beta?.period || '5Y Monthly' },
  ];

  const visible = items.filter((item) => item.field?.value != null);
  const unavailable = items.filter((item) => item.field?.value == null);

  return (
    <div style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(var(--glass-blur))',
      WebkitBackdropFilter: 'blur(var(--glass-blur))',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-card)',
      padding: 'var(--s5)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s4)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--s3)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--fs-h3)', fontWeight: 600, color: 'var(--text)' }}>
            Key Financial Ratios & Fundamentals
          </h3>
          <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>
            Audited Corporate Filings & Normalized Metrics
          </span>
        </div>
        <SourceBadge
          field={fundamentals.peRatio || { source: 'Yahoo Finance (Secondary Fallback)', freshness: 'LATEST_AVAILABLE', quality: 'AVAILABLE' }}
          label="Fundamentals Source"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--s4)',
        }}
      >
        {visible.map((item, idx) => {
          const rawVal = item.field?.value;
          const displayVal = item.formatter(rawVal);
          const periodLabel = item.field?.period || item.period;
          const isPositive = typeof rawVal === 'number' && rawVal > 0;
          const isNegative = typeof rawVal === 'number' && rawVal < 0;

          return (
            <div
              key={idx}
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--r-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px',
                transition: 'all var(--dur-fast) var(--ease)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', fontWeight: 500, display: 'block' }}>
                    {item.label}
                  </span>
                  {periodLabel && (
                    <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-disabled)' }}>
                      Period: {periodLabel}
                    </span>
                  )}
                </div>
                <SourceBadge field={item.field} size="small" />
              </div>

              <div>
                <strong
                  style={{
                    fontSize: 'var(--num-strong)',
                    fontWeight: 600,
                    color: 'var(--text)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {displayVal}
                </strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Count indicator */}
      <div style={{ marginTop: 14, fontSize: 'var(--fs-label)', color: 'var(--text-disabled)', textAlign: 'center' }}>
        {visible.length} metrics available
        {unavailable.length > 0 ? ` · ${unavailable.length} unavailable from provider` : ''}
      </div>
    </div>
  );
}
