/**
 * FinancialStatementsTable Component — premium opaque table.
 * Keeps opaque background for readability. Upgraded headers, hover accent bars, design tokens.
 */

import { useState } from 'react';
import { formatCrores } from '../utils/formatters';
import SourceBadge from './SourceBadge';

export default function FinancialStatementsTable({ statements = {}, periodInfo = {} }) {
  const [activeTab, setActiveTab] = useState('income');
  const [periodType, setPeriodType] = useState('annual');

  const { incomeStatement = {}, balanceSheet = {}, cashFlow = {} } = statements || {};

  const tabs = [
    { id: 'income', label: 'Income Statement' },
    { id: 'balance', label: 'Balance Sheet' },
    { id: 'cashflow', label: 'Cash Flow' },
  ];

  const STATEMENT_ITEMS = {
    income: [
      { key: 'totalRevenue', label: 'Total Revenue / Turnover' },
      { key: 'grossProfit', label: 'Gross Profit' },
      { key: 'operatingIncome', label: 'Operating Income / EBIT' },
      { key: 'ebitda', label: 'EBITDA' },
      { key: 'netIncome', label: 'Net Profit After Tax (PAT)' },
    ],
    balance: [
      { key: 'totalAssets', label: 'Total Assets' },
      { key: 'totalStockholderEquity', label: 'Net Worth / Equity' },
      { key: 'totalDebt', label: 'Total Borrowings / Debt' },
      { key: 'totalLiab', label: 'Total Liabilities' },
      { key: 'cash', label: 'Cash & Liquid Balances' },
    ],
    cashflow: [
      { key: 'operatingCashFlow', label: 'Cash from Operations (CFO)' },
      { key: 'capitalExpenditures', label: 'Capital Expenditures (CapEx)' },
      { key: 'investingCashFlow', label: 'Cash from Investing Activities' },
      { key: 'financingCashFlow', label: 'Cash from Financing Activities' },
      { key: 'freeCashFlow', label: 'Free Cash Flow (FCF)' },
    ],
  };

  const getStatementData = () => {
    const raw =
      activeTab === 'income'
        ? incomeStatement
        : activeTab === 'balance'
        ? balanceSheet
        : cashFlow;
    return (raw && raw[periodType]) || [];
  };

  const periodsList = getStatementData();
  const currentItems = STATEMENT_ITEMS[activeTab] || [];

  return (
    <div style={{
      backgroundColor: 'var(--bg-elevated)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-card)',
      padding: 'var(--s5)',
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s4)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--s3)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--fs-h3)', fontWeight: 600, color: 'var(--text)' }}>
            Financial Statements
          </h3>
          <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>
            Accounting Standard: Ind AS / IFRS Consolidated (INR ₹ Crores)
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s2)', alignItems: 'center' }}>
          {/* Period Toggle */}
          <div style={{ display: 'flex', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-sm)', padding: '2px' }}>
            <button
              onClick={() => setPeriodType('annual')}
              style={{
                background: periodType === 'annual' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: periodType === 'annual' ? 'var(--accent-strong)' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: 'var(--fs-label)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--dur-fast) var(--ease)',
              }}
            >
              Annual
            </button>
            <button
              onClick={() => setPeriodType('quarterly')}
              style={{
                background: periodType === 'quarterly' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: periodType === 'quarterly' ? 'var(--accent-strong)' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: 'var(--fs-label)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--dur-fast) var(--ease)',
              }}
            >
              Quarterly
            </button>
          </div>

          {/* Statement Tabs */}
          <div style={{ display: 'flex', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-sm)', padding: '2px' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: 'var(--fs-small)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--dur-fast) var(--ease)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        {periodsList.length === 0 ? (
          <div style={{ padding: 'var(--s8)', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0, fontSize: 'var(--fs-body)' }}>Detailed line-item breakdown is not published in public feed for this period.</p>
            <span style={{ fontSize: 'var(--fs-label)', color: 'var(--text-disabled)', display: 'block', marginTop: '6px' }}>
              Zero Fake Data Principle: Metric omitted rather than estimated.
            </span>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-body)', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border-hover)' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600, minWidth: '220px', color: 'var(--text-muted)', fontSize: 'var(--fs-small)', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 2 }}>Accounting Line Item</th>
                {periodsList.map((p, idx) => (
                  <th key={p.period || idx} style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right', minWidth: '120px', color: 'var(--text-muted)', fontSize: 'var(--fs-small)', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 2 }}>
                    <div>{p.period}</div>
                    {p.endDate && <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-disabled)', fontWeight: 400 }}>{p.endDate}</div>}
                  </th>
                ))}
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center', width: '90px', color: 'var(--text-muted)', fontSize: 'var(--fs-small)', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 2 }}>Source</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, rowIdx) => {
                const sampleField = periodsList[0]?.[item.key];
                return (
                  <tr
                    key={item.key}
                    style={{
                      borderBottom: '1px solid var(--glass-border)',
                      backgroundColor: rowIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                      transition: 'all var(--dur-fast) var(--ease)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                      e.currentTarget.style.boxShadow = 'inset 3px 0 0 var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = rowIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <td style={{ padding: '10px 12px', color: 'var(--text)', fontWeight: 500 }}>
                      {item.label}
                    </td>
                    {periodsList.map((p, colIdx) => {
                      const field = p[item.key];
                      const val = field?.value;
                      const isUnavailable = val === null || val === undefined;
                      const isNeg = typeof val === 'number' && val < 0;

                      return (
                        <td
                          key={p.period || colIdx}
                          style={{
                            padding: '10px 12px',
                            textAlign: 'right',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 600,
                            color: isUnavailable ? 'var(--text-disabled)' : isNeg ? 'var(--negative-strong)' : 'var(--text)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {isUnavailable ? '—' : formatCrores(val)}
                        </td>
                      );
                    })}
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <SourceBadge field={sampleField} size="small" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
