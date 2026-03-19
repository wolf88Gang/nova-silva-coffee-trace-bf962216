/**
 * Labels and constants for the Calibration Review module.
 */

export const SCORE_LABELS: Record<string, string> = {
  pain: 'Pain',
  maturity: 'Maturity',
  urgency: 'Urgency',
  fit: 'Fit',
  budget_readiness: 'Budget Readiness',
};

export const OUTCOME_LABELS: Record<string, string> = {
  won: 'Won',
  lost: 'Lost',
  no_decision: 'No Decision',
};

export const OUTCOME_COLORS: Record<string, string> = {
  won: 'text-success',
  lost: 'text-destructive',
  no_decision: 'text-muted-foreground',
};

export const BUCKET_LABELS: Record<string, string> = {
  low: '1-3',
  mid: '4-7',
  high: '8-10',
};

export const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', path: '/admin/sales/calibration' },
  { key: 'scores', label: 'Scores', path: '/admin/sales/calibration/scores' },
  { key: 'objections', label: 'Bloqueadores', path: '/admin/sales/calibration/objections' },
  { key: 'recommendations', label: 'Próximos pasos', path: '/admin/sales/calibration/recommendations' },
  { key: 'versions', label: 'Versiones', path: '/admin/sales/calibration/versions' },
  { key: 'signals', label: 'Señales', path: '/admin/sales/calibration/signals' },
] as const;

export function fmtPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-CR', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-CR', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
