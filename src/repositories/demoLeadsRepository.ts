/**
 * Repository: demo_leads.
 * Solo insert desde cliente. SELECT/UPDATE vía admin.
 */

import { supabase } from '@/integrations/supabase/client';
import type { DemoLeadPayload } from '@/types/demoLeads';

export interface DbDemoLead {
  id: string;
  created_at: string;
  nombre: string;
  email: string;
  organizacion: string | null;
  tipo_organizacion: string | null;
  mensaje: string | null;
  demo_org_type: string | null;
  demo_profile_label: string | null;
  demo_route: string | null;
  cta_source: string | null;
  status: string;
  notes: string | null;
}

export async function insertLeadInDb(payload: DemoLeadPayload): Promise<DbDemoLead> {
  const { data, error } = await supabase
    .from('demo_leads')
    .insert({
      nombre: payload.nombre,
      email: payload.email,
      organizacion: payload.organizacion ?? null,
      tipo_organizacion: payload.tipo_organizacion ?? null,
      mensaje: payload.mensaje ?? null,
      demo_org_type: payload.demo_org_type ?? null,
      demo_profile_label: payload.demo_profile_label ?? null,
      demo_route: payload.demo_route ?? null,
      cta_source: payload.cta_source ?? null,
    })
    .select('id, created_at, nombre, email, organizacion, tipo_organizacion, mensaje, demo_org_type, demo_profile_label, demo_route, cta_source, status, notes')
    .single();

  if (error) throw error;
  return data as DbDemoLead;
}
