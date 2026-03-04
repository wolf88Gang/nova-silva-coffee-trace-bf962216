/**
 * VITAL Organizacional — 50 preguntas en 5 ejes.
 * Fórmula: IGRN_Org = (0.25 × μ_Gobernanza) + (0.20 × μ_Finanzas) + (0.25 × μ_Cumplimiento) + (0.15 × μ_Servicios) + (0.15 × μ_Digital)
 */

export interface VitalOrgOption {
  label: string;
  score: number;
}

export interface VitalOrgQuestion {
  id: number;
  text: string;
  options: VitalOrgOption[];
}

export interface VitalOrgBlock {
  id: string;
  label: string;
  weight: number;
  questions: VitalOrgQuestion[];
}

const opt = (labels: [string, number][]): VitalOrgOption[] =>
  labels.map(([label, score]) => ({ label, score }));

const STD = (text: string, id: number): VitalOrgQuestion => ({
  id, text,
  options: opt([['No / Ausente', 0], ['Parcial / Incipiente', 0.4], ['Moderado / En desarrollo', 0.7], ['Sí / Consolidado', 1.0]]),
});

export const VITAL_ORG_BLOCKS: VitalOrgBlock[] = [
  {
    id: 'gobernanza',
    label: 'Gobernanza Climática y Estrategia',
    weight: 0.25,
    questions: [
      STD('¿Existe una Política Climática aprobada por el Consejo de Administración?', 1),
      STD('¿Cuenta con un Comité de Gestión de Resiliencia multidisciplinario?', 2),
      { id: 3, text: '¿Qué % del presupuesto operativo se destina a adaptación/mitigación/EUDR?',
        options: opt([['<5%', 0], ['5-10%', 0.4], ['10-20%', 0.7], ['>20%', 1.0]]) },
      STD('¿Dispone de un protocolo probado ante eventos climáticos extremos?', 4),
      STD('¿Se incluyen criterios de sostenibilidad en evaluación de la gerencia?', 5),
      STD('¿Política de equidad de género con meta mínima 30% en órganos de decisión?', 6),
      STD('¿Programa estructurado de relevo generacional o "Jóvenes Caficultores"?', 7),
      STD('¿Asambleas semestrales para socializar riesgos climáticos y EUDR?', 8),
      STD('¿Existe un mapa de riesgos climáticos actualizado anualmente?', 9),
      STD('¿Se documenta formalmente la trazabilidad desde finca hasta embarque?', 10),
    ],
  },
  {
    id: 'finanzas',
    label: 'Salud Financiera y Resiliencia Económica',
    weight: 0.20,
    questions: [
      STD('¿Liquidez operativa suficiente para ≥3 meses sin ingresos?', 11),
      STD('¿Fondo de reserva para emergencias climáticas?', 12),
      STD('¿Acceso a líneas de crédito de contingencia?', 13),
      STD('¿Diversificación de fuentes de ingreso (>3 compradores)?', 14),
      STD('¿Seguro agrícola colectivo o individual disponible?', 15),
      STD('¿Sistema contable auditado anualmente?', 16),
      STD('¿Morosidad de cartera de créditos <15%?', 17),
      STD('¿Prima diferenciada por calidad o certificación?', 18),
      STD('¿Programa de ahorro programado para socios?', 19),
      STD('¿Transparencia financiera con reportes trimestrales a socios?', 20),
    ],
  },
  {
    id: 'cumplimiento',
    label: 'Cumplimiento Regulatorio y Certificaciones',
    weight: 0.25,
    questions: [
      STD('¿Cumplimiento documentado EUDR para >80% de la base productiva?', 21),
      STD('¿Geolocalización GPS de >90% de parcelas activas?', 22),
      STD('¿Documentación legal de tenencia para >80% de productores?', 23),
      STD('¿Análisis de deforestación (LUC) disponible para todas las parcelas?', 24),
      STD('¿Al menos una certificación activa (FT, RFA, Orgánico, 4C)?', 25),
      STD('¿Sistema de control interno (SCI) documentado y auditado?', 26),
      STD('¿Trazabilidad física completa parcela → lote → embarque?', 27),
      STD('¿Protocolo de gestión de no conformidades con seguimiento?', 28),
      STD('¿Capacitación anual en normativas a personal clave?', 29),
      STD('¿Auditoría interna anual de cumplimiento?', 30),
    ],
  },
  {
    id: 'servicios',
    label: 'Servicios a Productores y Capacidad Técnica',
    weight: 0.15,
    questions: [
      STD('¿Cobertura de asistencia técnica a >70% de socios?', 31),
      STD('¿Frecuencia de visitas técnicas ≥2 por ciclo productivo?', 32),
      STD('¿Programa de capacitación en adaptación climática?', 33),
      STD('¿Provisión de insumos o acceso facilitado?', 34),
      STD('¿Laboratorio o acceso a catación para retroalimentación al productor?', 35),
      STD('¿Programa de renovación de cafetales con apoyo técnico?', 36),
      STD('¿Servicio de beneficio centralizado disponible?', 37),
      STD('¿Programa de parcelas demostrativas o fincas modelo?', 38),
      STD('¿Mapeo de capacidades y necesidades de los socios?', 39),
      STD('¿Mecanismo de retroalimentación de socios (encuestas, buzón)?', 40),
    ],
  },
  {
    id: 'digital',
    label: 'Transformación Digital e Innovación',
    weight: 0.15,
    questions: [
      STD('¿Sistema digital de registro de entregas y trazabilidad?', 41),
      STD('¿Base de datos actualizada de socios y parcelas?', 42),
      STD('¿Uso de herramientas de monitoreo satelital o drones?', 43),
      STD('¿Plataforma de comunicación digital con socios (app, WhatsApp Business)?', 44),
      STD('¿Tablero de indicadores (dashboard) para toma de decisiones?', 45),
      STD('¿Digitalización de documentos legales y certificados?', 46),
      STD('¿Sistema de alertas tempranas (clima, plagas)?', 47),
      STD('¿Integración con plataformas de compradores (portales B2B)?', 48),
      STD('¿Plan de continuidad digital ante desastres?', 49),
      STD('¿Indicadores de adopción digital entre socios?', 50),
    ],
  },
];

export function calculateIGRNOrg(answers: Record<number, number>): {
  global: number;
  byBlock: Record<string, number>;
  falsaResiliencia: boolean;
  maxDiff: number;
} {
  const byBlock: Record<string, number> = {};

  for (const block of VITAL_ORG_BLOCKS) {
    const scores = block.questions
      .map(q => answers[q.id])
      .filter(s => s !== undefined && s !== null);
    byBlock[block.id] = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
  }

  const global = VITAL_ORG_BLOCKS.reduce(
    (sum, b) => sum + b.weight * (byBlock[b.id] || 0), 0
  );

  const vals = Object.values(byBlock);
  const maxDiff = vals.length > 1 ? Math.max(...vals) - Math.min(...vals) : 0;

  return {
    global,
    byBlock,
    falsaResiliencia: maxDiff >= 0.4,
    maxDiff,
  };
}
