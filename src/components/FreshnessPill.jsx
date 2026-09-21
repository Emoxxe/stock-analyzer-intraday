/**
 * FreshnessPill Component — richer glow states.
 * 🟢 Live (green glow) | 🟡 Delayed (amber glow) | 🔵 Latest | ⚪ Historical | 🔴 Unavailable (red glow)
 */

export default function FreshnessPill({ status = 'LATEST_AVAILABLE', size = 'normal', showText = true }) {
  const normalized = (status || '').toUpperCase();

  const configs = {
    LIVE: {
      color: 'var(--positive-strong)',
      bg: 'var(--positive-soft)',
      border: 'rgba(34, 214, 114, 0.3)',
      glow: 'var(--glow-green)',
      text: 'Live',
      dot: '●',
    },
    DELAYED: {
      color: 'var(--warning-strong)',
      bg: 'var(--warning-soft)',
      border: 'rgba(251, 191, 36, 0.3)',
      glow: 'var(--glow-amber)',
      text: 'Delayed (~15m)',
      dot: '●',
    },
    LATEST_AVAILABLE: {
      color: 'var(--info-strong)',
      bg: 'var(--info-soft)',
      border: 'rgba(59, 130, 246, 0.3)',
      glow: 'var(--glow-blue)',
      text: 'Latest available',
      dot: '●',
    },
    HISTORICAL: {
      color: 'var(--text-muted)',
      bg: 'rgba(148, 163, 184, 0.08)',
      border: 'rgba(148, 163, 184, 0.2)',
      glow: 'none',
      text: 'Historical',
      dot: '○',
    },
    UNAVAILABLE: {
      color: 'var(--negative-strong)',
      bg: 'var(--negative-soft)',
      border: 'rgba(255, 107, 107, 0.3)',
      glow: 'var(--glow-red)',
      text: 'Data unavailable',
      dot: '●',
    },
  };

  const cfg = configs[normalized] || configs.LATEST_AVAILABLE;
  const isSmall = size === 'small';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '4px' : '6px',
        padding: isSmall ? '2px 6px' : '4px 8px',
        borderRadius: 'var(--r-pill)',
        fontSize: isSmall ? 'var(--fs-label)' : 'var(--fs-small)',
        fontWeight: 600,
        color: cfg.color,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: cfg.glow,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        transition: 'all var(--dur-fast) var(--ease)',
      }}
      title={`Data Freshness: ${cfg.text}`}
    >
      <span style={{ fontSize: isSmall ? '7px' : '8px', color: cfg.color }}>{cfg.dot}</span>
      {showText && <span>{cfg.text}</span>}
    </span>
  );
}
