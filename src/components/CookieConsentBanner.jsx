import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieConsentBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('terminal_cookie_consent');
      if (!stored) {
        setDismissed(false);
      }
    } catch {
      // In case localStorage is disabled
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('terminal_cookie_consent', 'accepted');
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Consent"
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        right: 20,
        maxWidth: 580,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🛡️</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
            Privacy &amp; Local Storage Notice
          </span>
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(99, 102, 241, 0.2)',
              color: 'var(--accent-strong)',
              fontWeight: 600,
            }}
          >
            By Sahil
          </span>
        </div>
        <button
          type="button"
          onClick={handleAccept}
          aria-label="Close notification"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 16,
            padding: 2,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        This terminal stores your chart indicators, timeframe selections, and watchlist locally on your device. We use strictly zero third-party advertising cookies and never sell your telemetry. Handcrafted with high standards by <strong>Sahil</strong>.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <Link
          to="/privacy"
          style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline' }}
        >
          Privacy Policy
        </Link>
        <Link
          to="/terms"
          style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline' }}
        >
          Terms
        </Link>
        <button
          type="button"
          onClick={handleAccept}
          style={{
            background: 'linear-gradient(135deg, var(--accent), #4338CA)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Acknowledge &amp; Continue
        </button>
      </div>
    </aside>
  );
}
