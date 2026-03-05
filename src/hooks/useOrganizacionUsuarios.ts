/**
 * CRUD hooks for organizacion_usuarios table.
 * Uses (supabase as any) because table is not in generated types yet.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DEFAULT_PERMISSIONS_BY_ROLE,
  type RolInterno,
  type PermissionKey,
  type PermissionDefaults,
} from '@/config/orgPermissions';
import { toast } from 'sonner';

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
const QUERY_KEY = 'organizacion-usuarios';

// ── List ──

export function useOrganizacionUsuarios(organizacionId: string | null | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, organizacionId],
    enabled: !!organizacionId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select('*')
        .eq('organizacion_id', organizacionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as OrganizacionUsuario[];
    },
  });
}

// ── Add ──

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
      // 1. Create auth user with temp password
      const tempPassword = crypto.randomUUID().substring(0, 12);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: tempPassword,
        options: {
          data: { name: input.name, role: 'viewer' },
        },
      });
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('No se pudo crear la cuenta');

      // 2. Wait for profile trigger
      await new Promise((r) => setTimeout(r, 1000));

      // 3. Build permissions from role defaults + overrides
      const defaults = DEFAULT_PERMISSIONS_BY_ROLE[input.rolInterno];
      const permisos = { ...defaults, ...(input.permisos ?? {}) };

      // 4. Insert into organizacion_usuarios
      const { error: insertError } = await (supabase as any).from(TABLE).insert({
        organizacion_id: input.organizacionId,
        user_id: authData.user.id,
        rol_interno: input.rolInterno,
        rol_visible: input.rolVisible || null,
        user_name: input.name,
        user_email: input.email,
        ...permisos,
      });
      if (insertError) throw insertError;

      return { userId: authData.user.id };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, vars.organizacionId] });
      toast.success('Miembro agregado correctamente');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al agregar miembro');
    },
  });
}

// ── Update ──

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
      const payload: Record<string, unknown> = {};
      if (input.rolInterno !== undefined) payload.rol_interno = input.rolInterno;
      if (input.rolVisible !== undefined) payload.rol_visible = input.rolVisible;
      if (input.activo !== undefined) payload.activo = input.activo;
      if (input.permisos) Object.assign(payload, input.permisos);

      const { error } = await (supabase as any)
        .from(TABLE)
        .update(payload)
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, vars.organizacionId] });
      toast.success('Permisos actualizados');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al actualizar');
    },
  });
}

// ── Delete ──

export function useDeleteOrganizacionUsuario() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizacionId }: { id: string; organizacionId: string }) => {
      const { error } = await (supabase as any).from(TABLE).delete().eq('id', id);
      if (error) throw error;
      return { organizacionId };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, result.organizacionId] });
      toast.success('Miembro eliminado');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al eliminar');
    },
  });
}
