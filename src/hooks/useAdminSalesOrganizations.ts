import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminSalesOrganization {
  id: string;
  nombre: string;
  tipo: string | null;
}

export interface AdminSalesOrganizationsResult {
  items: AdminSalesOrganization[];
  source: 'v_admin_organizations_summary' | 'platform_organizations' | null;
  status: 'available' | 'empty' | 'unavailable';
}

function isMissingRelationError(error: any): boolean {
  const message = String(error?.message ?? '').toLowerCase();
  return error?.code === '42P01' || error?.code === 'PGRST205' || message.includes('does not exist');
}

function normalizeOrgRow(row: any): AdminSalesOrganization | null {
  const id = row?.id ?? row?.organization_id ?? null;
  const nombre = row?.nombre ?? row?.organization_name ?? row?.name ?? null;
  const tipo = row?.tipo ?? row?.org_type ?? row?.organization_type ?? null;

  if (!id || !nombre) return null;

  return {
    id: String(id),
    nombre: String(nombre),
    tipo: tipo ? String(tipo) : null,
  };
}

function isActiveRow(row: any): boolean {
  if (typeof row?.is_active === 'boolean') return row.is_active;
  if (typeof row?.activo === 'boolean') return row.activo;
  if (typeof row?.status === 'string') {
    return ['active', 'activo', 'trial'].includes(row.status.toLowerCase());
  }
  return true;
}

async function loadOrganizationsFrom(source: 'v_admin_organizations_summary' | 'platform_organizations' | 'organizaciones') {
  const { data, error } = await supabase
    .from(source as any)
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw error;

  const items = (data ?? [])
    .filter(isActiveRow)
    .map(normalizeOrgRow)
    .filter(Boolean) as AdminSalesOrganization[];

  return items.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function useAdminSalesOrganizations() {
  return useQuery({
    queryKey: ['admin', 'sales', 'organizations'],
    queryFn: async (): Promise<AdminSalesOrganizationsResult> => {
      try {
        const viewItems = await loadOrganizationsFrom('v_admin_organizations_summary');
        return {
          items: viewItems,
          source: 'v_admin_organizations_summary',
          status: viewItems.length > 0 ? 'available' : 'empty',
        };
      } catch (error) {
        if (!isMissingRelationError(error)) throw error;
      }

      try {
        const tableItems = await loadOrganizationsFrom('platform_organizations');
        return {
          items: tableItems,
          source: 'platform_organizations' as any,
          status: tableItems.length > 0 ? 'available' : 'empty',
        };
      } catch (error) {
        if (!isMissingRelationError(error)) throw error;
      }

      try {
        const orgItems = await loadOrganizationsFrom('organizaciones');
        return {
          items: orgItems,
          source: 'organizaciones' as any,
          status: orgItems.length > 0 ? 'available' : 'empty',
        };
      } catch (error) {
        if (!isMissingRelationError(error)) throw error;
      }

      return {
        items: [],
        source: null,
        status: 'unavailable',
      };
    },
    staleTime: 1000 * 60 * 10,
  });
}
