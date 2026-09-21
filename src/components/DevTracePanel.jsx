/**
 * DevTracePanel — collapsible glass overlay with monospace styling and status colors.
 * Displays raw provider latency, cache status, resolved symbol & ISIN, and JSON inspector.
 */

import { useState } from 'react';
import { formatISTDateTime } from '../utils/formatters';

export default function DevTracePanel({ debugTrace = {}, rawData = null }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showJson, setShowJson] = useState(false);

  if (!debugTrace || Object.keys(debugTrace).length === 0) {
    return null;
  }

  const {
    provider = 'Yahoo Finance Adapter',
    resolvedSymbol = 'N/A',
    isin = 'N/A',
    latencyMs = 0,
    cached = false,
    retrievedAt = new Date().toISOString(),
    providerTimestamp = null,
    notes = [],
  } = debugTrace;

  return (
    <div
      style={{
        marginTop: 'var(--s6)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-small)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px var(--s4)',
          background: 'var(--info-soft)',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: isExpanded ? '1px solid var(--glass-border)' : 'none',
          transition: 'background var(--dur-fast) var(--ease)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--info-strong)' }}>⚡</span>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>
            Data Provider & Latency Trace
          </span>
          <span
            style={{
              fontSize: 'var(--fs-micro)',
              padding: '2px 6px',
              borderRadius: 'var(--r-sm)',
              backgroundColor: cached ? 'var(--positive-soft)' : 'var(--info-soft)',
              color: cached ? 'var(--positive-strong)' : 'var(--info-strong)',
              border: `1px solid ${cached ? 'rgba(34, 214, 114, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
            }}
          >
            {cached ? 'CACHE HIT' : 'NETWORK FETCH'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>({latencyMs}ms)</span>
        </div>
        <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{isExpanded ? 'Collapse' : 'Expand Details'}</span>
          <span>{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: 'var(--s4)', display: 'flex', flexDirection: 'column', gap: 'var(--s3)', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--s3)' }}>
            <div>
              <span style={{ color: 'var(--text-disabled)', display: 'block', fontSize: 'var(--fs-label)', letterSpacing: '0.04em' }}>DATA PROVIDER</span>
              <strong style={{ color: 'var(--info-strong)' }}>{provider}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-disabled)', display: 'block', fontSize: 'var(--fs-label)', letterSpacing: '0.04em' }}>RESOLVED SYMBOL</span>
              <strong style={{ color: 'var(--text)' }}>{resolvedSymbol}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-disabled)', display: 'block', fontSize: 'var(--fs-label)', letterSpacing: '0.04em' }}>SECURITY ISIN</span>
              <strong style={{ color: 'var(--text)' }}>{isin}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-disabled)', display: 'block', fontSize: 'var(--fs-label)', letterSpacing: '0.04em' }}>FETCH LATENCY</span>
              <strong style={{ color: latencyMs < 500 ? 'var(--positive-strong)' : 'var(--warning-strong)' }}>{latencyMs} ms</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-disabled)', display: 'block', fontSize: 'var(--fs-label)', letterSpacing: '0.04em' }}>RETRIEVAL TIMESTAMP</span>
              <span style={{ color: 'var(--text)' }}>{formatISTDateTime(retrievedAt)}</span>
            </div>

            <div>
              <span style={{ color: 'var(--text-disabled)', display: 'block', fontSize: 'var(--fs-label)', letterSpacing: '0.04em' }}>PROVIDER MARKET TIMESTAMP</span>
              <span style={{ color: 'var(--text)' }}>{providerTimestamp ? formatISTDateTime(providerTimestamp) : 'Not Disclosed'}</span>
            </div>
          </div>

          {notes && notes.length > 0 && (
            <div style={{ marginTop: 'var(--s2)', padding: '8px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-sm)' }}>
              <span style={{ color: 'var(--text-disabled)', display: 'block', fontSize: 'var(--fs-micro)', marginBottom: '4px', letterSpacing: '0.04em' }}>ROUTING & NORMALIZATION NOTES</span>
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)', fontSize: 'var(--fs-label)' }}>
                {notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {rawData && (
            <div style={{ marginTop: 'var(--s2)' }}>
              <button
                type="button"
                onClick={() => setShowJson(!showJson)}
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--info-strong)',
                  padding: '4px 10px',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 'var(--fs-label)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all var(--dur-fast) var(--ease)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
                  e.currentTarget.style.boxShadow = 'var(--glow-blue)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {showJson ? 'Hide Raw Verified JSON' : 'Inspect Raw Verified JSON'}
              </button>

              {showJson && (
                <pre
                  style={{
                    marginTop: '10px',
                    padding: 'var(--s3)',
                    backgroundColor: 'var(--surface-inset)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--r-sm)',
                    maxHeight: '300px',
                    overflow: 'auto',
                    fontSize: 'var(--fs-label)',
                    color: 'var(--info-strong)',
                    lineHeight: 1.5,
                  }}
                >
                  {JSON.stringify(rawData, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
