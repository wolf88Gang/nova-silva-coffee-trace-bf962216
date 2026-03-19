/**
 * Mapper: DB → AdminFeedbackItem, AdminOpportunity.
 */

import type { AdminFeedbackItem, AdminOpportunity, AdminDemoLead } from '@/types/admin';
import type { DbFeedback, DbOpportunity, DbDemoLead } from '@/repositories/admin/adminGrowthRepository';

export function mapFeedbackToAdmin(d: DbFeedback, orgName: string): AdminFeedbackItem {
  return {
    id: d.id,
    organizationId: d.organization_id,
    organizationName: orgName,
    category: d.category,
    severity: d.severity,
    message: d.message,
    status: (d.status === 'new' ? 'new' : d.status === 'resolved' ? 'resolved' : 'acknowledged') as 'new' | 'acknowledged' | 'resolved',
    createdAt: d.created_at,
  };
}

export function mapOpportunityToAdmin(d: DbOpportunity, orgName: string): AdminOpportunity {
  const type = ['high_usage_low_plan', 'trial_engaged', 'inactive_recoverable', 'addon_candidate'].includes(d.type)
    ? (d.type as AdminOpportunity['type'])
    : 'addon_candidate';
  return {
    id: d.id,
    organizationId: d.organization_id,
    organizationName: orgName,
    type,
    score: Number(d.score),
    notes: d.notes ?? undefined,
  };
}

export function mapDemoLeadToAdmin(d: DbDemoLead): AdminDemoLead {
  return {
    id: d.id,
    createdAt: d.created_at,
    nombre: d.nombre,
    email: d.email,
    organizacion: d.organizacion,
    tipoOrganizacion: d.tipo_organizacion,
    mensaje: d.mensaje,
    demoOrgType: d.demo_org_type,
    demoProfileLabel: d.demo_profile_label,
    demoRoute: d.demo_route,
    ctaSource: d.cta_source,
    status: d.status,
    notes: d.notes,
  };
}
