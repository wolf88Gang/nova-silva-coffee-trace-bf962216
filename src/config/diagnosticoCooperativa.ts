// ═══════════════════════════════════════════════════════════════
// Configuración Diagnóstico Organizacional — 12 dimensiones, 58 preguntas
// ═══════════════════════════════════════════════════════════════

export interface PreguntaDiagnostico {
  codigo: string;
  dimension: string;
  texto: string;
}

export interface DimensionDiagnostico {
  id: string;
  nombre: string;
  critica: boolean;
  preguntas: PreguntaDiagnostico[];
}

export type NivelSemaforo = 'rojo' | 'ambar' | 'verde';

export function getSemaforo(promedio: number): { nivel: NivelSemaforo; label: string; color: string } {
  if (promedio >= 3.0) return { nivel: 'verde', label: 'Sólido', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' };
  if (promedio >= 2.0) return { nivel: 'ambar', label: 'En desarrollo', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' };
  return { nivel: 'rojo', label: 'Crítico', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
}

export function getRecomendacion(promedio: number): string {
  if (promedio >= 3.0) return 'implementacion_completa';
  if (promedio >= 2.0) return 'piloto_parcial';
  return 'fortalecimiento_previo';
}

export const OPCIONES_DIAGNOSTICO = [
  { valor: 1, etiqueta: 'Muy débil — No existe o es muy deficiente' },
  { valor: 2, etiqueta: 'Débil — Existe pero con muchas deficiencias' },
  { valor: 3, etiqueta: 'Moderado — Funciona pero requiere mejoras' },
  { valor: 4, etiqueta: 'Sólido — Funciona bien y se mantiene' },
];

export const DIMENSIONES_DIAGNOSTICO: DimensionDiagnostico[] = [
  {
    id: 'gobernanza', nombre: 'Gobernanza y Gestión', critica: true,
    preguntas: [
      { codigo: 'G01', dimension: 'gobernanza', texto: '¿La organización tiene una junta directiva activa con reuniones periódicas documentadas?' },
      { codigo: 'G02', dimension: 'gobernanza', texto: '¿Existe un plan estratégico actualizado con metas medibles?' },
      { codigo: 'G03', dimension: 'gobernanza', texto: '¿Se rinden cuentas a los asociados al menos una vez al año?' },
      { codigo: 'G04', dimension: 'gobernanza', texto: '¿Existen políticas internas documentadas (compras, créditos, calidad)?' },
      { codigo: 'G05', dimension: 'gobernanza', texto: '¿Los procesos de toma de decisiones son participativos y transparentes?' },
    ],
  },
  {
    id: 'equipo_tecnico', nombre: 'Equipo Técnico', critica: true,
    preguntas: [
      { codigo: 'ET01', dimension: 'equipo_tecnico', texto: '¿La organización cuenta con personal técnico propio o contratado permanente?' },
      { codigo: 'ET02', dimension: 'equipo_tecnico', texto: '¿El equipo técnico tiene formación actualizada en las áreas que cubre?' },
      { codigo: 'ET03', dimension: 'equipo_tecnico', texto: '¿Los técnicos visitan a los productores con frecuencia programada?' },
      { codigo: 'ET04', dimension: 'equipo_tecnico', texto: '¿Existe un plan de capacitación continua para el equipo técnico?' },
      { codigo: 'ET05', dimension: 'equipo_tecnico', texto: '¿Los técnicos llevan registros de sus visitas y recomendaciones?' },
    ],
  },
  {
    id: 'datos', nombre: 'Gestión de Datos e Información', critica: true,
    preguntas: [
      { codigo: 'DA01', dimension: 'datos', texto: '¿La organización utiliza un sistema digital para gestionar su información?' },
      { codigo: 'DA02', dimension: 'datos', texto: '¿Los datos de producción, entregas y calidad están centralizados y accesibles?' },
      { codigo: 'DA03', dimension: 'datos', texto: '¿Se generan reportes periódicos con indicadores clave de gestión?' },
      { codigo: 'DA04', dimension: 'datos', texto: '¿Existe respaldo de la información crítica de la organización?' },
      { codigo: 'DA05', dimension: 'datos', texto: '¿El personal está capacitado en el uso de las herramientas digitales disponibles?' },
    ],
  },
  {
    id: 'registro_productores', nombre: 'Registro de Productores', critica: false,
    preguntas: [
      { codigo: 'RP01', dimension: 'registro_productores', texto: '¿Se tiene un registro actualizado de todos los productores asociados con datos completos?' },
      { codigo: 'RP02', dimension: 'registro_productores', texto: '¿Los registros incluyen información de parcelas con coordenadas GPS?' },
      { codigo: 'RP03', dimension: 'registro_productores', texto: '¿Se actualizan los registros al menos una vez al año?' },
      { codigo: 'RP04', dimension: 'registro_productores', texto: '¿Los productores tienen acceso a su propia información registrada?' },
      { codigo: 'RP05', dimension: 'registro_productores', texto: '¿Se registra información socioeconómica de los productores y sus familias?' },
    ],
  },
  {
    id: 'trazabilidad', nombre: 'Trazabilidad de Parcelas', critica: false,
    preguntas: [
      { codigo: 'TP01', dimension: 'trazabilidad', texto: '¿Cada parcela tiene un código único de identificación?' },
      { codigo: 'TP02', dimension: 'trazabilidad', texto: '¿Se registran las prácticas agrícolas realizadas en cada parcela?' },
      { codigo: 'TP03', dimension: 'trazabilidad', texto: '¿Se puede rastrear el café desde la parcela hasta el lote de exportación?' },
      { codigo: 'TP04', dimension: 'trazabilidad', texto: '¿Las parcelas están georreferenciadas con polígonos?' },
      { codigo: 'TP05', dimension: 'trazabilidad', texto: '¿Se registra el historial de uso de agroquímicos por parcela?' },
    ],
  },
  {
    id: 'control_calidad', nombre: 'Control de Calidad', critica: false,
    preguntas: [
      { codigo: 'CC01', dimension: 'control_calidad', texto: '¿Se realizan cataciones de los lotes de café recibidos?' },
      { codigo: 'CC02', dimension: 'control_calidad', texto: '¿Existe un laboratorio de catación propio o acceso a uno?' },
      { codigo: 'CC03', dimension: 'control_calidad', texto: '¿Se clasifican los cafés por calidad y se paga diferenciado?' },
      { codigo: 'CC04', dimension: 'control_calidad', texto: '¿Se lleva control de humedad, defectos y rendimiento de cada entrega?' },
    ],
  },
  {
    id: 'gestion_entregas', nombre: 'Gestión de Entregas', critica: false,
    preguntas: [
      { codigo: 'GE01', dimension: 'gestion_entregas', texto: '¿Se emiten recibos detallados a cada productor por cada entrega?' },
      { codigo: 'GE02', dimension: 'gestion_entregas', texto: '¿Se registran peso, tipo de café, calidad y origen de cada entrega?' },
      { codigo: 'GE03', dimension: 'gestion_entregas', texto: '¿Los pagos a productores se realizan en los plazos acordados?' },
      { codigo: 'GE04', dimension: 'gestion_entregas', texto: '¿Se puede consultar el historial de entregas y pagos de cada productor?' },
      { codigo: 'GE05', dimension: 'gestion_entregas', texto: '¿El proceso de recepción incluye verificación de calidad en campo?' },
    ],
  },
  {
    id: 'acopio_lotes', nombre: 'Acopio y Formación de Lotes', critica: false,
    preguntas: [
      { codigo: 'AL01', dimension: 'acopio_lotes', texto: '¿Se forman lotes homogéneos por zona, variedad o calidad?' },
      { codigo: 'AL02', dimension: 'acopio_lotes', texto: '¿Existe control de inventario de café en bodega?' },
      { codigo: 'AL03', dimension: 'acopio_lotes', texto: '¿Las condiciones de almacenamiento son adecuadas (humedad, ventilación)?' },
      { codigo: 'AL04', dimension: 'acopio_lotes', texto: '¿Se registra la composición de cada lote (productores, parcelas, volúmenes)?' },
      { codigo: 'AL05', dimension: 'acopio_lotes', texto: '¿Se realizan análisis de calidad antes de conformar los lotes comerciales?' },
    ],
  },
  {
    id: 'financiera', nombre: 'Gestión Financiera', critica: false,
    preguntas: [
      { codigo: 'FI01', dimension: 'financiera', texto: '¿Se lleva contabilidad formal y actualizada?' },
      { codigo: 'FI02', dimension: 'financiera', texto: '¿Se elaboran estados financieros periódicos?' },
      { codigo: 'FI03', dimension: 'financiera', texto: '¿Existe control de flujo de caja y presupuesto anual?' },
      { codigo: 'FI04', dimension: 'financiera', texto: '¿La gestión de créditos a productores tiene políticas claras de recuperación?' },
      { codigo: 'FI05', dimension: 'financiera', texto: '¿Se realizan auditorías financieras externas?' },
    ],
  },
  {
    id: 'eudr', nombre: 'Cumplimiento EUDR', critica: false,
    preguntas: [
      { codigo: 'EU01', dimension: 'eudr', texto: '¿La organización conoce los requisitos de la regulación EUDR?' },
      { codigo: 'EU02', dimension: 'eudr', texto: '¿Se cuenta con mapas de polígonos de todas las parcelas?' },
      { codigo: 'EU03', dimension: 'eudr', texto: '¿Se puede demostrar que el café no proviene de áreas deforestadas después de 2020?' },
      { codigo: 'EU04', dimension: 'eudr', texto: '¿Existe un sistema de due diligence documentado?' },
    ],
  },
  {
    id: 'certificaciones', nombre: 'Certificaciones', critica: false,
    preguntas: [
      { codigo: 'CE01', dimension: 'certificaciones', texto: '¿La organización tiene certificaciones activas (Orgánico, FairTrade, Rainforest, etc.)?' },
      { codigo: 'CE02', dimension: 'certificaciones', texto: '¿Se mantiene el sistema de control interno actualizado?' },
      { codigo: 'CE03', dimension: 'certificaciones', texto: '¿Los productores conocen y cumplen los estándares de las certificaciones?' },
      { codigo: 'CE04', dimension: 'certificaciones', texto: '¿Se obtiene prima de precio por las certificaciones?' },
    ],
  },
  {
    id: 'mercado', nombre: 'Acceso a Mercado', critica: false,
    preguntas: [
      { codigo: 'ME01', dimension: 'mercado', texto: '¿La organización tiene clientes directos (no solo intermediarios)?' },
      { codigo: 'ME02', dimension: 'mercado', texto: '¿Se negocian contratos con precio fijo o diferenciado?' },
      { codigo: 'ME03', dimension: 'mercado', texto: '¿Se participa en ferias, ruedas de negocio o eventos comerciales?' },
      { codigo: 'ME04', dimension: 'mercado', texto: '¿Existe una estrategia de comercialización documentada?' },
      { codigo: 'ME05', dimension: 'mercado', texto: '¿Se tiene presencia digital (web, redes sociales) para promoción?' },
    ],
  },
];

export function getTotalPreguntas(): number {
  return DIMENSIONES_DIAGNOSTICO.reduce((sum, d) => sum + d.preguntas.length, 0);
}
