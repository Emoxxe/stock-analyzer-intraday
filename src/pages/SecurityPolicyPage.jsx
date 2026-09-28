import { Link } from 'react-router-dom';
import { panelStyle } from '../utils/ui.jsx';

export default function SecurityPolicyPage() {
  return (
    <div className="fade-in" style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--s8) var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}>
      {/* Breadcrumb & Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terminal</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)' }}>Security Policy</span>
        </div>
        <h1 className="gradient-text" style={{ fontSize: 'var(--fs-h1)', fontWeight: 800, margin: '0 0 8px' }}>
          Security &amp; Vulnerability Disclosure Policy
        </h1>
        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)', margin: 0 }}>
          Coordinated Vulnerability Disclosure · Maintained by Sahil
        </p>
      </div>

      <div style={{ ...panelStyle, padding: 'var(--s8)', display: 'flex', flexDirection: 'column', gap: 'var(--s6)', lineHeight: 1.7 }}>
        <section>
          <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            1. Security Posture &amp; Standards
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            We take application security and market data integrity seriously. This web application runs under modern Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), frame-ancestor protections, and strict CORS controls on serverless endpoints.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            2. Reporting a Vulnerability
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            If you believe you have found a security vulnerability in this terminal, please disclose it responsibly. Do not perform denial of service, social engineering, or compromise personal privacy.
          </p>
          <ul style={{ color: 'var(--text-secondary)', marginTop: 8, paddingLeft: 20 }}>
            <li><strong>Security Lead:</strong> Sahil</li>
            <li><strong>Email:</strong> <a href="mailto:sahil@users.noreply.github.com" style={{ color: 'var(--accent-strong)' }}>sahil@users.noreply.github.com</a></li>
            <li><strong>Canonical security.txt:</strong> <a href="/.well-known/security.txt" style={{ color: 'var(--accent-strong)' }}>/.well-known/security.txt</a></li>
            <li><strong>Humans credit:</strong> <a href="/humans.txt" style={{ color: 'var(--accent-strong)' }}>/humans.txt</a></li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            3. Safe Harbor
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Any activities conducted in a manner consistent with this policy will be considered authorized conduct, and we will not initiate legal action against you for accidental, good-faith violations.
          </p>
        </section>
      </div>
    </div>
  );
}
