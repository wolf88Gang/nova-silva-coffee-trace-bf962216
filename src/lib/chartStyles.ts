import type React from 'react';

/**
 * Shared Recharts tooltip styles that respect dark/light mode via CSS variables.
 * contentStyle only sets the wrapper; itemStyle/labelStyle override Recharts' inline colors.
 */
export const tooltipStyle: React.CSSProperties = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  color: 'hsl(var(--foreground))',
  fontSize: 12,
};

/** Apply to Tooltip itemStyle to fix text color in dark mode */
export const tooltipItemStyle: React.CSSProperties = {
  color: 'hsl(var(--foreground))',
};

/** Apply to Tooltip labelStyle to fix label color in dark mode */
export const tooltipLabelStyle: React.CSSProperties = {
  color: 'hsl(var(--foreground))',
};

/** Cursor fill for bar/area charts on hover */
export const chartCursorStyle = { fill: 'hsl(var(--muted))' };
