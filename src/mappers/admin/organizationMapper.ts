/**
 * Mapper: DB → AdminOrganization.
 * Normaliza estados y deriva health/risk desde status y billing.
 */

import type { AdminOrganization, OrgStatus, OrgType, OrgPlan, BillingCycle, HealthStatus, RiskLevel } from '@/types/admin';
import type { DbOrganizationSummary, DbPlatformOrganization, DbOrgBillingSettings } from '@/repositories/admin/adminOrganizationsRepository';

function mapStatus(s: string | null): OrgStatus {
  const v = (s ?? '').toLowerCase();
  if (['activo', 'en_prueba', 'vencido', 'suspendido', 'cerrado'].includes(v)) return v as OrgStatus;
  return 'en_prueba';
}

function mapType(t: string | null, orgType?: string | null): OrgType {
  const v = (t ?? orgType ?? '').toLowerCase();
  if (['cooperativa', 'exportador', 'certificadora', 'interna'].includes(v)) return v as OrgType;
  return 'cooperativa';
}

function mapPlan(p: string | null): OrgPlan {
  const v = (p ?? '').toLowerCase();
  if (['lite', 'smart', 'plus', 'none'].includes(v)) return v as OrgPlan;
  return 'none';
}

function mapBillingCycle(c: string | null): BillingCycle {
  const v = (c ?? '').toLowerCase();
  return v === 'anual' ? 'anual' : 'mensual';
}

function deriveHealthStatus(status: OrgStatus, outstandingBalance: number): HealthStatus {
  if (status === 'vencido' || status === 'suspendido') return 'critical';
  if (status === 'cerrado') return 'critical';
  if (outstandingBalance > 0) return 'warning';
  return 'healthy';
}

function deriveRiskLevel(status: OrgStatus, outstandingBalance: number): RiskLevel {
  if (status === 'vencido' || status === 'suspendido') return 'high';
  if (outstandingBalance > 0) return 'medium';
  return 'low';
}

function parseModules(m: unknown): string[] {
  if (Array.isArray(m)) return m.filter((x): x is string => typeof x === 'string');
  if (typeof m === 'string') {
    try {
      const parsed = JSON.parse(m);
      return Array.isArray(parsed) ? parsed.filter((x: unknown): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function mapOrganizationSummaryToAdmin(d: DbOrganizationSummary, billing?: DbOrgBillingSettings | null): AdminOrganization {
  const status = mapStatus(d.status);
  const plan = mapPlan(billing?.plan_code ?? d.plan);
  const outstanding = Number(d.outstanding_balance ?? 0);

  return {
    id: d.organization_id,
    name: d.organization_name ?? 'Sin nombre',
    type: mapType(d.tipo),
    country: d.country ?? 'Costa Rica',
    status,
    plan,
    billingCycle: mapBillingCycle(billing?.billing_cycle),
    modulesActive: [],
    ownerName: '—',
    ownerEmail: '—',
    createdAt: d.created_at,
    lastActivityAt: null,
    healthStatus: deriveHealthStatus(status, outstanding),
    riskLevel: deriveRiskLevel(status, outstanding),
    usageSummary: {
      productores: Number(d.active_user_count ?? 0),
    },
    billingSummary: {
      saldoPendiente: outstanding,
      proximaFactura: d.last_invoice_due_at ? new Date(d.last_invoice_due_at).toISOString().slice(0, 10) : undefined,
    },
  };
}

export function mapPlatformOrgToAdmin(
  org: DbPlatformOrganization,
  summary: DbOrganizationSummary | null,
  billing: DbOrgBillingSettings | null
): AdminOrganization {
  const status = mapStatus(org.status ?? summary?.status);
  const plan = mapPlan(billing?.plan_code ?? org.plan);
  const outstanding = Number(summary?.outstanding_balance ?? 0);

  return {
    id: org.id,
    name: org.name ?? org.display_name ?? 'Sin nombre',
    type: mapType(org.tipo, org.org_type),
    country: org.country ?? org.pais ?? 'Costa Rica',
    status,
    plan,
    billingCycle: mapBillingCycle(billing?.billing_cycle),
    modulesActive: parseModules(org.modules),
    ownerName: '—',
    ownerEmail: '—',
    createdAt: org.created_at,
    lastActivityAt: null,
    healthStatus: deriveHealthStatus(status, outstanding),
    riskLevel: deriveRiskLevel(status, outstanding),
    usageSummary: summary ? { productores: Number(summary.active_user_count ?? 0) } : undefined,
    billingSummary: summary
      ? {
          saldoPendiente: outstanding,
          proximaFactura: summary.last_invoice_due_at
            ? new Date(summary.last_invoice_due_at).toISOString().slice(0, 10)
            : undefined,
        }
      : undefined,
  };
}
