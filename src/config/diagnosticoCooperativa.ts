// ═══════════════════════════════════════════════════════════════
// Configuración Diagnóstico Organizacional — 12 dimensiones, 58 preguntas
// ═══════════════════════════════════════════════════════════════

export interface PreguntaDiagnostico {
  codigo: string;
  dimension: string;
  texto: string;
  ayuda: string;
}

export interface DimensionDiagnostico {
  id: string;
  nombre: string;
  critica: boolean;
  descripcion: string;
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
    descripcion: 'Evalúa la estructura de gobierno, planificación estratégica y transparencia en la toma de decisiones de la organización.',
    preguntas: [
      { codigo: 'G01', dimension: 'gobernanza', texto: '¿La organización tiene una junta directiva activa con reuniones periódicas documentadas?',
        ayuda: 'Considere si hay actas de reuniones, frecuencia mínima trimestral y participación activa de los directivos.' },
      { codigo: 'G02', dimension: 'gobernanza', texto: '¿Existe un plan estratégico actualizado con metas medibles?',
        ayuda: 'Un plan estratégico vigente debe incluir objetivos SMART, indicadores de avance y revisión al menos anual.' },
      { codigo: 'G03', dimension: 'gobernanza', texto: '¿Se rinden cuentas a los asociados al menos una vez al año?',
        ayuda: 'Incluye asambleas generales, informes financieros y de gestión compartidos con la base asociativa.' },
      { codigo: 'G04', dimension: 'gobernanza', texto: '¿Existen políticas internas documentadas (compras, créditos, calidad)?',
        ayuda: 'Reglamentos escritos y aprobados que regulen procesos clave como compras de café, otorgamiento de créditos y estándares de calidad.' },
      { codigo: 'G05', dimension: 'gobernanza', texto: '¿Los procesos de toma de decisiones son participativos y transparentes?',
        ayuda: 'Evalúe si los socios son consultados en decisiones importantes y si existe acceso a información relevante.' },
    ],
  },
  {
    id: 'equipo_tecnico', nombre: 'Equipo Técnico', critica: true,
    descripcion: 'Mide la capacidad técnica instalada: personal calificado, frecuencia de visitas y formación continua.',
    preguntas: [
      { codigo: 'ET01', dimension: 'equipo_tecnico', texto: '¿La organización cuenta con personal técnico propio o contratado permanente?',
        ayuda: 'Al menos un técnico de campo dedicado a tiempo completo o parcial con contrato vigente.' },
      { codigo: 'ET02', dimension: 'equipo_tecnico', texto: '¿El equipo técnico tiene formación actualizada en las áreas que cubre?',
        ayuda: 'Capacitaciones recibidas en los últimos 2 años en manejo agronómico, calidad, certificaciones o sostenibilidad.' },
      { codigo: 'ET03', dimension: 'equipo_tecnico', texto: '¿Los técnicos visitan a los productores con frecuencia programada?',
        ayuda: 'Mínimo 2 visitas por ciclo productivo con agenda previa y registro de hallazgos.' },
      { codigo: 'ET04', dimension: 'equipo_tecnico', texto: '¿Existe un plan de capacitación continua para el equipo técnico?',
        ayuda: 'Programa anual documentado de formación, incluyendo temas prioritarios y presupuesto asignado.' },
      { codigo: 'ET05', dimension: 'equipo_tecnico', texto: '¿Los técnicos llevan registros de sus visitas y recomendaciones?',
        ayuda: 'Fichas de visita, bitácoras o registros digitales con fecha, productor visitado, hallazgos y recomendaciones.' },
    ],
  },
  {
    id: 'datos', nombre: 'Gestión de Datos e Información', critica: true,
    descripcion: 'Evalúa la infraestructura de información digital, centralización de datos y capacidad analítica.',
    preguntas: [
      { codigo: 'DA01', dimension: 'datos', texto: '¿La organización utiliza un sistema digital para gestionar su información?',
        ayuda: 'Puede ser un software especializado, hojas de cálculo estructuradas o una plataforma como Nova Silva.' },
      { codigo: 'DA02', dimension: 'datos', texto: '¿Los datos de producción, entregas y calidad están centralizados y accesibles?',
        ayuda: 'Toda la información operativa debe estar en un mismo lugar y ser consultable por el personal autorizado.' },
      { codigo: 'DA03', dimension: 'datos', texto: '¿Se generan reportes periódicos con indicadores clave de gestión?',
        ayuda: 'Informes mensuales o trimestrales con KPIs como volumen acopiado, precio promedio, morosidad, etc.' },
      { codigo: 'DA04', dimension: 'datos', texto: '¿Existe respaldo de la información crítica de la organización?',
        ayuda: 'Copias de seguridad regulares en la nube o dispositivos externos, con frecuencia mínima semanal.' },
      { codigo: 'DA05', dimension: 'datos', texto: '¿El personal está capacitado en el uso de las herramientas digitales disponibles?',
        ayuda: 'Al menos el 80% del personal que maneja datos ha recibido capacitación formal en las herramientas que usa.' },
    ],
  },
  {
    id: 'registro_productores', nombre: 'Registro de Productores', critica: false,
    descripcion: 'Verifica la completitud y actualización del padrón de productores, incluyendo datos personales, productivos y socioeconómicos.',
    preguntas: [
      { codigo: 'RP01', dimension: 'registro_productores', texto: '¿Se tiene un registro actualizado de todos los productores asociados con datos completos?',
        ayuda: 'Nombre, cédula, contacto, ubicación, número de parcelas, área total y estado de membresía.' },
      { codigo: 'RP02', dimension: 'registro_productores', texto: '¿Los registros incluyen información de parcelas con coordenadas GPS?',
        ayuda: 'Al menos un punto GPS por parcela; idealmente polígonos completos para cumplimiento EUDR.' },
      { codigo: 'RP03', dimension: 'registro_productores', texto: '¿Se actualizan los registros al menos una vez al año?',
        ayuda: 'Proceso formal de actualización durante inspecciones internas o al inicio de cada ciclo productivo.' },
      { codigo: 'RP04', dimension: 'registro_productores', texto: '¿Los productores tienen acceso a su propia información registrada?',
        ayuda: 'Los socios pueden consultar sus datos de entregas, pagos y estado de parcelas, ya sea digital o presencialmente.' },
      { codigo: 'RP05', dimension: 'registro_productores', texto: '¿Se registra información socioeconómica de los productores y sus familias?',
        ayuda: 'Datos de composición familiar, nivel educativo, fuentes de ingreso, participación de mujeres y jóvenes.' },
    ],
  },
  {
    id: 'trazabilidad', nombre: 'Trazabilidad de Parcelas', critica: false,
    descripcion: 'Mide la capacidad de rastrear el café desde la parcela de origen hasta el lote de exportación.',
    preguntas: [
      { codigo: 'TP01', dimension: 'trazabilidad', texto: '¿Cada parcela tiene un código único de identificación?',
        ayuda: 'Sistema de codificación que permita distinguir cada parcela de forma inequívoca en todos los registros.' },
      { codigo: 'TP02', dimension: 'trazabilidad', texto: '¿Se registran las prácticas agrícolas realizadas en cada parcela?',
        ayuda: 'Fertilización, podas, control de plagas, renovaciones y otras labores con fecha y parcela asociada.' },
      { codigo: 'TP03', dimension: 'trazabilidad', texto: '¿Se puede rastrear el café desde la parcela hasta el lote de exportación?',
        ayuda: 'Cadena completa: parcela → entrega → bodega → lote → embarque, con registros verificables.' },
      { codigo: 'TP04', dimension: 'trazabilidad', texto: '¿Las parcelas están georreferenciadas con polígonos?',
        ayuda: 'Polígonos GPS que delimiten el perímetro de cada parcela, requisito obligatorio para EUDR.' },
      { codigo: 'TP05', dimension: 'trazabilidad', texto: '¿Se registra el historial de uso de agroquímicos por parcela?',
        ayuda: 'Productos aplicados, dosis, fecha y responsable, necesario para certificaciones y EUDR.' },
    ],
  },
  {
    id: 'control_calidad', nombre: 'Control de Calidad', critica: false,
    descripcion: 'Evalúa los procesos de catación, clasificación por calidad y diferenciación en el pago a productores.',
    preguntas: [
      { codigo: 'CC01', dimension: 'control_calidad', texto: '¿Se realizan cataciones de los lotes de café recibidos?',
        ayuda: 'Catación de muestras representativas siguiendo protocolos SCA o equivalentes.' },
      { codigo: 'CC02', dimension: 'control_calidad', texto: '¿Existe un laboratorio de catación propio o acceso a uno?',
        ayuda: 'Espacio equipado con tostador de muestras, molinillo, mesa de catación y catador certificado.' },
      { codigo: 'CC03', dimension: 'control_calidad', texto: '¿Se clasifican los cafés por calidad y se paga diferenciado?',
        ayuda: 'Sistema de premiación o castigo según puntaje de taza, defectos o humedad del café entregado.' },
      { codigo: 'CC04', dimension: 'control_calidad', texto: '¿Se lleva control de humedad, defectos y rendimiento de cada entrega?',
        ayuda: 'Medición de humedad (higrómetro), conteo de defectos y cálculo de factor de rendimiento por lote.' },
    ],
  },
  {
    id: 'gestion_entregas', nombre: 'Gestión de Entregas', critica: false,
    descripcion: 'Mide la formalidad del proceso de recepción de café, emisión de comprobantes y cumplimiento de pagos.',
    preguntas: [
      { codigo: 'GE01', dimension: 'gestion_entregas', texto: '¿Se emiten recibos detallados a cada productor por cada entrega?',
        ayuda: 'Comprobante con peso, tipo de café, precio, fecha y firma/confirmación del productor.' },
      { codigo: 'GE02', dimension: 'gestion_entregas', texto: '¿Se registran peso, tipo de café, calidad y origen de cada entrega?',
        ayuda: 'Registro digital o físico que asocie cada entrega con el productor y la parcela de origen.' },
      { codigo: 'GE03', dimension: 'gestion_entregas', texto: '¿Los pagos a productores se realizan en los plazos acordados?',
        ayuda: 'Cumplimiento del cronograma de pagos establecido, incluyendo anticipos y liquidaciones.' },
      { codigo: 'GE04', dimension: 'gestion_entregas', texto: '¿Se puede consultar el historial de entregas y pagos de cada productor?',
        ayuda: 'Sistema que permita al productor o al personal verificar todas las transacciones históricas.' },
      { codigo: 'GE05', dimension: 'gestion_entregas', texto: '¿El proceso de recepción incluye verificación de calidad en campo?',
        ayuda: 'Inspección visual, prueba de humedad o catación rápida antes de aceptar el café en el centro de acopio.' },
    ],
  },
  {
    id: 'acopio_lotes', nombre: 'Acopio y Formación de Lotes', critica: false,
    descripcion: 'Evalúa la gestión de inventario, condiciones de almacenamiento y formación de lotes comerciales homogéneos.',
    preguntas: [
      { codigo: 'AL01', dimension: 'acopio_lotes', texto: '¿Se forman lotes homogéneos por zona, variedad o calidad?',
        ayuda: 'Agrupación de café con características similares para maximizar el valor comercial del lote.' },
      { codigo: 'AL02', dimension: 'acopio_lotes', texto: '¿Existe control de inventario de café en bodega?',
        ayuda: 'Registro de entradas, salidas, saldos y ubicación del café en bodega, actualizado diariamente.' },
      { codigo: 'AL03', dimension: 'acopio_lotes', texto: '¿Las condiciones de almacenamiento son adecuadas (humedad, ventilación)?',
        ayuda: 'Bodega con piso elevado, ventilación cruzada, control de humedad <65% y protección contra plagas.' },
      { codigo: 'AL04', dimension: 'acopio_lotes', texto: '¿Se registra la composición de cada lote (productores, parcelas, volúmenes)?',
        ayuda: 'Ficha de lote con listado de productores contribuyentes, volúmenes y porcentaje de participación.' },
      { codigo: 'AL05', dimension: 'acopio_lotes', texto: '¿Se realizan análisis de calidad antes de conformar los lotes comerciales?',
        ayuda: 'Catación y análisis físico previo a la consolidación para garantizar homogeneidad del lote final.' },
    ],
  },
  {
    id: 'financiera', nombre: 'Gestión Financiera', critica: false,
    descripcion: 'Mide la solidez contable, control presupuestario, gestión de créditos y auditoría externa.',
    preguntas: [
      { codigo: 'FI01', dimension: 'financiera', texto: '¿Se lleva contabilidad formal y actualizada?',
        ayuda: 'Sistema contable con registros al día, catalogo de cuentas y reportes mensuales.' },
      { codigo: 'FI02', dimension: 'financiera', texto: '¿Se elaboran estados financieros periódicos?',
        ayuda: 'Balance general, estado de resultados y flujo de efectivo al menos trimestralmente.' },
      { codigo: 'FI03', dimension: 'financiera', texto: '¿Existe control de flujo de caja y presupuesto anual?',
        ayuda: 'Presupuesto aprobado con seguimiento mensual de ingresos y egresos vs. lo planificado.' },
      { codigo: 'FI04', dimension: 'financiera', texto: '¿La gestión de créditos a productores tiene políticas claras de recuperación?',
        ayuda: 'Reglamento de crédito con criterios de elegibilidad, montos máximos, plazos y mecanismos de cobro.' },
      { codigo: 'FI05', dimension: 'financiera', texto: '¿Se realizan auditorías financieras externas?',
        ayuda: 'Auditoría por firma independiente al menos una vez al año, con informe y dictamen.' },
    ],
  },
  {
    id: 'eudr', nombre: 'Cumplimiento EUDR', critica: false,
    descripcion: 'Verifica el grado de preparación para cumplir con la regulación europea de deforestación (EUDR 2023/1115).',
    preguntas: [
      { codigo: 'EU01', dimension: 'eudr', texto: '¿La organización conoce los requisitos de la regulación EUDR?',
        ayuda: 'El equipo directivo y técnico comprende las obligaciones de geolocalización, trazabilidad y due diligence.' },
      { codigo: 'EU02', dimension: 'eudr', texto: '¿Se cuenta con mapas de polígonos de todas las parcelas?',
        ayuda: 'Polígonos GPS con precisión suficiente (<4 ha requieren punto GPS; ≥4 ha requieren polígono completo).' },
      { codigo: 'EU03', dimension: 'eudr', texto: '¿Se puede demostrar que el café no proviene de áreas deforestadas después de 2020?',
        ayuda: 'Análisis de cambio de uso de suelo (LUC) con imágenes satelitales y documentación de respaldo.' },
      { codigo: 'EU04', dimension: 'eudr', texto: '¿Existe un sistema de due diligence documentado?',
        ayuda: 'Procedimiento formal de evaluación de riesgo por proveedor, con acciones correctivas definidas.' },
    ],
  },
  {
    id: 'certificaciones', nombre: 'Certificaciones', critica: false,
    descripcion: 'Evalúa la gestión de certificaciones activas, sistema de control interno y generación de primas.',
    preguntas: [
      { codigo: 'CE01', dimension: 'certificaciones', texto: '¿La organización tiene certificaciones activas (Orgánico, FairTrade, Rainforest, etc.)?',
        ayuda: 'Al menos una certificación vigente con auditoría externa completada en el último año.' },
      { codigo: 'CE02', dimension: 'certificaciones', texto: '¿Se mantiene el sistema de control interno actualizado?',
        ayuda: 'SCI con inspecciones internas anuales, registros de no conformidades y acciones correctivas.' },
      { codigo: 'CE03', dimension: 'certificaciones', texto: '¿Los productores conocen y cumplen los estándares de las certificaciones?',
        ayuda: 'Capacitaciones anuales sobre requisitos y verificación de cumplimiento en finca.' },
      { codigo: 'CE04', dimension: 'certificaciones', texto: '¿Se obtiene prima de precio por las certificaciones?',
        ayuda: 'Ingreso adicional verificable por venta de café certificado, distribuido parcial o totalmente a productores.' },
    ],
  },
  {
    id: 'mercado', nombre: 'Acceso a Mercado', critica: false,
    descripcion: 'Mide la capacidad comercial: clientes directos, negociación de contratos, presencia en eventos y estrategia digital.',
    preguntas: [
      { codigo: 'ME01', dimension: 'mercado', texto: '¿La organización tiene clientes directos (no solo intermediarios)?',
        ayuda: 'Relación comercial directa con tostadores, importadores o plataformas de specialty coffee.' },
      { codigo: 'ME02', dimension: 'mercado', texto: '¿Se negocian contratos con precio fijo o diferenciado?',
        ayuda: 'Contratos firmados con condiciones de precio, volumen, calidad y plazos de entrega definidos.' },
      { codigo: 'ME03', dimension: 'mercado', texto: '¿Se participa en ferias, ruedas de negocio o eventos comerciales?',
        ayuda: 'Participación activa en al menos un evento comercial por año (presencial o virtual).' },
      { codigo: 'ME04', dimension: 'mercado', texto: '¿Existe una estrategia de comercialización documentada?',
        ayuda: 'Plan de ventas con metas de volumen, mercados objetivo, política de precios y canales de distribución.' },
      { codigo: 'ME05', dimension: 'mercado', texto: '¿Se tiene presencia digital (web, redes sociales) para promoción?',
        ayuda: 'Sitio web, perfil en redes sociales o registro en plataformas B2B con información actualizada.' },
    ],
  },
];

export function getTotalPreguntas(): number {
  return DIMENSIONES_DIAGNOSTICO.reduce((sum, d) => sum + d.preguntas.length, 0);
}
