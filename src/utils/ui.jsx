/**
 * Shared UI primitives — Premium glassmorphism design system.
 * All components consume these so the design system stays consistent.
 */

export const panelStyle = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(var(--glass-blur))',
  WebkitBackdropFilter: 'blur(var(--glass-blur))',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--r-lg)',
  boxShadow: 'var(--shadow-sm)',
};

export const panelHeaderStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 'var(--s3)',
  padding: 'var(--s3) var(--s4)',
  borderBottom: '1px solid var(--glass-border)',
};

export const panelTitleStyle = {
  fontSize: 'var(--fs-h3)',
  fontWeight: 600,
  color: 'var(--text)',
  letterSpacing: '-0.01em',
};

export const panelSubStyle = {
  fontSize: 'var(--fs-small)',
  color: 'var(--text-muted)',
};

export const panelBodyStyle = {
  padding: 'var(--s4)',
};

export const cellStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

export const metricLabelStyle = {
  fontSize: 'var(--fs-label)',
  color: 'var(--text-muted)',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

export const metricValueStyle = {
  fontSize: 'var(--num-strong)',
  fontWeight: 600,
  color: 'var(--text)',
  fontVariantNumeric: 'tabular-nums',
  fontFamily: 'var(--font-mono)',
  letterSpacing: '-0.02em',
};

export const tagStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: 'var(--r-pill)',
  fontSize: 'var(--fs-label)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

export const subtleBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(8px)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--r-md)',
  color: 'var(--text-secondary)',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all var(--dur-fast) var(--ease)',
};

export const divHoverStyle = {
  transition: 'background-color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease)',
};

export const glassCardStyle = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(var(--glass-blur))',
  WebkitBackdropFilter: 'blur(var(--glass-blur))',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--r-lg)',
  boxShadow: 'var(--shadow-card)',
  transition: 'all var(--dur-base) var(--ease)',
};

export const metricTileStyle = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(var(--glass-blur))',
  WebkitBackdropFilter: 'blur(var(--glass-blur))',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--r-md)',
  padding: '12px 14px',
  transition: 'all var(--dur-fast) var(--ease)',
};

export const sectionHeaderStyle = {
  fontSize: 'var(--fs-h2)',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: 'var(--text)',
};

/**
 * Toggle button group (segmented control)
 */
export function Segmented({ options, value, onChange, size = 'md', color = 'info' }) {
  const pad = size === 'sm' ? '4px 9px' : '5px 12px';
  const fs = size === 'sm' ? '11px' : '12px';

  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--r-md)',
        padding: '2px',
        gap: '2px',
      }}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              background: isActive ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-muted)',
              border: isActive ? '1px solid var(--glass-border-hover)' : '1px solid transparent',
              padding: pad,
              borderRadius: 'var(--r-sm)',
              fontSize: fs,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all var(--dur-fast) var(--ease)',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Row hover helper for lists/tables.
 */
export const rowHoverStyle = {
  transition: 'background-color var(--dur-fast) var(--ease)',
};