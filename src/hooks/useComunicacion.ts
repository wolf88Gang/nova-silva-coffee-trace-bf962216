import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── Tipos ────────────────────────────────────────────────────────────────

export type AvisoTipo = 'general' | 'alerta' | 'informativo' | 'urgente';
export type AvisoNivel = 'normal' | 'alto' | 'critico';
export type AvisoAlcance = 'interno' | 'productores' | 'publico';
export type AvisoEstado = 'activo' | 'publicado' | 'pausado' | 'archivado';

export interface Aviso {
  id: string;
  cooperativa_id: string;
  titulo: string;
  resumen: string | null;
  texto_largo: string | null;
  tipo: AvisoTipo;
  nivel_importancia: AvisoNivel;
  alcance: AvisoAlcance;
  estado: AvisoEstado;
  fecha_publicacion: string | null;
  fecha_inicio_vigencia: string | null;
  fecha_fin_vigencia: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvisoSectorCafe {
  id: string;
  titulo: string;
  resumen: string | null;
  fuente: string;
  tipo: string;
  nivel_importancia: string;
  alcance: string;
  pais_iso: string | null;
  link_externo: string | null;
  activo: boolean;
  fecha_publicacion: string | null;
  created_at: string;
}

export interface MensajeOrganizacion {
  id: string;
  organizacion_remitente_id: string | null;
  organizacion_destinatario_id: string | null;
  remitente_tipo: string;
  destinatario_tipo: string;
  asunto: string | null;
  contenido: string;
  categoria_mensaje_tema: string | null;
  leido: boolean;
  created_at: string;
}

export interface MensajeCoopProductor {
  id: string;
  cooperativa_id: string | null;
  productor_id: string | null;
  remitente_id: string | null;
  destinatario_id: string | null;
  remitente_tipo: string;
  contenido: string;
  leido_por_destino: boolean;
  created_at: string;
}

export interface Notificacion {
  id: string;
  usuario_id: string;
  tipo: string;
  titulo: string;
  mensaje: string | null;
  link_accion: string | null;
  metadata: Record<string, unknown>;
  leido: boolean;
  created_at: string;
}

// ─── Avisos Cooperativa ───────────────────────────────────────────────────

export function useAvisosCooperativa(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['avisos_cooperativa', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avisos_cooperativa')
        .select('*')
        .eq('cooperativa_id', organizationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Aviso[];
    },
    enabled: !!organizationId,
  });
}

export type CreateAvisoInput = {
  cooperativa_id: string;
  titulo: string;
  resumen?: string;
  texto_largo?: string;
  tipo?: AvisoTipo;
  nivel_importancia?: AvisoNivel;
  alcance?: AvisoAlcance;
  estado?: AvisoEstado;
  fecha_fin_vigencia?: string;
};

export function useCreateAviso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAvisoInput) => {
      const { data, error } = await supabase
        .from('avisos_cooperativa')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Aviso;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['avisos_cooperativa', data.cooperativa_id] });
    },
  });
}

export function useUpdateAvisoEstado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado, cooperativa_id }: { id: string; estado: AvisoEstado; cooperativa_id: string }) => {
      const { data, error } = await supabase
        .from('avisos_cooperativa')
        .update({ estado, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { data: data as Aviso, cooperativa_id };
    },
    onSuccess: ({ cooperativa_id }) => {
      queryClient.invalidateQueries({ queryKey: ['avisos_cooperativa', cooperativa_id] });
    },
  });
}

export function useDeleteAviso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cooperativa_id }: { id: string; cooperativa_id: string }) => {
      const { error } = await supabase
        .from('avisos_cooperativa')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return cooperativa_id;
    },
    onSuccess: (cooperativa_id) => {
      queryClient.invalidateQueries({ queryKey: ['avisos_cooperativa', cooperativa_id] });
    },
  });
}

// ─── Avisos Sector Café (noticias externas) ────────────────────────────────

export function useAvisosSectorCafe(limit = 10) {
  return useQuery({
    queryKey: ['avisos_sector_cafe', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avisos_sector_cafe')
        .select('*')
        .eq('activo', true)
        .order('fecha_publicacion', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as AvisoSectorCafe[];
    },
  });
}

// ─── Mensajes entre organizaciones ────────────────────────────────────────

export function useMensajesOrganizacion(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['mensajes_organizacion', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mensajes_organizacion')
        .select('*')
        .or(`organizacion_remitente_id.eq.${organizationId},organizacion_destinatario_id.eq.${organizationId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MensajeOrganizacion[];
    },
    enabled: !!organizationId,
  });
}

export type CreateMensajeOrgInput = {
  organizacion_remitente_id: string;
  organizacion_destinatario_id: string;
  remitente_tipo: string;
  destinatario_tipo: string;
  asunto?: string;
  contenido: string;
  categoria_mensaje_tema?: string;
};

export function useCreateMensajeOrg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMensajeOrgInput) => {
      const { data, error } = await supabase
        .from('mensajes_organizacion')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as MensajeOrganizacion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['mensajes_organizacion', data.organizacion_remitente_id],
      });
    },
  });
}

export function useMarcarMensajeOrgLeido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, organizationId }: { id: string; organizationId: string }) => {
      const { error } = await supabase
        .from('mensajes_organizacion')
        .update({ leido: true })
        .eq('id', id);
      if (error) throw error;
      return organizationId;
    },
    onSuccess: (organizationId) => {
      queryClient.invalidateQueries({ queryKey: ['mensajes_organizacion', organizationId] });
    },
  });
}

// ─── Mensajes coop ↔ productor ────────────────────────────────────────────

export function useMensajesCoopProductor(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['mensajes_coop_productor', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mensajes_coop_productor')
        .select('*')
        .eq('cooperativa_id', organizationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MensajeCoopProductor[];
    },
    enabled: !!organizationId,
  });
}

// ─── Notificaciones del usuario ───────────────────────────────────────────

export function useNotificaciones(userId: string | undefined) {
  return useQuery({
    queryKey: ['notificaciones', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('usuario_id', userId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notificacion[];
    },
    enabled: !!userId,
  });
}

export function useMarcarNotificacionLeida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leido: true })
        .eq('id', id);
      if (error) throw error;
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones', userId] });
    },
  });
}
