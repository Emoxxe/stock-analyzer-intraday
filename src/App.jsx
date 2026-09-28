import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import SearchModal from './components/SearchModal';
import CookieConsentBanner from './components/CookieConsentBanner';
import DashboardPage from './pages/DashboardPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import SectorExplorerPage from './pages/SectorExplorerPage';
import CoverageAboutPage from './pages/CoverageAboutPage';
import IntradayPage from './pages/IntradayPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import SecurityPolicyPage from './pages/SecurityPolicyPage';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <SearchModal />
        <CookieConsentBanner />

        <main id="app-main" style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/company/:symbol" element={<CompanyProfilePage />} />
            <Route path="/sectors" element={<SectorExplorerPage />} />
            <Route path="/intraday" element={<IntradayPage />} />
            <Route path="/coverage" element={<CoverageAboutPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/security" element={<SecurityPolicyPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </main>

        {/* Institutional Human-Crafted Terminal Footer */}
        <footer
          style={{
            borderTop: '1px solid var(--glass-border)',
            padding: '32px var(--s6) 24px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            background: 'var(--glass-bg-strong)',
            backdropFilter: 'blur(16px)',
            marginTop: 'auto',
          }}
        >
          <div
            style={{
              maxWidth: 'var(--content-max)',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* Top row: Brand & Human Creator Signature */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '20px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div style={{ maxWidth: '420px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: '#f8fafc', letterSpacing: '-0.02em' }}>
                    Stock &amp; Intraday Intelligence Terminal
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: 'var(--accent-strong)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    Engineered by Sahil
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  High-performance Indian equity workstation and intraday momentum scanner. Handcrafted by <strong>Sahil</strong> with zero synthetic or fake data architecture. Built for traders, analysts, and market quants.
                </p>
              </div>

              {/* Navigation Columns */}
              <div style={{ display: 'flex', gap: '36px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)', display: 'block', marginBottom: 10 }}>
                    Terminal
                  </span>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li><Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Markets Overview</Link></li>
                    <li><Link to="/intraday" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Intraday Scanner</Link></li>
                    <li><Link to="/sectors" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Sector Heatmap</Link></li>
                    <li><Link to="/coverage" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Provenance &amp; Health</Link></li>
                  </ul>
                </div>

                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)', display: 'block', marginBottom: 10 }}>
                    Trust &amp; Legal
                  </span>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li><Link to="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</Link></li>
                    <li><Link to="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms &amp; Disclaimers</Link></li>
                    <li><Link to="/security" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Security Policy</Link></li>
                    <li><a href="/humans.txt" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>humans.txt</a></li>
                  </ul>
                </div>

                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)', display: 'block', marginBottom: 10 }}>
                    Engineer
                  </span>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li><span style={{ color: 'var(--text-secondary)' }}>Architect: Sahil</span></li>
                    <li><a href="https://github.com/Emoxxe" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-strong)', textDecoration: 'none' }}>GitHub Profile</a></li>
                    <li><a href="/llm.txt" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>llm.txt Policy</a></li>
                    <li><a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Sitemap XML</a></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Row: SEBI disclaimer and copyright */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                fontSize: '11px',
                color: 'var(--text-disabled)',
              }}
            >
              <span>
                &copy; {new Date().getFullYear()} Sahil. All rights reserved. Indian Stock &amp; Intraday Terminal. Not SEBI registered investment advice.
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  Zero Fake Data Verified
                </span>
                <span>·</span>
                <span>Crafted by Sahil</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}