import type React from 'react';

/**
 * Shared Recharts tooltip style that respects dark/light mode via CSS variables.
 */
export const tooltipStyle: React.CSSProperties = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  color: 'hsl(var(--foreground))',
  fontSize: 12,
};
