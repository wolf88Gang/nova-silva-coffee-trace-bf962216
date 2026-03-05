/**
 * Motor de Interpretación Nova Silva — Texto determinístico
 * Genera interpretación en 6 secciones, en español accesible.
 * REGLA: No mencionar "IA", "algoritmo", "modelo". Todo es "Interpretación Nova Silva".
 */

export type NivelRiesgoProductor = 'bajo' | 'medio' | 'alto' | 'critico';

// ── Types ──

export interface ClimaProductorData {
  productor?: { nombre: string; comunidad?: string; area_total?: number };
  fecha?: string;
  indice_clima: number;             // 0-100 (higher = more risk)
  nivel_riesgo_global: NivelRiesgoProductor;
  puntaje_exposicion: number;
  puntaje_sensibilidad: number;
  puntaje_capacidad_adaptativa: number;
  riesgo_exposicion: NivelRiesgoProductor;
  riesgo_sensibilidad: NivelRiesgoProductor;
  riesgo_capacidad_adaptativa: NivelRiesgoProductor;
  factores_riesgo: Array<{ codigo: string; bloque: string; pregunta: string; dimension: string; impacto: 'alto' | 'medio' }>;
}

export interface InterpretacionClima {
  queEsDiagnostico: string;
  resumenSituacion: string;
  analisisDimensiones: {
    exposicion: { titulo: string; texto: string; nivel: string; puntaje: number };
    sensibilidad: { titulo: string; texto: string; nivel: string; puntaje: number };
    capacidad_adaptativa: { titulo: string; texto: string; nivel: string; puntaje: number };
  };
  factoresCriticos: Array<{ titulo: string; descripcion: string; nivelRiesgo: string; queHacer: string }>;
  pasosCorto: string[];
  pasosMediano: string[];
  apoyoCooperativa: string[];
  resumenCorto: string;
  introduccion: string;
}

// ── Templates ──

const nivelTextos: Record<NivelRiesgoProductor, string> = {
  bajo: 'bajo',
  medio: 'moderado',
  alto: 'alto',
  critico: 'crítico',
};

const exposicionTextos: Record<NivelRiesgoProductor, string> = {
  bajo: 'La finca muestra baja exposición a eventos climáticos adversos. Las condiciones han sido relativamente estables.',
  medio: 'Se detecta exposición moderada a factores climáticos. Algunos eventos adversos han afectado la zona de manera intermitente.',
  alto: 'Alta frecuencia de eventos climáticos adversos: sequías prolongadas, lluvias intensas, o nuevas plagas que antes no existían en la zona.',
  critico: 'Exposición crítica a múltiples amenazas climáticas simultáneas. La finca enfrenta riesgos severos que requieren acción inmediata.',
};

const sensibilidadTextos: Record<NivelRiesgoProductor, string> = {
  bajo: 'La finca tiene buena capacidad de absorber impactos. La diversificación de cultivos y la edad de las plantaciones son favorables.',
  medio: 'Sensibilidad moderada a impactos. Algunas áreas de la finca podrían ser más vulnerables que otras.',
  alto: 'Alta sensibilidad a impactos externos. La dependencia de un solo cultivo o la edad de las plantaciones aumentan la vulnerabilidad.',
  critico: 'Sensibilidad crítica. Cualquier evento adverso tendría un impacto severo en la producción y los ingresos.',
};

const capacidadTextos: Record<NivelRiesgoProductor, string> = {
  bajo: 'Excelente capacidad de adaptación. Se implementan buenas prácticas y se cuenta con recursos para responder a cambios.',
  medio: 'Capacidad de adaptación moderada. Hay prácticas positivas pero también áreas donde se puede mejorar significativamente.',
  alto: 'Capacidad de adaptación limitada. Se requiere fortalecer conocimientos, recursos y prácticas para enfrentar cambios.',
  critico: 'Capacidad de adaptación muy limitada. Es urgente implementar medidas básicas de preparación y respuesta.',
};

const recomendacionesPorBloque: Record<string, string> = {
  produccion: 'Revisar con el técnico el estado de los cafetales, programar podas de renovación y considerar variedades más tolerantes.',
  clima_agua: 'Implementar cosecha de agua de lluvia, zanjas de infiltración y mejorar el drenaje de las parcelas.',
  suelo_manejo: 'Establecer coberturas permanentes, evitar quemas, realizar análisis de suelo y ajustar la fertilización.',
  plagas_enfermedades: 'Implementar monitoreo regular de broca y roya, considerar control biológico y variedades resistentes.',
  diversificacion_ingresos: 'Fortalecer la planificación de gastos por ciclo, diversificar fuentes de ingreso y establecer fondo de emergencia.',
  capacidades_servicios: 'Participar activamente en capacitaciones, aprovechar la asistencia técnica y conectarse con redes de apoyo.',
};

// ── Engine ──

export function generarInterpretacion(data: ClimaProductorData): InterpretacionClima {
  const nombre = data.productor?.nombre ?? 'Productor';
  const comunidad = data.productor?.comunidad ?? '';
  const nivel = nivelTextos[data.nivel_riesgo_global];

  // S1: What is the diagnosis
  const queEsDiagnostico = 'El Protocolo VITAL de Nova Silva es una evaluación integral de la resiliencia de su finca frente a los riesgos climáticos, productivos y socioeconómicos. Analiza tres dimensiones: qué tan expuesta está su finca a amenazas (Exposición), qué tan sensible es a los impactos (Sensibilidad), y qué capacidad tiene para adaptarse (Capacidad Adaptativa).';

  // S2: Summary
  const resumenSituacion = `${nombre}${comunidad ? ` de ${comunidad}` : ''} presenta un nivel de riesgo ${nivel} con un índice global de ${data.indice_clima}/100. ${
    data.nivel_riesgo_global === 'bajo' ? 'Su finca muestra buena resiliencia general.' :
    data.nivel_riesgo_global === 'medio' ? 'Existen áreas de mejora que, atendidas oportunamente, fortalecerían significativamente la resiliencia.' :
    data.nivel_riesgo_global === 'alto' ? 'Se identifican factores de vulnerabilidad importantes que requieren atención prioritaria.' :
    'La situación requiere intervención urgente en múltiples frentes para proteger la operación.'
  }`;

  // S3: Dimension analysis
  const analisisDimensiones = {
    exposicion: {
      titulo: 'Exposición a Amenazas',
      texto: `Un puntaje de ${data.puntaje_exposicion}/100. ${exposicionTextos[data.riesgo_exposicion]}`,
      nivel: nivelTextos[data.riesgo_exposicion],
      puntaje: data.puntaje_exposicion,
    },
    sensibilidad: {
      titulo: 'Sensibilidad a Impactos',
      texto: `Un puntaje de ${data.puntaje_sensibilidad}/100. ${sensibilidadTextos[data.riesgo_sensibilidad]}`,
      nivel: nivelTextos[data.riesgo_sensibilidad],
      puntaje: data.puntaje_sensibilidad,
    },
    capacidad_adaptativa: {
      titulo: 'Capacidad Adaptativa',
      texto: `Un puntaje de ${data.puntaje_capacidad_adaptativa}/100. ${capacidadTextos[data.riesgo_capacidad_adaptativa]}`,
      nivel: nivelTextos[data.riesgo_capacidad_adaptativa],
      puntaje: data.puntaje_capacidad_adaptativa,
    },
  };

  // S4: Critical factors
  const bloquesAfectados = new Set(data.factores_riesgo.map(f => f.bloque));
  const factoresCriticos = data.factores_riesgo.slice(0, 5).map(f => ({
    titulo: f.pregunta.substring(0, 60) + (f.pregunta.length > 60 ? '...' : ''),
    descripcion: f.pregunta,
    nivelRiesgo: f.impacto === 'alto' ? 'Alto' : 'Medio',
    queHacer: recomendacionesPorBloque[f.bloque] ?? 'Consultar con su técnico para definir un plan de acción.',
  }));

  // S5: Steps
  const pasosCorto: string[] = [];
  const pasosMediano: string[] = [];

  if (bloquesAfectados.has('produccion')) {
    pasosCorto.push('Programar poda de renovación en los cafetales más viejos');
    pasosMediano.push('Renovar al menos el 20% de las plantaciones con variedades tolerantes');
  }
  if (bloquesAfectados.has('clima_agua')) {
    pasosCorto.push('Instalar sistema básico de cosecha de agua lluvia');
    pasosMediano.push('Construir reservorio para riego de emergencia');
  }
  if (bloquesAfectados.has('suelo_manejo')) {
    pasosCorto.push('Establecer cobertura viva entre hileras de café');
    pasosMediano.push('Realizar análisis de suelo completo y ajustar plan de fertilización');
  }
  if (bloquesAfectados.has('plagas_enfermedades')) {
    pasosCorto.push('Iniciar monitoreo quincenal de roya y broca');
    pasosMediano.push('Implementar plan de manejo integrado de plagas');
  }
  if (bloquesAfectados.has('diversificacion_ingresos')) {
    pasosCorto.push('Elaborar presupuesto familiar por ciclo productivo');
    pasosMediano.push('Establecer al menos una fuente alternativa de ingreso');
  }
  if (data.riesgo_capacidad_adaptativa === 'alto' || data.riesgo_capacidad_adaptativa === 'critico') {
    pasosCorto.push('Solicitar plan de acompañamiento técnico intensivo');
  }
  pasosCorto.push('Documentar todas las acciones en Nova Silva para seguimiento');

  // S6: Support
  const apoyoCooperativa = [
    'Su organización puede coordinar asistencia técnica personalizada',
    'Pregunte por programas de crédito verde para implementar mejoras',
    'Nova Silva monitoreará su progreso y actualizará sus recomendaciones',
  ];

  const resumenCorto = `Riesgo ${nivel} (${data.indice_clima}/100). ${factoresCriticos.length} factores críticos identificados.`;
  const introduccion = `Resultado del Protocolo VITAL para ${nombre}. Evaluación realizada el ${data.fecha ?? new Date().toISOString().split('T')[0]}.`;

  return {
    queEsDiagnostico,
    resumenSituacion,
    analisisDimensiones,
    factoresCriticos,
    pasosCorto,
    pasosMediano,
    apoyoCooperativa,
    resumenCorto,
    introduccion,
  };
}
