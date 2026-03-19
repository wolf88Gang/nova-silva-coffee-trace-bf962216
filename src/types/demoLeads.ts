/**
 * Tipos para captura de leads demo.
 */

export interface DemoLeadPayload {
  nombre: string;
  email: string;
  organizacion?: string | null;
  tipo_organizacion?: string | null;
  mensaje?: string | null;
  demo_org_type?: string | null;
  demo_profile_label?: string | null;
  demo_route?: string | null;
  cta_source?: string | null;
}

export interface DemoLead {
  id: string;
  createdAt: string;
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
