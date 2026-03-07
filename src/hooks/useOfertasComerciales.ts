/**
 * Hook to fetch ofertas_comerciales from Supabase.
 * Scoped by organization_id. Falls back to demo data.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { ORG_KEY, TABLE } from '@/lib/keys';

export interface OfertaComercial {
  id: string;
  organization_id: string;
  lote_comercial_id: string | null;
  lote_code: string | null;
  exportador_nombre: string | null;
  exportador_org_id: string | null;
  volumen_kg: number | null;
  precio_ofertado: number | null;
  condiciones_pago: string | null;
  fecha_oferta: string | null;
  notas: string | null;
  riesgo: string | null;
  estado: 'pendiente' | 'aceptada' | 'rechazada' | 'contraoferta';
  es_vip: boolean;
  fecha_respuesta: string | null;
  created_at: string;
}

const DEMO_OFERTAS: OfertaComercial[] = [
  { id: '1', organization_id: '', lote_comercial_id: null, lote_code: 'SOL-2024-001', exportador_nombre: 'Volcafe S.A.', exportador_org_id: null, volumen_kg: 1500, precio_ofertado: 4.15, condiciones_pago: 'Net 30', fecha_oferta: '2026-02-20', notas: 'Interesados en volumen completo.', riesgo: 'bajo', estado: 'pendiente', es_vip: true, fecha_respuesta: null, created_at: '' },
  { id: '2', organization_id: '', lote_comercial_id: null, lote_code: 'MV-2024-015', exportador_nombre: 'Nordic Approach', exportador_org_id: null, volumen_kg: 2200, precio_ofertado: 4.65, condiciones_pago: 'Net 0 (pago inmediato)', fecha_oferta: '2026-02-18', notas: 'Specialty buyer.', riesgo: 'bajo', estado: 'pendiente', es_vip: false, fecha_respuesta: null, created_at: '' },
  { id: '3', organization_id: '', lote_comercial_id: null, lote_code: 'SN-2024-008', exportador_nombre: 'Mercon Coffee', exportador_org_id: null, volumen_kg: 850, precio_ofertado: 3.80, condiciones_pago: 'Net 90', fecha_oferta: '2026-02-15', notas: 'Condicional a EUDR.', riesgo: 'medio', estado: 'pendiente', es_vip: false, fecha_respuesta: null, created_at: '' },
  { id: '4', organization_id: '', lote_comercial_id: null, lote_code: 'SOL-2024-002', exportador_nombre: 'CECA Trading', exportador_org_id: null, volumen_kg: 680, precio_ofertado: 3.95, condiciones_pago: 'Net 60', fecha_oferta: '2026-02-10', notas: '', riesgo: 'bajo', estado: 'aceptada', es_vip: true, fecha_respuesta: '2026-02-12', created_at: '' },
];

export function useOfertasComerciales() {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['ofertas-comerciales', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE.OFERTAS_COMERCIALES)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return DEMO_OFERTAS;
      return data as OfertaComercial[];
    },
    placeholderData: DEMO_OFERTAS,
  });
}

export function useResponderOferta() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: 'aceptada' | 'rechazada' | 'contraoferta' }) => {
      const { error } = await supabase
        .from('ofertas_comerciales')
        .update({ estado, fecha_respuesta: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ofertas-comerciales'] });
    },
  });
}
