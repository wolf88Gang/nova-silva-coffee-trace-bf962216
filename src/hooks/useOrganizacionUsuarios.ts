import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDefaultPermissions, type RolInterno, type PermissionDefaults } from '@/config/orgPermissions';

export interface OrganizacionUsuario {
  id: string;
  organizacion_id: string;
  user_id: string;
  rol_interno: RolInterno;
  rol_visible: string | null;
  scope: string;
  activo: boolean;
  permiso_gestion_productores: boolean;
  permiso_crear_editar_productores: boolean;
  permiso_ver_parcelas_clima: boolean;
  permiso_gestion_lotes_acopio: boolean;
  permiso_ver_eudr_exportador: boolean;
  permiso_gestion_contratos: boolean;
  permiso_gestion_configuracion_org: boolean;
  permiso_ver_informes_financieros: boolean;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_email: string | null;
}

const TABLE = 'organizacion_usuarios';
const QUERY_KEY = 'organizacion_usuarios';

export function useOrganizacionUsuarios(organizacionId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, organizacionId],
    queryFn: async (): Promise<OrganizacionUsuario[]> => {
      if (!organizacionId) return [];
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select('*')
        .eq('organizacion_id', organizacionId)
        .order('created_at');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizacionId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export interface AddOrgUserInput {
  organizacionId: string;
  email: string;
  name: string;
  rolInterno: RolInterno;
  rolVisible?: string;
  permisos?: Partial<PermissionDefaults>;
}

export function useAddOrganizacionUsuario() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddOrgUserInput) => {
      const tempPassword = crypto.randomUUID().slice(0, 12);
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: input.email,
        password: tempPassword,
        options: { data: { name: input.name } },
      });
      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      await new Promise(r => setTimeout(r, 1500));

      const defaults = getDefaultPermissions(input.rolInterno);
      const permisos = { ...defaults, ...input.permisos };

      const { error } = await (supabase as any).from(TABLE).insert({
        organizacion_id: input.organizacionId,
        user_id: authData.user.id,
        rol_interno: input.rolInterno,
        rol_visible: input.rolVisible ?? null,
        user_name: input.name,
        user_email: input.email,
        ...permisos,
      });
      if (error) throw error;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, input.organizacionId] });
    },
  });
}

export interface UpdateOrgUserInput {
  id: string;
  organizacionId: string;
  rolInterno?: RolInterno;
  rolVisible?: string | null;
  activo?: boolean;
  permisos?: Partial<PermissionDefaults>;
}

export function useUpdateOrganizacionUsuario() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateOrgUserInput) => {
      const updates: Record<string, unknown> = {};
      if (input.rolInterno !== undefined) updates.rol_interno = input.rolInterno;
      if (input.rolVisible !== undefined) updates.rol_visible = input.rolVisible;
      if (input.activo !== undefined) updates.activo = input.activo;
      if (input.permisos) Object.assign(updates, input.permisos);

      const { error } = await (supabase as any)
        .from(TABLE)
        .update(updates)
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, input.organizacionId] });
    },
  });
}

export function useDeleteOrganizacionUsuario() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizacionId }: { id: string; organizacionId: string }) => {
      const { error } = await (supabase as any).from(TABLE).delete().eq('id', id);
      if (error) throw error;
      return organizacionId;
    },
    onSuccess: (organizacionId) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, organizacionId] });
    },
  });
}

export function useCurrentUserPermissions(organizacionId: string | null) {
  const { data: orgUsers } = useOrganizacionUsuarios(organizacionId);

  return useQuery({
    queryKey: ['currentUserPerms', organizacionId],
    queryFn: async (): Promise<OrganizacionUsuario | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !orgUsers) return null;
      return orgUsers.find(u => u.user_id === user.id) ?? null;
    },
    enabled: !!organizacionId && !!orgUsers,
    staleTime: 5 * 60 * 1000,
  });
}
