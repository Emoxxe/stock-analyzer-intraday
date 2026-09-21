/**
 * SectorExplorerPage — glass panels with hover interactions.
 * Indian Sectors and Constituent Explorer with design system tokens.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SourceBadge from '../components/SourceBadge';

export default function SectorExplorerPage() {
  const [sectorsData, setSectorsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState('ALL');

  useEffect(() => {
    async function fetchSectors() {
      setLoading(true);
      try {
        const res = await fetch('/api/search/universe');
        if (res.ok) {
          const data = await res.json();
          const companiesList = data.companies || data.data?.companies || [];
          const grouped = {};
          companiesList.forEach((c) => {
            const sec = c.sector || 'Diversified / Conglomerates';
            if (!grouped[sec]) {
              grouped[sec] = [];
            }
            grouped[sec].push(c);
          });

          const list = Object.entries(grouped).map(([sector, constituents]) => ({
            sector,
            count: constituents.length,
            constituents,
          }));

          setSectorsData(list);
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }

    fetchSectors();
  }, []);

  const allSectors = ['ALL', ...sectorsData.map((s) => s.sector)];
  const displayedSectors =
    selectedSector === 'ALL'
      ? sectorsData
      : sectorsData.filter((s) => s.sector === selectedSector);

  return (
    <div className="fade-in" style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}>
      <div style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: 'var(--s5)',
      }}>
        <h1 className="gradient-text" style={{ margin: '0 0 6px 0', fontSize: 'var(--fs-h1)', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Indian Sectors & Index Universe Explorer
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--fs-body)', color: 'var(--text-muted)' }}>
          Explore verified constituents across Indian economic sectors with ISIN verification and direct intelligence links.
        </p>

        {/* Sector Filter Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s2)', marginTop: 'var(--s4)' }}>
          {allSectors.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              style={{
                background: selectedSector === sec ? 'var(--accent)' : 'var(--glass-bg)',
                color: selectedSector === sec ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${selectedSector === sec ? 'var(--accent)' : 'var(--glass-border)'}`,
                borderRadius: 'var(--r-pill)',
                padding: '5px 12px',
                fontSize: 'var(--fs-small)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--dur-fast) var(--ease)',
              }}
              onMouseEnter={(e) => {
                if (selectedSector !== sec) {
                  e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSector !== sec) {
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 'var(--s10)', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading sector constituents from security master...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s6)' }}>
          {displayedSectors.map((secGroup, groupIdx) => (
            <div
              key={secGroup.sector}
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(var(--glass-blur))',
                WebkitBackdropFilter: 'blur(var(--glass-blur))',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--r-lg)',
                boxShadow: 'var(--shadow-card)',
                padding: 'var(--s5)',
                animation: `cardFadeIn var(--dur-slow) var(--ease) ${groupIdx * 50}ms both`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s4)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, fontSize: 'var(--fs-h3)', fontWeight: 600, color: 'var(--text)' }}>
                    {secGroup.sector}
                  </h2>
                  <span style={{ fontSize: 'var(--fs-label)', color: 'var(--info-strong)', background: 'var(--info-soft)', padding: '2px 6px', borderRadius: 'var(--r-sm)', fontWeight: 600 }}>
                    {secGroup.count} Companies
                  </span>
                </div>
                <SourceBadge
                  field={{
                    source: 'Security Master Database',
                    freshness: 'HISTORICAL',
                    quality: 'AVAILABLE',
                  }}
                  label="Master Registry"
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 'var(--s3)',
                }}
              >
                {secGroup.constituents.map((item) => (
                  <Link
                    key={item.id}
                    to={`/company/${item.primarySymbol}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--r-md)',
                      textDecoration: 'none',
                      gap: '8px',
                      transition: 'all var(--dur-fast) var(--ease)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
                      e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                      e.currentTarget.style.backgroundColor = 'var(--glass-bg)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: 'var(--info-strong)', fontSize: 'var(--fs-body)' }}>{item.primarySymbol}</strong>
                        <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-muted)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '1px 5px', borderRadius: '3px' }}>
                          NSE/BSE
                        </span>
                      </div>
                      <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                        {item.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-micro)', color: 'var(--text-disabled)', borderTop: '1px solid var(--glass-border)', paddingTop: '6px' }}>
                      <span>ISIN: {item.isin}</span>
                      <span style={{ color: 'var(--info-strong)' }}>View →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
