/**
 * CRUD hook for mensajes_coop_productor table.
 * Scoped by organization_id via useOrgContext.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { ORG_KEY } from '@/lib/keys';

const TABLE = 'mensajes_coop_productor';
const QK = 'mensajes-coop-productor';

export interface MensajeCoopProductor {
  id: string;
  organization_id: string;
  cooperativa_id: string;
  productor_id: string;
  remitente_tipo: 'cooperativa' | 'productor';
  remitente_id: string;
  asunto: string | null;
  cuerpo: string;
  fecha_envio: string;
  leido_por_destino: boolean;
  fecha_lectura: string | null;
  estado: 'activo' | 'archivado';
  parcela_id: string | null;
  accion_clima_id: string | null;
}

export interface NuevoMensajeCoop {
  cooperativa_id: string;
  productor_id: string;
  remitente_tipo: 'cooperativa' | 'productor';
  asunto?: string;
  cuerpo: string;
  parcela_id?: string;
  accion_clima_id?: string;
}

/** Fetch messages for the current org, ordered by date desc */
export function useMensajesCoopProductor(productorId?: string) {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: [QK, organizationId, productorId],
    enabled: !!organizationId,
    queryFn: async () => {
      let q = supabase
        .from(TABLE)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .eq('estado', 'activo')
        .order('fecha_envio', { ascending: false });

      if (productorId) q = q.eq('productor_id', productorId);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as MensajeCoopProductor[];
    },
  });
}

/** Send a new message */
export function useSendMensajeCoop() {
  const { organizationId } = useOrgContext();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (msg: NuevoMensajeCoop) => {
      const { error } = await supabase.from(TABLE).insert({
        ...msg,
        organization_id: organizationId!,
        remitente_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

/** Mark a message as read */
export function useMarkMensajeCoopRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from(TABLE)
        .update({ leido_por_destino: true, fecha_lectura: new Date().toISOString() })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

/** Archive a message */
export function useArchiveMensajeCoop() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from(TABLE)
        .update({ estado: 'archivado' })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}
