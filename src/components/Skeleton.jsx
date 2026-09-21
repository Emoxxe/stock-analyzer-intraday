/**
 * Skeleton loading primitives — glass-compatible shimmer.
 * Uses the global .skeleton class with upgraded animations.
 */

export default function Skeleton({ width = '100%', height = '14px', radius = 6, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonRow({ lines = 1, lastWidth = '60%', gap = 10, height = 13, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={height} width={i === lines - 1 ? lastWidth : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 4, cols = 5, height = 16, gridGap = 12, cellMin = 60 }) {
  const colWidth = `calc((100% - ${(cols - 1) * gridGap}px) / ${cols})`;
  return (
    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(${cellMin}px, 1fr))`, gap: gridGap }}>
      {Array.from({ length: rows * cols }).map((_, i) => (
        <Skeleton key={i} height={height} width={colWidth} />
      ))}
    </div>
  );
}