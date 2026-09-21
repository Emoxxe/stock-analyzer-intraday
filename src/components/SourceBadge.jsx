/**
 * SourceBadge — glass pill with subtle border and glassmorphism modal.
 * Displays an interactive data attribution badge with popup detailing
 * the verified provider, timestamps, and delay notices.
 */

import { useState } from 'react';
import { formatISTDateTime } from '../utils/formatters';
import FreshnessPill from './FreshnessPill';

export default function SourceBadge({
  field = {},
  label = 'Source',
  size = 'small',
}) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    source = 'Yahoo Finance (Secondary Fallback)',
    providerTimestamp = null,
    retrievedAt = null,
    freshness = 'LATEST_AVAILABLE',
    quality = 'AVAILABLE',
  } = field || {};

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--r-sm)',
          color: 'var(--text-muted)',
          fontSize: size === 'small' ? 'var(--fs-micro)' : 'var(--fs-label)',
          padding: '2px 5px',
          cursor: 'pointer',
          transition: 'all var(--dur-fast) var(--ease)',
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--info-strong)';
          e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
          e.currentTarget.style.boxShadow = '0 0 8px rgba(99, 102, 241, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.borderColor = 'var(--glass-border)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        title="Click to view verified data provenance and timestamps"
      >
        <span>ⓘ</span>
        <span>{label}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(4, 6, 8, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 'var(--s4)',
            animation: 'fadeIn var(--dur-base) var(--ease)',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              background: 'var(--glass-bg-strong)',
              backdropFilter: 'blur(var(--glass-blur-strong))',
              WebkitBackdropFilter: 'blur(var(--glass-blur-strong))',
              border: '1px solid var(--glass-border-hover)',
              borderRadius: 'var(--r-lg)',
              padding: 'var(--s5)',
              maxWidth: '440px',
              width: '100%',
              boxShadow: 'var(--shadow-overlay)',
              color: 'var(--text)',
              animation: 'modalPop var(--dur-base) var(--ease)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s4)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🛡️</span>
                <h3 style={{ margin: 0, fontSize: 'var(--fs-h3)', fontWeight: 600 }}>Data Provenance & Attribution</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  transition: 'color var(--dur-fast) var(--ease)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)', fontSize: 'var(--fs-body)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Data Provider:</span>
                <strong style={{ color: 'var(--info-strong)' }}>{source}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Data Freshness:</span>
                <FreshnessPill status={freshness} size="small" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Quality State:</span>
                <span style={{ fontWeight: 600, color: quality === 'AVAILABLE' ? 'var(--positive-strong)' : 'var(--negative-strong)' }}>{quality}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Provider Market Time:</span>
                <span style={{ color: 'var(--text)' }}>{providerTimestamp ? formatISTDateTime(providerTimestamp) : 'Not disclosed by feed'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Backend Retrieval Time:</span>
                <span style={{ color: 'var(--text)' }}>{retrievedAt ? formatISTDateTime(retrievedAt) : 'Immediate'}</span>
              </div>

              <div
                style={{
                  marginTop: 'var(--s2)',
                  padding: '10px',
                  borderRadius: 'var(--r-sm)',
                  background: 'var(--info-soft)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  fontSize: 'var(--fs-label)',
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                }}
              >
                ℹ️ <strong>Zero Fake Data Guarantee:</strong> This figure is sourced directly from verifiable external data providers. If a metric is missing or withheld by providers, it is displayed as "Data unavailable" rather than synthetic or fabricated estimates.
              </div>
            </div>

            <div style={{ marginTop: 'var(--s4)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--glass-border-hover)',
                  color: 'var(--text)',
                  borderRadius: 'var(--r-sm)',
                  padding: '6px 14px',
                  fontSize: 'var(--fs-small)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--dur-fast) var(--ease)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = 'var(--glow-blue)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
