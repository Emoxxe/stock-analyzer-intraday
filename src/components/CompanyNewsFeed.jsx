/**
 * CompanyNewsFeed — glass card per article with hover lift.
 * Displays verified authentic financial news articles fetched from Google News RSS.
 */

import { formatISTDateTime } from '../utils/formatters';
import SourceBadge from './SourceBadge';

export default function CompanyNewsFeed({ news = [], companyName = '', symbol = '' }) {
  const articles = news || [];

  return (
    <div style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(var(--glass-blur))',
      WebkitBackdropFilter: 'blur(var(--glass-blur))',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-card)',
      padding: 'var(--s5)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s4)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--s3)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--fs-h3)', fontWeight: 600, color: 'var(--text)' }}>
            Corporate News & Intelligence
          </h3>
          <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>
            Verified Real-time RSS Articles for {companyName || symbol}
          </span>
        </div>
        <SourceBadge
          field={{
            source: 'Google News RSS Feed (India Financial Editions)',
            freshness: 'LIVE',
            quality: articles.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
          }}
          label="News Provenance"
        />
      </div>

      {articles.length === 0 ? (
        <div style={{ padding: 'var(--s8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ margin: 0, fontSize: 'var(--fs-body)' }}>No recent verified press articles found for {companyName || symbol}.</p>
          <span style={{ fontSize: 'var(--fs-label)', color: 'var(--text-disabled)', display: 'block', marginTop: '4px' }}>
            Zero Fake News Guarantee: Synthetic or LLM-generated news articles are strictly disabled.
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
          {articles.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                textDecoration: 'none',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--r-md)',
                padding: 'var(--s4)',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: 'var(--fs-body)', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
                  {item.title}
                </h4>
                <span style={{ fontSize: 'var(--fs-body)', color: 'var(--info-strong)', flexShrink: 0 }}>↗</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', fontSize: 'var(--fs-label)', color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--info-strong)', fontWeight: 600 }}>{item.publisher || 'Financial Press'}</span>
                <span>•</span>
                <span>{item.publishedAt ? formatISTDateTime(item.publishedAt) : 'Recent'}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
