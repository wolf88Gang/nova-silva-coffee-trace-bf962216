/**
 * CRUD hook for mensajes_organizacion table.
 * Messages between organizations (coop ↔ exporter, etc.)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useAuth } from '@/contexts/AuthContext';

const TABLE = 'mensajes_organizacion';
const QK = 'mensajes-organizacion';

export type CategoriaTema = 'operativo' | 'comercial' | 'urgente' | 'general';

export interface MensajeOrganizacion {
  id: string;
  remitente_user_id: string;
  remitente_tipo: string;
  remitente_org_id: string | null;
  destinatario_user_id: string | null;
  destinatario_tipo: string;
  destinatario_org_id: string | null;
  destinatario_productor_id: string | null;
  categoria_destinatario: string | null;
  categoria_tema: CategoriaTema;
  asunto: string | null;
  cuerpo: string;
  leido: boolean;
  archivado: boolean;
  created_at: string;
}

export interface NuevoMensajeOrg {
  remitente_tipo: string;
  destinatario_user_id?: string;
  destinatario_tipo: string;
  destinatario_org_id?: string;
  destinatario_productor_id?: string;
  categoria_destinatario?: string;
  categoria_tema: CategoriaTema;
  asunto?: string;
  cuerpo: string;
}

/** Fetch incoming messages for current org */
export function useMensajesOrganizacion(categoria?: CategoriaTema) {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: [QK, organizationId, categoria],
    enabled: !!organizationId,
    queryFn: async () => {
      let q = supabase
        .from(TABLE)
        .select('*')
        .or(`remitente_org_id.eq.${organizationId},destinatario_org_id.eq.${organizationId}`)
        .eq('archivado', false)
        .order('created_at', { ascending: false });

      if (categoria) q = q.eq('categoria_tema', categoria);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as MensajeOrganizacion[];
    },
  });
}

/** Send a message between organizations */
export function useSendMensajeOrg() {
  const { organizationId } = useOrgContext();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (msg: NuevoMensajeOrg) => {
      const { error } = await supabase.from(TABLE).insert({
        ...msg,
        remitente_user_id: user!.id,
        remitente_org_id: organizationId,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

/** Mark a message as read */
export function useMarkMensajeOrgRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from(TABLE)
        .update({ leido: true })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

/** Archive a message */
export function useArchiveMensajeOrg() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from(TABLE)
        .update({ archivado: true })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}
