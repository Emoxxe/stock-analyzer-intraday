import { Link } from 'react-router-dom';
import { panelStyle } from '../utils/ui.jsx';

export default function PrivacyPolicyPage() {
  return (
    <div className="fade-in" style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--s8) var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}>
      {/* Breadcrumb & Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terminal</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)' }}>Privacy Policy</span>
        </div>
        <h1 className="gradient-text" style={{ fontSize: 'var(--fs-h1)', fontWeight: 800, margin: '0 0 8px' }}>
          Privacy Policy &amp; Data Ethics
        </h1>
        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)', margin: 0 }}>
          Last updated: September 2026 · Maintained &amp; Authored by Sahil
        </p>
      </div>

      <div style={{ ...panelStyle, padding: 'var(--s8)', display: 'flex', flexDirection: 'column', gap: 'var(--s6)', lineHeight: 1.7 }}>
        <section>
          <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            1. Zero-Tracker Commitment
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            This Indian Stock &amp; Intraday Intelligence Terminal was personally designed and engineered by <strong>Sahil</strong> with a strict privacy-first architecture. We do not sell, rent, monetize, or broker personal user data to third-party ad networks, data brokers, or marketing consortiums.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            2. Local Browser Storage &amp; Cache
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            To deliver ultra-low latency financial charting without requiring a personal user account, your chart settings, timeframe preferences, and watchlist selections are stored strictly inside your browser&apos;s <code>localStorage</code>. This data never leaves your client device unless you explicitly export or clear your browser cache.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            3. Server Telemetry &amp; Public Market Feeds
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Our Node.js / Express proxy queries publicly accessible equity endpoints for NSE and BSE ticker quotes and corporate disclosures. When your browser makes an API request to <code>/api/market/...</code>, standard non-identifying server diagnostic logs (timestamp, HTTP status code, request path) are retained temporarily for rate-limiting and DDoS mitigation purposes.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            4. Cookie &amp; Storage Usage
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            We do not inject third-party advertising cookies or cross-site tracking pixels. Any stored cookies or token stores are strictly necessary for session routing, load balancing, and anti-abuse verification under European GDPR, ePrivacy Directive, and Indian Digital Personal Data Protection Act (DPDPA) guidelines.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            5. Contact the Engineer
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            For privacy inquiries, rights erasure requests, or architecture verification, contact the developer directly at{' '}
            <a href="mailto:sahil@users.noreply.github.com" style={{ color: 'var(--accent-strong)', textDecoration: 'none' }}>
              sahil@users.noreply.github.com
            </a>{' '}
            or view team credits at <Link to="/coverage" style={{ color: 'var(--accent-strong)', textDecoration: 'none' }}>Transparency</Link> and{' '}
            <a href="/humans.txt" style={{ color: 'var(--accent-strong)', textDecoration: 'none' }}>humans.txt</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
