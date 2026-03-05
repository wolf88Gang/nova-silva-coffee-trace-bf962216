/**
 * Canonical VITAL level definitions per Protocolo VITAL document.
 *
 * Rangos IGRN (0–100):
 *   0–40  → Crítica    🔴  (Colapso Inminente)
 *   41–60 → Fragilidad 🟠  (Fragilidad Sistémica)
 *   61–80 → En Construcción 🟡  (Resiliencia en Construcción)
 *   81–100 → Resiliente 🟢  (Sostenibilidad Consolidada)
 *
 * Source: Modelo Protocolo VITAL Cafetalero — Nova Silva
 */

export interface VitalLevel {
  label: string;
  emoji: string;
  /** Text color class */
  textColor: string;
  /** Badge/bg color class */
  bgColor: string;
  /** Combined badge styling (bg + text + border) */
  badgeColor: string;
}

export function getVitalLevel(score: number): VitalLevel {
  if (score >= 81) return {
    label: 'Resiliente',
    emoji: '🟢',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  };
  if (score >= 61) return {
    label: 'En Construcción',
    emoji: '🟡',
    textColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  };
  if (score >= 41) return {
    label: 'Fragilidad',
    emoji: '🟠',
    textColor: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    badgeColor: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  };
  return {
    label: 'Crítica',
    emoji: '🔴',
    textColor: 'text-destructive',
    bgColor: 'bg-destructive/10',
    badgeColor: 'bg-destructive/10 text-destructive border-destructive/30',
  };
}

/** VITAL filter options for Select components */
export const VITAL_FILTER_OPTIONS = [
  'Crítica',
  'Fragilidad',
  'En Construcción',
  'Resiliente',
] as const;

/** Chart cell fill color based on VITAL score */
export function getVitalChartColor(score: number): string {
  if (score >= 81) return 'hsl(142, 60%, 40%)';
  if (score >= 61) return 'hsl(45, 90%, 50%)';
  if (score >= 41) return 'hsl(30, 90%, 50%)';
  return 'hsl(0, 65%, 50%)';
}
