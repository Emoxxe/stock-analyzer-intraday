/**
 * Normalization & Data Quality Service
 * Strict rule: Never converts null/undefined/NaN into 0.
 * Every metric retains field-level metadata (source, providerTimestamp, period, quality, freshness).
 */

/**
 * Safely unwrap raw numeric or string value from nested provider objects
 */
export function extractRawValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) || !isFinite(val) ? null : val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '' || trimmed === 'N/A' || trimmed === '-') return null;
    const num = Number(trimmed.replace(/,/g, ''));
    return !isNaN(num) && isFinite(num) ? num : trimmed;
  }
  if (typeof val === 'object') {
    if ('raw' in val) return extractRawValue(val.raw);
    if ('value' in val) return extractRawValue(val.value);
  }
  return null;
}

/**
 * Construct a strictly normalized field with quality metadata
 */
export function normalizeField(rawVal, options = {}) {
  const {
    unit = 'None',
    currency = 'INR',
    period = null,
    source = 'Yahoo Finance (Secondary Fallback)',
    providerTimestamp = null,
    retrievedAt = new Date().toISOString(),
    freshness = 'LATEST_AVAILABLE',
    isMultiplier100 = false,
  } = options;

  let value = extractRawValue(rawVal);

  if (value !== null && isMultiplier100 && typeof value === 'number') {
    value = Number((value * 100).toFixed(4));
  }

  // Strict check: if missing or unavailable -> UNAVAILABLE
  if (value === null || value === undefined) {
    return {
      value: null,
      currency: null,
      unit,
      period,
      source,
      providerTimestamp,
      retrievedAt,
      freshness: 'UNAVAILABLE',
      quality: 'UNAVAILABLE',
    };
  }

  return {
    value,
    currency,
    unit,
    period,
    source,
    providerTimestamp,
    retrievedAt,
    freshness,
    quality: 'AVAILABLE',
  };
}

/**
 * Format Indian Financial Year / Quarter from raw date/timestamp
 */
export function formatFinancialPeriod(dateInput, isQuarterly = false) {
  if (!dateInput) return null;
  const rawNum = typeof dateInput === 'object' && dateInput.raw ? dateInput.raw : dateInput;
  const d = new Date(typeof rawNum === 'number' ? (rawNum < 1e11 ? rawNum * 1000 : rawNum) : rawNum);
  if (isNaN(d.getTime())) return null;

  const month = d.getUTCMonth(); // 0 = Jan, 11 = Dec
  const year = d.getUTCFullYear();

  // Indian FY runs April to March (e.g. April 2024 to March 2025 is FY2024-25)
  let fyStart = month >= 3 ? year : year - 1;
  const fyEnd = (fyStart + 1) % 100;
  const fyStr = `FY${fyStart}-${String(fyEnd).padStart(2, '0')}`;

  if (!isQuarterly) {
    return fyStr;
  }

  // Indian Quarters: Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar)
  let q = 'Q1';
  if (month >= 3 && month <= 5) q = 'Q1';
  else if (month >= 6 && month <= 8) q = 'Q2';
  else if (month >= 9 && month <= 11) q = 'Q3';
  else q = 'Q4';

  return `${q} ${fyStr}`;
}

/**
 * Normalize Financial Statements (Annual and Quarterly)
 */
export function normalizeFinancialStatements(rawResult, source, providerTimestamp, retrievedAt) {
  const annualIncome = rawResult?.incomeStatementHistory?.incomeStatementHistory || [];
  const quarterlyIncome = rawResult?.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];
  const balanceSheet = rawResult?.balanceSheetHistory?.balanceSheetStatements || [];
  const cashFlow = rawResult?.cashflowStatementHistory?.cashflowStatements || [];

  const mapStatementItem = (item, isQuarterly = false) => {
    const period = formatFinancialPeriod(item.endDate?.raw || item.endDate, isQuarterly);
    return {
      period,
      endDate: item.endDate?.fmt || (item.endDate?.raw ? new Date(item.endDate.raw * 1000).toISOString().split('T')[0] : null),
      totalRevenue: normalizeField(item.totalRevenue, { unit: 'Cr', period, source, providerTimestamp, retrievedAt }),
      operatingIncome: normalizeField(item.operatingIncome, { unit: 'Cr', period, source, providerTimestamp, retrievedAt }),
      netIncome: normalizeField(item.netIncome, { unit: 'Cr', period, source, providerTimestamp, retrievedAt }),
      ebitda: normalizeField(item.ebit || item.operatingIncome, { unit: 'Cr', period, source, providerTimestamp, retrievedAt }),
      grossProfit: normalizeField(item.grossProfit, { unit: 'Cr', period, source, providerTimestamp, retrievedAt }),
    };
  };

  const mapBalanceSheetItem = (item) => {
    const period = formatFinancialPeriod(item.endDate?.raw || item.endDate, false);
    return {
      period,
      endDate: item.endDate?.fmt || (item.endDate?.raw ? new Date(item.endDate.raw * 1000).toISOString().split('T')[0] : null),
      totalAssets: normalizeField(item.totalAssets, { unit: 'Cr', period, source, providerTimestamp, retrievedAt }),
      totalLiab: normalizeField(item.totalLiab, { unit: 'Cr', period, source, providerTimestamp, retrievedAt }),
      totalStockholderEquity: normalizeField(item.totalStockholderEquity, { unit: 'Cr', period, source, providerTimestamp, retrievedAt }),
      cash: normalizeField(item.cash, { unit: 'Cr', period, source, providerTimestamp, retrievedAt }),
      totalDebt: normalizeField(item.longTermDebt || item.shortLongTermDebt, { unit: 'Cr', period, source, providerTimestamp, retrievedAt }),
    };
  };

  const mapCashFlowItem = (item) => {
    const period = formatFinancialPeriod(item.endDate?.raw || item.endDate, false);
    const opCash = extractRawValue(item.totalCashFromOperatingActivities);
    const capEx = extractRawValue(item.capitalExpenditures);
    const fcf = opCash !== null && capEx !== null ? opCash + capEx : null;

    return {
      period,
      endDate: item.endDate?.fmt || (item.endDate?.raw ? new Date(item.endDate.raw * 1000).toISOString().split('T')[0] : null),
      operatingCashFlow: normalizeField(item.totalCashFromOperatingActivities, { unit: 'Cr', period, source, providerTimestamp, retrievedAt }),
      capitalExpenditures: normalizeField(item.capitalExpenditures, { unit: 'Cr', period, source, providerTimestamp, retrievedAt }),
      freeCashFlow: normalizeField(fcf, { unit: 'Cr', period, source, providerTimestamp, retrievedAt }),
      financingCashFlow: normalizeField(item.totalCashFromFinancingActivities, { unit: 'Cr', period, source, providerTimestamp, retrievedAt }),
      investingCashFlow: normalizeField(item.totalCashflowsFromInvestingActivities, { unit: 'Cr', period, source, providerTimestamp, retrievedAt }),
    };
  };

  return {
    incomeStatement: {
      annual: annualIncome.map(item => mapStatementItem(item, false)),
      quarterly: quarterlyIncome.map(item => mapStatementItem(item, true)),
    },
    balanceSheet: {
      annual: balanceSheet.map(mapBalanceSheetItem),
    },
    cashFlow: {
      annual: cashFlow.map(mapCashFlowItem),
    },
  };
}
