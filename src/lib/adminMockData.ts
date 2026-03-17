/**
 * Admin Panel — Centralized mock data for all admin views.
 * TODO: Replace each section with Supabase queries when backend tables are ready.
 */

// ── Types ──

export type PlatformStatus = 'operational' | 'degraded' | 'critical';
export type OrgStatus = 'active' | 'trial' | 'suspended' | 'expired';
export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';
export type PaymentMethod = 'transferencia' | 'tarjeta' | 'efectivo' | 'cheque';
export type AlertLevel = 'critical' | 'warning' | 'info';
export type FeedbackType = 'sugerencia' | 'bug' | 'consulta';
export type CampaignStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled';
export type ModuleStatus = 'stable' | 'degraded' | 'offline' | 'beta';
export type ComplianceIssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface MockOrg {
  id: string;
  name: string;
  type: string;
  plan: string;
  status: OrgStatus;
  country: string;
  createdAt: string;
  lastActivity: string;
  healthScore: number;
  owner: string;
  modules: string[];
  usage: { producers: number; producersLimit: number; plots: number; plotsLimit: number; lots: number; lotsLimit: number; dossiers: number; dossiersLimit: number };
  billing: { mrr: number; cycle: 'monthly' | 'annual'; addons: string[]; pendingBalance: number; nextInvoice: string };
  trial?: { active: boolean; expiresAt: string; daysLeft: number };
  riskLevel: 'low' | 'medium' | 'high';
  riskIssues: string[];
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  orgId: string;
  orgName: string;
  role: string;
  internalRole: string;
  status: 'active' | 'inactive' | 'blocked';
  lastLogin: string;
  createdAt: string;
}

export interface MockInvoice {
  id: string;
  number: string;
  orgId: string;
  orgName: string;
  period: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
}

export interface MockPayment {
  id: string;
  orgName: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference: string;
  registeredBy: string;
}

export interface MockAlert {
  id: number;
  level: AlertLevel;
  message: string;
  orgName?: string;
  time: string;
  actionLabel?: string;
  actionUrl?: string;
}

export interface MockFeedback {
  id: number;
  user: string;
  orgName: string;
  type: FeedbackType;
  category: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  status: 'new' | 'reviewed' | 'planned' | 'resolved';
  date: string;
}

export interface MockCampaign {
  id: number;
  name: string;
  audience: string;
  audienceCount: number;
  status: CampaignStatus;
  date: string;
  openRate?: number;
}

export interface MockModuleHealth {
  name: string;
  code: string;
  status: ModuleStatus;
  lastIncident: string | null;
  uptime: number;
  description: string;
  details?: string;
  remediation?: string;
}

export interface MockHealthEvent {
  date: string;
  event: string;
  severity: 'warning' | 'info';
  module?: string;
  details?: string;
  remediation?: string;
}

export interface ServiceRemediation {
  service: string;
  remediation: string;
}

export const SERVICE_REMEDIATIONS: ServiceRemediation[] = [
  {
    service: 'Base de datos (PostgreSQL)',
    remediation: 'Verificar en Supabase Dashboard > Settings > Database que la instancia esté activa. Si persiste, ejecutar en SQL Editor:\n\nSELECT pg_is_in_recovery();\n\nSi retorna true, la base está en modo de recuperación. Contactar soporte de Supabase.',
  },
  {
    service: 'Autenticación (GoTrue)',
    remediation: 'Verificar en Supabase Dashboard > Authentication > Settings que el servicio esté habilitado. Revisar los Rate Limits en Settings > Auth > Rate Limits. Si el token JWT expiró, hacer logout y login nuevamente.',
  },
  {
    service: 'Storage',
    remediation: 'Verificar en Supabase Dashboard > Storage que los buckets existan. Si hay error de permisos, revisar las políticas RLS del Storage:\n\nSELECT * FROM storage.policies;',
  },
  {
    service: 'Edge Functions',
    remediation: 'La Edge Function no está desplegada o tiene un error de CORS. Pasos:\n\n1. En Supabase Dashboard > Edge Functions, verificar que "ensure-demo-user" exista y esté activa\n2. Si no está desplegada: supabase functions deploy ensure-demo-user\n3. Si hay error CORS, agregar headers en la función:\n\nconst corsHeaders = {\n  "Access-Control-Allow-Origin": "*",\n  "Access-Control-Allow-Methods": "POST, OPTIONS",\n};\n\n4. Verificar logs en Supabase Dashboard > Edge Functions > Logs',
  },
];

export interface MockComplianceIssue {
  id: number;
  orgName: string;
  type: string;
  description: string;
  severity: ComplianceIssueSeverity;
  date: string;
  status: 'pending' | 'investigating' | 'resolved';
  recommendedAction: string;
}

// ── Mock Organizations ──

export const MOCK_ORGS: MockOrg[] = [
  {
    id: 'org-001', name: 'Cooperativa La Montaña', type: 'cooperativa', plan: 'smart', status: 'active',
    country: 'Costa Rica', createdAt: '2025-06-15', lastActivity: 'Hace 2h', healthScore: 87, owner: 'María González',
    modules: ['Producción', 'Agronomía', 'VITAL', 'Finanzas', 'Cumplimiento'],
    usage: { producers: 420, producersLimit: 500, plots: 890, plotsLimit: 1000, lots: 42, lotsLimit: 100, dossiers: 18, dossiersLimit: 50 },
    billing: { mrr: 750, cycle: 'monthly', addons: ['EUDR', 'Nova Guard'], pendingBalance: 0, nextInvoice: '2026-04-01' },
    riskLevel: 'low', riskIssues: [],
  },
  {
    id: 'org-002', name: 'Exportadora Volcán del Café', type: 'exportador', plan: 'plus', status: 'active',
    country: 'Costa Rica', createdAt: '2025-08-22', lastActivity: 'Hace 5h', healthScore: 92, owner: 'Carlos Mendoza',
    modules: ['Orígenes', 'Comercial', 'Cumplimiento', 'EUDR', 'Calidad'],
    usage: { producers: 180, producersLimit: 300, plots: 340, plotsLimit: 600, lots: 67, lotsLimit: 150, dossiers: 45, dossiersLimit: 100 },
    billing: { mrr: 1400, cycle: 'annual', addons: ['EUDR', 'Nova Yield', 'API Access'], pendingBalance: 0, nextInvoice: '2026-04-01' },
    riskLevel: 'low', riskIssues: [],
  },
  {
    id: 'org-003', name: 'Cooperativa El Progreso', type: 'cooperativa', plan: 'smart', status: 'trial',
    country: 'Guatemala', createdAt: '2026-03-01', lastActivity: 'Hace 1d', healthScore: 64, owner: 'Ana Lucía Ramírez',
    modules: ['Producción', 'Agronomía'],
    usage: { producers: 85, producersLimit: 500, plots: 120, plotsLimit: 1000, lots: 5, lotsLimit: 100, dossiers: 0, dossiersLimit: 50 },
    billing: { mrr: 0, cycle: 'monthly', addons: [], pendingBalance: 0, nextInvoice: '—' },
    trial: { active: true, expiresAt: '2026-03-31', daysLeft: 14 },
    riskLevel: 'medium', riskIssues: ['Sin polígonos en 60% de parcelas'],
  },
  {
    id: 'org-004', name: 'Finca San Cristóbal', type: 'finca_empresarial', plan: 'lite', status: 'active',
    country: 'Honduras', createdAt: '2025-11-10', lastActivity: 'Hace 3d', healthScore: 71, owner: 'Roberto Hernández',
    modules: ['Producción', 'Finanzas'],
    usage: { producers: 12, producersLimit: 50, plots: 24, plotsLimit: 100, lots: 8, lotsLimit: 30, dossiers: 2, dossiersLimit: 10 },
    billing: { mrr: 65, cycle: 'monthly', addons: [], pendingBalance: 65, nextInvoice: '2026-03-15' },
    riskLevel: 'high', riskIssues: ['Factura vencida', 'Sin actividad reciente'],
  },
  {
    id: 'org-005', name: 'Beneficio Central del Valle', type: 'cooperativa', plan: 'plus', status: 'active',
    country: 'Costa Rica', createdAt: '2025-04-02', lastActivity: 'Hace 30min', healthScore: 95, owner: 'Laura Villegas',
    modules: ['Producción', 'Agronomía', 'VITAL', 'Finanzas', 'Cumplimiento', 'Calidad', 'Jornales'],
    usage: { producers: 620, producersLimit: 800, plots: 1340, plotsLimit: 1500, lots: 89, lotsLimit: 200, dossiers: 56, dossiersLimit: 100 },
    billing: { mrr: 1400, cycle: 'annual', addons: ['EUDR', 'Nova Guard', 'Nova Yield', 'VITAL'], pendingBalance: 0, nextInvoice: '2026-04-01' },
    riskLevel: 'low', riskIssues: [],
  },
  {
    id: 'org-006', name: 'Asociación Cafetalera Chirripó', type: 'cooperativa', plan: 'smart', status: 'suspended',
    country: 'Costa Rica', createdAt: '2025-07-18', lastActivity: 'Hace 45d', healthScore: 32, owner: 'José Ureña',
    modules: ['Producción'],
    usage: { producers: 210, producersLimit: 500, plots: 380, plotsLimit: 1000, lots: 15, lotsLimit: 100, dossiers: 0, dossiersLimit: 50 },
    billing: { mrr: 750, cycle: 'monthly', addons: [], pendingBalance: 1500, nextInvoice: '—' },
    riskLevel: 'high', riskIssues: ['Suspendida por mora', 'Sin actividad 45 días'],
  },
];

// ── Mock Users ──

export const MOCK_USERS: MockUser[] = [
  { id: 'u-001', name: 'María González', email: 'maria@lamontana.cr', orgId: 'org-001', orgName: 'Cooperativa La Montaña', role: 'cooperativa', internalRole: 'admin_org', status: 'active', lastLogin: 'Hace 2h', createdAt: '2025-06-15' },
  { id: 'u-002', name: 'Pedro Solano', email: 'pedro@lamontana.cr', orgId: 'org-001', orgName: 'Cooperativa La Montaña', role: 'cooperativa', internalRole: 'tecnico', status: 'active', lastLogin: 'Hace 4h', createdAt: '2025-07-01' },
  { id: 'u-003', name: 'Carlos Mendoza', email: 'carlos@volcancafe.com', orgId: 'org-002', orgName: 'Exportadora Volcán del Café', role: 'exportador', internalRole: 'admin_org', status: 'active', lastLogin: 'Hace 5h', createdAt: '2025-08-22' },
  { id: 'u-004', name: 'Lucía Jiménez', email: 'lucia@volcancafe.com', orgId: 'org-002', orgName: 'Exportadora Volcán del Café', role: 'exportador', internalRole: 'comercial', status: 'active', lastLogin: 'Hace 1d', createdAt: '2025-09-10' },
  { id: 'u-005', name: 'Ana Lucía Ramírez', email: 'ana@elprogreso.gt', orgId: 'org-003', orgName: 'Cooperativa El Progreso', role: 'cooperativa', internalRole: 'admin_org', status: 'active', lastLogin: 'Hace 1d', createdAt: '2026-03-01' },
  { id: 'u-006', name: 'Roberto Hernández', email: 'roberto@sancristobal.hn', orgId: 'org-004', orgName: 'Finca San Cristóbal', role: 'productor', internalRole: 'admin_org', status: 'active', lastLogin: 'Hace 3d', createdAt: '2025-11-10' },
  { id: 'u-007', name: 'Laura Villegas', email: 'laura@centralvalle.cr', orgId: 'org-005', orgName: 'Beneficio Central del Valle', role: 'cooperativa', internalRole: 'admin_org', status: 'active', lastLogin: 'Hace 30min', createdAt: '2025-04-02' },
  { id: 'u-008', name: 'Diego Morales', email: 'diego@centralvalle.cr', orgId: 'org-005', orgName: 'Beneficio Central del Valle', role: 'cooperativa', internalRole: 'tecnico', status: 'active', lastLogin: 'Hace 1h', createdAt: '2025-05-15' },
  { id: 'u-009', name: 'Sofía Araya', email: 'sofia@centralvalle.cr', orgId: 'org-005', orgName: 'Beneficio Central del Valle', role: 'cooperativa', internalRole: 'auditor', status: 'active', lastLogin: 'Hace 2d', createdAt: '2025-06-20' },
  { id: 'u-010', name: 'José Ureña', email: 'jose@chirripo.cr', orgId: 'org-006', orgName: 'Asociación Cafetalera Chirripó', role: 'cooperativa', internalRole: 'admin_org', status: 'inactive', lastLogin: 'Hace 45d', createdAt: '2025-07-18' },
  { id: 'u-011', name: 'Wolfgang Schiller', email: 'info@novasilva.co', orgId: '', orgName: 'Nova Silva', role: 'admin', internalRole: 'admin', status: 'active', lastLogin: 'Ahora', createdAt: '2024-01-01' },
];

// ── Mock Invoices ──

export const MOCK_INVOICES: MockInvoice[] = [
  { id: 'inv-001', number: 'NS-2026-0042', orgId: 'org-001', orgName: 'Cooperativa La Montaña', period: 'Mar 2026', amount: 870, status: 'paid', issuedAt: '2026-03-01', dueAt: '2026-03-15' },
  { id: 'inv-002', number: 'NS-2026-0043', orgId: 'org-002', orgName: 'Exportadora Volcán del Café', period: 'Mar 2026', amount: 1680, status: 'paid', issuedAt: '2026-03-01', dueAt: '2026-03-15' },
  { id: 'inv-003', number: 'NS-2026-0044', orgId: 'org-004', orgName: 'Finca San Cristóbal', period: 'Mar 2026', amount: 65, status: 'overdue', issuedAt: '2026-03-01', dueAt: '2026-03-15' },
  { id: 'inv-004', number: 'NS-2026-0045', orgId: 'org-005', orgName: 'Beneficio Central del Valle', period: 'Mar 2026', amount: 1820, status: 'paid', issuedAt: '2026-03-01', dueAt: '2026-03-15' },
  { id: 'inv-005', number: 'NS-2026-0041', orgId: 'org-001', orgName: 'Cooperativa La Montaña', period: 'Feb 2026', amount: 870, status: 'paid', issuedAt: '2026-02-01', dueAt: '2026-02-15' },
  { id: 'inv-006', number: 'NS-2026-0040', orgId: 'org-006', orgName: 'Asociación Cafetalera Chirripó', period: 'Feb 2026', amount: 750, status: 'overdue', issuedAt: '2026-02-01', dueAt: '2026-02-15' },
  { id: 'inv-007', number: 'NS-2026-0039', orgId: 'org-006', orgName: 'Asociación Cafetalera Chirripó', period: 'Ene 2026', amount: 750, status: 'overdue', issuedAt: '2026-01-01', dueAt: '2026-01-15' },
];

// ── Mock Payments ──

export const MOCK_PAYMENTS: MockPayment[] = [
  { id: 'pay-001', orgName: 'Cooperativa La Montaña', amount: 870, date: '2026-03-10', method: 'transferencia', reference: 'TRF-8892', registeredBy: 'Wolfgang S.' },
  { id: 'pay-002', orgName: 'Exportadora Volcán del Café', amount: 1680, date: '2026-03-08', method: 'transferencia', reference: 'TRF-8891', registeredBy: 'Wolfgang S.' },
  { id: 'pay-003', orgName: 'Beneficio Central del Valle', amount: 1820, date: '2026-03-05', method: 'transferencia', reference: 'TRF-8890', registeredBy: 'Wolfgang S.' },
  { id: 'pay-004', orgName: 'Cooperativa La Montaña', amount: 870, date: '2026-02-12', method: 'transferencia', reference: 'TRF-8845', registeredBy: 'Wolfgang S.' },
  { id: 'pay-005', orgName: 'Exportadora Volcán del Café', amount: 1680, date: '2026-02-10', method: 'tarjeta', reference: 'CC-4412', registeredBy: 'Carlos M.' },
];

// ── Mock Alerts ──

export const MOCK_ALERTS: MockAlert[] = [
  { id: 1, level: 'critical', message: 'Asociación Chirripó: 2 facturas vencidas ($1,500 pendiente)', orgName: 'Asociación Cafetalera Chirripó', time: 'Hace 1h', actionLabel: 'Ver cuenta', actionUrl: '/admin/organizations' },
  { id: 2, level: 'critical', message: 'Finca San Cristóbal: factura vencida de Marzo ($65)', orgName: 'Finca San Cristóbal', time: 'Hace 2h', actionLabel: 'Ver factura' },
  { id: 3, level: 'warning', message: 'Cooperativa El Progreso: trial vence en 14 días, bajo engagement', orgName: 'Cooperativa El Progreso', time: 'Hace 6h', actionLabel: 'Ver trial' },
  { id: 4, level: 'warning', message: 'Nova Yield: tasa de error superior al 3% en últimas 24h', time: 'Hace 8h', actionLabel: 'Ver plataforma' },
  { id: 5, level: 'warning', message: 'Hash mismatch detectado en 2 registros de nutricion_aplicaciones', time: 'Hace 12h', actionLabel: 'Ver integridad' },
  { id: 6, level: 'info', message: 'Beneficio Central del Valle superó 600 productores activos (plan: 800)', orgName: 'Beneficio Central del Valle', time: 'Hace 1d' },
  { id: 7, level: 'info', message: 'Nuevo trial registrado: Cooperativa El Progreso (Guatemala)', time: 'Hace 16d' },
];

// ── Mock Feedback ──

export const MOCK_FEEDBACK: MockFeedback[] = [
  { id: 1, user: 'María González', orgName: 'Cooperativa La Montaña', type: 'sugerencia', category: 'EUDR', severity: 'medium', message: 'Permitir exportación PDF de dossiers EUDR completos con firma digital', status: 'planned', date: '2026-03-14' },
  { id: 2, user: 'Carlos Mendoza', orgName: 'Exportadora Volcán del Café', type: 'bug', category: 'Parcelas', severity: 'high', message: 'Error al cargar parcelas con más de 100 puntos GPS en el polígono', status: 'reviewed', date: '2026-03-13' },
  { id: 3, user: 'Laura Villegas', orgName: 'Beneficio Central del Valle', type: 'sugerencia', category: 'Notificaciones', severity: 'low', message: 'Notificaciones push para alertas de Nova Guard en dispositivos móviles', status: 'new', date: '2026-03-11' },
  { id: 4, user: 'Diego Morales', orgName: 'Beneficio Central del Valle', type: 'sugerencia', category: 'Nutrición', severity: 'medium', message: 'Comparar planes de nutrición entre cosechas para evaluar cambios', status: 'new', date: '2026-03-10' },
  { id: 5, user: 'Pedro Solano', orgName: 'Cooperativa La Montaña', type: 'bug', category: 'Jornales', severity: 'medium', message: 'Cálculo de horas extra no coincide con el reporte impreso', status: 'resolved', date: '2026-03-08' },
  { id: 6, user: 'Lucía Jiménez', orgName: 'Exportadora Volcán del Café', type: 'consulta', category: 'API', severity: 'low', message: 'Documentación sobre webhook para integración con ERP propio', status: 'reviewed', date: '2026-03-05' },
];

// ── Mock Campaigns ──

export const MOCK_CAMPAIGNS: MockCampaign[] = [
  { id: 1, name: 'Novedades EUDR Q1 2026', audience: 'Todos los clientes', audienceCount: 5, status: 'sent', date: '2026-03-12', openRate: 80 },
  { id: 2, name: 'Promo anual: 20% descuento', audience: 'Trials activos', audienceCount: 1, status: 'scheduled', date: '2026-03-20' },
  { id: 3, name: 'Guía Nova Guard: plagas Q2', audience: 'Cooperativas', audienceCount: 3, status: 'draft', date: '—' },
];

// ── Module Health ──

export const MOCK_MODULE_HEALTH: MockModuleHealth[] = [
  { name: 'EUDR / Trazabilidad', code: 'eudr', status: 'stable', lastIncident: null, uptime: 99.9, description: 'Dossiers, geolocalización, cadena de custodia', details: 'Módulo de cumplimiento EUDR operando normalmente. 87 dossiers generados, 74 listos para aprobación. Sin incidentes recientes.', remediation: 'Si hay problemas de geolocalización, verificar la tabla parcelas tenga coordenadas válidas:\n\nSELECT id, nombre FROM parcelas WHERE coordenadas IS NULL;' },
  { name: 'Nova Guard', code: 'guard', status: 'stable', lastIncident: '2026-02-28', uptime: 99.5, description: 'Diagnóstico fitosanitario y tratamientos', details: 'Último incidente el 28 de febrero: falso positivo en diagnóstico de roya por umbral de sensibilidad muy bajo. Se ajustó el threshold de 0.65 a 0.75.', remediation: 'Si se repiten falsos positivos, ajustar el umbral de detección en la configuración del motor:\n\nUPDATE guard_config SET detection_threshold = 0.75 WHERE module = \'roya\';' },
  { name: 'Nova Yield', code: 'yield', status: 'degraded', lastIncident: '2026-03-16', uptime: 97.2, description: 'Estimaciones de cosecha y modelos predictivos', details: 'DEGRADADO: Latencia elevada (>800ms) durante 45 min el 16 de marzo. El modelo predictivo está consumiendo más recursos de lo esperado en organizaciones con >500 parcelas.', remediation: '1. Verificar el rendimiento de la Edge Function:\n   supabase functions logs nova-yield --tail\n\n2. Si la latencia persiste, optimizar la query principal:\n   CREATE INDEX idx_parcelas_org_yield ON parcelas(organization_id) WHERE variedad IS NOT NULL;\n\n3. Considerar paginar las estimaciones por lotes de 100 parcelas.' },
  { name: 'Protocolo VITAL', code: 'vital', status: 'stable', lastIncident: null, uptime: 99.8, description: 'Diagnóstico de resiliencia y sostenibilidad', details: 'Protocolo VITAL operando normalmente. Cuestionarios de diagnóstico activos para 5 organizaciones.', remediation: 'Si los scores no se calculan, verificar que las respuestas estén guardadas:\n\nSELECT COUNT(*) FROM vital_respuestas WHERE created_at > NOW() - INTERVAL \'7 days\';' },
  { name: 'Jornales', code: 'jornales', status: 'stable', lastIncident: null, uptime: 99.9, description: 'Gestión de mano de obra y costos laborales', details: 'Módulo de jornales estable. Procesamiento de planillas y costos sin incidentes.', remediation: 'Si hay errores en cálculos de horas extra, verificar la configuración de jornada en la organización.' },
  { name: 'Finanzas', code: 'finanzas', status: 'stable', lastIncident: null, uptime: 99.7, description: 'Costos, ingresos, scoring crediticio', details: 'Motor financiero y scoring crediticio funcionando correctamente. Última calibración del modelo: 2026-03-01.', remediation: 'Si el scoring no actualiza, revisar que la vista materializada esté refrescándose:\n\nREFRESH MATERIALIZED VIEW CONCURRENTLY mv_credit_scores;' },
  { name: 'Inventario', code: 'inventario', status: 'beta', lastIncident: null, uptime: 98.0, description: 'Control de insumos y productos en bodega', details: 'Módulo en BETA. Funcionalidad básica de registro de insumos disponible. Pendientes: alertas de stock bajo, integración con proveedores.', remediation: 'Módulo en beta — reportar bugs directamente en el canal de desarrollo. No requiere intervención de producción.' },
  { name: 'Nutrición', code: 'nutricion', status: 'stable', lastIncident: '2026-03-02', uptime: 99.4, description: 'Planes nutricionales, análisis de suelo y ejecución', details: 'Último incidente el 2 de marzo: error de cálculo en motor v2.1 al procesar recomendaciones con pH < 4.0. Corregido en v2.1.1.', remediation: 'Si se detectan cálculos incorrectos en planes nutricionales:\n\n1. Verificar versión del motor: SELECT version FROM nutrition_engine_config;\n2. Si es < 2.1.1, actualizar: UPDATE nutrition_engine_config SET version = \'2.1.1\';\n3. Recalcular planes afectados con el RPC: SELECT recalculate_nutrition_plan(plan_id);' },
];

// ── Compliance Issues ──

export const MOCK_COMPLIANCE_ISSUES: MockComplianceIssue[] = [
  { id: 1, orgName: 'Finca San Cristóbal', type: 'Hash mismatch', description: 'Registro de nutricion_aplicaciones #892 con hash SHA-256 alterado', severity: 'critical', date: '2026-03-16', status: 'pending', recommendedAction: 'Investigar registro original y contactar administrador de la organización' },
  { id: 2, orgName: 'Cooperativa El Progreso', type: 'Parcelas sin polígono', description: '72 de 120 parcelas carecen de delimitación geográfica', severity: 'high', date: '2026-03-14', status: 'investigating', recommendedAction: 'Notificar a la organización para completar geolocalización' },
  { id: 3, orgName: 'Cooperativa La Montaña', type: 'Evidencia faltante', description: '8 lotes sin fotografías de evidencia de entrega', severity: 'medium', date: '2026-03-12', status: 'pending', recommendedAction: 'Solicitar carga retroactiva de evidencia' },
  { id: 4, orgName: 'Exportadora Volcán del Café', type: 'Dossier EUDR incompleto', description: 'Dossier DS-067 sin declaración de geolocalización de origen', severity: 'high', date: '2026-03-10', status: 'pending', recommendedAction: 'Completar datos de origen antes de envío a la UE' },
  { id: 5, orgName: 'Beneficio Central del Valle', type: 'Trazabilidad incompleta', description: 'Lote LT-2026-089 sin vinculación a parcela de origen', severity: 'medium', date: '2026-03-08', status: 'resolved', recommendedAction: 'Lote ya vinculado correctamente' },
];

// ── Revenue KPIs ──

export const MOCK_REVENUE = {
  mrr: 4_435,
  arrProjected: 53_220,
  collectedThisMonth: 4_370,
  accountsReceivable: 1_565,
  trialsExpiringSoon: 1,
  recentUpgrades: 0,
  churnRate: 0,
  suspensions: 1,
};

// ── Integrity KPIs ──

export const MOCK_INTEGRITY = {
  verifiedRecords: 98.5,
  validHashes: 99.2,
  mismatchIncidents: 2,
  eventsWithoutEvidence: 12,
};

// ── EUDR KPIs ──

export const MOCK_EUDR = {
  generated: 87,
  approvable: 74,
  atRisk: 8,
  withGaps: 5,
};

// ── Infrastructure ──

export const MOCK_INFRA = {
  storage: { used: 1.2, total: 8, unit: 'GB', growthPerMonth: 0.3 },
  syncFailRate: 0.3,
  avgLatency: 142,
  errorsLast24h: 7,
  pendingQueues: 3,
  failedSyncs: 2,
  aiInferences: { yield: 142, guard: 67 },
  edgeFunctions: 22,
};

// ── Health Timeline ──

export const MOCK_HEALTH_TIMELINE = [
  { date: '2026-03-16', event: 'Nova Yield: latencia elevada (>800ms) durante 45 min', severity: 'warning' as const },
  { date: '2026-03-14', event: 'Migración de base de datos completada sin incidentes', severity: 'info' as const },
  { date: '2026-03-10', event: 'Edge Function send-client-email: timeout intermitente', severity: 'warning' as const },
  { date: '2026-03-02', event: 'Nutrición: error de cálculo corregido en motor v2.1', severity: 'info' as const },
  { date: '2026-02-28', event: 'Nova Guard: falso positivo en diagnóstico de roya', severity: 'warning' as const },
];

// ── Audit Log ──

export const MOCK_AUDIT_LOG = [
  { id: 1, event: 'Hash verificado: lote LT-2026-087', time: 'Hace 1h', severity: 'ok' as const },
  { id: 2, event: 'Alerta: gap en trazabilidad parcela P-442', time: 'Hace 3h', severity: 'warning' as const },
  { id: 3, event: 'Nuevo dossier EUDR generado: Cooperativa La Montaña', time: 'Hace 6h', severity: 'ok' as const },
  { id: 4, event: 'Hash mismatch detectado: nutricion_aplicaciones #892', time: 'Hace 12h', severity: 'critical' as const },
  { id: 5, event: 'Acceso admin: cambio de plan Finca San Cristóbal', time: 'Hace 1d', severity: 'ok' as const },
  { id: 6, event: 'Suspensión automática: Asociación Chirripó (mora)', time: 'Hace 3d', severity: 'warning' as const },
  { id: 7, event: 'Factura NS-2026-0042 marcada como pagada', time: 'Hace 5d', severity: 'ok' as const },
];

// ── Opportunities (Growth) ──

export const MOCK_OPPORTUNITIES = [
  { orgName: 'Beneficio Central del Valle', type: 'upgrade', reason: 'Uso alto: 620/800 productores y 7 módulos activos. Candidato a Enterprise.', engagement: 95 },
  { orgName: 'Cooperativa El Progreso', type: 'conversion', reason: 'Trial activo con 85 productores registrados en 16 días. Alta actividad.', engagement: 72 },
  { orgName: 'Asociación Cafetalera Chirripó', type: 'reactivation', reason: 'Cuenta suspendida con 210 productores. Potencial de recuperación.', engagement: 0 },
];

// ── Helpers ──

export function getStatusColor(status: OrgStatus): string {
  const map: Record<OrgStatus, string> = {
    active: 'text-success',
    trial: 'text-primary',
    suspended: 'text-destructive',
    expired: 'text-muted-foreground',
  };
  return map[status] || 'text-muted-foreground';
}

export function getStatusBadgeVariant(status: OrgStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  const map: Record<OrgStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    trial: 'secondary',
    suspended: 'destructive',
    expired: 'outline',
  };
  return map[status] || 'outline';
}

export function getInvoiceStatusVariant(status: InvoiceStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  const map: Record<InvoiceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    paid: 'default',
    pending: 'secondary',
    overdue: 'destructive',
    cancelled: 'outline',
  };
  return map[status] || 'outline';
}

export function getSeverityVariant(severity: ComplianceIssueSeverity): 'default' | 'secondary' | 'destructive' | 'outline' {
  const map: Record<ComplianceIssueSeverity, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    critical: 'destructive',
    high: 'destructive',
    medium: 'secondary',
    low: 'outline',
  };
  return map[severity] || 'outline';
}

export function getRiskColor(level: 'low' | 'medium' | 'high'): string {
  return level === 'high' ? 'text-destructive' : level === 'medium' ? 'text-warning' : 'text-success';
}
