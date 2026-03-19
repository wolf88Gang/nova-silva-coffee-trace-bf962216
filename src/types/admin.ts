/**
 * Tipos de dominio para el panel de administración interno.
 * Preparados para conexión futura a Supabase.
 */

// ─── Organización ──────────────────────────────────────────────────────────

export type OrgType = 'cooperativa' | 'exportador' | 'certificadora' | 'interna';
export type OrgStatus = 'en_prueba' | 'activo' | 'vencido' | 'suspendido' | 'cerrado';
export type OrgPlan = 'lite' | 'smart' | 'plus' | 'none';
export type BillingCycle = 'mensual' | 'anual';
export type HealthStatus = 'healthy' | 'warning' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface OrgUsageSummary {
  productores?: number;
  parcelas?: number;
  entregas?: number;
  lotes?: number;
  proveedores?: number;
  dossiers?: number;
}

export interface OrgBillingSummary {
  mrr?: number;
  saldoPendiente?: number;
  proximaFactura?: string;
}

export interface AdminOrganization {
  id: string;
  name: string;
  type: OrgType;
  country: string;
  status: OrgStatus;
  plan: OrgPlan;
  billingCycle: BillingCycle;
  modulesActive: string[];
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  lastActivityAt: string | null;
  healthStatus: HealthStatus;
  riskLevel: RiskLevel;
  usageSummary?: OrgUsageSummary;
  billingSummary?: OrgBillingSummary;
}

// ─── Usuario ───────────────────────────────────────────────────────────────

export type UserStatus = 'active' | 'invited' | 'suspended' | 'inactive';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: string;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

// ─── Billing ───────────────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'transfer' | 'card' | 'paypal' | 'manual';

export interface AdminSubscription {
  id: string;
  organizationId: string;
  organizationName: string;
  plan: OrgPlan;
  cycle: BillingCycle;
  status: OrgStatus;
  usage?: OrgUsageSummary;
  overagesEstimate?: number;
  addOns: string[];
  nextInvoiceDate?: string;
  balanceDue?: number;
}

/** Último intento PayPal asociado a una factura (payment_intent con reference_type=invoice). */
export interface AdminInvoicePayPalIntent {
  status: string;
  providerOrderId: string | null;
  isCaptured: boolean;
  createdAt: string;
}

/** Intent PayPal con id (para lista en detalle). */
export interface AdminInvoicePayPalIntentRow extends AdminInvoicePayPalIntent {
  id: string;
}

/** Estado de conciliación de una factura. */
export type InvoiceReconciliationStatus =
  | 'sin_intento'
  | 'intento_creado'
  | 'capturado'
  | 'pago_registrado'
  | 'invoice_paid';

/** Detalle de factura con intentos PayPal y pagos. */
export interface AdminInvoiceDetail {
  id: string;
  number: string;
  organizationId: string;
  organizationName: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  paymentIntents: AdminInvoicePayPalIntentRow[];
  payments: AdminPayment[];
  reconciliationStatus: InvoiceReconciliationStatus;
}

export interface AdminInvoice {
  id: string;
  number: string;
  organizationId: string;
  organizationName: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
  /** Último payment_intent PayPal asociado (si existe). */
  lastPayPalIntent?: AdminInvoicePayPalIntent;
}

export interface AdminPayment {
  id: string;
  organizationId: string;
  organizationName: string;
  amount: number;
  paidAt: string;
  method: PaymentMethod;
  reference: string | null;
  registeredBy: string | null;
}

// ─── Platform Health ───────────────────────────────────────────────────────

export type ServiceStatus = 'operational' | 'degraded' | 'outage';

export interface AdminServiceStatus {
  name: string;
  status: ServiceStatus;
  latencyMs?: number;
  incidentCount: number;
  lastIncidentAt: string | null;
  lastSyncAt: string | null;
  notes?: string;
}

// ─── Compliance ────────────────────────────────────────────────────────────

export type ComplianceSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AdminComplianceIssue {
  id: string;
  severity: ComplianceSeverity;
  category: string;
  organizationId: string;
  organizationName: string;
  createdAt: string;
  status: 'open' | 'in_review' | 'resolved';
  description: string;
  actionLabel?: string;
  actionRoute?: string;
}

// ─── Growth ────────────────────────────────────────────────────────────────

export interface AdminTrialMetric {
  active: number;
  expiringSoon: number;
  conversionRate: number;
}

export interface AdminFeedbackItem {
  id: string;
  organizationId: string;
  organizationName: string;
  category: string;
  severity: string;
  message: string;
  status: 'new' | 'acknowledged' | 'resolved';
  createdAt: string;
}

export interface AdminOpportunity {
  id: string;
  organizationId: string;
  organizationName: string;
  type: 'high_usage_low_plan' | 'trial_engaged' | 'inactive_recoverable' | 'addon_candidate';
  score: number;
  notes?: string;
}

export interface AdminDemoLead {
  id: string;
  createdAt: string;
  nombre: string;
  email: string;
  organizacion: string | null;
  tipoOrganizacion: string | null;
  mensaje: string | null;
  demoOrgType: string | null;
  demoProfileLabel: string | null;
  demoRoute: string | null;
  ctaSource: string | null;
  status: string;
  notes: string | null;
}
