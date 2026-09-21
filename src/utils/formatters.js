/**
 * Indian Financial Formatting Utilities
 * Standardizes INR currency, ₹ Crore, ₹ Lakh, percentage, and date/time.
 * Strictly returns "Data unavailable" for null/undefined/missing values.
 */

/**
 * Compact price display — drops trailing ".00", keeps 2dp for sub-₹ values.
 * Returns null for missing so callers decide how to render "unavailable".
 */
export function formatPriceCompact(val) {
  if (val === null || val === undefined || isNaN(Number(val))) return null;
  const num = Number(val);
  if (Number.isInteger(num)) return num.toLocaleString('en-IN');
  return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/**
 * Signed number string: "+1,234.50" / "-987.00" / "0.00"
 */
export function formatSigned(val, digits = 2) {
  if (val === null || val === undefined || isNaN(Number(val))) return null;
  const num = Number(val);
  const sign = num > 0 ? '+' : num < 0 ? '−' : '';
  return `${sign}${Math.abs(num).toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
}

/**
 * Absolute market cap in compact ₹ notation: ₹19.3L Cr, ₹4.2L Cr, ₹18.5K Cr
 */
export function formatMarketCapCr(val) {
  if (val === null || val === undefined || isNaN(Number(val))) return null;
  const num = Number(val);
  const cr = num / 1e7;
  if (cr >= 1e5) return `${(cr / 1e5).toFixed(1)} Lakh Cr`;
  if (cr >= 1e4) return `${(cr / 1e3).toFixed(1)}K Cr`;
  return `${cr.toFixed(0)} Cr`;
}

/**
 * Bytes-for-humans elapsed string used in latency/provenance UI.
 */
export function formatElapsed(ms) {
  if (ms === null || ms === undefined || isNaN(Number(ms))) return '—';
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const inrNumberFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const inrIntegerFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

/**
 * Format raw currency in INR (e.g. 1450.25 -> ₹1,450.25)
 */
export function formatINR(val, prefix = '₹') {
  if (val === null || val === undefined || isNaN(Number(val))) {
    return 'Data unavailable';
  }
  const num = Number(val);
  return `${prefix}${inrNumberFormatter.format(num)}`;
}

/**
 * Format large values into ₹ Cr or ₹ Lakh Cr (e.g., 20000000000 -> ₹2,000.00 Cr)
 */
export function formatCrores(val, prefix = '₹') {
  if (val === null || val === undefined || isNaN(Number(val))) {
    return 'Data unavailable';
  }
  const num = Number(val);
  const abs = Math.abs(num);

  // 1 Lakh Cr = 10^12 (1 Trillion)
  if (abs >= 1e12) {
    const lakhCr = num / 1e12;
    return `${prefix}${inrNumberFormatter.format(lakhCr)} Lakh Cr`;
  }

  // 1 Cr = 10^7 (10 Million)
  if (abs >= 1e7) {
    const cr = num / 1e7;
    return `${prefix}${inrNumberFormatter.format(cr)} Cr`;
  }

  // 1 Lakh = 10^5 (100 Thousand)
  if (abs >= 1e5) {
    const lakh = num / 1e5;
    return `${prefix}${inrNumberFormatter.format(lakh)} L`;
  }

  return `${prefix}${inrNumberFormatter.format(num)}`;
}

/**
 * Format percentage with positive/negative indicator (e.g. 2.45 -> +2.45%)
 */
export function formatPercent(val) {
  if (val === null || val === undefined || isNaN(Number(val))) {
    return 'Data unavailable';
  }
  const num = Number(val);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

/**
 * Format numeric ratio (e.g. 23.45 -> 23.45x)
 */
export function formatRatio(val, suffix = 'x') {
  if (val === null || val === undefined || isNaN(Number(val))) {
    return 'Data unavailable';
  }
  const num = Number(val);
  return `${num.toFixed(2)}${suffix}`;
}

/**
 * Format share volume with Indian grouping (e.g. 1540020 -> 15,40,020 shares)
 */
export function formatVolume(val) {
  if (val === null || val === undefined || isNaN(Number(val))) {
    return 'Data unavailable';
  }
  const num = Number(val);
  if (num >= 1e7) {
    return `${(num / 1e7).toFixed(2)} Cr shares`;
  }
  if (num >= 1e5) {
    return `${(num / 1e5).toFixed(2)} L shares`;
  }
  return `${inrIntegerFormatter.format(num)} shares`;
}

/**
 * Format timestamp to Indian Standard Time (IST)
 */
export function formatISTDateTime(dateInput) {
  if (!dateInput) return 'Data unavailable';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Data unavailable';

  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }) + ' IST';
}

/**
 * Format short date (e.g. 08 Sep 2026)
 */
export function formatShortDate(dateInput) {
  if (!dateInput) return 'Data unavailable';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Data unavailable';

  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
