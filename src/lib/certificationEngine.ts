/**
 * Certification Intelligence Engine
 * Based on: Arquitectura de Inteligencia de Certificación Café (Nova Silva)
 *
 * Covers: EUDR, Rainforest Alliance, Fairtrade SPO, C.A.F.E. Practices, 4C, Orgánico, ESENCIAL Costa Rica
 */

// ══════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════

export type SchemeKey = 'eudr' | 'rainforest_alliance' | 'fairtrade' | 'cafe_practices' | '4c' | 'organic' | 'esencial_cr';
export type SeverityLevel = 'tolerancia_cero' | 'critico' | 'mayor' | 'menor' | 'mejora';
export type EvidenceStatus = 'completo' | 'parcial' | 'faltante' | 'vencido' | 'rechazado';
export type RequirementScope = 'parcela' | 'organizacion' | 'productor' | 'lote' | 'trabajador';
export type CorrectiveStatus = 'pendiente' | 'en_progreso' | 'resuelto' | 'vencido' | 'escalado';

export interface CertificationScheme {
  key: SchemeKey;
  name: string;
  shortName: string;
  type: 'regulacion_estatal' | 'estandar_voluntario' | 'codigo_corporativo' | 'marca_pais';
  typeLabel: string;
  deforestationCutoff: string | null;
  geoRequirement: string;
  traceability: string;
  auditFrequency: string;
  description: string;
  color: string;
  icon: string;
  categories: RequirementCategory[];
}

export interface RequirementCategory {
  key: string;
  label: string;
  requirements: CertificationRequirement[];
}

export interface CertificationRequirement {
  id: string;
  scheme: SchemeKey;
  category: string;
  name: string;
  description: string;
  whyItMatters: string;
  scope: RequirementScope;
  severity: SeverityLevel;
  evidenceTypes: string[];
  requiredDataFields: string[];
  frequency: string;
  crossSchemeOverlap: SchemeKey[];
  status?: EvidenceStatus;
  evidenceCount?: number;
  evidenceRequired?: number;
}

export interface EvidenceItem {
  id: string;
  requirementId: string;
  type: string;
  fileName: string;
  uploadDate: string;
  expirationDate?: string;
  status: EvidenceStatus;
  reusedInSchemes: SchemeKey[];
  notes?: string;
  uploadedBy?: string;
  hash?: string;
}

export interface CorrectiveAction {
  id: string;
  requirementId: string;
  scheme: SchemeKey;
  issue: string;
  severity: SeverityLevel;
  owner: string;
  dueDate: string;
  status: CorrectiveStatus;
  resolution?: string;
  createdDate: string;
}

export interface SchemeReadiness {
  scheme: SchemeKey;
  totalRequirements: number;
  compliant: number;
  partial: number;
  missing: number;
  expired: number;
  readinessPercent: number;
  criticalGaps: number;
  riskLevel: 'bajo' | 'medio' | 'alto' | 'critico';
}

export interface GapItem {
  requirementId: string;
  requirementName: string;
  scheme: SchemeKey;
  severity: SeverityLevel;
  missingEvidence: string[];
  impact: string;
  suggestedAction: string;
}

// ══════════════════════════════════════════════════
// SCHEMES
// ══════════════════════════════════════════════════

export const CERTIFICATION_SCHEMES: CertificationScheme[] = [
  {
    key: 'eudr',
    name: 'Reglamento UE Libre de Deforestación',
    shortName: 'EUDR',
    type: 'regulacion_estatal',
    typeLabel: 'Regulación Estatal Vinculante',
    deforestationCutoff: '31 de diciembre de 2020',
    geoRequirement: 'Puntos GPS (<4ha) o polígonos (>4ha) a 6 decimales',
    traceability: 'Identidad preservada (parcela a lote)',
    auditFrequency: 'Por lote de exportación (DDS)',
    description: 'Regulación obligatoria que exige demostrar que los productos no provienen de tierras deforestadas o degradadas después del 31/12/2020.',
    color: 'hsl(var(--primary))',
    icon: 'Shield',
    categories: [
      {
        key: 'geo_spatial',
        label: 'Validación Geoespacial',
        requirements: [
          {
            id: 'REQ_EUDR_001',
            scheme: 'eudr',
            category: 'Validación Geoespacial',
            name: 'Polígonos topológicamente válidos (>4ha)',
            description: 'Parcelas mayores a 4 hectáreas deben tener polígono georreferenciado topológicamente limpio, sin auto-intersecciones.',
            whyItMatters: 'Sin polígono válido, el lote de café queda bloqueado comercialmente. No se puede generar la Declaración de Debida Diligencia (DDS).',
            scope: 'parcela',
            severity: 'tolerancia_cero',
            evidenceTypes: ['GeoJSON', 'Shapefile', 'Análisis multiespectral NDVI'],
            requiredDataFields: ['parcel_id', 'geometry_polygon', 'gps_points', 'establishment_date', 'satellite_risk_score'],
            frequency: 'Por lote de exportación',
            crossSchemeOverlap: ['rainforest_alliance', '4c'],
          },
          {
            id: 'REQ_EUDR_002',
            scheme: 'eudr',
            category: 'Validación Geoespacial',
            name: 'Puntos GPS a 6 decimales (<4ha)',
            description: 'Parcelas menores o iguales a 4 hectáreas requieren al menos un punto GPS con precisión de 6 decimales.',
            whyItMatters: 'Dato atómico obligatorio para la Declaración de Debida Diligencia. Sin esto, el operador no puede declarar ante la UE.',
            scope: 'parcela',
            severity: 'tolerancia_cero',
            evidenceTypes: ['Coordenadas GPS verificadas', 'Captura con metadatos'],
            requiredDataFields: ['parcel_id', 'gps_latitude', 'gps_longitude', 'precision_decimals'],
            frequency: 'Por lote de exportación',
            crossSchemeOverlap: ['rainforest_alliance', 'fairtrade', '4c'],
          },
          {
            id: 'REQ_EUDR_003',
            scheme: 'eudr',
            category: 'Validación Geoespacial',
            name: 'Fecha de establecimiento del cultivo',
            description: 'Variable de cruce obligatoria contra la fecha límite del 31/12/2020 para verificar que no hubo conversión de uso de suelo.',
            whyItMatters: 'Sin esta fecha, no se puede demostrar que la parcela existía antes del corte. Bloqueo inmediato de exportación.',
            scope: 'parcela',
            severity: 'tolerancia_cero',
            evidenceTypes: ['Registro de establecimiento', 'Imágenes satelitales históricas', 'Declaración jurada'],
            requiredDataFields: ['parcel_id', 'establishment_date', 'satellite_verification_date'],
            frequency: 'Una vez (verificación permanente)',
            crossSchemeOverlap: ['rainforest_alliance', 'cafe_practices'],
          },
        ],
      },
      {
        key: 'legalidad',
        label: 'Legalidad y Cumplimiento',
        requirements: [
          {
            id: 'REQ_EUDR_004',
            scheme: 'eudr',
            category: 'Legalidad y Cumplimiento',
            name: 'Cumplimiento de legislación del país de origen',
            description: 'Producción debe cumplir con derechos de uso de tierra, protección ambiental, normativas laborales, derechos humanos, leyes fiscales.',
            whyItMatters: 'Requisito amplio que conecta con toda la estructura legal local. Cubre desde tenencia hasta derechos laborales.',
            scope: 'organizacion',
            severity: 'critico',
            evidenceTypes: ['Permisos de uso de suelo', 'Certificación CCSS', 'Patente municipal', 'Personería jurídica'],
            requiredDataFields: ['org_id', 'land_use_permit', 'tax_compliance', 'labor_compliance'],
            frequency: 'Anual',
            crossSchemeOverlap: ['esencial_cr', 'cafe_practices', 'fairtrade'],
          },
        ],
      },
      {
        key: 'trazabilidad',
        label: 'Trazabilidad y Cadena de Custodia',
        requirements: [
          {
            id: 'REQ_EUDR_005',
            scheme: 'eudr',
            category: 'Trazabilidad y Cadena de Custodia',
            name: 'Declaración de Debida Diligencia (DDS)',
            description: 'El operador debe generar e introducir una DDS en el Sistema de Información de la UE antes de la comercialización.',
            whyItMatters: 'Es el documento final que habilita la importación a la UE. Sin DDS, el producto no cruza la aduana.',
            scope: 'lote',
            severity: 'tolerancia_cero',
            evidenceTypes: ['DDS generada (JSON/XML)', 'Confirmación de envío al sistema UE'],
            requiredDataFields: ['lot_id', 'dds_reference', 'submission_date', 'operator_id'],
            frequency: 'Por lote de exportación',
            crossSchemeOverlap: [],
          },
        ],
      },
    ],
  },
  {
    key: 'rainforest_alliance',
    name: 'Rainforest Alliance (Norma 2020)',
    shortName: 'Rainforest Alliance',
    type: 'estandar_voluntario',
    typeLabel: 'Estándar Voluntario (VSS)',
    deforestationCutoff: '1 de enero de 2014',
    geoRequirement: 'Polígonos y puntos alineados a EUDR a 6 decimales',
    traceability: 'Identidad preservada / Balance de masas permitido',
    auditFrequency: 'Auditoría trienal con vigilancia anual',
    description: 'Estándar de agricultura sostenible que exige conservación de biodiversidad, protección de suelos y 15% de cobertura vegetal natural.',
    color: 'hsl(142 71% 45%)',
    icon: 'Leaf',
    categories: [
      {
        key: 'ambiental',
        label: 'Liderazgo Ambiental',
        requirements: [
          {
            id: 'REQ_RA_001',
            scheme: 'rainforest_alliance',
            category: 'Liderazgo Ambiental',
            name: 'Conservación de biodiversidad y vegetación natural',
            description: '15% de cobertura de vegetación natural no cultivada dentro de los linderos de la finca para el sexto año de certificación.',
            whyItMatters: 'Requisito de mejora con plazo definido. Fincas sin avance en cobertura pierden la certificación.',
            scope: 'parcela',
            severity: 'critico',
            evidenceTypes: ['Inventario arbóreo georreferenciado', 'Análisis NDVI', 'Fotografías de campo'],
            requiredDataFields: ['parcel_id', 'tree_cover_percent', 'ndvi_score', 'shade_tree_inventory'],
            frequency: 'Anual',
            crossSchemeOverlap: ['4c', 'organic'],
          },
          {
            id: 'REQ_RA_002',
            scheme: 'rainforest_alliance',
            category: 'Liderazgo Ambiental',
            name: 'Manejo integrado de plagas (MIP)',
            description: 'Implementación documentada de prácticas de manejo integrado de plagas con reducción progresiva de agroquímicos.',
            whyItMatters: 'Requisito core. Sin documentación de MIP, la auditoría levanta no-conformidad mayor.',
            scope: 'parcela',
            severity: 'mayor',
            evidenceTypes: ['Registros de aplicación', 'Plan MIP documentado', 'Inventario de insumos'],
            requiredDataFields: ['parcel_id', 'ipm_plan_id', 'application_records', 'pesticide_inventory'],
            frequency: 'Por ciclo de cosecha',
            crossSchemeOverlap: ['4c', 'cafe_practices', 'organic'],
          },
        ],
      },
      {
        key: 'social',
        label: 'Responsabilidad Social',
        requirements: [
          {
            id: 'REQ_RA_003',
            scheme: 'rainforest_alliance',
            category: 'Responsabilidad Social',
            name: 'Sistema Assess-and-Address (trabajo infantil/forzoso)',
            description: 'Implementación de sistema de monitoreo y remediación para detectar riesgos de trabajo infantil, forzoso y discriminación.',
            whyItMatters: 'Requisito core de tolerancia cero. Su ausencia causa suspensión inmediata del certificado.',
            scope: 'organizacion',
            severity: 'tolerancia_cero',
            evidenceTypes: ['Política escrita', 'Registros de monitoreo', 'Informes de remediación', 'Entrevistas documentadas'],
            requiredDataFields: ['org_id', 'policy_document_id', 'monitoring_records', 'remediation_logs'],
            frequency: 'Continuo con revisión anual',
            crossSchemeOverlap: ['fairtrade', 'cafe_practices', '4c'],
          },
        ],
      },
      {
        key: 'economico',
        label: 'Sostenibilidad Económica',
        requirements: [
          {
            id: 'REQ_RA_004',
            scheme: 'rainforest_alliance',
            category: 'Sostenibilidad Económica',
            name: 'Diferencial de Sostenibilidad pagado al productor',
            description: 'Pago obligatorio del Diferencial de Sostenibilidad e inversiones de sostenibilidad a los agricultores certificados.',
            whyItMatters: 'Es el mecanismo económico central del esquema. Sin evidencia de pago, no hay certificación.',
            scope: 'productor',
            severity: 'critico',
            evidenceTypes: ['Comprobantes de pago', 'Registros financieros', 'Conciliaciones bancarias'],
            requiredDataFields: ['producer_id', 'payment_receipt_id', 'amount_paid', 'payment_date'],
            frequency: 'Por ciclo de cosecha',
            crossSchemeOverlap: ['fairtrade'],
          },
        ],
      },
    ],
  },
  {
    key: 'fairtrade',
    name: 'Fairtrade (Pequeños Productores)',
    shortName: 'Fairtrade',
    type: 'estandar_voluntario',
    typeLabel: 'Estándar Voluntario (VSS)',
    deforestationCutoff: 'Alineación paulatina con EUDR post-2024',
    geoRequirement: 'Soporte en validación y transmisión de polígonos',
    traceability: 'Identidad preservada / Balance de masas permitido',
    auditFrequency: 'Auditoría trienal con revisiones anuales (FLOCERT)',
    description: 'Estándar centrado en equidad económica con precio mínimo garantizado, prima comunitaria y gobernanza democrática.',
    color: 'hsl(217 91% 50%)',
    icon: 'Users',
    categories: [
      {
        key: 'economico',
        label: 'Equidad Económica',
        requirements: [
          {
            id: 'REQ_FT_001',
            scheme: 'fairtrade',
            category: 'Equidad Económica',
            name: 'Precio Mínimo Garantizado pagado al productor',
            description: 'Garantizar que el precio pagado al productor nunca cae por debajo del precio mínimo Fairtrade establecido.',
            whyItMatters: 'Es la piedra angular del sistema. Su incumplimiento genera suspensión por FLOCERT.',
            scope: 'productor',
            severity: 'tolerancia_cero',
            evidenceTypes: ['Registros de liquidación', 'Comprobantes de pago', 'Contratos de compra'],
            requiredDataFields: ['producer_id', 'price_paid', 'fairtrade_minimum', 'transaction_date'],
            frequency: 'Por transacción',
            crossSchemeOverlap: ['cafe_practices'],
          },
          {
            id: 'REQ_FT_002',
            scheme: 'fairtrade',
            category: 'Equidad Económica',
            name: 'Prima Fairtrade destinada a proyectos comunitarios',
            description: 'Prima fija invertida en proyectos de desarrollo decididos democráticamente por la asamblea de productores.',
            whyItMatters: 'La desviación de la prima genera suspensión inmediata. Auditores rastrean uso de fondos.',
            scope: 'organizacion',
            severity: 'critico',
            evidenceTypes: ['Actas de asamblea', 'Informe de uso de prima', 'Comprobantes de proyectos', 'Auditoría financiera'],
            requiredDataFields: ['org_id', 'premium_amount', 'project_ids', 'assembly_minutes_hash'],
            frequency: 'Anual',
            crossSchemeOverlap: [],
          },
        ],
      },
      {
        key: 'gobernanza',
        label: 'Gobernanza Democrática',
        requirements: [
          {
            id: 'REQ_FT_003',
            scheme: 'fairtrade',
            category: 'Gobernanza Democrática',
            name: 'Sistema de Control Interno (IMS)',
            description: 'Sistema robusto de control interno con políticas documentadas, monitoreo y capacitación.',
            whyItMatters: 'Sin IMS, la estructura organizacional no cumple el estándar. Es prerrequisito para la auditoría.',
            scope: 'organizacion',
            severity: 'critico',
            evidenceTypes: ['Manual IMS', 'Registros de capacitación', 'Listas de inspectores internos'],
            requiredDataFields: ['org_id', 'ims_document_id', 'training_records', 'inspector_list'],
            frequency: 'Continuo',
            crossSchemeOverlap: ['4c'],
          },
        ],
      },
      {
        key: 'social',
        label: 'Protección Social',
        requirements: [
          {
            id: 'REQ_FT_004',
            scheme: 'fairtrade',
            category: 'Protección Social',
            name: 'Erradicación de trabajo forzoso e infantil',
            description: 'Monitoreo y remediación activos para detectar e impedir la explotación laboral.',
            whyItMatters: 'Tolerancia cero global. Un solo hallazgo puede revocar el certificado de toda la organización.',
            scope: 'organizacion',
            severity: 'tolerancia_cero',
            evidenceTypes: ['Registros de nómina', 'Verificación de edad', 'Entrevistas de campo', 'Contratos laborales'],
            requiredDataFields: ['worker_id', 'worker_date_of_birth', 'labor_contract_hash', 'remediation_logs'],
            frequency: 'Continuo con auditoría trienal',
            crossSchemeOverlap: ['rainforest_alliance', 'cafe_practices', '4c'],
          },
        ],
      },
    ],
  },
  {
    key: 'cafe_practices',
    name: 'C.A.F.E. Practices (Starbucks)',
    shortName: 'C.A.F.E. Practices',
    type: 'codigo_corporativo',
    typeLabel: 'Código de Conducta Corporativo',
    deforestationCutoff: 'Año 2004',
    geoRequirement: 'Mapas de finca e identificación de áreas de conservación',
    traceability: 'Transparencia económica requerida',
    auditFrequency: 'Auditoría de tercera parte, frecuencia según puntaje',
    description: 'Sistema de puntuación con 200+ indicadores. ≥85% = Estratégico, <85% = Verificado. Transparencia económica absoluta hasta productor.',
    color: 'hsl(142 50% 35%)',
    icon: 'Coffee',
    categories: [
      {
        key: 'transparencia',
        label: 'Transparencia Económica',
        requirements: [
          {
            id: 'REQ_CAFE_001',
            scheme: 'cafe_practices',
            category: 'Transparencia Económica',
            name: 'Trazabilidad de pagos al productor individual',
            description: 'Evidencia documental auditable que demuestre el pago directo y transparente de la liquidación al productor.',
            whyItMatters: 'Starbucks exige transparencia total. Sin comprobantes de pago verificables, se pierde el estatus.',
            scope: 'productor',
            severity: 'critico',
            evidenceTypes: ['Registros financieros digitales', 'Conciliaciones bancarias', 'Recibos firmados'],
            requiredDataFields: ['producer_id', 'transaction_receipt_id', 'volume_delivered_kg', 'price_paid_unit', 'payment_hash'],
            frequency: 'Por período contable de cosecha',
            crossSchemeOverlap: ['fairtrade', 'esencial_cr'],
          },
        ],
      },
      {
        key: 'ambiental',
        label: 'Liderazgo Ambiental',
        requirements: [
          {
            id: 'REQ_CAFE_002',
            scheme: 'cafe_practices',
            category: 'Liderazgo Ambiental',
            name: 'Reducción documentada de agroquímicos sintéticos',
            description: 'Registro verificable de reducción progresiva en el uso de pesticidas y fertilizantes sintéticos.',
            whyItMatters: 'Puntaje ambiental directo. Cada punto perdido aquí aleja del estatus Estratégico.',
            scope: 'parcela',
            severity: 'mayor',
            evidenceTypes: ['Historial de aplicaciones', 'Inventarios de bodega', 'Plan de reducción'],
            requiredDataFields: ['parcel_id', 'application_log', 'chemical_inventory', 'reduction_plan_id'],
            frequency: 'Anual',
            crossSchemeOverlap: ['rainforest_alliance', '4c', 'organic'],
          },
        ],
      },
      {
        key: 'social',
        label: 'Responsabilidad Social',
        requirements: [
          {
            id: 'REQ_CAFE_003',
            scheme: 'cafe_practices',
            category: 'Responsabilidad Social',
            name: 'Indicadores de Tolerancia Cero (ZT)',
            description: 'Tolerancia cero para trabajo infantil, trabajo forzoso, conversión de bosques post-2004, y pesticidas prohibidos.',
            whyItMatters: 'Cualquier hallazgo ZT invalida toda la evaluación independientemente del puntaje general.',
            scope: 'organizacion',
            severity: 'tolerancia_cero',
            evidenceTypes: ['Política escrita', 'Registros laborales', 'Mapas de cobertura forestal'],
            requiredDataFields: ['org_id', 'zt_policy_hash', 'labor_records', 'forest_cover_status'],
            frequency: 'Continuo',
            crossSchemeOverlap: ['rainforest_alliance', 'fairtrade', '4c'],
          },
        ],
      },
    ],
  },
  {
    key: '4c',
    name: '4C (Common Code for Coffee Community)',
    shortName: '4C',
    type: 'estandar_voluntario',
    typeLabel: 'Estándar de Sostenibilidad Base',
    deforestationCutoff: '31 de diciembre de 2020 (para unidades EUDR)',
    geoRequirement: 'Georreferenciación 100% de parcelas requerida',
    traceability: 'Trazabilidad de cadena y plausibilidad de volumen',
    auditFrequency: 'Mejora continua escalonada en ciclos de seis años',
    description: '27 principios en dimensiones económica, social y ambiental. Exclusión estricta de 10 prácticas inaceptables.',
    color: 'hsl(38 92% 50%)',
    icon: 'Globe',
    categories: [
      {
        key: 'practicas_inaceptables',
        label: 'Prácticas Inaceptables',
        requirements: [
          {
            id: 'REQ_4C_001',
            scheme: '4c',
            category: 'Prácticas Inaceptables',
            name: 'Exclusión de 10 prácticas inaceptables',
            description: 'Verificar ausencia total de: destrucción de bosques primarios, uso de plaguicidas prohibidos (Estocolmo/Rotterdam), trabajo forzoso, etc.',
            whyItMatters: 'Cada práctica inaceptable es eliminatoria. No hay remediación posible, solo exclusión.',
            scope: 'organizacion',
            severity: 'tolerancia_cero',
            evidenceTypes: ['Declaración jurada', 'Inventario de insumos', 'Registros laborales'],
            requiredDataFields: ['org_id', 'unacceptable_practices_declaration', 'chemical_inventory', 'labor_compliance'],
            frequency: 'Anual',
            crossSchemeOverlap: ['rainforest_alliance', 'fairtrade', 'cafe_practices'],
          },
        ],
      },
      {
        key: 'trazabilidad',
        label: 'Trazabilidad y Volumen',
        requirements: [
          {
            id: 'REQ_4C_002',
            scheme: '4c',
            category: 'Trazabilidad y Volumen',
            name: 'Balance de masas verificable',
            description: 'Reconciliación: Inventario_Inicial + Entradas − Salidas = Inventario_Final. Detección de lavado de café.',
            whyItMatters: 'Mecanismo antifraude central. Un desbalance >5% levanta no-conformidad mayor.',
            scope: 'organizacion',
            severity: 'critico',
            evidenceTypes: ['Registros de entrega', 'Tiquetes de báscula', 'Registros de procesamiento', 'Inventario físico'],
            requiredDataFields: ['org_id', 'initial_inventory', 'deliveries_in', 'shipments_out', 'final_inventory'],
            frequency: 'Por campaña de cosecha',
            crossSchemeOverlap: ['organic', 'fairtrade'],
          },
        ],
      },
    ],
  },
  {
    key: 'organic',
    name: 'Orgánico (USDA NOP / EU Organic / JAS)',
    shortName: 'Orgánico',
    type: 'regulacion_estatal',
    typeLabel: 'Regulación Estatal',
    deforestationCutoff: null,
    geoRequirement: 'Croquis detallados, zonas de amortiguamiento',
    traceability: 'Segregación física obligatoria / Balance de masas',
    auditFrequency: 'Auditoría anual obligatoria in situ',
    description: 'Prohibición estricta de fertilizantes y pesticidas sintéticos. 3 años de conversión documentados. Segregación total.',
    color: 'hsl(87 60% 42%)',
    icon: 'Sprout',
    categories: [
      {
        key: 'insumos',
        label: 'Control de Insumos',
        requirements: [
          {
            id: 'REQ_ORG_001',
            scheme: 'organic',
            category: 'Control de Insumos',
            name: 'Prohibición total de sintéticos',
            description: 'Solo se permiten insumos de lista positiva. Cualquier residuo de sintético revoca la certificación.',
            whyItMatters: 'Un solo uso documentado de producto prohibido requiere reiniciar los 3 años de conversión.',
            scope: 'parcela',
            severity: 'tolerancia_cero',
            evidenceTypes: ['Inventario de bodega', 'Registros de compra', 'Análisis de residuos'],
            requiredDataFields: ['parcel_id', 'input_inventory', 'purchase_records', 'residue_test_results'],
            frequency: 'Continuo con auditoría anual',
            crossSchemeOverlap: ['cafe_practices', 'rainforest_alliance'],
          },
        ],
      },
      {
        key: 'conversion',
        label: 'Período de Conversión',
        requirements: [
          {
            id: 'REQ_ORG_002',
            scheme: 'organic',
            category: 'Período de Conversión',
            name: 'Período de conversión de 3 años documentados',
            description: 'Documentación completa de los 3 años de transición desde agricultura convencional a orgánica.',
            whyItMatters: 'Sin los 3 años documentados, no se puede certificar como orgánico independientemente de las prácticas.',
            scope: 'parcela',
            severity: 'critico',
            evidenceTypes: ['Registros de campo por año', 'Declaraciones de no-uso', 'Inspecciones anuales'],
            requiredDataFields: ['parcel_id', 'conversion_start_date', 'year_1_records', 'year_2_records', 'year_3_records'],
            frequency: 'Una vez (documentación permanente)',
            crossSchemeOverlap: [],
          },
        ],
      },
      {
        key: 'trazabilidad',
        label: 'Segregación y Trazabilidad',
        requirements: [
          {
            id: 'REQ_ORG_003',
            scheme: 'organic',
            category: 'Segregación y Trazabilidad',
            name: 'Reconciliación de Balance de Masas',
            description: 'Verificación de que el volumen comercializado no excede la producción certificada. Segregación física estricta.',
            whyItMatters: 'Prevenir el "lavado de café" convencional como orgánico. Desbalance >5% es fraude.',
            scope: 'organizacion',
            severity: 'tolerancia_cero',
            evidenceTypes: ['Registros de entrega inmutables', 'Tiquetes de báscula', 'Conciliación de pagos'],
            requiredDataFields: ['org_id', 'certified_volume', 'delivered_volume', 'exported_volume', 'yield_plausibility_check'],
            frequency: 'Por campaña de cosecha',
            crossSchemeOverlap: ['4c', 'fairtrade'],
          },
        ],
      },
    ],
  },
  {
    key: 'esencial_cr',
    name: 'ESENCIAL Costa Rica',
    shortName: 'ESENCIAL CR',
    type: 'marca_pais',
    typeLabel: 'Marca País',
    deforestationCutoff: null,
    geoRequirement: 'N/A (enfoque corporativo)',
    traceability: 'Transparencia corporativa total',
    auditFrequency: 'Evaluación de licenciamiento periódica',
    description: 'Licenciamiento de marca país que evalúa excelencia (85%), sostenibilidad (80%), progreso social (80%), innovación (80%) y vinculación costarricense (100%).',
    color: 'hsl(210 80% 40%)',
    icon: 'Award',
    categories: [
      {
        key: 'vinculacion',
        label: 'Vinculación Costarricense (100%)',
        requirements: [
          {
            id: 'REQ_ESCR_001',
            scheme: 'esencial_cr',
            category: 'Vinculación Costarricense',
            name: 'Cumplimiento legal y tributario corporativo',
            description: 'Validación del estatus respecto a obligaciones tributarias (Hacienda), cargas sociales (CCSS), patentes municipales y RTBF.',
            whyItMatters: 'Este valor exige 100% de cumplimiento. Un solo fallo tributario descalifica totalmente.',
            scope: 'organizacion',
            severity: 'tolerancia_cero',
            evidenceTypes: ['Certificación CCSS al día', 'Estado de cuenta Hacienda', 'Patente municipal vigente', 'Cumplimiento RTBF'],
            requiredDataFields: ['org_id', 'corporate_tax_id', 'ccss_status', 'hacienda_status', 'rtbf_compliance_date'],
            frequency: 'Consulta en tiempo real / Anual',
            crossSchemeOverlap: ['eudr', 'cafe_practices'],
          },
        ],
      },
      {
        key: 'excelencia',
        label: 'Excelencia (85%)',
        requirements: [
          {
            id: 'REQ_ESCR_002',
            scheme: 'esencial_cr',
            category: 'Excelencia',
            name: 'Planeación estratégica y gestión de riesgos',
            description: 'Evidencia de planeación estratégica formal, gestión de riesgos documentada y métricas de desempeño (KPIs).',
            whyItMatters: 'Umbral mínimo 85%. Sin gestión documentada, la organización no califica para la marca país.',
            scope: 'organizacion',
            severity: 'critico',
            evidenceTypes: ['Plan estratégico', 'Matriz de riesgos', 'Tablero de KPIs', 'Actas de comité'],
            requiredDataFields: ['org_id', 'strategic_plan_id', 'risk_matrix_id', 'kpi_dashboard_status'],
            frequency: 'Anual',
            crossSchemeOverlap: [],
          },
        ],
      },
    ],
  },
];

// ══════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════

export function getAllRequirements(): CertificationRequirement[] {
  return CERTIFICATION_SCHEMES.flatMap(s =>
    s.categories.flatMap(c => c.requirements)
  );
}

export function getRequirementById(id: string): CertificationRequirement | undefined {
  return getAllRequirements().find(r => r.id === id);
}

export function getSchemeByKey(key: SchemeKey): CertificationScheme | undefined {
  return CERTIFICATION_SCHEMES.find(s => s.key === key);
}

export function getSeverityLabel(severity: SeverityLevel): string {
  const map: Record<SeverityLevel, string> = {
    tolerancia_cero: 'Tolerancia cero',
    critico: 'Crítico',
    mayor: 'Mayor',
    menor: 'Menor',
    mejora: 'Mejora continua',
  };
  return map[severity];
}

export function getSeverityColor(severity: SeverityLevel): string {
  const map: Record<SeverityLevel, string> = {
    tolerancia_cero: 'bg-destructive text-destructive-foreground',
    critico: 'bg-destructive/80 text-destructive-foreground',
    mayor: 'border-destructive/50 text-destructive bg-destructive/10',
    menor: 'bg-muted text-muted-foreground',
    mejora: 'bg-secondary text-secondary-foreground',
  };
  return map[severity];
}

export function getEvidenceStatusLabel(status: EvidenceStatus): string {
  const map: Record<EvidenceStatus, string> = {
    completo: 'Completo',
    parcial: 'Parcial',
    faltante: 'Faltante',
    vencido: 'Vencido',
    rechazado: 'Rechazado',
  };
  return map[status];
}

export function getEvidenceStatusColor(status: EvidenceStatus): string {
  const map: Record<EvidenceStatus, string> = {
    completo: 'bg-primary/10 text-primary border-primary/30',
    parcial: 'bg-accent/10 text-accent-foreground border-accent/30',
    faltante: 'bg-destructive/10 text-destructive border-destructive/30',
    vencido: 'bg-destructive/10 text-destructive border-destructive/30',
    rechazado: 'bg-destructive/10 text-destructive border-destructive/30',
  };
  return map[status];
}

export function getCorrectiveStatusLabel(status: CorrectiveStatus): string {
  const map: Record<CorrectiveStatus, string> = {
    pendiente: 'Pendiente',
    en_progreso: 'En progreso',
    resuelto: 'Resuelto',
    vencido: 'Vencido',
    escalado: 'Escalado',
  };
  return map[status];
}

// ══════════════════════════════════════════════════
// DEMO DATA GENERATION
// ══════════════════════════════════════════════════

function randomStatus(): EvidenceStatus {
  const statuses: EvidenceStatus[] = ['completo', 'completo', 'completo', 'parcial', 'parcial', 'faltante', 'vencido'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

export function generateDemoReadiness(): SchemeReadiness[] {
  return CERTIFICATION_SCHEMES.map(scheme => {
    const reqs = scheme.categories.flatMap(c => c.requirements);
    const total = reqs.length;
    const compliant = Math.floor(total * (0.3 + Math.random() * 0.5));
    const partial = Math.floor((total - compliant) * 0.4);
    const missing = total - compliant - partial;
    const expired = Math.floor(Math.random() * 2);
    const readiness = total > 0 ? Math.round((compliant / total) * 100) : 0;
    const criticalGaps = reqs.filter(r => r.severity === 'tolerancia_cero' || r.severity === 'critico').length - Math.floor(compliant * 0.6);
    return {
      scheme: scheme.key,
      totalRequirements: total,
      compliant,
      partial,
      missing: Math.max(0, missing),
      expired,
      readinessPercent: readiness,
      criticalGaps: Math.max(0, criticalGaps),
      riskLevel: readiness > 80 ? 'bajo' : readiness > 60 ? 'medio' : readiness > 40 ? 'alto' : 'critico',
    };
  });
}

export function generateDemoGaps(): GapItem[] {
  const allReqs = getAllRequirements();
  return allReqs
    .filter(r => r.severity === 'tolerancia_cero' || r.severity === 'critico')
    .slice(0, 8)
    .map(r => ({
      requirementId: r.id,
      requirementName: r.name,
      scheme: r.scheme,
      severity: r.severity,
      missingEvidence: r.evidenceTypes.slice(0, 2),
      impact: r.whyItMatters,
      suggestedAction: `Recopilar: ${r.evidenceTypes[0]}`,
    }));
}

export function generateDemoCorrectiveActions(): CorrectiveAction[] {
  const actions: CorrectiveAction[] = [
    { id: 'ca-1', requirementId: 'REQ_EUDR_001', scheme: 'eudr', issue: 'Polígonos con auto-intersección en 3 parcelas del sector norte', severity: 'tolerancia_cero', owner: 'Técnico de campo', dueDate: '2026-04-15', status: 'en_progreso', createdDate: '2026-03-01' },
    { id: 'ca-2', requirementId: 'REQ_RA_003', scheme: 'rainforest_alliance', issue: 'Política Assess-and-Address no actualizada desde 2024', severity: 'tolerancia_cero', owner: 'Gerencia de certificación', dueDate: '2026-04-01', status: 'pendiente', createdDate: '2026-02-15' },
    { id: 'ca-3', requirementId: 'REQ_FT_002', scheme: 'fairtrade', issue: 'Faltan actas de asamblea para uso de prima del segundo semestre', severity: 'critico', owner: 'Administración', dueDate: '2026-03-30', status: 'pendiente', createdDate: '2026-03-10' },
    { id: 'ca-4', requirementId: 'REQ_CAFE_001', scheme: 'cafe_practices', issue: 'Comprobantes de pago pendientes para 12 productores', severity: 'critico', owner: 'Contabilidad', dueDate: '2026-04-10', status: 'en_progreso', createdDate: '2026-03-05' },
    { id: 'ca-5', requirementId: 'REQ_ORG_001', scheme: 'organic', issue: 'Inventario de bodega sin conciliar contra registros de aplicación', severity: 'tolerancia_cero', owner: 'Técnico agrónomo', dueDate: '2026-03-25', status: 'vencido', createdDate: '2026-02-01' },
    { id: 'ca-6', requirementId: 'REQ_ESCR_001', scheme: 'esencial_cr', issue: 'Certificación CCSS vencida — requiere actualización inmediata', severity: 'tolerancia_cero', owner: 'Dirección', dueDate: '2026-03-20', status: 'escalado', createdDate: '2026-03-15' },
  ];
  return actions;
}

export function generateDemoEvidence(): EvidenceItem[] {
  return [
    { id: 'ev-1', requirementId: 'REQ_EUDR_001', type: 'GeoJSON', fileName: 'poligonos_sector_norte.geojson', uploadDate: '2026-02-15', status: 'completo', reusedInSchemes: ['eudr', 'rainforest_alliance', '4c'] },
    { id: 'ev-2', requirementId: 'REQ_EUDR_003', type: 'Imágenes satelitales', fileName: 'sentinel2_analisis_2020.tif', uploadDate: '2026-01-10', status: 'completo', reusedInSchemes: ['eudr', 'rainforest_alliance'] },
    { id: 'ev-3', requirementId: 'REQ_FT_001', type: 'Registros de liquidación', fileName: 'liquidaciones_cosecha_2025.xlsx', uploadDate: '2026-02-28', status: 'parcial', reusedInSchemes: ['fairtrade', 'cafe_practices'] },
    { id: 'ev-4', requirementId: 'REQ_RA_001', type: 'Inventario arbóreo', fileName: 'inventario_sombra_2026.csv', uploadDate: '2026-03-01', status: 'completo', reusedInSchemes: ['rainforest_alliance'] },
    { id: 'ev-5', requirementId: 'REQ_RA_002', type: 'Plan MIP', fileName: 'plan_mip_2026.pdf', uploadDate: '2026-01-20', status: 'completo', reusedInSchemes: ['rainforest_alliance', '4c', 'cafe_practices'] },
    { id: 'ev-6', requirementId: 'REQ_CAFE_001', type: 'Conciliaciones bancarias', fileName: 'conciliacion_pagos_q4_2025.pdf', uploadDate: '2026-02-10', status: 'parcial', reusedInSchemes: ['cafe_practices', 'fairtrade'] },
    { id: 'ev-7', requirementId: 'REQ_4C_002', type: 'Registros de entrega', fileName: 'entregas_campaña_2025.csv', uploadDate: '2026-03-05', status: 'completo', reusedInSchemes: ['4c', 'organic', 'fairtrade'] },
    { id: 'ev-8', requirementId: 'REQ_ESCR_001', type: 'Certificación CCSS', fileName: 'ccss_constancia_2026.pdf', uploadDate: '2025-12-01', expirationDate: '2026-03-01', status: 'vencido', reusedInSchemes: ['esencial_cr', 'eudr'] },
    { id: 'ev-9', requirementId: 'REQ_ORG_001', type: 'Análisis de residuos', fileName: 'residuos_lab_2026.pdf', uploadDate: '2026-02-20', status: 'completo', reusedInSchemes: ['organic'] },
    { id: 'ev-10', requirementId: 'REQ_FT_003', type: 'Manual IMS', fileName: 'manual_ims_v3.pdf', uploadDate: '2025-08-15', status: 'completo', reusedInSchemes: ['fairtrade', '4c'] },
  ];
}

/** Cross-scheme overlap analysis */
export function getCrossSchemeOverlap(): { evidence: EvidenceItem; schemes: string[]; }[] {
  const evidence = generateDemoEvidence();
  return evidence
    .filter(e => e.reusedInSchemes.length > 1)
    .map(e => ({
      evidence: e,
      schemes: e.reusedInSchemes.map(s => getSchemeByKey(s)?.shortName ?? s),
    }));
}

export const RISK_ITEMS = [
  { id: 'RSK-01', risk: 'Deforestación post-2020 detectada', impact: 'Tolerancia Cero EUDR / RA', control: 'Bloqueo automático de ingesta de datos del polígono mediante geocerca algorítmica' },
  { id: 'RSK-02', risk: 'Trabajo infantil o forzoso', impact: 'Tolerancia Cero Global', control: 'Alertas de discrepancia de edad en el padrón laboral' },
  { id: 'RSK-03', risk: 'Uso de plaguicidas prohibidos (OMS Ia/Ib)', impact: 'Tolerancia Cero Global / ESENCIAL', control: 'Validación de inputs contra diccionarios de sustancias activas' },
  { id: 'RSK-04', risk: 'Lavado de café (fraude en volúmenes)', impact: 'Revocación Orgánico / Fairtrade', control: 'Límite superior basado en inferencia Nova Yield' },
  { id: 'RSK-05', risk: 'Traslape de polígonos con áreas protegidas', impact: 'Bloqueo EUDR Inmediato', control: 'Intersección espacial PostGIS contra capas gubernamentales' },
  { id: 'RSK-06', risk: 'Desviación de Prima Fairtrade', impact: 'Suspensión por FLOCERT', control: 'Auditoría forzada de flujo de caja' },
];
