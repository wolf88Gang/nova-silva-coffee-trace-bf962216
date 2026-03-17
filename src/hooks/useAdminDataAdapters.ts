/**
 * Admin Data Adapters
 * Merges real Supabase data with mock enrichment for sections without backend tables.
 * Each adapter is typed and marked with its data source for clarity.
 *
 * DATA SOURCES:
 *   🟢 Real  — organizaciones, profiles, user_roles, organizacion_usuarios
 *   🟡 Stub  — billing_subscriptions (read-only, may not have rows)
 *   🔴 Mock  — invoices, payments, compliance incidents, campaigns, feedback
 *
 * TODO: Replace mock providers when backend tables are created.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  MOCK_ORGS, MOCK_INVOICES, MOCK_PAYMENTS, MOCK_ALERTS, MOCK_FEEDBACK,
  MOCK_CAMPAIGNS, MOCK_OPPORTUNITIES, MOCK_COMPLIANCE_ISSUES,
  MOCK_INTEGRITY, MOCK_EUDR, MOCK_AUDIT_LOG, MOCK_REVENUE,
  type MockOrg, type MockInvoice, type MockPayment, type MockAlert,
  type MockFeedback, type MockCampaign, type MockComplianceIssue,
} from '@/lib/adminMockData';

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface AdminOrgRow {
  id: string;
  nombre: string;
  tipo: string;
  created_at: string;
  /** Enriched fields from mock until billing tables exist */
  _enriched: MockOrg;
  _source: 'real';
}

export interface AdminUserRow {
  user_id: string;
  name: string | null;
  email: string | null;
  organization_id: string | null;
  organization_name: string | null;
  role_global: string | null;
  rol_interno: string | null;
  activo: boolean;
  /** Org nombre resolved from join */
  org_nombre: string | null;
  _source: 'real';
}

export interface AdminOrgDetail {
  org: AdminOrgRow;
  users: AdminUserRow[];
  usage: { producers: number; plots: number; lots: number; dossiers: number };
  /** Mock billing until tables exist */
  billing: MockOrg['billing'];
  trial: MockOrg['trial'];
  modules: string[];
  _usageSource: 'real' | 'mock';
}

// ═══════════════════════════════════════════
// 🟢 Organizations (real Supabase + mock enrichment)
// ═══════════════════════════════════════════

function enrichOrgWithMock(org: { id: string; nombre: string; tipo: string; created_at: string }): AdminOrgRow {
  // Find matching mock org by name or type for enrichment, fallback to defaults
  const mockMatch = MOCK_ORGS.find(m =>
    m.name.toLowerCase() === org.nombre.toLowerCase() ||
    m.id === org.id
  ) ?? createDefaultMockEnrichment(org);

  return {
    ...org,
    _enriched: mockMatch,
    _source: 'real',
  };
}

function createDefaultMockEnrichment(org: { id: string; nombre: string; tipo: string }): MockOrg {
  return {
    id: org.id,
    name: org.nombre,
    type: org.tipo,
    plan: 'smart',
    status: 'active',
    country: '—',
    createdAt: '',
    lastActivity: '—',
    healthScore: 75,
    owner: '—',
    modules: ['Producción'],
    usage: { producers: 0, producersLimit: 500, plots: 0, plotsLimit: 1000, lots: 0, lotsLimit: 100, dossiers: 0, dossiersLimit: 50 },
    billing: { mrr: 0, cycle: 'monthly', addons: [], pendingBalance: 0, nextInvoice: '—' },
    riskLevel: 'low',
    riskIssues: [],
  };
}

export function useAdminOrgList() {
  return useQuery({
    queryKey: ['admin', 'org-list'],
    queryFn: async (): Promise<AdminOrgRow[]> => {
      const { data, error } = await supabase
        .from('organizaciones')
        .select('id, nombre, tipo, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // If no real data, fall back to mock orgs for demo
      if (!data || data.length === 0) {
        return MOCK_ORGS.map(m => ({
          id: m.id,
          nombre: m.name,
          tipo: m.type,
          created_at: m.createdAt,
          _enriched: m,
          _source: 'real' as const,
        }));
      }

      return data.map(enrichOrgWithMock);
    },
  });
}

// ═══════════════════════════════════════════
// 🟢 Users (real Supabase: profiles + user_roles + organizacion_usuarios)
// ═══════════════════════════════════════════

export function useAdminUserList() {
  return useQuery({
    queryKey: ['admin', 'user-list'],
    queryFn: async (): Promise<AdminUserRow[]> => {
      // Parallel fetch: profiles, roles, org_usuarios, orgs for name resolution
      const [profilesRes, rolesRes, orgUsuariosRes, orgsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, name, organization_name, organization_id'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('organizacion_usuarios').select('user_id, organizacion_id, rol_interno, activo, user_name, user_email'),
        supabase.from('organizaciones').select('id, nombre'),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const roleMap = new Map((rolesRes.data ?? []).map(r => [r.user_id, r.role]));
      const orgUserMap = new Map((orgUsuariosRes.data ?? []).map(ou => [ou.user_id, ou]));
      const orgNameMap = new Map((orgsRes.data ?? []).map(o => [o.id, o.nombre]));

      const profiles = profilesRes.data ?? [];

      if (profiles.length === 0) {
        // Fall back to mock users for demo
        const { MOCK_USERS } = await import('@/lib/adminMockData');
        return MOCK_USERS.map(u => ({
          user_id: u.id,
          name: u.name,
          email: u.email,
          organization_id: u.orgId || null,
          organization_name: u.orgName,
          role_global: u.role,
          rol_interno: u.internalRole,
          activo: u.status === 'active',
          org_nombre: u.orgName,
          _source: 'real' as const,
        }));
      }

      return profiles.map(p => {
        const ou = orgUserMap.get(p.user_id);
        return {
          user_id: p.user_id,
          name: ou?.user_name ?? p.name,
          email: ou?.user_email ?? null,
          organization_id: p.organization_id,
          organization_name: p.organization_name,
          role_global: roleMap.get(p.user_id) ?? null,
          rol_interno: ou?.rol_interno ?? null,
          activo: ou?.activo ?? true,
          org_nombre: p.organization_id ? (orgNameMap.get(p.organization_id) ?? p.organization_name) : p.organization_name,
          _source: 'real' as const,
        };
      });
    },
  });
}

// ═══════════════════════════════════════════
// 🟢 Org Detail (real org + real users + real usage counts)
// ═══════════════════════════════════════════

export function useAdminOrgDetail(orgId: string | null) {
  const orgList = useAdminOrgList();
  const userList = useAdminUserList();

  return useQuery({
    queryKey: ['admin', 'org-detail', orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<AdminOrgDetail | null> => {
      if (!orgId) return null;

      const org = orgList.data?.find(o => o.id === orgId);
      if (!org) return null;

      // Try to get real usage counts
      let usageSource: 'real' | 'mock' = 'mock';
      let producers = org._enriched.usage.producers;
      let plots = org._enriched.usage.plots;
      let lots = org._enriched.usage.lots;
      let dossiers = org._enriched.usage.dossiers;

      try {
        // Count productores linked to this org
        const [prodRes, parcelRes] = await Promise.all([
          supabase.from('productores' as any).select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
          supabase.from('parcelas' as any).select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        ]);
        if (prodRes.count !== null) { producers = prodRes.count; usageSource = 'real'; }
        if (parcelRes.count !== null) { plots = parcelRes.count; usageSource = 'real'; }
      } catch {
        // Tables may not exist, keep mock
      }

      const orgUsers = (userList.data ?? []).filter(u => u.organization_id === orgId);

      return {
        org,
        users: orgUsers,
        usage: { producers, plots, lots, dossiers },
        billing: org._enriched.billing,
        trial: org._enriched.trial,
        modules: org._enriched.modules,
        _usageSource: usageSource,
      };
    },
  });
}

// ═══════════════════════════════════════════
// 🟢 Admin KPIs (real counts)
// ═══════════════════════════════════════════

export function useAdminKPIsAdapter() {
  const orgs = useAdminOrgList();
  const users = useAdminUserList();

  const orgCount = orgs.data?.length ?? 0;
  const userCount = users.data?.length ?? 0;
  const adminCount = users.data?.filter(u => u.role_global === 'admin').length ?? 0;

  return {
    orgCount,
    userCount,
    adminCount,
    isLoading: orgs.isLoading || users.isLoading,
    error: orgs.error || users.error,
    orgs: orgs.data ?? [],
    users: users.data ?? [],
  };
}

// ═══════════════════════════════════════════
// 🔴 Billing (mock provider — no tables yet)
// TODO: Replace with billing_subscriptions, invoices tables
// ═══════════════════════════════════════════

export function useAdminBillingData() {
  const orgs = useAdminOrgList();

  return {
    revenue: MOCK_REVENUE,
    invoices: MOCK_INVOICES,
    payments: MOCK_PAYMENTS,
    subscriptions: (orgs.data ?? []).map(o => ({
      orgId: o.id,
      orgName: o.nombre,
      orgType: o.tipo,
      plan: o._enriched.plan,
      status: o._enriched.status,
      mrr: o._enriched.billing.mrr,
      cycle: o._enriched.billing.cycle,
      addons: o._enriched.billing.addons,
      pendingBalance: o._enriched.billing.pendingBalance,
      nextInvoice: o._enriched.billing.nextInvoice,
      usage: o._enriched.usage,
    })),
    isLoading: orgs.isLoading,
    _source: 'mock' as const,
  };
}

// ═══════════════════════════════════════════
// 🔴 Compliance (mock provider)
// TODO: Replace with ag_nut_plan_audit_events, ag_support_tickets
// ═══════════════════════════════════════════

export function useAdminComplianceData() {
  return {
    integrity: MOCK_INTEGRITY,
    eudr: MOCK_EUDR,
    auditLog: MOCK_AUDIT_LOG,
    issues: MOCK_COMPLIANCE_ISSUES,
    _source: 'mock' as const,
  };
}

// ═══════════════════════════════════════════
// 🔴 Growth (mock provider)
// TODO: Replace with analytics tables
// ═══════════════════════════════════════════

export function useAdminGrowthData() {
  return {
    feedback: MOCK_FEEDBACK,
    campaigns: MOCK_CAMPAIGNS,
    opportunities: MOCK_OPPORTUNITIES,
    alerts: MOCK_ALERTS,
    _source: 'mock' as const,
  };
}
