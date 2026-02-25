// ═══════════════════════════════════════════════════════════════
// Configuración Protocolo VITAL — Productor (132 preguntas)
// Internamente usa prefijo "clima_" para estabilidad de imports
// UI siempre muestra "Protocolo VITAL"
// ═══════════════════════════════════════════════════════════════

export interface OpcionRespuesta {
  clave: string;
  etiqueta: string;
  valor: number; // 0-3, donde 3 = mayor riesgo
}

export interface PreguntaClima {
  codigo: string;
  bloque: 'produccion' | 'agua' | 'suelo' | 'plagas' | 'diversificacion' | 'capacitacion';
  dimension: 'exposicion' | 'sensibilidad' | 'capacidad_adaptativa';
  peso: number;
  texto: string;
  opciones: OpcionRespuesta[];
}

export const BLOQUES_INFO: Record<string, { titulo: string; descripcion: string; icono: string }> = {
  produccion: { titulo: 'Producción y Rendimientos', descripcion: 'Evaluación de las prácticas productivas y rendimientos de café', icono: 'Sprout' },
  agua: { titulo: 'Recursos Hídricos', descripcion: 'Gestión y disponibilidad de recursos de agua', icono: 'Droplets' },
  suelo: { titulo: 'Salud del Suelo', descripcion: 'Conservación y manejo de suelos', icono: 'Mountain' },
  plagas: { titulo: 'Plagas y Enfermedades', descripcion: 'Manejo integrado de plagas y enfermedades', icono: 'Bug' },
  diversificacion: { titulo: 'Diversificación Económica', descripcion: 'Fuentes alternativas de ingresos y diversificación productiva', icono: 'TreePine' },
  capacitacion: { titulo: 'Capacitación y Asistencia Técnica', descripcion: 'Acceso a conocimiento y acompañamiento técnico', icono: 'GraduationCap' },
};

const opcionesSiNo: OpcionRespuesta[] = [
  { clave: 'si', etiqueta: 'Sí', valor: 0 },
  { clave: 'no', etiqueta: 'No', valor: 3 },
];

const opcionesFrec: OpcionRespuesta[] = [
  { clave: 'siempre', etiqueta: 'Siempre', valor: 0 },
  { clave: 'frecuente', etiqueta: 'Frecuentemente', valor: 1 },
  { clave: 'a_veces', etiqueta: 'A veces', valor: 2 },
  { clave: 'nunca', etiqueta: 'Nunca', valor: 3 },
];

const opcionesNivel: OpcionRespuesta[] = [
  { clave: 'alto', etiqueta: 'Alto', valor: 0 },
  { clave: 'medio', etiqueta: 'Medio', valor: 1 },
  { clave: 'bajo', etiqueta: 'Bajo', valor: 2 },
  { clave: 'nulo', etiqueta: 'Nulo / No aplica', valor: 3 },
];

const opcionesAcuerdo: OpcionRespuesta[] = [
  { clave: 'total', etiqueta: 'Totalmente de acuerdo', valor: 0 },
  { clave: 'parcial', etiqueta: 'Parcialmente de acuerdo', valor: 1 },
  { clave: 'desacuerdo', etiqueta: 'En desacuerdo', valor: 2 },
  { clave: 'total_des', etiqueta: 'Totalmente en desacuerdo', valor: 3 },
];

export const CLIMA_PRODUCTOR_PREGUNTAS: PreguntaClima[] = [
  // ═══════════════════════════════════════
  // BLOQUE 1: PRODUCCIÓN (22 preguntas)
  // ═══════════════════════════════════════
  { codigo: 'P01', bloque: 'produccion', dimension: 'exposicion', peso: 1.2, texto: '¿Ha experimentado disminución en los rendimientos de café en los últimos 3 años?', opciones: [{ clave: 'no', etiqueta: 'No, se han mantenido o aumentado', valor: 0 }, { clave: 'leve', etiqueta: 'Sí, leve (menos del 10%)', valor: 1 }, { clave: 'moderada', etiqueta: 'Sí, moderada (10-30%)', valor: 2 }, { clave: 'severa', etiqueta: 'Sí, severa (más del 30%)', valor: 3 }] },
  { codigo: 'P02', bloque: 'produccion', dimension: 'exposicion', peso: 1.0, texto: '¿Cuántas variedades de café cultiva actualmente?', opciones: [{ clave: '3mas', etiqueta: '3 o más variedades', valor: 0 }, { clave: '2', etiqueta: '2 variedades', valor: 1 }, { clave: '1', etiqueta: '1 variedad', valor: 2 }, { clave: 'no_sabe', etiqueta: 'No sabe / una sola variedad antigua', valor: 3 }] },
  { codigo: 'P03', bloque: 'produccion', dimension: 'exposicion', peso: 1.1, texto: '¿Ha experimentado eventos climáticos extremos (sequía, exceso de lluvia, heladas) que afecten su producción?', opciones: opcionesFrec },
  { codigo: 'P04', bloque: 'produccion', dimension: 'exposicion', peso: 0.9, texto: '¿Qué porcentaje de su cafetal tiene árboles de sombra?', opciones: [{ clave: '70mas', etiqueta: 'Más del 70%', valor: 0 }, { clave: '40_70', etiqueta: 'Entre 40% y 70%', valor: 1 }, { clave: '10_40', etiqueta: 'Entre 10% y 40%', valor: 2 }, { clave: 'menos10', etiqueta: 'Menos del 10% o sin sombra', valor: 3 }] },
  { codigo: 'P05', bloque: 'produccion', dimension: 'sensibilidad', peso: 1.0, texto: '¿Cuál es la edad promedio de sus cafetales?', opciones: [{ clave: 'joven', etiqueta: 'Menos de 5 años (renovados)', valor: 0 }, { clave: 'productivo', etiqueta: '5-15 años (plena producción)', valor: 1 }, { clave: 'maduro', etiqueta: '15-25 años', valor: 2 }, { clave: 'viejo', etiqueta: 'Más de 25 años', valor: 3 }] },
  { codigo: 'P06', bloque: 'produccion', dimension: 'sensibilidad', peso: 1.1, texto: '¿Realiza podas de renovación de manera programada?', opciones: opcionesFrec },
  { codigo: 'P07', bloque: 'produccion', dimension: 'sensibilidad', peso: 0.8, texto: '¿Tiene acceso a variedades resistentes al cambio climático (ej. Obatá, Marsellesa, Centroamericano)?', opciones: opcionesSiNo },
  { codigo: 'P08', bloque: 'produccion', dimension: 'sensibilidad', peso: 1.0, texto: '¿Cuántos quintales de café pergamino produce por hectárea al año?', opciones: [{ clave: '30mas', etiqueta: 'Más de 30 qq/ha', valor: 0 }, { clave: '20_30', etiqueta: '20-30 qq/ha', valor: 1 }, { clave: '10_20', etiqueta: '10-20 qq/ha', valor: 2 }, { clave: 'menos10', etiqueta: 'Menos de 10 qq/ha', valor: 3 }] },
  { codigo: 'P09', bloque: 'produccion', dimension: 'capacidad_adaptativa', peso: 1.2, texto: '¿Lleva registros escritos o digitales de sus prácticas de producción?', opciones: [{ clave: 'digital', etiqueta: 'Sí, digitales', valor: 0 }, { clave: 'escrito', etiqueta: 'Sí, en cuaderno', valor: 1 }, { clave: 'parcial', etiqueta: 'Solo algunos datos', valor: 2 }, { clave: 'no', etiqueta: 'No lleva registros', valor: 3 }] },
  { codigo: 'P10', bloque: 'produccion', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Ha implementado prácticas de adaptación al cambio climático en su finca?', opciones: [{ clave: 'varias', etiqueta: 'Sí, varias prácticas integradas', valor: 0 }, { clave: 'algunas', etiqueta: 'Algunas prácticas', valor: 1 }, { clave: 'inicio', etiqueta: 'Está iniciando', valor: 2 }, { clave: 'no', etiqueta: 'No ha implementado ninguna', valor: 3 }] },
  { codigo: 'P11', bloque: 'produccion', dimension: 'capacidad_adaptativa', peso: 0.9, texto: '¿Cuenta con un plan de renovación de cafetales?', opciones: opcionesSiNo },
  { codigo: 'P12', bloque: 'produccion', dimension: 'exposicion', peso: 1.0, texto: '¿Ha notado cambios en la época de floración de su café?', opciones: [{ clave: 'no', etiqueta: 'No, se mantiene estable', valor: 0 }, { clave: 'leve', etiqueta: 'Cambios leves', valor: 1 }, { clave: 'moderado', etiqueta: 'Cambios moderados', valor: 2 }, { clave: 'severo', etiqueta: 'Floraciones irregulares severas', valor: 3 }] },
  { codigo: 'P13', bloque: 'produccion', dimension: 'sensibilidad', peso: 0.8, texto: '¿Aplica fertilización basada en análisis de suelo?', opciones: opcionesFrec },
  { codigo: 'P14', bloque: 'produccion', dimension: 'sensibilidad', peso: 0.9, texto: '¿Cuenta con beneficio húmedo en su finca?', opciones: [{ clave: 'completo', etiqueta: 'Sí, completo y funcional', valor: 0 }, { clave: 'basico', etiqueta: 'Sí, básico', valor: 1 }, { clave: 'compartido', etiqueta: 'Compartido con otros', valor: 2 }, { clave: 'no', etiqueta: 'No tiene', valor: 3 }] },
  { codigo: 'P15', bloque: 'produccion', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Participa en programas de mejoramiento de calidad de taza?', opciones: opcionesSiNo },
  { codigo: 'P16', bloque: 'produccion', dimension: 'exposicion', peso: 1.1, texto: '¿Ha perdido producción por granizadas o vientos fuertes en los últimos 5 años?', opciones: opcionesFrec },
  { codigo: 'P17', bloque: 'produccion', dimension: 'sensibilidad', peso: 0.9, texto: '¿Realiza cosecha selectiva (solo cereza madura)?', opciones: opcionesFrec },
  { codigo: 'P18', bloque: 'produccion', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Tiene acceso a crédito para inversiones en su cafetal?', opciones: opcionesNivel },
  { codigo: 'P19', bloque: 'produccion', dimension: 'exposicion', peso: 0.8, texto: '¿A qué altitud se encuentran sus parcelas de café?', opciones: [{ clave: '1500mas', etiqueta: 'Más de 1,500 msnm', valor: 0 }, { clave: '1200_1500', etiqueta: '1,200-1,500 msnm', valor: 1 }, { clave: '900_1200', etiqueta: '900-1,200 msnm', valor: 2 }, { clave: 'menos900', etiqueta: 'Menos de 900 msnm', valor: 3 }] },
  { codigo: 'P20', bloque: 'produccion', dimension: 'sensibilidad', peso: 1.0, texto: '¿Cuál es la densidad de siembra de su cafetal?', opciones: [{ clave: 'optima', etiqueta: '4,000-5,000 plantas/ha', valor: 0 }, { clave: 'media', etiqueta: '3,000-4,000 plantas/ha', valor: 1 }, { clave: 'baja', etiqueta: '2,000-3,000 plantas/ha', valor: 2 }, { clave: 'muy_baja', etiqueta: 'Menos de 2,000 plantas/ha', valor: 3 }] },
  { codigo: 'P21', bloque: 'produccion', dimension: 'capacidad_adaptativa', peso: 0.9, texto: '¿Utiliza abonos orgánicos (compost, lombricompost, bocashi)?', opciones: opcionesFrec },
  { codigo: 'P22', bloque: 'produccion', dimension: 'capacidad_adaptativa', peso: 1.1, texto: '¿Tiene acceso a un vivero para material genético de calidad?', opciones: [{ clave: 'propio', etiqueta: 'Vivero propio', valor: 0 }, { clave: 'coop', etiqueta: 'De la cooperativa', valor: 1 }, { clave: 'compra', etiqueta: 'Compra a terceros', valor: 2 }, { clave: 'no', etiqueta: 'No tiene acceso', valor: 3 }] },

  // ═══════════════════════════════════════
  // BLOQUE 2: AGUA (22 preguntas)
  // ═══════════════════════════════════════
  { codigo: 'A01', bloque: 'agua', dimension: 'exposicion', peso: 1.2, texto: '¿Ha experimentado escasez de agua para uso en la finca en los últimos 3 años?', opciones: opcionesFrec },
  { codigo: 'A02', bloque: 'agua', dimension: 'exposicion', peso: 1.1, texto: '¿Las fuentes de agua cercanas a su finca han disminuido su caudal?', opciones: [{ clave: 'no', etiqueta: 'No, se mantienen estables', valor: 0 }, { clave: 'leve', etiqueta: 'Disminución leve', valor: 1 }, { clave: 'moderada', etiqueta: 'Disminución moderada', valor: 2 }, { clave: 'severa', etiqueta: 'Disminución severa o se secaron', valor: 3 }] },
  { codigo: 'A03', bloque: 'agua', dimension: 'exposicion', peso: 1.0, texto: '¿Ha experimentado inundaciones o exceso de escorrentía en su finca?', opciones: opcionesFrec },
  { codigo: 'A04', bloque: 'agua', dimension: 'sensibilidad', peso: 1.0, texto: '¿Cuenta con sistema de recolección de agua lluvia?', opciones: opcionesSiNo },
  { codigo: 'A05', bloque: 'agua', dimension: 'sensibilidad', peso: 1.1, texto: '¿Qué tipo de fuente de agua principal usa para el beneficio de café?', opciones: [{ clave: 'potable', etiqueta: 'Agua potable o de nacimiento protegido', valor: 0 }, { clave: 'rio', etiqueta: 'Río o quebrada', valor: 1 }, { clave: 'pozo', etiqueta: 'Pozo', valor: 2 }, { clave: 'lluvia_solo', etiqueta: 'Solo agua lluvia o no tiene', valor: 3 }] },
  { codigo: 'A06', bloque: 'agua', dimension: 'sensibilidad', peso: 0.9, texto: '¿Cuánta agua utiliza por quintal de café procesado?', opciones: [{ clave: 'eco', etiqueta: 'Beneficio ecológico (menos de 500 litros)', valor: 0 }, { clave: 'moderado', etiqueta: '500-1,000 litros', valor: 1 }, { clave: 'alto', etiqueta: '1,000-2,000 litros', valor: 2 }, { clave: 'excesivo', etiqueta: 'Más de 2,000 litros', valor: 3 }] },
  { codigo: 'A07', bloque: 'agua', dimension: 'capacidad_adaptativa', peso: 1.2, texto: '¿Tiene sistema de tratamiento de aguas mieles?', opciones: [{ clave: 'completo', etiqueta: 'Sí, sistema completo', valor: 0 }, { clave: 'basico', etiqueta: 'Sistema básico (fosas)', valor: 1 }, { clave: 'parcial', etiqueta: 'Tratamiento parcial', valor: 2 }, { clave: 'no', etiqueta: 'No trata las aguas', valor: 3 }] },
  { codigo: 'A08', bloque: 'agua', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Protege las zonas de recarga hídrica en su finca?', opciones: opcionesSiNo },
  { codigo: 'A09', bloque: 'agua', dimension: 'exposicion', peso: 0.9, texto: '¿Los patrones de lluvia han cambiado significativamente en su zona?', opciones: opcionesAcuerdo },
  { codigo: 'A10', bloque: 'agua', dimension: 'sensibilidad', peso: 1.0, texto: '¿Tiene riego suplementario para épocas de sequía?', opciones: opcionesSiNo },
  { codigo: 'A11', bloque: 'agua', dimension: 'capacidad_adaptativa', peso: 0.8, texto: '¿Realiza prácticas de conservación de suelos para retener humedad?', opciones: opcionesFrec },
  { codigo: 'A12', bloque: 'agua', dimension: 'exposicion', peso: 1.0, texto: '¿Su finca está ubicada en una cuenca con alto riesgo de sequía?', opciones: [{ clave: 'no', etiqueta: 'No, zona con buena precipitación', valor: 0 }, { clave: 'bajo', etiqueta: 'Riesgo bajo', valor: 1 }, { clave: 'medio', etiqueta: 'Riesgo medio', valor: 2 }, { clave: 'alto', etiqueta: 'Sí, alto riesgo', valor: 3 }] },
  { codigo: 'A13', bloque: 'agua', dimension: 'sensibilidad', peso: 0.9, texto: '¿Cuenta con reservorios o tanques de almacenamiento de agua?', opciones: [{ clave: 'varios', etiqueta: 'Sí, varios tanques', valor: 0 }, { clave: 'uno', etiqueta: 'Un tanque', valor: 1 }, { clave: 'pequeno', etiqueta: 'Solo almacenamiento pequeño', valor: 2 }, { clave: 'no', etiqueta: 'No tiene', valor: 3 }] },
  { codigo: 'A14', bloque: 'agua', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Conoce la cantidad de agua disponible en su finca a lo largo del año?', opciones: opcionesNivel },
  { codigo: 'A15', bloque: 'agua', dimension: 'exposicion', peso: 1.1, texto: '¿Ha tenido conflictos por el uso del agua con vecinos o comunidades?', opciones: opcionesFrec },
  { codigo: 'A16', bloque: 'agua', dimension: 'sensibilidad', peso: 0.8, texto: '¿Las aguas residuales de su beneficio contaminan fuentes de agua?', opciones: [{ clave: 'no', etiqueta: 'No, tiene tratamiento completo', valor: 0 }, { clave: 'minimo', etiqueta: 'Impacto mínimo', valor: 1 }, { clave: 'moderado', etiqueta: 'Contaminación moderada', valor: 2 }, { clave: 'alto', etiqueta: 'Sin control de contaminación', valor: 3 }] },
  { codigo: 'A17', bloque: 'agua', dimension: 'capacidad_adaptativa', peso: 0.9, texto: '¿Participa en comités de agua o gestión comunitaria del recurso hídrico?', opciones: opcionesSiNo },
  { codigo: 'A18', bloque: 'agua', dimension: 'exposicion', peso: 1.0, texto: '¿Ha experimentado contaminación de sus fuentes de agua por actividades externas?', opciones: opcionesFrec },
  { codigo: 'A19', bloque: 'agua', dimension: 'sensibilidad', peso: 1.0, texto: '¿Utiliza mulch o cobertura vegetal para conservar la humedad del suelo?', opciones: opcionesFrec },
  { codigo: 'A20', bloque: 'agua', dimension: 'capacidad_adaptativa', peso: 1.1, texto: '¿Ha recibido capacitación en gestión eficiente del agua?', opciones: opcionesSiNo },
  { codigo: 'A21', bloque: 'agua', dimension: 'sensibilidad', peso: 0.9, texto: '¿Tiene acceso a agua potable para consumo humano en la finca?', opciones: opcionesSiNo },
  { codigo: 'A22', bloque: 'agua', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Monitorea la calidad del agua que utiliza en su beneficio?', opciones: opcionesFrec },

  // ═══════════════════════════════════════
  // BLOQUE 3: SUELO (22 preguntas)
  // ═══════════════════════════════════════
  { codigo: 'S01', bloque: 'suelo', dimension: 'exposicion', peso: 1.2, texto: '¿Observa erosión visible (cárcavas, surcos) en sus parcelas de café?', opciones: [{ clave: 'no', etiqueta: 'No hay erosión visible', valor: 0 }, { clave: 'leve', etiqueta: 'Erosión leve', valor: 1 }, { clave: 'moderada', etiqueta: 'Erosión moderada', valor: 2 }, { clave: 'severa', etiqueta: 'Erosión severa', valor: 3 }] },
  { codigo: 'S02', bloque: 'suelo', dimension: 'exposicion', peso: 1.0, texto: '¿Sus parcelas están en laderas con pendiente pronunciada?', opciones: [{ clave: 'plano', etiqueta: 'Terreno plano o suave', valor: 0 }, { clave: 'moderada', etiqueta: 'Pendiente moderada', valor: 1 }, { clave: 'pronunciada', etiqueta: 'Pendiente pronunciada', valor: 2 }, { clave: 'muy_pronunciada', etiqueta: 'Muy pronunciada sin terrazas', valor: 3 }] },
  { codigo: 'S03', bloque: 'suelo', dimension: 'sensibilidad', peso: 1.1, texto: '¿Ha realizado análisis de suelo en los últimos 2 años?', opciones: opcionesSiNo },
  { codigo: 'S04', bloque: 'suelo', dimension: 'sensibilidad', peso: 1.0, texto: '¿Utiliza cobertura vegetal viva entre las calles de café?', opciones: opcionesFrec },
  { codigo: 'S05', bloque: 'suelo', dimension: 'sensibilidad', peso: 0.9, texto: '¿Aplica materia orgánica (compost, pulpa descompuesta) a sus suelos?', opciones: opcionesFrec },
  { codigo: 'S06', bloque: 'suelo', dimension: 'capacidad_adaptativa', peso: 1.2, texto: '¿Tiene prácticas de conservación de suelos (terrazas, barreras vivas, acequias)?', opciones: [{ clave: 'integrado', etiqueta: 'Sistema integrado de conservación', valor: 0 }, { clave: 'varias', etiqueta: 'Varias prácticas', valor: 1 }, { clave: 'basicas', etiqueta: 'Prácticas básicas', valor: 2 }, { clave: 'no', etiqueta: 'No tiene', valor: 3 }] },
  { codigo: 'S07', bloque: 'suelo', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Conoce el tipo de suelo y sus limitaciones en su finca?', opciones: opcionesNivel },
  { codigo: 'S08', bloque: 'suelo', dimension: 'exposicion', peso: 1.0, texto: '¿Ha notado disminución de la fertilidad natural de sus suelos?', opciones: opcionesFrec },
  { codigo: 'S09', bloque: 'suelo', dimension: 'sensibilidad', peso: 0.8, texto: '¿Realiza rotación de cultivos asociados al café?', opciones: opcionesSiNo },
  { codigo: 'S10', bloque: 'suelo', dimension: 'capacidad_adaptativa', peso: 0.9, texto: '¿Produce su propio abono orgánico?', opciones: [{ clave: 'si_vario', etiqueta: 'Sí, varios tipos', valor: 0 }, { clave: 'si_uno', etiqueta: 'Sí, un tipo', valor: 1 }, { clave: 'a_veces', etiqueta: 'Ocasionalmente', valor: 2 }, { clave: 'no', etiqueta: 'No produce', valor: 3 }] },
  { codigo: 'S11', bloque: 'suelo', dimension: 'exposicion', peso: 1.1, texto: '¿Ha experimentado deslizamientos de tierra en su finca o alrededores?', opciones: opcionesFrec },
  { codigo: 'S12', bloque: 'suelo', dimension: 'sensibilidad', peso: 1.0, texto: '¿Utiliza herbicidas químicos para el control de malezas?', opciones: [{ clave: 'nunca', etiqueta: 'Nunca, solo control manual/mecánico', valor: 0 }, { clave: 'minimo', etiqueta: 'Uso mínimo y dirigido', valor: 1 }, { clave: 'regular', etiqueta: 'Uso regular', valor: 2 }, { clave: 'frecuente', etiqueta: 'Uso frecuente e intensivo', valor: 3 }] },
  { codigo: 'S13', bloque: 'suelo', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Implementa siembra en curvas de nivel o terrazas?', opciones: opcionesSiNo },
  { codigo: 'S14', bloque: 'suelo', dimension: 'exposicion', peso: 0.9, texto: '¿El suelo de su finca presenta compactación?', opciones: [{ clave: 'no', etiqueta: 'Suelo suelto y bien estructurado', valor: 0 }, { clave: 'leve', etiqueta: 'Compactación leve', valor: 1 }, { clave: 'moderada', etiqueta: 'Compactación moderada', valor: 2 }, { clave: 'severa', etiqueta: 'Muy compactado', valor: 3 }] },
  { codigo: 'S15', bloque: 'suelo', dimension: 'sensibilidad', peso: 1.0, texto: '¿Observa presencia de lombrices y otros organismos benéficos en su suelo?', opciones: [{ clave: 'abundante', etiqueta: 'Abundante vida biológica', valor: 0 }, { clave: 'moderada', etiqueta: 'Presencia moderada', valor: 1 }, { clave: 'poca', etiqueta: 'Poca presencia', valor: 2 }, { clave: 'no', etiqueta: 'No se observan', valor: 3 }] },
  { codigo: 'S16', bloque: 'suelo', dimension: 'capacidad_adaptativa', peso: 0.8, texto: '¿Utiliza microorganismos benéficos (EM, Trichoderma, micorrizas)?', opciones: opcionesFrec },
  { codigo: 'S17', bloque: 'suelo', dimension: 'exposicion', peso: 1.0, texto: '¿Observa afloramiento de raíces por pérdida de suelo superficial?', opciones: opcionesFrec },
  { codigo: 'S18', bloque: 'suelo', dimension: 'sensibilidad', peso: 0.9, texto: '¿Mantiene la hojarasca y residuos vegetales como cobertura del suelo?', opciones: opcionesFrec },
  { codigo: 'S19', bloque: 'suelo', dimension: 'capacidad_adaptativa', peso: 1.1, texto: '¿Ha establecido barreras vivas o muertas para control de erosión?', opciones: opcionesSiNo },
  { codigo: 'S20', bloque: 'suelo', dimension: 'sensibilidad', peso: 1.0, texto: '¿Conoce el pH de su suelo?', opciones: [{ clave: 'si_rango', etiqueta: 'Sí, y está en rango adecuado', valor: 0 }, { clave: 'si_fuera', etiqueta: 'Sí, pero está fuera de rango', valor: 1 }, { clave: 'aprox', etiqueta: 'Tiene una idea aproximada', valor: 2 }, { clave: 'no', etiqueta: 'No lo conoce', valor: 3 }] },
  { codigo: 'S21', bloque: 'suelo', dimension: 'capacidad_adaptativa', peso: 0.9, texto: '¿Tiene un plan de manejo de suelos documentado?', opciones: opcionesSiNo },
  { codigo: 'S22', bloque: 'suelo', dimension: 'exposicion', peso: 1.0, texto: '¿Ha perdido área cultivable por degradación del suelo?', opciones: [{ clave: 'no', etiqueta: 'No ha perdido', valor: 0 }, { clave: 'poca', etiqueta: 'Menos del 5%', valor: 1 }, { clave: 'moderada', etiqueta: '5-15%', valor: 2 }, { clave: 'mucha', etiqueta: 'Más del 15%', valor: 3 }] },

  // ═══════════════════════════════════════
  // BLOQUE 4: PLAGAS (22 preguntas)
  // ═══════════════════════════════════════
  { codigo: 'PL01', bloque: 'plagas', dimension: 'exposicion', peso: 1.2, texto: '¿Cuál es el nivel de incidencia de roya (Hemileia vastatrix) en su cafetal?', opciones: [{ clave: 'menos2', etiqueta: 'Menos del 2%', valor: 0 }, { clave: '2_5', etiqueta: '2-5%', valor: 1 }, { clave: '5_15', etiqueta: '5-15%', valor: 2 }, { clave: 'mas15', etiqueta: 'Más del 15%', valor: 3 }] },
  { codigo: 'PL02', bloque: 'plagas', dimension: 'exposicion', peso: 1.2, texto: '¿Cuál es el nivel de infestación de broca (Hypothenemus hampei)?', opciones: [{ clave: 'menos2', etiqueta: 'Menos del 2%', valor: 0 }, { clave: '2_5', etiqueta: '2-5%', valor: 1 }, { clave: '5_10', etiqueta: '5-10%', valor: 2 }, { clave: 'mas10', etiqueta: 'Más del 10%', valor: 3 }] },
  { codigo: 'PL03', bloque: 'plagas', dimension: 'exposicion', peso: 1.0, texto: '¿Ha notado aumento de plagas o enfermedades en los últimos 3 años?', opciones: opcionesAcuerdo },
  { codigo: 'PL04', bloque: 'plagas', dimension: 'sensibilidad', peso: 1.1, texto: '¿Aplica manejo integrado de plagas (MIP)?', opciones: [{ clave: 'completo', etiqueta: 'MIP completo con monitoreo', valor: 0 }, { clave: 'parcial', etiqueta: 'Algunas prácticas de MIP', valor: 1 }, { clave: 'quimico', etiqueta: 'Principalmente control químico', valor: 2 }, { clave: 'no', etiqueta: 'Sin manejo estructurado', valor: 3 }] },
  { codigo: 'PL05', bloque: 'plagas', dimension: 'sensibilidad', peso: 1.0, texto: '¿Realiza monitoreo periódico de plagas y enfermedades?', opciones: opcionesFrec },
  { codigo: 'PL06', bloque: 'plagas', dimension: 'sensibilidad', peso: 0.9, texto: '¿Utiliza trampas para broca (Brocap, artesanales)?', opciones: opcionesSiNo },
  { codigo: 'PL07', bloque: 'plagas', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Tiene acceso a productos biológicos para control de plagas (Beauveria, Bacillus)?', opciones: opcionesSiNo },
  { codigo: 'PL08', bloque: 'plagas', dimension: 'capacidad_adaptativa', peso: 1.1, texto: '¿Puede identificar las principales plagas y enfermedades del café?', opciones: opcionesNivel },
  { codigo: 'PL09', bloque: 'plagas', dimension: 'exposicion', peso: 0.8, texto: '¿Ha experimentado ataques de ojo de gallo (Mycena citricolor)?', opciones: opcionesFrec },
  { codigo: 'PL10', bloque: 'plagas', dimension: 'sensibilidad', peso: 1.0, texto: '¿Realiza prácticas de re-re (recolección de frutos del suelo)?', opciones: opcionesFrec },
  { codigo: 'PL11', bloque: 'plagas', dimension: 'capacidad_adaptativa', peso: 0.9, texto: '¿Recibe alertas tempranas de plagas por parte de la cooperativa o técnicos?', opciones: opcionesSiNo },
  { codigo: 'PL12', bloque: 'plagas', dimension: 'exposicion', peso: 1.0, texto: '¿Ha detectado presencia de nematodos en sus cafetales?', opciones: [{ clave: 'no', etiqueta: 'No detectados', valor: 0 }, { clave: 'leve', etiqueta: 'Presencia leve', valor: 1 }, { clave: 'moderada', etiqueta: 'Presencia moderada', valor: 2 }, { clave: 'severa', etiqueta: 'Presencia severa', valor: 3 }] },
  { codigo: 'PL13', bloque: 'plagas', dimension: 'sensibilidad', peso: 0.9, texto: '¿Regula la sombra para condiciones fitosanitarias óptimas?', opciones: opcionesFrec },
  { codigo: 'PL14', bloque: 'plagas', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Conoce los umbrales económicos de daño para las principales plagas?', opciones: opcionesNivel },
  { codigo: 'PL15', bloque: 'plagas', dimension: 'exposicion', peso: 0.8, texto: '¿Ha observado presencia de antracnosis en sus frutos?', opciones: opcionesFrec },
  { codigo: 'PL16', bloque: 'plagas', dimension: 'sensibilidad', peso: 1.0, texto: '¿Aplica fungicidas de manera preventiva y programada?', opciones: opcionesFrec },
  { codigo: 'PL17', bloque: 'plagas', dimension: 'capacidad_adaptativa', peso: 1.1, texto: '¿Lleva registros de aplicaciones fitosanitarias?', opciones: [{ clave: 'detallado', etiqueta: 'Registros detallados', valor: 0 }, { clave: 'basico', etiqueta: 'Registros básicos', valor: 1 }, { clave: 'parcial', etiqueta: 'Solo algunos', valor: 2 }, { clave: 'no', etiqueta: 'No lleva registros', valor: 3 }] },
  { codigo: 'PL18', bloque: 'plagas', dimension: 'exposicion', peso: 0.9, texto: '¿Las condiciones climáticas recientes han favorecido la proliferación de plagas?', opciones: opcionesAcuerdo },
  { codigo: 'PL19', bloque: 'plagas', dimension: 'sensibilidad', peso: 1.0, texto: '¿Mantiene la diversidad de flora como refugio de enemigos naturales de plagas?', opciones: opcionesFrec },
  { codigo: 'PL20', bloque: 'plagas', dimension: 'capacidad_adaptativa', peso: 0.9, texto: '¿Tiene acceso a laboratorio para diagnóstico de plagas y enfermedades?', opciones: opcionesSiNo },
  { codigo: 'PL21', bloque: 'plagas', dimension: 'sensibilidad', peso: 0.8, texto: '¿Utiliza equipo de protección personal al aplicar agroquímicos?', opciones: opcionesFrec },
  { codigo: 'PL22', bloque: 'plagas', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Conoce y aplica el período de carencia de los productos que utiliza?', opciones: opcionesNivel },

  // ═══════════════════════════════════════
  // BLOQUE 5: DIVERSIFICACIÓN (22 preguntas)
  // ═══════════════════════════════════════
  { codigo: 'D01', bloque: 'diversificacion', dimension: 'exposicion', peso: 1.2, texto: '¿Qué porcentaje de sus ingresos depende exclusivamente del café?', opciones: [{ clave: 'menos50', etiqueta: 'Menos del 50%', valor: 0 }, { clave: '50_70', etiqueta: '50-70%', valor: 1 }, { clave: '70_90', etiqueta: '70-90%', valor: 2 }, { clave: 'mas90', etiqueta: 'Más del 90%', valor: 3 }] },
  { codigo: 'D02', bloque: 'diversificacion', dimension: 'exposicion', peso: 1.0, texto: '¿Tiene otros cultivos generadores de ingreso además del café?', opciones: [{ clave: '3mas', etiqueta: '3 o más cultivos', valor: 0 }, { clave: '2', etiqueta: '2 cultivos', valor: 1 }, { clave: '1', etiqueta: '1 cultivo', valor: 2 }, { clave: 'no', etiqueta: 'Solo café', valor: 3 }] },
  { codigo: 'D03', bloque: 'diversificacion', dimension: 'sensibilidad', peso: 1.1, texto: '¿Tiene producción de alimentos para autoconsumo (huerto, granos básicos)?', opciones: [{ clave: 'suficiente', etiqueta: 'Producción suficiente para la familia', valor: 0 }, { clave: 'parcial', etiqueta: 'Producción parcial', valor: 1 }, { clave: 'minima', etiqueta: 'Producción mínima', valor: 2 }, { clave: 'no', etiqueta: 'No produce alimentos', valor: 3 }] },
  { codigo: 'D04', bloque: 'diversificacion', dimension: 'sensibilidad', peso: 1.0, texto: '¿Tiene actividades pecuarias (aves, cerdos, ganado menor)?', opciones: [{ clave: 'varias', etiqueta: 'Varias especies integradas', valor: 0 }, { clave: 'una', etiqueta: 'Una especie', valor: 1 }, { clave: 'minima', etiqueta: 'Muy pocas', valor: 2 }, { clave: 'no', etiqueta: 'No tiene', valor: 3 }] },
  { codigo: 'D05', bloque: 'diversificacion', dimension: 'capacidad_adaptativa', peso: 1.2, texto: '¿Tiene ingresos no agrícolas (artesanías, turismo rural, servicios)?', opciones: opcionesSiNo },
  { codigo: 'D06', bloque: 'diversificacion', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Cuenta con ahorros o fondo de emergencia para meses de baja producción?', opciones: [{ clave: '6mas', etiqueta: 'Más de 6 meses de reserva', valor: 0 }, { clave: '3_6', etiqueta: '3-6 meses', valor: 1 }, { clave: '1_3', etiqueta: '1-3 meses', valor: 2 }, { clave: 'no', etiqueta: 'No tiene ahorros', valor: 3 }] },
  { codigo: 'D07', bloque: 'diversificacion', dimension: 'exposicion', peso: 0.9, texto: '¿Ha experimentado meses sin ingreso económico en el último año?', opciones: [{ clave: 'no', etiqueta: 'No, ingresos todo el año', valor: 0 }, { clave: '1_2', etiqueta: '1-2 meses', valor: 1 }, { clave: '3_4', etiqueta: '3-4 meses', valor: 2 }, { clave: 'mas4', etiqueta: 'Más de 4 meses', valor: 3 }] },
  { codigo: 'D08', bloque: 'diversificacion', dimension: 'sensibilidad', peso: 0.8, texto: '¿Aprovecha los subproductos del café (pulpa, mucílago, cascarilla)?', opciones: [{ clave: 'todos', etiqueta: 'Aprovecha todos', valor: 0 }, { clave: 'algunos', etiqueta: 'Algunos subproductos', valor: 1 }, { clave: 'poco', etiqueta: 'Muy poco', valor: 2 }, { clave: 'no', etiqueta: 'No los aprovecha', valor: 3 }] },
  { codigo: 'D09', bloque: 'diversificacion', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Vende su café con valor agregado (tostado, molido, marca propia)?', opciones: opcionesSiNo },
  { codigo: 'D10', bloque: 'diversificacion', dimension: 'exposicion', peso: 1.0, texto: '¿La volatilidad del precio del café afecta significativamente su economía familiar?', opciones: opcionesAcuerdo },
  { codigo: 'D11', bloque: 'diversificacion', dimension: 'sensibilidad', peso: 0.9, texto: '¿Tiene árboles maderables o frutales integrados en su cafetal?', opciones: [{ clave: 'sistema', etiqueta: 'Sistema agroforestal diverso', valor: 0 }, { clave: 'varios', etiqueta: 'Varias especies', valor: 1 }, { clave: 'pocos', etiqueta: 'Pocos árboles', valor: 2 }, { clave: 'no', etiqueta: 'No tiene', valor: 3 }] },
  { codigo: 'D12', bloque: 'diversificacion', dimension: 'capacidad_adaptativa', peso: 1.1, texto: '¿Tiene acceso a mercados diferenciados (orgánico, comercio justo, specialty)?', opciones: [{ clave: 'varios', etiqueta: 'Acceso a varios mercados', valor: 0 }, { clave: 'uno', etiqueta: 'Un mercado diferenciado', valor: 1 }, { clave: 'proceso', etiqueta: 'En proceso de acceder', valor: 2 }, { clave: 'no', etiqueta: 'Solo mercado convencional', valor: 3 }] },
  { codigo: 'D13', bloque: 'diversificacion', dimension: 'exposicion', peso: 0.8, texto: '¿Algún miembro de la familia emigró por falta de ingresos agrícolas?', opciones: opcionesSiNo },
  { codigo: 'D14', bloque: 'diversificacion', dimension: 'sensibilidad', peso: 1.0, texto: '¿Tiene acceso a seguro agrícola o mecanismos de protección ante desastres?', opciones: opcionesSiNo },
  { codigo: 'D15', bloque: 'diversificacion', dimension: 'capacidad_adaptativa', peso: 0.9, texto: '¿Participa en organizaciones de productores para comercialización conjunta?', opciones: opcionesSiNo },
  { codigo: 'D16', bloque: 'diversificacion', dimension: 'exposicion', peso: 1.0, texto: '¿Tiene deudas que comprometan más del 30% de sus ingresos anuales?', opciones: [{ clave: 'no', etiqueta: 'No tiene deudas significativas', valor: 0 }, { clave: 'baja', etiqueta: 'Deudas menores al 30%', valor: 1 }, { clave: 'media', etiqueta: 'Deudas entre 30-50%', valor: 2 }, { clave: 'alta', etiqueta: 'Deudas mayores al 50%', valor: 3 }] },
  { codigo: 'D17', bloque: 'diversificacion', dimension: 'sensibilidad', peso: 0.9, texto: '¿La mano de obra familiar es suficiente para las labores de la finca?', opciones: [{ clave: 'si', etiqueta: 'Sí, con capacidad adicional', valor: 0 }, { clave: 'justo', etiqueta: 'Justo lo necesario', valor: 1 }, { clave: 'insuficiente', etiqueta: 'A veces insuficiente', valor: 2 }, { clave: 'deficit', etiqueta: 'Déficit constante', valor: 3 }] },
  { codigo: 'D18', bloque: 'diversificacion', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Tiene un plan financiero o presupuesto anual para la finca?', opciones: opcionesSiNo },
  { codigo: 'D19', bloque: 'diversificacion', dimension: 'exposicion', peso: 0.8, texto: '¿Ha considerado o implementado ecoturismo o agroturismo en su finca?', opciones: [{ clave: 'activo', etiqueta: 'Sí, genera ingresos', valor: 0 }, { clave: 'inicio', etiqueta: 'En proceso de implementación', valor: 1 }, { clave: 'interes', etiqueta: 'Tiene interés', valor: 2 }, { clave: 'no', etiqueta: 'No ha considerado', valor: 3 }] },
  { codigo: 'D20', bloque: 'diversificacion', dimension: 'sensibilidad', peso: 1.0, texto: '¿Produce miel de abeja como actividad complementaria?', opciones: opcionesSiNo },
  { codigo: 'D21', bloque: 'diversificacion', dimension: 'capacidad_adaptativa', peso: 0.9, texto: '¿Tiene cuenta bancaria o acceso a servicios financieros formales?', opciones: opcionesSiNo },
  { codigo: 'D22', bloque: 'diversificacion', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Recibe prima o sobreprecio por café certificado o de calidad?', opciones: [{ clave: 'significativo', etiqueta: 'Sí, prima significativa', valor: 0 }, { clave: 'moderado', etiqueta: 'Prima moderada', valor: 1 }, { clave: 'minima', etiqueta: 'Prima mínima', valor: 2 }, { clave: 'no', etiqueta: 'No recibe prima', valor: 3 }] },

  // ═══════════════════════════════════════
  // BLOQUE 6: CAPACITACIÓN (22 preguntas)
  // ═══════════════════════════════════════
  { codigo: 'C01', bloque: 'capacitacion', dimension: 'capacidad_adaptativa', peso: 1.2, texto: '¿Ha recibido capacitación en cambio climático y adaptación en los últimos 2 años?', opciones: [{ clave: 'varias', etiqueta: 'Sí, varias capacitaciones', valor: 0 }, { clave: 'una', etiqueta: 'Una capacitación', valor: 1 }, { clave: 'informal', etiqueta: 'Solo información informal', valor: 2 }, { clave: 'no', etiqueta: 'No ha recibido', valor: 3 }] },
  { codigo: 'C02', bloque: 'capacitacion', dimension: 'capacidad_adaptativa', peso: 1.1, texto: '¿Recibe visitas de asistencia técnica regularmente?', opciones: [{ clave: 'mensual', etiqueta: 'Mensual o más frecuente', valor: 0 }, { clave: 'trimestral', etiqueta: 'Cada 2-3 meses', valor: 1 }, { clave: 'semestral', etiqueta: 'Cada 6 meses', valor: 2 }, { clave: 'no', etiqueta: 'No recibe o esporádica', valor: 3 }] },
  { codigo: 'C03', bloque: 'capacitacion', dimension: 'sensibilidad', peso: 1.0, texto: '¿Aplica las recomendaciones técnicas que recibe?', opciones: opcionesFrec },
  { codigo: 'C04', bloque: 'capacitacion', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Participa en escuelas de campo (ECA) o grupos de aprendizaje?', opciones: opcionesSiNo },
  { codigo: 'C05', bloque: 'capacitacion', dimension: 'sensibilidad', peso: 0.9, texto: '¿Puede leer y escribir con facilidad?', opciones: [{ clave: 'si', etiqueta: 'Sí, sin dificultad', valor: 0 }, { clave: 'basico', etiqueta: 'Nivel básico', valor: 1 }, { clave: 'dificultad', etiqueta: 'Con dificultad', valor: 2 }, { clave: 'no', etiqueta: 'No sabe leer/escribir', valor: 3 }] },
  { codigo: 'C06', bloque: 'capacitacion', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Tiene acceso a información climática (pronósticos, alertas)?', opciones: [{ clave: 'digital', etiqueta: 'Sí, por medios digitales', valor: 0 }, { clave: 'radio', etiqueta: 'Por radio o TV', valor: 1 }, { clave: 'vecinos', etiqueta: 'Por vecinos o boca a boca', valor: 2 }, { clave: 'no', etiqueta: 'No tiene acceso', valor: 3 }] },
  { codigo: 'C07', bloque: 'capacitacion', dimension: 'sensibilidad', peso: 0.8, texto: '¿Utiliza teléfono celular con acceso a internet?', opciones: [{ clave: 'smartphone', etiqueta: 'Sí, smartphone con datos', valor: 0 }, { clave: 'wifi', etiqueta: 'Smartphone solo con WiFi', valor: 1 }, { clave: 'basico', etiqueta: 'Celular básico sin internet', valor: 2 }, { clave: 'no', etiqueta: 'No tiene celular', valor: 3 }] },
  { codigo: 'C08', bloque: 'capacitacion', dimension: 'capacidad_adaptativa', peso: 1.1, texto: '¿Comparte conocimientos y experiencias con otros productores?', opciones: opcionesFrec },
  { codigo: 'C09', bloque: 'capacitacion', dimension: 'sensibilidad', peso: 1.0, texto: '¿Existe relevo generacional en su finca (jóvenes interesados en continuar)?', opciones: [{ clave: 'si', etiqueta: 'Sí, con jóvenes capacitados', valor: 0 }, { clave: 'interes', etiqueta: 'Hay interés pero sin capacitación', valor: 1 }, { clave: 'incierto', etiqueta: 'Incierto', valor: 2 }, { clave: 'no', etiqueta: 'No hay relevo', valor: 3 }] },
  { codigo: 'C10', bloque: 'capacitacion', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Ha participado en intercambios de experiencias con productores de otras regiones?', opciones: opcionesSiNo },
  { codigo: 'C11', bloque: 'capacitacion', dimension: 'sensibilidad', peso: 0.9, texto: '¿Las mujeres de su hogar participan en las decisiones productivas de la finca?', opciones: opcionesFrec },
  { codigo: 'C12', bloque: 'capacitacion', dimension: 'capacidad_adaptativa', peso: 0.8, texto: '¿Tiene acceso a publicaciones técnicas sobre café?', opciones: opcionesSiNo },
  { codigo: 'C13', bloque: 'capacitacion', dimension: 'sensibilidad', peso: 1.0, texto: '¿Conoce los requisitos de las certificaciones que posee o busca obtener?', opciones: opcionesNivel },
  { codigo: 'C14', bloque: 'capacitacion', dimension: 'capacidad_adaptativa', peso: 1.1, texto: '¿Ha recibido capacitación específica en calidad de café y catación?', opciones: opcionesSiNo },
  { codigo: 'C15', bloque: 'capacitacion', dimension: 'sensibilidad', peso: 0.9, texto: '¿Conoce sus derechos como productor asociado a la cooperativa?', opciones: opcionesNivel },
  { codigo: 'C16', bloque: 'capacitacion', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Participa activamente en las asambleas y decisiones de la cooperativa?', opciones: opcionesFrec },
  { codigo: 'C17', bloque: 'capacitacion', dimension: 'sensibilidad', peso: 0.8, texto: '¿Tiene experiencia en manejo de registros contables o financieros básicos?', opciones: opcionesNivel },
  { codigo: 'C18', bloque: 'capacitacion', dimension: 'capacidad_adaptativa', peso: 1.0, texto: '¿Ha recibido capacitación en primeros auxilios y seguridad laboral?', opciones: opcionesSiNo },
  { codigo: 'C19', bloque: 'capacitacion', dimension: 'sensibilidad', peso: 1.0, texto: '¿Sabe interpretar resultados de análisis de suelo y foliares?', opciones: opcionesNivel },
  { codigo: 'C20', bloque: 'capacitacion', dimension: 'capacidad_adaptativa', peso: 0.9, texto: '¿Tiene acceso a asesoría legal o contable cuando la necesita?', opciones: opcionesSiNo },
  { codigo: 'C21', bloque: 'capacitacion', dimension: 'sensibilidad', peso: 0.8, texto: '¿Conoce las normas de la regulación EUDR y cómo le afectan?', opciones: opcionesNivel },
  { codigo: 'C22', bloque: 'capacitacion', dimension: 'capacidad_adaptativa', peso: 1.1, texto: '¿Estaría dispuesto a adoptar nuevas tecnologías si recibe la capacitación adecuada?', opciones: opcionesAcuerdo },
];

// Agrupar preguntas por bloque
export function getPreguntasPorBloque(bloque: string): PreguntaClima[] {
  return CLIMA_PRODUCTOR_PREGUNTAS.filter(p => p.bloque === bloque);
}

export const BLOQUES_ORDER = ['produccion', 'agua', 'suelo', 'plagas', 'diversificacion', 'capacitacion'] as const;
