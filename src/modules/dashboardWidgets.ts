/**
 * Dashboard widget definitions per module.
 *
 * Each active module can contribute widgets to the unified dashboard.
 * The dashboard renders widgets from all active modules — no per-orgTipo forks.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Users, Map, Package, Shield, Leaf, Wallet, Award,
  DollarSign, AlertTriangle, Coffee, BarChart3,
} from 'lucide-react';

export interface DashboardWidget {
  moduleId: string;
  id: string;
  label: string;
  icon: LucideIcon;
  /** Priority: lower = rendered first */
  priority: number;
  /** Widget size hint */
  size: 'sm' | 'md' | 'lg';
}

export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  // Core actors
  { moduleId: 'core_actors', id: 'actors_summary', label: 'Resumen Actores', icon: Users, priority: 10, size: 'md' },

  // Parcelas
  { moduleId: 'core_plots', id: 'plots_map', label: 'Mapa de Parcelas', icon: Map, priority: 20, size: 'lg' },

  // Entregas
  { moduleId: 'core_deliveries', id: 'deliveries_recent', label: 'Entregas Recientes', icon: Package, priority: 15, size: 'md' },

  // VITAL
  { moduleId: 'vital_clima', id: 'vital_score', label: 'Índice VITAL', icon: Shield, priority: 5, size: 'sm' },

  // EUDR
  { moduleId: 'eudr', id: 'eudr_compliance', label: 'Cumplimiento EUDR', icon: Leaf, priority: 8, size: 'sm' },

  // Nova Guard
  { moduleId: 'nova_guard', id: 'guard_alerts', label: 'Alertas Activas', icon: AlertTriangle, priority: 3, size: 'sm' },

  // Credits
  { moduleId: 'credits', id: 'credits_summary', label: 'Cartera de Créditos', icon: Wallet, priority: 30, size: 'md' },

  // Finance
  { moduleId: 'finance', id: 'finance_overview', label: 'Resumen Financiero', icon: DollarSign, priority: 25, size: 'md' },

  // Quality
  { moduleId: 'quality_cupping', id: 'quality_scores', label: 'Puntajes Nova Cup', icon: Award, priority: 35, size: 'sm' },

  // Exporter trade
  { moduleId: 'exporter_trade', id: 'trade_pipeline', label: 'Pipeline Comercial', icon: Coffee, priority: 12, size: 'lg' },

  // Governance
  { moduleId: 'governance', id: 'governance_score', label: 'Diagnóstico Org', icon: BarChart3, priority: 40, size: 'sm' },
];

/**
 * Get widgets for active modules, sorted by priority.
 */
export function getActiveWidgets(activeModuleIds: string[]): DashboardWidget[] {
  const idSet = new Set(activeModuleIds);
  return DASHBOARD_WIDGETS
    .filter(w => idSet.has(w.moduleId))
    .sort((a, b) => a.priority - b.priority);
}
