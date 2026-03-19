/**
 * Mock data para el panel de administración.
 * Datos realistas en español, contexto latinoamericano.
 * TODO: Reemplazar por llamadas a Supabase cuando backend esté listo.
 */

import type {
  AdminOrganization,
  AdminUser,
  AdminSubscription,
  AdminInvoice,
  AdminPayment,
  AdminServiceStatus,
  AdminComplianceIssue,
  AdminFeedbackItem,
  AdminOpportunity,
} from '@/types/admin';

// ─── Organizaciones ────────────────────────────────────────────────────────

export const MOCK_ORGANIZATIONS: AdminOrganization[] = [
  {
    id: 'org-001',
    name: 'Cooperativa Cafetalera Valle Central',
    type: 'cooperativa',
    country: 'Costa Rica',
    status: 'activo',
    plan: 'plus',
    billingCycle: 'anual',
    modulesActive: ['produccion', 'acopio', 'finanzas', 'eudr', 'vital'],
    ownerName: 'Roberto Méndez',
    ownerEmail: 'roberto@vallecentral.coop',
    createdAt: '2024-06-15T10:00:00Z',
    lastActivityAt: '2026-03-17T08:30:00Z',
    healthStatus: 'healthy',
    riskLevel: 'low',
    usageSummary: { productores: 142, parcelas: 380, entregas: 1250 },
    billingSummary: { mrr: 450, saldoPendiente: 0, proximaFactura: '2026-04-01' },
  },
  {
    id: 'org-002',
    name: 'Exportadora Sol de América',
    type: 'exportador',
    country: 'Guatemala',
    status: 'activo',
    plan: 'smart',
    billingCycle: 'mensual',
    modulesActive: ['lotes', 'proveedores', 'eudr', 'contratos'],
    ownerName: 'Ana Lucía García',
    ownerEmail: 'ana.garcia@solamerica.com.gt',
    createdAt: '2024-09-20T14:00:00Z',
    lastActivityAt: '2026-03-16T16:45:00Z',
    healthStatus: 'healthy',
    riskLevel: 'low',
    usageSummary: { proveedores: 28, lotes: 156, dossiers: 89 },
    billingSummary: { mrr: 320, saldoPendiente: 0, proximaFactura: '2026-03-25' },
  },
  {
    id: 'org-003',
    name: 'Cooperativa El Progreso',
    type: 'cooperativa',
    country: 'Honduras',
    status: 'en_prueba',
    plan: 'lite',
    billingCycle: 'mensual',
    modulesActive: ['produccion', 'acopio'],
    ownerName: 'José Martínez',
    ownerEmail: 'jose@elprogreso.hn',
    createdAt: '2026-02-01T09:00:00Z',
    lastActivityAt: '2026-03-17T07:20:00Z',
    healthStatus: 'healthy',
    riskLevel: 'medium',
    usageSummary: { productores: 45, parcelas: 98, entregas: 320 },
    billingSummary: { mrr: 0, saldoPendiente: 0, proximaFactura: '2026-04-01' },
  },
  {
    id: 'org-004',
    name: 'CertifiCafé Internacional',
    type: 'certificadora',
    country: 'Costa Rica',
    status: 'activo',
    plan: 'plus',
    billingCycle: 'anual',
    modulesActive: ['auditorias', 'verificacion', 'reportes'],
    ownerName: 'María Fernández',
    ownerEmail: 'maria@certificafe.com',
    createdAt: '2024-03-10T11:00:00Z',
    lastActivityAt: '2026-03-15T12:00:00Z',
    healthStatus: 'warning',
    riskLevel: 'low',
    usageSummary: {},
    billingSummary: { mrr: 580, saldoPendiente: 0, proximaFactura: '2026-06-01' },
  },
  {
    id: 'org-005',
    name: 'Cooperativa Norteña',
    type: 'cooperativa',
    country: 'Nicaragua',
    status: 'vencido',
    plan: 'smart',
    billingCycle: 'mensual',
    modulesActive: ['produccion', 'acopio', 'finanzas'],
    ownerName: 'Carlos Ramírez',
    ownerEmail: 'carlos@coopnortena.ni',
    createdAt: '2025-01-15T08:00:00Z',
    lastActivityAt: '2026-02-28T10:00:00Z',
    healthStatus: 'critical',
    riskLevel: 'high',
    usageSummary: { productores: 78, parcelas: 210, entregas: 890 },
    billingSummary: { mrr: 280, saldoPendiente: 560, proximaFactura: '2026-02-28' },
  },
];

// ─── Usuarios ──────────────────────────────────────────────────────────────

export const MOCK_USERS: AdminUser[] = [
  { id: 'u-001', fullName: 'Roberto Méndez', email: 'roberto@vallecentral.coop', organizationId: 'org-001', organizationName: 'Cooperativa Cafetalera Valle Central', role: 'admin', status: 'active', lastLoginAt: '2026-03-17T08:30:00Z', createdAt: '2024-06-15T10:00:00Z' },
  { id: 'u-002', fullName: 'Laura Sánchez', email: 'laura@vallecentral.coop', organizationId: 'org-001', organizationName: 'Cooperativa Cafetalera Valle Central', role: 'compliance', status: 'active', lastLoginAt: '2026-03-16T14:20:00Z', createdAt: '2024-07-01T09:00:00Z' },
  { id: 'u-003', fullName: 'Ana Lucía García', email: 'ana.garcia@solamerica.com.gt', organizationId: 'org-002', organizationName: 'Exportadora Sol de América', role: 'admin', status: 'active', lastLoginAt: '2026-03-16T16:45:00Z', createdAt: '2024-09-20T14:00:00Z' },
  { id: 'u-004', fullName: 'José Martínez', email: 'jose@elprogreso.hn', organizationId: 'org-003', organizationName: 'Cooperativa El Progreso', role: 'admin', status: 'active', lastLoginAt: '2026-03-17T07:20:00Z', createdAt: '2026-02-01T09:00:00Z' },
  { id: 'u-005', fullName: 'Pedro López', email: 'pedro@elprogreso.hn', organizationId: 'org-003', organizationName: 'Cooperativa El Progreso', role: 'field_tech', status: 'invited', lastLoginAt: null, createdAt: '2026-03-10T11:00:00Z' },
  { id: 'u-006', fullName: 'María Fernández', email: 'maria@certificafe.com', organizationId: 'org-004', organizationName: 'CertifiCafé Internacional', role: 'admin', status: 'active', lastLoginAt: '2026-03-15T12:00:00Z', createdAt: '2024-03-10T11:00:00Z' },
  { id: 'u-007', fullName: 'Carlos Ramírez', email: 'carlos@coopnortena.ni', organizationId: 'org-005', organizationName: 'Cooperativa Norteña', role: 'admin', status: 'suspended', lastLoginAt: '2026-02-28T10:00:00Z', createdAt: '2025-01-15T08:00:00Z' },
];

// ─── Suscripciones ────────────────────────────────────────────────────────

export const MOCK_SUBSCRIPTIONS: AdminSubscription[] = MOCK_ORGANIZATIONS.map((o) => ({
  id: `sub-${o.id}`,
  organizationId: o.id,
  organizationName: o.name,
  plan: o.plan,
  cycle: o.billingCycle,
  status: o.status,
  usage: o.usageSummary,
  overagesEstimate: o.status === 'activo' && o.usageSummary?.productores && o.usageSummary.productores > 100 ? 45 : 0,
  addOns: o.plan === 'plus' ? ['eudr_advanced', 'vital'] : [],
  nextInvoiceDate: o.billingSummary?.proximaFactura,
  balanceDue: o.billingSummary?.saldoPendiente,
}));

// ─── Facturas ──────────────────────────────────────────────────────────────

export const MOCK_INVOICES: AdminInvoice[] = [
  { id: 'inv-001', number: 'FAC-2026-001', organizationId: 'org-001', organizationName: 'Cooperativa Cafetalera Valle Central', periodStart: '2026-03-01', periodEnd: '2026-03-31', amount: 450, status: 'paid', issuedAt: '2026-03-01', dueAt: '2026-03-15' },
  { id: 'inv-002', number: 'FAC-2026-002', organizationId: 'org-002', organizationName: 'Exportadora Sol de América', periodStart: '2026-03-01', periodEnd: '2026-03-31', amount: 320, status: 'sent', issuedAt: '2026-03-01', dueAt: '2026-03-25' },
  { id: 'inv-003', number: 'FAC-2026-003', organizationId: 'org-005', organizationName: 'Cooperativa Norteña', periodStart: '2026-02-01', periodEnd: '2026-02-28', amount: 280, status: 'overdue', issuedAt: '2026-02-01', dueAt: '2026-02-28' },
  { id: 'inv-004', number: 'FAC-2026-004', organizationId: 'org-005', organizationName: 'Cooperativa Norteña', periodStart: '2026-03-01', periodEnd: '2026-03-31', amount: 280, status: 'overdue', issuedAt: '2026-03-01', dueAt: '2026-03-15' },
];

// ─── Pagos ─────────────────────────────────────────────────────────────────

export const MOCK_PAYMENTS: AdminPayment[] = [
  { id: 'pay-001', organizationId: 'org-001', organizationName: 'Cooperativa Cafetalera Valle Central', amount: 5400, paidAt: '2026-01-15T10:30:00Z', method: 'transfer', reference: 'TRF-2026-001', registeredBy: 'admin@novasilva.com' },
  { id: 'pay-002', organizationId: 'org-002', organizationName: 'Exportadora Sol de América', amount: 320, paidAt: '2026-02-28T14:00:00Z', method: 'card', reference: 'ch_xxx', registeredBy: null },
  { id: 'pay-003', organizationId: 'org-005', organizationName: 'Cooperativa Norteña', amount: 280, paidAt: '2026-01-20T09:00:00Z', method: 'manual', reference: 'Depósito ref 123', registeredBy: 'admin@novasilva.com' },
];

// ─── Estado de servicios ──────────────────────────────────────────────────

export const MOCK_SERVICE_STATUS: AdminServiceStatus[] = [
  { name: 'Web App', status: 'operational', latencyMs: 120, incidentCount: 0, lastIncidentAt: null, lastSyncAt: '2026-03-17T08:00:00Z' },
  { name: 'Auth', status: 'operational', latencyMs: 45, incidentCount: 0, lastIncidentAt: null, lastSyncAt: null },
  { name: 'Storage', status: 'operational', latencyMs: 80, incidentCount: 1, lastIncidentAt: '2026-03-10T02:00:00Z', lastSyncAt: '2026-03-17T07:55:00Z' },
  { name: 'Database', status: 'operational', latencyMs: 35, incidentCount: 0, lastIncidentAt: null, lastSyncAt: null },
  { name: 'Edge Functions', status: 'degraded', latencyMs: 450, incidentCount: 2, lastIncidentAt: '2026-03-16T14:30:00Z', lastSyncAt: '2026-03-17T08:00:00Z', notes: 'Latencia elevada en generate_nutrition_plan_v1' },
  { name: 'Sync Mobile', status: 'operational', latencyMs: 200, incidentCount: 0, lastIncidentAt: null, lastSyncAt: '2026-03-17T07:50:00Z' },
];

// ─── Issues de compliance ──────────────────────────────────────────────────

export const MOCK_COMPLIANCE_ISSUES: AdminComplianceIssue[] = [
  { id: 'c-001', severity: 'critical', category: 'Integridad', organizationId: 'org-005', organizationName: 'Cooperativa Norteña', createdAt: '2026-03-01T10:00:00Z', status: 'open', description: 'Factura vencida — cuenta en mora', actionLabel: 'Registrar pago', actionRoute: '/admin/billing' },
  { id: 'c-002', severity: 'high', category: 'Documental', organizationId: 'org-003', organizationName: 'Cooperativa El Progreso', createdAt: '2026-03-05T14:00:00Z', status: 'in_review', description: '12 parcelas sin polígono registrado', actionLabel: 'Revisar parcelas', actionRoute: '/admin/organizations/org-003' },
  { id: 'c-003', severity: 'medium', category: 'EUDR', organizationId: 'org-002', organizationName: 'Exportadora Sol de América', createdAt: '2026-03-10T09:00:00Z', status: 'open', description: '3 dossiers con advertencias de trazabilidad', actionLabel: 'Ver dossiers', actionRoute: '/admin/compliance' },
  { id: 'c-004', severity: 'low', category: 'Auditoría', organizationId: 'org-001', organizationName: 'Cooperativa Cafetalera Valle Central', createdAt: '2026-03-12T11:00:00Z', status: 'resolved', description: 'Cambio de plan registrado', actionLabel: null, actionRoute: undefined },
];

// ─── Feedback ──────────────────────────────────────────────────────────────

export const MOCK_FEEDBACK: AdminFeedbackItem[] = [
  { id: 'fb-001', organizationId: 'org-001', organizationName: 'Cooperativa Cafetalera Valle Central', category: 'Funcionalidad', severity: 'media', message: 'Solicitud de exportación masiva de lotes a Excel', status: 'acknowledged', createdAt: '2026-03-10T11:00:00Z' },
  { id: 'fb-002', organizationId: 'org-003', organizationName: 'Cooperativa El Progreso', category: 'UX', severity: 'baja', message: 'Mejorar flujo de registro de entregas en móvil', status: 'new', createdAt: '2026-03-15T16:00:00Z' },
  { id: 'fb-003', organizationId: 'org-002', organizationName: 'Exportadora Sol de América', category: 'Integración', severity: 'alta', message: 'Necesidad de integración con ERP interno', status: 'acknowledged', createdAt: '2026-03-08T09:30:00Z' },
];

// ─── Oportunidades ─────────────────────────────────────────────────────────

export const MOCK_OPPORTUNITIES: AdminOpportunity[] = [
  { id: 'opp-001', organizationId: 'org-003', organizationName: 'Cooperativa El Progreso', type: 'trial_engaged', score: 85, notes: 'Alto uso en trial — 45 productores, 98 parcelas en 6 semanas' },
  { id: 'opp-002', organizationId: 'org-002', organizationName: 'Exportadora Sol de América', type: 'addon_candidate', score: 72, notes: 'Plan smart — candidato a módulo EUDR avanzado' },
  { id: 'opp-003', organizationId: 'org-005', organizationName: 'Cooperativa Norteña', type: 'inactive_recoverable', score: 60, notes: 'Suspensión por mora — contacto comercial en curso' },
];
