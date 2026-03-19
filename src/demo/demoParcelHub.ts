/**
 * Fallback de ficha parcela para demo.
 * Cuando useParcelHubSummary no encuentra en Supabase y org es demo.
 */
import type { ParcelHubSummary } from '@/hooks/useParcelHubSummary';
import { DEMO_PARCELAS } from '@/config/demoParcelas';

const DEMO_HUB_BY_ID: Record<string, Omit<ParcelHubSummary, 'parcela_id' | 'organization_id'>> = {
  'parcela-1': {
    productor_id: null,
    productor_nombre: 'Juan Pérez',
    parcela_nombre: 'Lote Norte',
    area_ha: 2.5,
    variedad: 'Caturra',
    altitud: 1450,
    ultimo_plan_nutricion_estado: 'En ejecución',
    ultimo_diagnostico_guard_riesgo: 'Media',
    ultima_estimacion_yield_fecha: '2025-03-01',
    ultimo_score_vital: 78,
    tiene_evidencias: true,
    tiene_jornales: true,
    tiene_eudr: true,
    tiene_novacup: true,
  },
  'parcela-2': {
    productor_id: null,
    productor_nombre: 'María García',
    parcela_nombre: 'El Mirador',
    area_ha: 3.2,
    variedad: 'Castillo',
    altitud: 1520,
    ultimo_plan_nutricion_estado: 'Completado',
    ultimo_diagnostico_guard_riesgo: null,
    ultima_estimacion_yield_fecha: '2025-02-28',
    ultimo_score_vital: 82,
    tiene_evidencias: true,
    tiene_jornales: true,
    tiene_eudr: false,
    tiene_novacup: true,
  },
  'parcela-3': {
    productor_id: null,
    productor_nombre: 'Pedro Técnico',
    parcela_nombre: 'La Esperanza',
    area_ha: 1.8,
    variedad: 'Colombia',
    altitud: 1380,
    ultimo_plan_nutricion_estado: 'Pendiente',
    ultimo_diagnostico_guard_riesgo: 'Baja',
    ultima_estimacion_yield_fecha: '2025-02-25',
    ultimo_score_vital: 65,
    tiene_evidencias: false,
    tiene_jornales: true,
    tiene_eudr: false,
    tiene_novacup: false,
  },
};

/** Genera fallback para parcela demo por ID */
export function getDemoParcelHubFallback(
  parcelId: string,
  organizationId: string = 'demo'
): ParcelHubSummary | null {
  const base = DEMO_HUB_BY_ID[parcelId];
  if (!base) {
    const p = DEMO_PARCELAS.find((x) => x.id === parcelId);
    if (!p) return null;
    return {
      parcela_id: parcelId,
      organization_id: organizationId,
      productor_id: null,
      productor_nombre: p.productorName,
      parcela_nombre: p.name,
      area_ha: 2.0,
      variedad: 'Caturra',
      altitud: 1400,
      ultimo_plan_nutricion_estado: null,
      ultimo_diagnostico_guard_riesgo: null,
      ultima_estimacion_yield_fecha: null,
      ultimo_score_vital: null,
      tiene_evidencias: false,
      tiene_jornales: false,
      tiene_eudr: false,
      tiene_novacup: false,
    };
  }
  return {
    parcela_id: parcelId,
    organization_id: organizationId,
    ...base,
  };
}
