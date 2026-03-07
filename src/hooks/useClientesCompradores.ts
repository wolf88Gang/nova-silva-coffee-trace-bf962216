/**
 * Hook to fetch clientes_compradores from Supabase.
 * Scoped by organization_id. Falls back to demo data.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { ORG_KEY, TABLE } from '@/lib/keys';

export interface ClienteComprador {
  id: string;
  organization_id: string;
  nombre: string;
  pais: string | null;
  contacto: string | null;
  email: string | null;
  telefono: string | null;
  notas: string | null;
  created_at: string;
}

const DEMO_CLIENTES: ClienteComprador[] = [
  { id: '1', organization_id: '', nombre: 'European Coffee Trading GmbH', pais: 'Alemania', contacto: 'Hans Mueller', email: 'hans@ect-coffee.de', telefono: null, notas: null, created_at: '' },
  { id: '2', organization_id: '', nombre: 'Nordic Roasters AB', pais: 'Suecia', contacto: 'Erik Johansson', email: 'erik@nordic-roasters.se', telefono: null, notas: null, created_at: '' },
  { id: '3', organization_id: '', nombre: 'Specialty Imports LLC', pais: 'Estados Unidos', contacto: 'Sarah Johnson', email: 'sarah@specialty-imports.com', telefono: null, notas: null, created_at: '' },
  { id: '4', organization_id: '', nombre: 'Tokyo Beans Co.', pais: 'Japón', contacto: 'Yuki Tanaka', email: 'yuki@tokyobeans.jp', telefono: null, notas: null, created_at: '' },
  { id: '5', organization_id: '', nombre: 'Melbourne Roast Co.', pais: 'Australia', contacto: 'James Wright', email: 'james@melbourneroast.com.au', telefono: null, notas: null, created_at: '' },
];

export function useClientesCompradores() {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['clientes-compradores', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE.CLIENTES_COMPRADORES)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return DEMO_CLIENTES;
      return data as ClienteComprador[];
    },
    placeholderData: DEMO_CLIENTES,
  });
}
