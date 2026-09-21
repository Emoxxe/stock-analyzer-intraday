import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SearchModal from './components/SearchModal';
import DashboardPage from './pages/DashboardPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import SectorExplorerPage from './pages/SectorExplorerPage';
import CoverageAboutPage from './pages/CoverageAboutPage';
import IntradayPage from './pages/IntradayPage';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <SearchModal />
        <main id="app-main" style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/company/:symbol" element={<CompanyProfilePage />} />
            <Route path="/sectors" element={<SectorExplorerPage />} />
            <Route path="/intraday" element={<IntradayPage />} />
            <Route path="/coverage" element={<CoverageAboutPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </main>
        <footer
          style={{
            borderTop: '1px solid var(--glass-border)',
            padding: '16px var(--s6)',
            fontSize: '12px',
            color: 'var(--text-muted)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              maxWidth: 'var(--content-max)',
              margin: '0 auto',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span>Indian Stock Intelligence Engine · Verified NSE &amp; BSE equities</span>
            <span>Zero Fake Data Architecture · Provider freshness disclosed</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}