/**
 * Protocolo VITAL — Diagnóstico de Finca (Productor)
 * 
 * 100 preguntas distribuidas en 5 bloques temáticos.
 * Cada pregunta pertenece a un componente:
 *   C = Exposición (Clima)
 *   E = Sensibilidad (Estructura)
 *   R = Capacidad Adaptativa (Respuesta)
 * 
 * Fórmula IGRN:
 *   IGRN = (0.35 × μ_C) + (0.30 × μ_E) + (0.35 × μ_R)
 * 
 * Puntaje alto (1.0) = bueno (baja vulnerabilidad).
 * IGRN 0-1 → ×100 para porcentaje.
 * 
 * Falsa Resiliencia: max(C,E,R) - min(C,E,R) >= 0.4
 * 
 * Rangos:
 *   0-40  → Crítica (🔴)
 *   41-60 → Alta Fragilidad (🟠)
 *   61-80 → Moderada / En Construcción (🟡)
 *   81-100 → Baja / Resiliente (🟢)
 * 
 * Fuente: Guía Maestra de Implementación Nova Silva v3.0
 */

export type VitalComponent = 'C' | 'E' | 'R';

export interface VitalOption {
  label: string;
  score: number;
}

export interface VitalQuestion {
  id: number;
  texto: string;
  componente: VitalComponent;
  opciones: VitalOption[];
}

export interface VitalBlock {
  id: string;
  nombre: string;
  rango: string;
  preguntas: VitalQuestion[];
}

// ── BLOQUE I: Clima, Recursos Hídricos y Entorno Biofísico (P1–P20) ──
const bloqueI: VitalQuestion[] = [
  { id: 1, texto: '¿Dispone la finca de sistemas para recolectar agua de lluvia?', componente: 'R',
    opciones: [{ label: 'No tiene', score: 0.0 }, { label: 'Baldes improvisados', score: 0.3 }, { label: 'Canaletas básicas', score: 0.6 }, { label: 'Tanque funcional', score: 1.0 }] },
  { id: 2, texto: '¿Con qué frecuencia se seca la fuente principal de agua?', componente: 'C',
    opciones: [{ label: 'Casi nunca', score: 1.0 }, { label: '1-2 veces/año', score: 0.6 }, { label: '>2 veces/año', score: 0.3 }, { label: 'Todos los años', score: 0.0 }] },
  { id: 3, texto: '¿Utiliza métodos para reducir pérdidas por escorrentía?', componente: 'E',
    opciones: [{ label: 'Ninguno', score: 0.0 }, { label: 'Zanjas rústicas', score: 0.4 }, { label: 'Zanjas técnicas', score: 0.7 }, { label: 'Terrazas integradas', score: 1.0 }] },
  { id: 4, texto: '¿Aplica cobertura viva o mulch para conservar humedad?', componente: 'R',
    opciones: [{ label: 'Nunca', score: 0.0 }, { label: 'A veces sin plan', score: 0.4 }, { label: 'Zonas estratégicas', score: 0.7 }, { label: 'Toda la finca planificada', score: 1.0 }] },
  { id: 5, texto: '¿Se han identificado zonas de erosión activa?', componente: 'C',
    opciones: [{ label: 'No', score: 1.0 }, { label: 'Zonas aisladas', score: 0.7 }, { label: 'Varias zonas críticas', score: 0.4 }, { label: 'Gran parte de la finca', score: 0.0 }] },
  { id: 6, texto: '¿Frecuencia de aplicación de abonos orgánicos/compost?', componente: 'R',
    opciones: [{ label: 'Nunca', score: 0.0 }, { label: '1 vez/año', score: 0.3 }, { label: '2 veces/ciclo', score: 0.6 }, { label: 'Según plan técnico', score: 1.0 }] },
  { id: 7, texto: '¿Existe planificación del manejo de sombra?', componente: 'R',
    opciones: [{ label: 'No hay sombra', score: 0.0 }, { label: 'Sombra espontánea', score: 0.5 }, { label: 'Sombra manejada técnicamente', score: 1.0 }] },
  { id: 8, texto: '¿Qué % del cafetal tiene sombra permanente?', componente: 'E',
    opciones: [{ label: '0-20%', score: 0.2 }, { label: '21-40%', score: 0.5 }, { label: '41-60%', score: 0.8 }, { label: '61-100%', score: 1.0 }] },
  { id: 9, texto: '¿Las especies de sombra ofrecen beneficios adicionales?', componente: 'R',
    opciones: [{ label: 'No considerado', score: 0.0 }, { label: 'Algunas sin plan', score: 0.6 }, { label: 'Mayoría aporta múltiples beneficios', score: 1.0 }] },
  { id: 10, texto: '¿Ha sufrido daños significativos por lluvias/sequías en últimos 5 años?', componente: 'C',
    opciones: [{ label: 'No', score: 1.0 }, { label: 'Una vez', score: 0.6 }, { label: '2+ veces', score: 0.3 }, { label: 'Cada año', score: 0.0 }] },
  { id: 11, texto: '¿Periodo de mayor estrés hídrico?', componente: 'C',
    opciones: [{ label: 'No presenta', score: 1.0 }, { label: 'Leve época corta', score: 0.7 }, { label: 'Moderado varios meses', score: 0.4 }, { label: 'Severo prolongado', score: 0.0 }] },
  { id: 12, texto: '¿Infraestructura para almacenar agua en épocas secas?', componente: 'R',
    opciones: [{ label: 'No tiene', score: 0.0 }, { label: 'Mínima sin mantenimiento', score: 0.4 }, { label: 'Funcional limitada', score: 0.7 }, { label: 'Completa', score: 1.0 }] },
  { id: 13, texto: '¿Qué tan dependiente es la producción de lluvia directa?', componente: 'E',
    opciones: [{ label: 'Totalmente', score: 0.0 }, { label: 'Alta', score: 0.4 }, { label: 'Parcial', score: 0.7 }, { label: 'Baja', score: 1.0 }] },
  { id: 14, texto: '¿Pendiente predominante en áreas de café?', componente: 'C',
    opciones: [{ label: 'Muy pronunciada sin manejo', score: 0.0 }, { label: 'Pronunciada con manejo parcial', score: 0.4 }, { label: 'Moderada', score: 0.7 }, { label: 'Suave o terrazas', score: 1.0 }] },
  { id: 15, texto: '¿Nivel de protección del suelo frente a lluvias intensas?', componente: 'E',
    opciones: [{ label: 'Descubierto', score: 0.0 }, { label: 'Cobertura ocasional', score: 0.4 }, { label: 'Parcial permanente', score: 0.7 }, { label: 'Continua planificada', score: 1.0 }] },
  { id: 16, texto: '¿Implementa prácticas para mantener materia orgánica?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: 'Esporádicas', score: 0.4 }, { label: 'Regulares', score: 0.7 }, { label: 'Sistemáticas', score: 1.0 }] },
  { id: 17, texto: '¿Ha notado mayor variabilidad climática en últimos años?', componente: 'C',
    opciones: [{ label: 'No', score: 1.0 }, { label: 'Leve', score: 0.7 }, { label: 'Moderada', score: 0.4 }, { label: 'Alta e impredecible', score: 0.0 }] },
  { id: 18, texto: '¿Ajusta fechas de siembra/poda/fertilización según clima?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: 'Ajustes reactivos', score: 0.4 }, { label: 'Planificados básicos', score: 0.7 }, { label: 'Técnicos sistemáticos', score: 1.0 }] },
  { id: 19, texto: '¿Qué tan diversa es la estructura del cafetal?', componente: 'E',
    opciones: [{ label: 'Muy homogénea', score: 0.0 }, { label: 'Algo diversa', score: 0.4 }, { label: 'Moderada', score: 0.7 }, { label: 'Alta diversidad', score: 1.0 }] },
  { id: 20, texto: '¿Experimenta temperaturas extremas que afectan el café?', componente: 'C',
    opciones: [{ label: 'Nunca', score: 1.0 }, { label: 'Ocasionalmente', score: 0.7 }, { label: 'Frecuentemente', score: 0.4 }, { label: 'Constantemente', score: 0.0 }] },
];

// ── BLOQUE II: Estructura Productiva y Agronómica (P21–P40) ──
const bloqueII: VitalQuestion[] = [
  { id: 21, texto: '¿Se aplican prácticas para reducir estrés térmico?', componente: 'R',
    opciones: [{ label: 'Ninguna', score: 0.0 }, { label: 'Aisladas', score: 0.4 }, { label: 'Integradas', score: 0.7 }, { label: 'Estrategia permanente', score: 1.0 }] },
  { id: 22, texto: '¿Las enfermedades han aumentado con cambios climáticos?', componente: 'E',
    opciones: [{ label: 'No', score: 1.0 }, { label: 'Aumento leve', score: 0.7 }, { label: 'Significativo', score: 0.4 }, { label: 'Severo', score: 0.0 }] },
  { id: 23, texto: '¿Qué tan rápido responde ante brotes de enfermedades?', componente: 'R',
    opciones: [{ label: 'No responde', score: 0.0 }, { label: 'Tardía', score: 0.4 }, { label: 'Oportuna', score: 0.7 }, { label: 'Preventiva', score: 1.0 }] },
  { id: 24, texto: '¿Plan de renovación progresiva del café?', componente: 'R',
    opciones: [{ label: 'No existe', score: 0.0 }, { label: 'Ocasional', score: 0.4 }, { label: 'Parcial planificada', score: 0.7 }, { label: 'Técnica continua', score: 1.0 }] },
  { id: 25, texto: '¿% del ingreso familiar que depende del café?', componente: 'E',
    opciones: [{ label: '>90%', score: 0.0 }, { label: '70-90%', score: 0.4 }, { label: '40-70%', score: 0.7 }, { label: '<40%', score: 1.0 }] },
  { id: 26, texto: '¿Cuántos cultivos comerciales además del café?', componente: 'R',
    opciones: [{ label: 'Ninguno', score: 0.0 }, { label: '1', score: 0.4 }, { label: '2+ complementarios', score: 0.7 }, { label: 'Sistema agroforestal diversificado', score: 1.0 }] },
  { id: 27, texto: '¿Frecuencia de acompañamiento técnico climático?', componente: 'R',
    opciones: [{ label: 'Nunca', score: 0.0 }, { label: '1/año o menos', score: 0.3 }, { label: 'Varias veces/año', score: 0.6 }, { label: 'Continuo', score: 1.0 }] },
  { id: 28, texto: '¿Registra información climática (lluvias, temperaturas)?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: 'A veces', score: 0.4 }, { label: 'Regular en cuaderno', score: 0.7 }, { label: 'Digital/técnico', score: 1.0 }] },
  { id: 29, texto: '¿Existen sistemas locales de aviso ante eventos climáticos?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: 'Existen no se usan', score: 0.4 }, { label: 'Usados ocasionalmente', score: 0.7 }, { label: 'Usados y confiables', score: 1.0 }] },
  { id: 30, texto: '¿Afectación por heladas en últimos 5 años?', componente: 'C',
    opciones: [{ label: 'Nunca', score: 1.0 }, { label: 'Una vez leve', score: 0.7 }, { label: 'Varias con daños', score: 0.4 }, { label: 'Cada año pérdidas', score: 0.0 }] },
  { id: 31, texto: '¿Las variedades de café son tolerantes al clima?', componente: 'R',
    opciones: [{ label: 'No sé', score: 0.2 }, { label: 'No tolerantes', score: 0.4 }, { label: 'Tolerancia media', score: 0.7 }, { label: 'Alta tolerancia', score: 1.0 }] },
  { id: 32, texto: '¿Ha renovado parte del cafetal en últimos 5 años?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: '<10%', score: 0.4 }, { label: '10-30%', score: 0.7 }, { label: '>30% planificada', score: 1.0 }] },
  { id: 33, texto: '¿Accesibilidad de la finca durante lluvias fuertes?', componente: 'C',
    opciones: [{ label: 'Siempre accesible', score: 1.0 }, { label: 'Dificultad moderada', score: 0.6 }, { label: 'Cierre temporal', score: 0.3 }, { label: 'Inaccesible', score: 0.0 }] },
  { id: 34, texto: '¿Daños por vientos extremos?', componente: 'C',
    opciones: [{ label: 'No', score: 1.0 }, { label: 'Leves', score: 0.7 }, { label: 'Estructurales', score: 0.4 }, { label: 'Recurrentes', score: 0.0 }] },
  { id: 35, texto: '¿Acciones frente a vientos extremos?', componente: 'R',
    opciones: [{ label: 'Ninguna', score: 0.0 }, { label: 'Podas improvisadas', score: 0.4 }, { label: 'Protección estratégica', score: 0.7 }, { label: 'Infraestructura planificada', score: 1.0 }] },
  { id: 36, texto: '¿Mantiene cobertura viva entre cafetos todo el año?', componente: 'E',
    opciones: [{ label: 'No', score: 0.0 }, { label: 'Parcial estacional', score: 0.4 }, { label: 'Permanente parcial', score: 0.7 }, { label: 'Completa planificada', score: 1.0 }] },
  { id: 37, texto: '¿Acceso a financiamiento para prácticas adaptativas?', componente: 'R',
    opciones: [{ label: 'No tiene', score: 0.0 }, { label: 'Muy limitado', score: 0.3 }, { label: 'Ha solicitado/recibido', score: 0.6 }, { label: 'Acceso activo', score: 1.0 }] },
  { id: 38, texto: '¿Capacidad de almacenar cosecha ante eventos climáticos?', componente: 'R',
    opciones: [{ label: 'No tiene', score: 0.0 }, { label: 'Por días', score: 0.4 }, { label: 'Por semanas', score: 0.7 }, { label: 'Sistema completo', score: 1.0 }] },
  { id: 39, texto: '¿Deslizamientos dentro o cerca de la finca?', componente: 'C',
    opciones: [{ label: 'Nunca', score: 1.0 }, { label: 'A <100m', score: 0.7 }, { label: 'En límite', score: 0.4 }, { label: 'Dentro de la finca', score: 0.0 }] },
  { id: 40, texto: '¿Toma decisiones productivas según clima observado/previsto?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: 'Reactivas', score: 0.4 }, { label: 'Planificadas', score: 0.7 }, { label: 'Técnicas sistemáticas', score: 1.0 }] },
];

// ── BLOQUE III: Sanidad Vegetal y Prácticas Regenerativas (P41–P60) ──
const bloqueIII: VitalQuestion[] = [
  { id: 41, texto: '¿Grado de pendiente y manejo?', componente: 'C',
    opciones: [{ label: '>30% sin manejo', score: 0.0 }, { label: '15-30% con barreras', score: 0.4 }, { label: '8-15% con terrazas', score: 0.7 }, { label: '<8% con cobertura', score: 1.0 }] },
  { id: 42, texto: '¿Eventos climáticos extremos en últimos 3 años?', componente: 'C',
    opciones: [{ label: 'Ninguno', score: 1.0 }, { label: '1', score: 0.7 }, { label: '2', score: 0.4 }, { label: '3+', score: 0.0 }] },
  { id: 43, texto: '¿Tipo de sombra predominante?', componente: 'E',
    opciones: [{ label: 'No tiene', score: 0.0 }, { label: 'No gestionada', score: 0.3 }, { label: 'Mixta sin plan', score: 0.6 }, { label: 'Planificada multiespecie', score: 1.0 }] },
  { id: 44, texto: '¿Consistencia del rendimiento últimos 5 años?', componente: 'E',
    opciones: [{ label: 'Disminuyeron todos', score: 0.0 }, { label: 'Disminuyeron 3+ años', score: 0.4 }, { label: 'Fluctuaron', score: 0.7 }, { label: 'Se mantuvieron/crecieron', score: 1.0 }] },
  { id: 45, texto: '¿Tipo de fertilización?', componente: 'R',
    opciones: [{ label: 'No fertiliza', score: 0.0 }, { label: 'Solo química', score: 0.4 }, { label: 'Combinación orgánica/química', score: 0.7 }, { label: 'Plan nutricional adaptado', score: 1.0 }] },
  { id: 46, texto: '¿Acceso a agua de riego?', componente: 'R',
    opciones: [{ label: 'No tiene', score: 0.0 }, { label: 'Estacional inseguro', score: 0.4 }, { label: 'Parcial compartido', score: 0.7 }, { label: 'Permanente individual', score: 1.0 }] },
  { id: 47, texto: '¿Capacitación en cambio climático últimos 2 años?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: '1 taller general', score: 0.4 }, { label: 'Varias', score: 0.7 }, { label: 'Formación continua', score: 1.0 }] },
  { id: 48, texto: '¿Diversificación de fuentes de ingreso?', componente: 'R',
    opciones: [{ label: 'Ninguna, solo café', score: 0.0 }, { label: '1 fuente secundaria', score: 0.4 }, { label: '2-3 fuentes', score: 0.7 }, { label: '>3 fuentes', score: 1.0 }] },
  { id: 49, texto: '¿Estrategia ante plagas climáticamente sensibles?', componente: 'R',
    opciones: [{ label: 'Ninguna', score: 0.0 }, { label: 'Reactiva', score: 0.4 }, { label: 'Preventiva', score: 0.7 }, { label: 'MIP integrado', score: 1.0 }] },
  { id: 50, texto: '¿Manejo de residuos orgánicos?', componente: 'E',
    opciones: [{ label: 'Quema', score: 0.0 }, { label: 'Sin tratamiento', score: 0.3 }, { label: 'Parcialmente como abono', score: 0.6 }, { label: 'Integralmente como insumo', score: 1.0 }] },
  { id: 51, texto: '¿Frecuencia de granizo o lluvias torrenciales?', componente: 'C',
    opciones: [{ label: 'Nunca', score: 1.0 }, { label: '1 vez', score: 0.7 }, { label: '2 veces', score: 0.4 }, { label: '3+', score: 0.0 }] },
  { id: 52, texto: '¿Prácticas de conservación de humedad?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: 'Una ocasional', score: 0.4 }, { label: 'Dos integradas', score: 0.7 }, { label: 'Manejo completo', score: 1.0 }] },
  { id: 53, texto: '¿Puede comercializar café en emergencia climática?', componente: 'R',
    opciones: [{ label: 'No tiene alternativa', score: 0.0 }, { label: 'Ruta informal', score: 0.4 }, { label: '1 comprador alterno', score: 0.7 }, { label: 'Acuerdos múltiples', score: 1.0 }] },
  { id: 54, texto: '¿Microcuencas degradadas cerca?', componente: 'C',
    opciones: [{ label: 'No', score: 1.0 }, { label: 'Lejos', score: 0.7 }, { label: 'Cercanas', score: 0.4 }, { label: 'Dentro de la finca', score: 0.0 }] },
  { id: 55, texto: '¿Usa pronósticos climáticos para planificar?', componente: 'R',
    opciones: [{ label: 'No los conoce', score: 0.0 }, { label: 'Conoce pero no aplica', score: 0.4 }, { label: 'Aplica parcialmente', score: 0.7 }, { label: 'Insumo regular', score: 1.0 }] },
  { id: 56, texto: '¿Tiene registros de cuánto afectó el clima a la cosecha?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: 'Estimaciones', score: 0.4 }, { label: 'Registro parcial', score: 0.7 }, { label: 'Registro digital', score: 1.0 }] },
  { id: 57, texto: '¿Tipo de secado del café?', componente: 'E',
    opciones: [{ label: 'Cielo abierto sin protección', score: 0.0 }, { label: 'Con plástico', score: 0.4 }, { label: 'Cama solar', score: 0.7 }, { label: 'Secado técnico', score: 1.0 }] },
  { id: 58, texto: '¿Ha perdido floración por sequías en últimos 3 años?', componente: 'C',
    opciones: [{ label: 'No', score: 1.0 }, { label: 'Leve 1 año', score: 0.7 }, { label: 'Moderada 2 años', score: 0.4 }, { label: 'Severa cada año', score: 0.0 }] },
  { id: 59, texto: '¿Densidad de siembra?', componente: 'E',
    opciones: [{ label: '>6000 plantas/ha', score: 0.0 }, { label: '5000-6000', score: 0.4 }, { label: '3500-5000', score: 0.7 }, { label: '<3500 planificada', score: 1.0 }] },
  { id: 60, texto: '¿Acceso a semillas/plantas adaptadas?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: 'Limitado', score: 0.4 }, { label: 'Parcial', score: 0.7 }, { label: 'Vivero propio o acceso garantizado', score: 1.0 }] },
];

// ── BLOQUE IV: Economía, Equidad Social y Capital Humano (P61–P80) ──
const bloqueIV: VitalQuestion[] = [
  { id: 61, texto: '¿Infraestructura para evitar deslizamientos/erosión?', componente: 'R',
    opciones: [{ label: 'No tiene', score: 0.0 }, { label: 'Algunas mal mantenidas', score: 0.4 }, { label: 'Varias funcionales', score: 0.7 }, { label: 'Planificada y mantenida', score: 1.0 }] },
  { id: 62, texto: '¿Prácticas para reducir escorrentía superficial?', componente: 'E',
    opciones: [{ label: 'No aplica', score: 0.0 }, { label: 'Zanjeo/mulch parcial', score: 0.4 }, { label: 'Varios métodos combinados', score: 0.7 }, { label: 'Manejo integral', score: 1.0 }] },
  { id: 63, texto: '¿Distancia al cuerpo de agua más cercano?', componente: 'C',
    opciones: [{ label: 'Zona de inundación', score: 0.0 }, { label: '<100m sin barreras', score: 0.4 }, { label: '100-500m', score: 0.7 }, { label: '>500m protegido', score: 1.0 }] },
  { id: 64, texto: '¿Usa herramientas digitales para decisiones?', componente: 'R',
    opciones: [{ label: 'No usa', score: 0.0 }, { label: 'Redes sociales/WhatsApp', score: 0.4 }, { label: 'Apps básicas clima', score: 0.7 }, { label: 'Herramientas técnicas con datos', score: 1.0 }] },
  { id: 65, texto: '¿Estado del bosque alrededor de la finca?', componente: 'C',
    opciones: [{ label: 'Totalmente deforestado', score: 0.0 }, { label: 'Fragmentado', score: 0.4 }, { label: 'Parcialmente conservado', score: 0.7 }, { label: 'Bosque denso', score: 1.0 }] },
  { id: 66, texto: '¿Pérdida de floración por calor excesivo?', componente: 'C',
    opciones: [{ label: 'Recurrente', score: 0.0 }, { label: 'Algunos años', score: 0.4 }, { label: 'Esporádico', score: 0.7 }, { label: 'No afectado', score: 1.0 }] },
  { id: 67, texto: '¿Sistema de drenaje funcional?', componente: 'R',
    opciones: [{ label: 'No tiene', score: 0.0 }, { label: 'Informal/parcial', score: 0.4 }, { label: 'Estructurado limitado', score: 0.7 }, { label: 'Completo operativo', score: 1.0 }] },
  { id: 68, texto: '¿Seguro agrícola o climático?', componente: 'R',
    opciones: [{ label: 'No tiene acceso', score: 0.0 }, { label: 'Conoce pero no accede', score: 0.3 }, { label: 'Ha accedido', score: 0.6 }, { label: 'Tiene activo', score: 1.0 }] },
  { id: 69, texto: '¿Se organiza con vecinos ante emergencias climáticas?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: 'Informalmente', score: 0.4 }, { label: 'Brigadas', score: 0.7 }, { label: 'Redes organizadas', score: 1.0 }] },
  { id: 70, texto: '¿Semillas de relevo o reserva?', componente: 'R',
    opciones: [{ label: 'No tiene', score: 0.0 }, { label: 'No adaptadas', score: 0.4 }, { label: 'Algunas adaptadas', score: 0.7 }, { label: 'Banco/vivero propio', score: 1.0 }] },
  { id: 71, texto: '¿Daños a accesos por eventos climáticos?', componente: 'C',
    opciones: [{ label: 'Cada año', score: 0.0 }, { label: 'Frecuentemente', score: 0.4 }, { label: 'Rara vez', score: 0.7 }, { label: 'Nunca', score: 1.0 }] },
  { id: 72, texto: '¿Mantener fertilidad sin insumos externos?', componente: 'R',
    opciones: [{ label: 'Depende completamente', score: 0.0 }, { label: 'Compost/abonos', score: 0.4 }, { label: 'Prácticas locales', score: 0.7 }, { label: 'Sistema cerrado', score: 1.0 }] },
  { id: 73, texto: '¿Percepción del cambio climático?', componente: 'E',
    opciones: [{ label: 'No cree que exista', score: 0.0 }, { label: 'Cambios menores', score: 0.3 }, { label: 'Impactos moderados', score: 0.6 }, { label: 'Severos y actúa', score: 1.0 }] },
  { id: 74, texto: '¿Prácticas para reducir estrés hídrico?', componente: 'R',
    opciones: [{ label: 'Nada', score: 0.0 }, { label: 'Riego ocasional', score: 0.4 }, { label: 'Mulch/barreras', score: 0.7 }, { label: 'Estrategia integral', score: 1.0 }] },
  { id: 75, texto: '¿Seguimiento técnico de cambios climáticos?', componente: 'R',
    opciones: [{ label: 'Nunca', score: 0.0 }, { label: 'Cuando hay daño', score: 0.4 }, { label: 'Revisión mensual', score: 0.7 }, { label: 'Seguimiento periódico', score: 1.0 }] },
  { id: 76, texto: '¿Tiempo de espera para asistencia tras emergencia?', componente: 'R',
    opciones: [{ label: 'No recibe', score: 0.0 }, { label: '>2 semanas', score: 0.4 }, { label: '3-7 días', score: 0.7 }, { label: '<48h', score: 1.0 }] },
  { id: 77, texto: '¿Participa en cooperativa o red de resiliencia?', componente: 'R',
    opciones: [{ label: 'No participa', score: 0.0 }, { label: 'Mínima', score: 0.4 }, { label: 'Activa', score: 0.7 }, { label: 'Lidera iniciativas', score: 1.0 }] },
  { id: 78, texto: '¿Impacto económico directo por clima último año?', componente: 'E',
    opciones: [{ label: '>30% ingreso', score: 0.0 }, { label: '15-30%', score: 0.4 }, { label: '<15%', score: 0.7 }, { label: 'Ninguno', score: 1.0 }] },
  { id: 79, texto: '¿Ajusta prácticas según altitud y microclima?', componente: 'R',
    opciones: [{ label: 'No sabe altitud', score: 0.0 }, { label: 'Conoce no adapta', score: 0.4 }, { label: 'Ajusta parcialmente', score: 0.7 }, { label: 'Estrategia por zona', score: 1.0 }] },
  { id: 80, texto: '¿Quiénes participan en decisiones adaptativas?', componente: 'R',
    opciones: [{ label: 'Solo el productor', score: 0.0 }, { label: '1-2 consultados', score: 0.4 }, { label: 'Toda la familia', score: 0.7 }, { label: 'Decisiones colectivas planificadas', score: 1.0 }] },
];

// ── BLOQUE V: Institucionalidad, Digitalización y Cumplimiento (P81–P100) ──
const bloqueV: VitalQuestion[] = [
  { id: 81, texto: '¿Control del escarabajo en época de lluvia?', componente: 'R',
    opciones: [{ label: 'Nada', score: 0.0 }, { label: 'Químico reactivo', score: 0.4 }, { label: 'Preventivo', score: 0.7 }, { label: 'MIP con monitoreo', score: 1.0 }] },
  { id: 82, texto: '¿Floraciones fuera de temporada últimos 2 años?', componente: 'C',
    opciones: [{ label: 'Sí varias veces', score: 0.0 }, { label: 'Ocasionalmente', score: 0.4 }, { label: 'Raramente', score: 0.7 }, { label: 'Nunca', score: 1.0 }] },
  { id: 83, texto: '¿Asistido a talleres sobre clima y café?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: '1 taller', score: 0.4 }, { label: 'Varios', score: 0.7 }, { label: 'Formación continua', score: 1.0 }] },
  { id: 84, texto: '¿Mujeres participan en decisiones agronómicas?', componente: 'R',
    opciones: [{ label: 'No participan', score: 0.0 }, { label: 'Actividades específicas', score: 0.4 }, { label: 'Forma general', score: 0.7 }, { label: 'Activamente en decisiones climáticas', score: 1.0 }] },
  { id: 85, texto: '¿Zanjas de infiltración?', componente: 'E',
    opciones: [{ label: 'No utiliza', score: 0.0 }, { label: 'Algunas aisladas', score: 0.4 }, { label: 'Red parcial', score: 0.7 }, { label: 'Red planificada toda la finca', score: 1.0 }] },
  { id: 86, texto: '¿Almacenamiento de agua de lluvia?', componente: 'R',
    opciones: [{ label: 'No tiene', score: 0.0 }, { label: 'Canaletas sin tanque', score: 0.3 }, { label: 'Tanques pequeños', score: 0.6 }, { label: 'Sistema funcional', score: 1.0 }] },
  { id: 87, texto: '¿Cambio en patrones de lluvia últimos 5 años?', componente: 'C',
    opciones: [{ label: 'Cambios drásticos', score: 0.0 }, { label: 'Moderados', score: 0.4 }, { label: 'Leves', score: 0.7 }, { label: 'Sin cambios', score: 1.0 }] },
  { id: 88, texto: '¿Podas considerando factores climáticos?', componente: 'R',
    opciones: [{ label: 'No realiza', score: 0.0 }, { label: 'Sin criterio climático', score: 0.4 }, { label: 'Estratégica base climática', score: 0.7 }, { label: 'Plan adaptativo definido', score: 1.0 }] },
  { id: 89, texto: '¿Tipo de árboles como sombra?', componente: 'E',
    opciones: [{ label: 'No hay sombra', score: 0.0 }, { label: 'Homogénea', score: 0.4 }, { label: 'Mezcla básica', score: 0.7 }, { label: 'Diversidad alta múltiples beneficios', score: 1.0 }] },
  { id: 90, texto: '¿Aumento de plagas vinculado a variaciones climáticas?', componente: 'C',
    opciones: [{ label: 'Sí significativo', score: 0.0 }, { label: 'Leve', score: 0.4 }, { label: 'No ha variado', score: 0.7 }, { label: 'Disminución', score: 1.0 }] },
  { id: 91, texto: '¿Acceso a mercados que premian prácticas resilientes?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: 'Potencial', score: 0.4 }, { label: 'Acceso parcial', score: 0.7 }, { label: 'Acceso activo con primas', score: 1.0 }] },
  { id: 92, texto: '¿Estabilidad de producción últimos 3 años?', componente: 'E',
    opciones: [{ label: 'Muy variable', score: 0.0 }, { label: 'Algunas caídas', score: 0.4 }, { label: 'Estable', score: 0.7 }, { label: 'Aumentó', score: 1.0 }] },
  { id: 93, texto: '¿Usa material orgánico para mejorar suelo?', componente: 'E',
    opciones: [{ label: 'No aplica', score: 0.0 }, { label: 'Uno', score: 0.4 }, { label: '2 técnicas', score: 0.7 }, { label: '3+', score: 1.0 }] },
  { id: 94, texto: '¿Pérdidas económicas por lluvias extremas últimos 2 años?', componente: 'E',
    opciones: [{ label: '>30%', score: 0.0 }, { label: '15-30%', score: 0.4 }, { label: '5-15%', score: 0.7 }, { label: '<5%', score: 1.0 }] },
  { id: 95, texto: '¿Ha sido parte de ensayos de innovación climática?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: 'Una vez', score: 0.4 }, { label: 'Varias veces', score: 0.7 }, { label: 'Participa activamente', score: 1.0 }] },
  { id: 96, texto: '¿Control natural de plagas y enfermedades?', componente: 'E',
    opciones: [{ label: 'No aplica', score: 0.0 }, { label: 'Mínima', score: 0.4 }, { label: 'Intermedio', score: 0.7 }, { label: 'Agroecológico completo', score: 1.0 }] },
  { id: 97, texto: '¿Ajusta calendario agrícola según clima?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: 'Parcial por experiencia', score: 0.4 }, { label: 'Por alertas/asistencia', score: 0.7 }, { label: 'Estratégico planificado', score: 1.0 }] },
  { id: 98, texto: '¿Afectado por enfermedades emergentes (ojo de gallo, etc.)?', componente: 'C',
    opciones: [{ label: 'Alta recurrencia', score: 0.0 }, { label: 'Ocasionales', score: 0.4 }, { label: 'Leves', score: 0.7 }, { label: 'No afectado', score: 1.0 }] },
  { id: 99, texto: '¿Personal capacitado en protocolos climáticos?', componente: 'R',
    opciones: [{ label: 'No', score: 0.0 }, { label: 'Solo personal sin formación', score: 0.4 }, { label: 'Algunos capacitados', score: 0.7 }, { label: 'Personal clave capacitado', score: 1.0 }] },
  { id: 100, texto: '¿Registro fotográfico de eventos climáticos?', componente: 'R',
    opciones: [{ label: 'No tiene', score: 0.0 }, { label: 'Informal', score: 0.4 }, { label: 'Parcial organizado', score: 0.7 }, { label: 'Digital sistemático', score: 1.0 }] },
];

// ── Bloques exportados ──
export const VITAL_BLOCKS: VitalBlock[] = [
  { id: 'bloque_1', nombre: 'Clima y Recursos Hídricos', rango: 'P1–P20', preguntas: bloqueI },
  { id: 'bloque_2', nombre: 'Estructura Productiva', rango: 'P21–P40', preguntas: bloqueII },
  { id: 'bloque_3', nombre: 'Sanidad y Regeneración', rango: 'P41–P60', preguntas: bloqueIII },
  { id: 'bloque_4', nombre: 'Economía y Capital Humano', rango: 'P61–P80', preguntas: bloqueIV },
  { id: 'bloque_5', nombre: 'Institucionalidad y Digital', rango: 'P81–P100', preguntas: bloqueV },
];

export const TOTAL_QUESTIONS = VITAL_BLOCKS.reduce((s, b) => s + b.preguntas.length, 0);

// ── IGRN Scoring ──

export interface IGRNResult {
  /** 0-100 */
  igrn: number;
  /** Average of C questions (0-1) */
  muClima: number;
  /** Average of E questions (0-1) */
  muEstructura: number;
  /** Average of R questions (0-1) */
  muRespuesta: number;
  /** Whether false resilience is detected */
  falsaResiliencia: boolean;
  /** Nivel text */
  nivel: 'Crítica' | 'Alta Fragilidad' | 'Moderada' | 'Resiliente';
  /** Color key */
  color: 'destructive' | 'accent' | 'warning' | 'primary';
}

/**
 * Calculate IGRN from answers map.
 * answers: Record<questionId, selectedScore (0-1)>
 */
export function calculateIGRN(answers: Record<number, number>): IGRNResult {
  const allQuestions = VITAL_BLOCKS.flatMap(b => b.preguntas);
  
  const getAvg = (comp: VitalComponent): number => {
    const qs = allQuestions.filter(q => q.componente === comp && answers[q.id] !== undefined);
    if (qs.length === 0) return 0;
    return qs.reduce((s, q) => s + (answers[q.id] ?? 0), 0) / qs.length;
  };

  const muClima = getAvg('C');
  const muEstructura = getAvg('E');
  const muRespuesta = getAvg('R');

  const igrn = Math.round(((0.35 * muClima) + (0.30 * muEstructura) + (0.35 * muRespuesta)) * 100);

  const max = Math.max(muClima, muEstructura, muRespuesta);
  const min = Math.min(muClima, muEstructura, muRespuesta);
  const falsaResiliencia = (max - min) >= 0.4;

  let nivel: IGRNResult['nivel'];
  let color: IGRNResult['color'];
  if (igrn <= 40) { nivel = 'Crítica'; color = 'destructive'; }
  else if (igrn <= 60) { nivel = 'Alta Fragilidad'; color = 'accent'; }
  else if (igrn <= 80) { nivel = 'Moderada'; color = 'warning'; }
  else { nivel = 'Resiliente'; color = 'primary'; }

  return { igrn, muClima, muEstructura, muRespuesta, falsaResiliencia, nivel, color };
}

/** Nivel labels and colors for display */
export const IGRN_RANGES = [
  { min: 0, max: 40, label: 'Crítica', description: 'Colapso inminente. Requiere intervención de emergencia.', color: 'destructive' },
  { min: 41, max: 60, label: 'Alta Fragilidad', description: 'Finca sobrevive por inercia. Prioridad: infraestructura básica y renovación.', color: 'accent' },
  { min: 61, max: 80, label: 'Moderada', description: 'Bases sólidas con brechas específicas. Prioridad: tecnificación y mercados.', color: 'warning' },
  { min: 81, max: 100, label: 'Resiliente', description: 'Finca modelo con capacidad de absorción. Prioridad: innovación y liderazgo.', color: 'primary' },
] as const;
