import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProductorRow {
  id: string;
  cooperativa_id: string;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  comunidad: string | null;
  region: string | null;
  pais: string | null;
  fecha_ingreso: string | null;
  activo: boolean;
  parcelas_count: number;
  hectareas_total: number;
  eudr_status: 'compliant' | 'pending' | 'non-compliant';
  puntaje_vital: number | null;
}

interface RawProductor {
  id: string;
  cooperativa_id: string;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  comunidad: string | null;
  region: string | null;
  pais: string | null;
  fecha_ingreso: string | null;
  activo: boolean;
}

async function fetchProductores(): Promise<ProductorRow[]> {
  const { data: productores, error } = await supabase
    .from('productores')
    .select('*')
    .eq('activo', true)
    .order('nombre');

  if (error) throw error;
  if (!productores || productores.length === 0) return [];

  const ids = productores.map((p: RawProductor) => p.id);

  const { data: parcelasAgg } = await supabase
    .from('parcelas')
    .select('productor_id, id, area_hectareas, eudr_geoloc_estado')
    .in('productor_id', ids);

  const parcelasByProductor = new Map<string, { count: number; hectareas: number; eudrStatuses: string[] }>();
  for (const parc of parcelasAgg ?? []) {
    const entry = parcelasByProductor.get(parc.productor_id) ?? { count: 0, hectareas: 0, eudrStatuses: [] };
    entry.count += 1;
    entry.hectareas += Number(parc.area_hectareas ?? 0);
    if (parc.eudr_geoloc_estado) entry.eudrStatuses.push(parc.eudr_geoloc_estado);
    parcelasByProductor.set(parc.productor_id, entry);
  }

  return productores.map((p: RawProductor): ProductorRow => {
    const agg = parcelasByProductor.get(p.id);
    let eudr: ProductorRow['eudr_status'] = 'pending';
    if (agg && agg.eudrStatuses.length > 0) {
      if (agg.eudrStatuses.every(s => s === 'verificado' || s === 'compliant')) eudr = 'compliant';
      else if (agg.eudrStatuses.some(s => s === 'rechazado' || s === 'non-compliant')) eudr = 'non-compliant';
    }

    return {
      id: p.id,
      cooperativa_id: p.cooperativa_id,
      nombre: p.nombre,
      cedula: p.cedula,
      telefono: p.telefono,
      email: p.email,
      comunidad: p.comunidad,
      region: p.region,
      pais: p.pais,
      fecha_ingreso: p.fecha_ingreso,
      activo: p.activo,
      parcelas_count: agg?.count ?? 0,
      hectareas_total: Math.round((agg?.hectareas ?? 0) * 10) / 10,
      eudr_status: eudr,
      puntaje_vital: null,
    };
  });
}

export function useProductores() {
  const { isAuthenticated, session } = useAuth();

  return useQuery({
    queryKey: ['productores', session?.user?.id],
    queryFn: fetchProductores,
    enabled: isAuthenticated && !!session,
    staleTime: 30_000,
  });
}
