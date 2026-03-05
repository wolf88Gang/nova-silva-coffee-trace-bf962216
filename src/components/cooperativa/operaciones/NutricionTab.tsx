import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Sprout, Droplets, Leaf, AlertTriangle, CheckCircle, HelpCircle,
  FlaskConical, FileText, Zap, DollarSign, Calendar, Shield,
  ChevronDown, Beaker, Gauge, Upload, FileUp, Loader2, ArrowRight,
} from 'lucide-react';

// ── Rangos Óptimos (Fase 1 §31-44) ──

const RANGOS_SUELO = {
  ph:       { bajo: 5.0, optMin: 5.3, optMax: 5.8, alto: 6.5, unidad: '', label: 'pH' },
  mo_pct:   { bajo: 3, optMin: 3, optMax: 6, alto: 6, unidad: '%', label: 'MO' },
  p_ppm:    { bajo: 10, optMin: 20, optMax: 30, alto: 40, unidad: 'ppm', label: 'P (Bray II)' },
  k_cmol:   { bajo: 0.3, optMin: 0.5, optMax: 0.8, alto: 1.0, unidad: 'cmol/kg', label: 'K' },
  ca_cmol:  { bajo: 3.0, optMin: 4.0, optMax: 8.0, alto: 10.0, unidad: 'cmol/kg', label: 'Ca' },
  mg_cmol:  { bajo: 0.8, optMin: 1.0, optMax: 2.5, alto: 3.5, unidad: 'cmol/kg', label: 'Mg' },
  al_cmol:  { bajo: 0, optMin: 0, optMax: 0.5, alto: 1.0, unidad: 'cmol/kg', label: 'Al' },
  s_ppm:    { bajo: 10, optMin: 12, optMax: 25, alto: 30, unidad: 'ppm', label: 'S' },
  fe_ppm:   { bajo: 10, optMin: 20, optMax: 100, alto: 150, unidad: 'ppm', label: 'Fe' },
  mn_ppm:   { bajo: 5, optMin: 10, optMax: 50, alto: 100, unidad: 'ppm', label: 'Mn' },
  cu_ppm:   { bajo: 0.5, optMin: 1, optMax: 5, alto: 10, unidad: 'ppm', label: 'Cu' },
  zn_ppm:   { bajo: 1.5, optMin: 3, optMax: 8, alto: 15, unidad: 'ppm', label: 'Zn' },
  b_ppm:    { bajo: 0.3, optMin: 0.5, optMax: 1.5, alto: 2.0, unidad: 'ppm', label: 'B' },
  cice:     { bajo: 10, optMin: 10, optMax: 20, alto: 25, unidad: 'cmol/kg', label: 'CICE' },
  sat_bases_pct: { bajo: 40, optMin: 50, optMax: 70, alto: 80, unidad: '%', label: 'Sat. Bases' },
};

const RANGOS_FOLIAR = {
  n_pct:  { bajo: 2.3, optMin: 2.5, optMax: 3.0, alto: 3.5, unidad: '%', label: 'N' },
  p_pct:  { bajo: 0.12, optMin: 0.16, optMax: 0.22, alto: 0.30, unidad: '%', label: 'P' },
  k_pct:  { bajo: 1.8, optMin: 2.3, optMax: 2.8, alto: 3.2, unidad: '%', label: 'K' },
  ca_pct: { bajo: 0.8, optMin: 1.0, optMax: 1.5, alto: 2.0, unidad: '%', label: 'Ca' },
  mg_pct: { bajo: 0.25, optMin: 0.30, optMax: 0.45, alto: 0.55, unidad: '%', label: 'Mg' },
  s_pct:  { bajo: 0.12, optMin: 0.15, optMax: 0.25, alto: 0.30, unidad: '%', label: 'S' },
  fe_ppm: { bajo: 50, optMin: 70, optMax: 200, alto: 300, unidad: 'ppm', label: 'Fe' },
  mn_ppm: { bajo: 30, optMin: 50, optMax: 200, alto: 300, unidad: 'ppm', label: 'Mn' },
  cu_ppm: { bajo: 5, optMin: 8, optMax: 20, alto: 30, unidad: 'ppm', label: 'Cu' },
  zn_ppm: { bajo: 10, optMin: 15, optMax: 40, alto: 60, unidad: 'ppm', label: 'Zn' },
  b_ppm:  { bajo: 25, optMin: 40, optMax: 80, alto: 100, unidad: 'ppm', label: 'B' },
};

// ── Structured Interpretation Type ──

interface InterpretacionEstructurada {
  resumen: string;
  hallazgos: Array<{ emoji: string; texto: string; nivel: 'ok' | 'warning' | 'critical' }>;
  queHacer: string[];
  notaTecnica?: string;
}

// ── Demo Data with structured interpretations ──

const DEMO_PARCELAS_ESTADO = [
  {
    parcela_id: 'p1', parcela_nombre: 'Finca La Esperanza — Lote 1', variedad: 'Castillo (60%) + Caturra (40%)',
    altitud_msnm: 1450, densidad_plantas_ha: 5200, sombra_pct: 45, pendiente_pct: 18, edad_anios: 4,
    suelo: { ph: 5.1, mo_pct: 4.8, p_ppm: 12, k_cmol: 0.35, ca_cmol: 4.2, mg_cmol: 1.1, al_cmol: 0.3, s_ppm: 14, fe_ppm: 85, mn_ppm: 42, cu_ppm: 2.1, zn_ppm: 3.8, b_ppm: 0.6, cice: 12.4, sat_bases_pct: 58, textura: 'Franco-arcilloso', fecha: '2026-01-15' },
    foliar: { n_pct: 2.8, p_pct: 0.15, k_pct: 2.1, ca_pct: 1.0, mg_pct: 0.32, s_pct: 0.18, fe_ppm: 120, mn_ppm: 85, cu_ppm: 12, zn_ppm: 18, b_ppm: 45, fecha: '2026-01-20' },
    interpretacion: {
      resumen: 'Su finca está en buen estado general. Hay un nutriente que necesita atención: el fósforo.',
      hallazgos: [
        { emoji: '✅', texto: 'El suelo tiene buen pH (5.1) y buena materia orgánica (4.8%). Las plantas pueden alimentarse bien.', nivel: 'ok' },
        { emoji: '⚠️', texto: 'Fósforo bajo (12 ppm). La planta lo necesita para florecer bien y cuajar los frutos. El análisis de hoja confirma que le falta (0.15%).', nivel: 'warning' },
        { emoji: '✅', texto: 'La relación entre Calcio y Magnesio es buena (3.8:1). Esto favorece el desarrollo de la raíz.', nivel: 'ok' },
        { emoji: '✅', texto: 'El aluminio está en nivel seguro (0.3). No hay riesgo de toxicidad para las raíces.', nivel: 'ok' },
        { emoji: '✅', texto: 'Todos los micronutrientes (Zinc, Boro, Cobre, etc.) están en rango normal.', nivel: 'ok' },
      ],
      queHacer: [
        'Aplicar fósforo al suelo (DAP o roca fosfórica) al inicio de las lluvias.',
        'El potasio en la hoja está un poco justo (2.1%). Vigílelo en la próxima fertilización.',
        'Mantenga su plan actual de abonamiento para los demás nutrientes.',
      ],
      notaTecnica: 'CICE 12.4 cmol/kg, Sat. Bases 58%. Suelo con retención moderada. Ca/Mg 3.8:1 ideal.',
    } as InterpretacionEstructurada,
  },
  {
    parcela_id: 'p2', parcela_nombre: 'Finca El Roble — Lote Central', variedad: 'Caturra (80%) + Bourbon (20%)',
    altitud_msnm: 1320, densidad_plantas_ha: 4800, sombra_pct: 60, pendiente_pct: 25, edad_anios: 6,
    suelo: { ph: 4.6, mo_pct: 2.9, p_ppm: 6, k_cmol: 0.18, ca_cmol: 2.5, mg_cmol: 0.7, al_cmol: 1.8, s_ppm: 8, fe_ppm: 145, mn_ppm: 68, cu_ppm: 1.2, zn_ppm: 1.4, b_ppm: 0.2, cice: 8.2, sat_bases_pct: 32, textura: 'Franco', fecha: '2025-11-08' },
    foliar: { n_pct: 2.2, p_pct: 0.11, k_pct: 1.6, ca_pct: 0.7, mg_pct: 0.22, s_pct: 0.11, fe_ppm: 92, mn_ppm: 55, cu_ppm: 6, zn_ppm: 9, b_ppm: 28, fecha: '2025-11-15' },
    interpretacion: {
      resumen: '⛔ Esta parcela necesita atención urgente. El suelo es muy ácido y hay aluminio tóxico que impide que las raíces absorban los nutrientes.',
      hallazgos: [
        { emoji: '🔴', texto: 'Aluminio tóxico muy alto (1.8). Esto "envenena" las raíces — la planta no puede comer aunque le ponga abono.', nivel: 'critical' },
        { emoji: '🔴', texto: 'Suelo muy ácido (pH 4.6). Si fertiliza sin corregir esto primero, va a desperdiciar más del 60% del abono.', nivel: 'critical' },
        { emoji: '🔴', texto: 'Materia orgánica insuficiente (2.9%). El suelo tiene poca "vida" para alimentar las plantas.', nivel: 'critical' },
        { emoji: '⚠️', texto: 'Fósforo, Potasio, Zinc y Boro están todos muy bajos. La hoja lo confirma: tiene hambre de casi todo.', nivel: 'warning' },
        { emoji: '⚠️', texto: 'Saturación de bases solo 32%. Significa que el suelo no tiene suficiente Calcio ni Magnesio.', nivel: 'warning' },
      ],
      queHacer: [
        'PRIMERO: Aplicar cal dolomítica (1.5 toneladas por hectárea) para bajar la acidez y el aluminio.',
        'SEGUNDO: Después de 60 días, incorporar compost (3 toneladas por hectárea) para reconstruir la vida del suelo.',
        'TERCERO: Solo después de encalar y abonar orgánico, aplicar fertilizante NPK.',
        'No fertilice con químicos hasta corregir la acidez — sería botar el dinero.',
      ],
      notaTecnica: 'CICE 8.2, Sat. Bases 32%. Bloqueo por Al (§10.1 Fase 1). Eficiencia NPK sin corrección: <35%.',
    } as InterpretacionEstructurada,
  },
  {
    parcela_id: 'p3', parcela_nombre: 'Finca Las Nubes', variedad: 'Geisha (70%) + SL28 (30%)',
    altitud_msnm: 1680, densidad_plantas_ha: 5500, sombra_pct: 35, pendiente_pct: 12, edad_anios: 3,
    suelo: { ph: 5.4, mo_pct: 5.2, p_ppm: 18, k_cmol: 0.42, ca_cmol: 5.8, mg_cmol: 1.5, al_cmol: 0.15, s_ppm: 18, fe_ppm: 62, mn_ppm: 35, cu_ppm: 3.5, zn_ppm: 5.2, b_ppm: 0.9, cice: 16.8, sat_bases_pct: 65, textura: 'Franco-arenoso', fecha: '2026-02-10' },
    foliar: { n_pct: 3.1, p_pct: 0.18, k_pct: 2.4, ca_pct: 1.2, mg_pct: 0.38, s_pct: 0.20, fe_ppm: 145, mn_ppm: 95, cu_ppm: 14, zn_ppm: 22, b_ppm: 55, fecha: '2026-02-15' },
    interpretacion: {
      resumen: '🌟 ¡Excelente! Esta parcela es su finca modelo. Todo está bien balanceado.',
      hallazgos: [
        { emoji: '✅', texto: 'Suelo con pH ideal (5.4) para café. Las raíces absorben todo correctamente.', nivel: 'ok' },
        { emoji: '✅', texto: 'Materia orgánica alta (5.2%). El suelo tiene buena vida biológica.', nivel: 'ok' },
        { emoji: '✅', texto: 'Todos los nutrientes (macro y micro) están en rango óptimo tanto en suelo como en hoja.', nivel: 'ok' },
        { emoji: '✅', texto: 'Sin aluminio tóxico. Sin bloqueos. Sin deficiencias.', nivel: 'ok' },
        { emoji: '💡', texto: 'Geisha a 1,680 metros es zona ideal para café de especialidad (85+ puntos SCA). Considere aumentar la sombra de 35% a 40-45%.', nivel: 'ok' },
      ],
      queHacer: [
        'Mantener el plan actual de fertilización — está funcionando bien.',
        'Considerar aumentar un poco la sombra (35% → 40-45%) para Geisha.',
        'Seguir con 3 aplicaciones foliares de Zinc y Boro por ciclo para Geisha.',
      ],
      notaTecnica: 'CICE 16.8, Sat. Bases 65%. Ca/Mg 3.9:1. Geisha 1.3x micronutrientes. Potencial 85+ SCA.',
    } as InterpretacionEstructurada,
  },
  {
    parcela_id: 'p4', parcela_nombre: 'Finca Agua Dulce — Lote Norte', variedad: 'Colombia (100%)',
    altitud_msnm: 1180, densidad_plantas_ha: 4200, sombra_pct: 55, pendiente_pct: 30, edad_anios: 8,
    suelo: { ph: 4.3, mo_pct: 1.8, p_ppm: 4, k_cmol: 0.12, ca_cmol: 1.8, mg_cmol: 0.4, al_cmol: 3.2, s_ppm: 5, fe_ppm: 168, mn_ppm: 92, cu_ppm: 0.8, zn_ppm: 0.9, b_ppm: 0.15, cice: 6.5, sat_bases_pct: 22, textura: 'Arcilloso', fecha: '2025-09-20' },
    foliar: null,
    interpretacion: {
      resumen: '🚨 Parcela en estado crítico. El suelo está muy degradado y necesita un plan de recuperación de 2-3 años.',
      hallazgos: [
        { emoji: '🔴', texto: 'Aluminio extremadamente alto (3.2) — es 3 veces el límite. Está destruyendo las raíces.', nivel: 'critical' },
        { emoji: '🔴', texto: 'Suelo extremadamente ácido (pH 4.3). No es apto para fertilización directa.', nivel: 'critical' },
        { emoji: '🔴', texto: 'Materia orgánica muy baja (1.8%). El suelo está "muerto" — casi sin actividad biológica.', nivel: 'critical' },
        { emoji: '🔴', texto: 'Le falta de todo: Fósforo (4 ppm), Potasio (0.12), Cobre, Zinc y Boro todos bajos.', nivel: 'critical' },
        { emoji: '⚠️', texto: 'No tiene análisis de hoja — se necesita urgente para confirmar el estado de la planta.', nivel: 'warning' },
        { emoji: '⚠️', texto: 'Cafetal de 8 años sin renovación en suelo degradado = riesgo de agotamiento total.', nivel: 'warning' },
      ],
      queHacer: [
        'URGENTE: Aplicar 2 toneladas/ha de cal dolomítica para bajar el aluminio.',
        'Incorporar 5 toneladas/ha de compost para reconstruir la materia orgánica.',
        'Después de encalar, hacer fertilización gradual (no todo de una vez).',
        'Hacer análisis foliar lo antes posible.',
        'Evaluar si conviene renovar parte del cafetal (8 años en suelo pobre = baja producción).',
        'Este suelo necesita 2-3 ciclos para recuperarse. No espere resultados inmediatos.',
      ],
      notaTecnica: 'CICE 6.5, Sat. Bases 22%. Al/CICE = 49% (crítico >25%). Pendiente 30% = eficiencia N 50%. §26 Fase 1: riesgo agotamiento estructural.',
    } as InterpretacionEstructurada,
  },
  {
    parcela_id: 'p5', parcela_nombre: 'Finca Monte Verde', variedad: 'Castillo (100%)',
    altitud_msnm: 1520, densidad_plantas_ha: 5000, sombra_pct: 40, pendiente_pct: 15, edad_anios: 5,
    suelo: { ph: 5.3, mo_pct: 4.1, p_ppm: 14, k_cmol: 0.38, ca_cmol: 4.5, mg_cmol: 1.2, al_cmol: 0.4, s_ppm: 16, fe_ppm: 72, mn_ppm: 38, cu_ppm: 2.8, zn_ppm: 4.1, b_ppm: 0.7, cice: 14.2, sat_bases_pct: 56, textura: 'Franco', fecha: '2026-02-28' },
    foliar: { n_pct: 2.9, p_pct: 0.16, k_pct: 2.3, ca_pct: 1.1, mg_pct: 0.35, s_pct: 0.17, fe_ppm: 110, mn_ppm: 78, cu_ppm: 11, zn_ppm: 16, b_ppm: 42, fecha: '2026-03-01' },
    interpretacion: {
      resumen: 'Parcela en buen estado. Solo hay que vigilar el Potasio y el Fósforo que están justos.',
      hallazgos: [
        { emoji: '✅', texto: 'pH aceptable (5.3) y materia orgánica buena (4.1%). El suelo está sano.', nivel: 'ok' },
        { emoji: '⚠️', texto: 'Potasio un poco bajo (0.38 en suelo, 2.3% en hoja). Si baja más, afectará el llenado del grano y la resistencia a enfermedades.', nivel: 'warning' },
        { emoji: '⚠️', texto: 'Fósforo en la hoja está justo en el límite (0.16%). Necesita vigilancia.', nivel: 'warning' },
        { emoji: '⚠️', texto: 'Aluminio (0.4) acercándose al límite de alerta (0.5). Monitorear en el próximo ciclo.', nivel: 'warning' },
        { emoji: '✅', texto: 'Micronutrientes (Boro, Zinc, Cobre) todos están bien.', nivel: 'ok' },
      ],
      queHacer: [
        'Aumentar la dosis de Potasio en la próxima fertilización.',
        'Monitorear el Fósforo — si baja del umbral, agregar DAP.',
        'Revisar pH y aluminio en el próximo análisis para detectar tendencia.',
        'Castillo con multiplicador de demanda 1.15x: necesita un poco más de nutrientes que otras variedades.',
      ],
      notaTecnica: 'CICE 14.2, Sat. Bases 56%. Ca/Mg 3.75:1. K/Mg 0.32 aceptable. N/K foliar 1.26:1.',
    } as InterpretacionEstructurada,
  },
];

const DEMO_SUELO = [
  { id: 's1', parcela_id: 'p1', parcela_nombre: 'Finca La Esperanza — Lote 1', fecha_muestreo: '2026-01-15', ph: 5.1, mo_pct: 4.8, p_ppm: 12, k_cmol: 0.35, ca_cmol: 4.2, mg_cmol: 1.1, al_cmol: 0.3, s_ppm: 14, fe_ppm: 85, mn_ppm: 42, cu_ppm: 2.1, zn_ppm: 3.8, b_ppm: 0.6, cice: 12.4, sat_bases_pct: 58, textura: 'Franco-arcilloso',
    interpretacion: { resumen: 'Suelo en buen estado. Fósforo bajo, lo demás bien.', hallazgos: [{ emoji: '✅', texto: 'pH y materia orgánica correctos.', nivel: 'ok' as const }, { emoji: '⚠️', texto: 'Fósforo bajo (12 ppm). Necesita aporte.', nivel: 'warning' as const }], queHacer: ['Aplicar fuente de fósforo al inicio de lluvias.', 'Mantener plan actual para los demás nutrientes.'] } },
  { id: 's2', parcela_id: 'p2', parcela_nombre: 'Finca El Roble — Lote Central', fecha_muestreo: '2025-11-08', ph: 4.6, mo_pct: 2.9, p_ppm: 6, k_cmol: 0.18, ca_cmol: 2.5, mg_cmol: 0.7, al_cmol: 1.8, s_ppm: 8, fe_ppm: 145, mn_ppm: 68, cu_ppm: 1.2, zn_ppm: 1.4, b_ppm: 0.2, cice: 8.2, sat_bases_pct: 32, textura: 'Franco',
    interpretacion: { resumen: '⛔ Suelo bloqueado por acidez y aluminio. No fertilizar sin encalar primero.', hallazgos: [{ emoji: '🔴', texto: 'Aluminio tóxico (1.8). Impide absorción de nutrientes.', nivel: 'critical' as const }, { emoji: '🔴', texto: 'Fósforo, Potasio, Zinc y Boro todos deficientes.', nivel: 'critical' as const }], queHacer: ['Encalar con 1.5 ton/ha de cal dolomítica.', 'Incorporar 3 ton/ha compost.', 'Fertilizar solo después de la corrección.'] } },
  { id: 's3', parcela_id: 'p3', parcela_nombre: 'Finca Las Nubes', fecha_muestreo: '2026-02-10', ph: 5.4, mo_pct: 5.2, p_ppm: 18, k_cmol: 0.42, ca_cmol: 5.8, mg_cmol: 1.5, al_cmol: 0.15, s_ppm: 18, fe_ppm: 62, mn_ppm: 35, cu_ppm: 3.5, zn_ppm: 5.2, b_ppm: 0.9, cice: 16.8, sat_bases_pct: 65, textura: 'Franco-arenoso',
    interpretacion: { resumen: '🌟 Excelente. Todos los parámetros en rango óptimo.', hallazgos: [{ emoji: '✅', texto: 'pH, MO, nutrientes y micronutrientes todos correctos.', nivel: 'ok' as const }], queHacer: ['Mantener el manejo actual.'] } },
  { id: 's4', parcela_id: 'p4', parcela_nombre: 'Finca Agua Dulce — Lote Norte', fecha_muestreo: '2025-09-20', ph: 4.3, mo_pct: 1.8, p_ppm: 4, k_cmol: 0.12, ca_cmol: 1.8, mg_cmol: 0.4, al_cmol: 3.2, s_ppm: 5, fe_ppm: 168, mn_ppm: 92, cu_ppm: 0.8, zn_ppm: 0.9, b_ppm: 0.15, cice: 6.5, sat_bases_pct: 22, textura: 'Arcilloso',
    interpretacion: { resumen: '🚨 Suelo en estado crítico. Necesita plan de recuperación.', hallazgos: [{ emoji: '🔴', texto: 'Aluminio extremo (3.2). Suelo muy ácido (pH 4.3). MO muy baja (1.8%).', nivel: 'critical' as const }, { emoji: '🔴', texto: 'Deficiencias múltiples: P, K, S, Cu, Zn, B.', nivel: 'critical' as const }], queHacer: ['Encalar con 2 ton/ha. Luego incorporar 5 ton/ha compost.', 'Fertilizar gradualmente después de la corrección.', 'Proceso de recuperación: 2-3 ciclos.'] } },
  { id: 's5', parcela_id: 'p5', parcela_nombre: 'Finca Monte Verde', fecha_muestreo: '2026-02-28', ph: 5.3, mo_pct: 4.1, p_ppm: 14, k_cmol: 0.38, ca_cmol: 4.5, mg_cmol: 1.2, al_cmol: 0.4, s_ppm: 16, fe_ppm: 72, mn_ppm: 38, cu_ppm: 2.8, zn_ppm: 4.1, b_ppm: 0.7, cice: 14.2, sat_bases_pct: 56, textura: 'Franco',
    interpretacion: { resumen: 'Suelo aceptable. K y P necesitan atención. Monitorear aluminio.', hallazgos: [{ emoji: '✅', texto: 'pH y MO en rango.', nivel: 'ok' as const }, { emoji: '⚠️', texto: 'K y P en deficiencia leve. Al acercándose al límite.', nivel: 'warning' as const }], queHacer: ['Aumentar K en la próxima fertilización.', 'Monitorear Al y pH en próximo análisis.'] } },
  { id: 's6', parcela_id: 'p1', parcela_nombre: 'Finca La Esperanza — Lote 1', fecha_muestreo: '2025-07-10', ph: 5.0, mo_pct: 4.5, p_ppm: 10, k_cmol: 0.30, ca_cmol: 3.9, mg_cmol: 1.0, al_cmol: 0.4, s_ppm: 12, fe_ppm: 90, mn_ppm: 45, cu_ppm: 1.9, zn_ppm: 3.2, b_ppm: 0.5, cice: 11.8, sat_bases_pct: 54, textura: 'Franco-arcilloso',
    interpretacion: { resumen: 'Análisis anterior. Comparando con enero 2026: el suelo ha mejorado.', hallazgos: [{ emoji: '📈', texto: 'pH mejoró de 5.0 a 5.1. Fósforo subió de 10 a 12 ppm. Aluminio bajó de 0.4 a 0.3.', nivel: 'ok' as const }], queHacer: ['Continuar con el plan de manejo actual, está funcionando.'] } },
];

const DEMO_HOJA = [
  { id: 'h1', parcela_id: 'p1', parcela_nombre: 'Finca La Esperanza — Lote 1', fecha_muestreo: '2026-01-20', n_pct: 2.8, p_pct: 0.15, k_pct: 2.1, ca_pct: 1.0, mg_pct: 0.32, s_pct: 0.18, fe_ppm: 120, mn_ppm: 85, cu_ppm: 12, zn_ppm: 18, b_ppm: 45,
    interpretacion: { resumen: 'Hoja en buen estado. P y K un poco bajos.', hallazgos: [{ emoji: '✅', texto: 'Nitrógeno bien (2.8%). Micronutrientes en rango.', nivel: 'ok' as const }, { emoji: '⚠️', texto: 'Fósforo (0.15%) y Potasio (2.1%) ligeramente bajos.', nivel: 'warning' as const }], queHacer: ['Aumentar P y K en la fertilización.'] } },
  { id: 'h2', parcela_id: 'p2', parcela_nombre: 'Finca El Roble — Lote Central', fecha_muestreo: '2025-11-15', n_pct: 2.2, p_pct: 0.11, k_pct: 1.6, ca_pct: 0.7, mg_pct: 0.22, s_pct: 0.11, fe_ppm: 92, mn_ppm: 55, cu_ppm: 6, zn_ppm: 9, b_ppm: 28,
    interpretacion: { resumen: '🚨 La planta tiene hambre de casi todo. Refleja el mal estado del suelo.', hallazgos: [{ emoji: '🔴', texto: 'N, P, K, Ca, Mg, S y Boro todos por debajo del mínimo. La planta está desnutrida.', nivel: 'critical' as const }], queHacer: ['Corregir primero el suelo (encalar). La planta no puede absorber si el suelo está bloqueado.', 'Mientras tanto, aplicar foliar multimineral para alivio rápido.'] } },
  { id: 'h3', parcela_id: 'p3', parcela_nombre: 'Finca Las Nubes', fecha_muestreo: '2026-02-15', n_pct: 3.1, p_pct: 0.18, k_pct: 2.4, ca_pct: 1.2, mg_pct: 0.38, s_pct: 0.20, fe_ppm: 145, mn_ppm: 95, cu_ppm: 14, zn_ppm: 22, b_ppm: 55,
    interpretacion: { resumen: '🌟 Excelente nutrición. Todos los nutrientes dentro del rango óptimo.', hallazgos: [{ emoji: '✅', texto: 'N 3.1%, P 0.18%, K 2.4% — todo bien. Zn y B adecuados para Geisha.', nivel: 'ok' as const }], queHacer: ['Mantener el plan actual.'] } },
  { id: 'h4', parcela_id: 'p5', parcela_nombre: 'Finca Monte Verde', fecha_muestreo: '2026-03-01', n_pct: 2.9, p_pct: 0.16, k_pct: 2.3, ca_pct: 1.1, mg_pct: 0.35, s_pct: 0.17, fe_ppm: 110, mn_ppm: 78, cu_ppm: 11, zn_ppm: 16, b_ppm: 42,
    interpretacion: { resumen: 'Niveles adecuados. K y P en el límite — vigílelos.', hallazgos: [{ emoji: '✅', texto: 'En general la planta está bien alimentada.', nivel: 'ok' as const }, { emoji: '⚠️', texto: 'K (2.3%) y P (0.16%) están justo en el límite mínimo.', nivel: 'warning' as const }], queHacer: ['Vigilar K y P en próximo ciclo. Si bajan, afectará el grano.'] } },
];

const DEMO_PLANES = [
  {
    id: 'plan1', parcela_id: 'p1', parcela_nombre: 'Finca La Esperanza — Lote 1',
    ciclo: '2026', objetivo: 'Mejorar fósforo y potasio para buena cosecha',
    status: 'activo', created_at: '2026-01-25', nivel_confianza: 'Alto',
    interpretacion: {
      resumen: 'Plan diseñado para corregir el fósforo bajo y mantener los demás nutrientes. Costo razonable con buen retorno esperado.',
      hallazgos: [
        { emoji: '🎯', texto: 'Se eligió fórmula 18-5-15 porque falta P y K. Se aplica en 3 momentos para que el café lo aproveche mejor.', nivel: 'ok' as const },
        { emoji: '💰', texto: 'Costo total: $455/ha. Si produce 25 quintales con precio diferenciado, la inversión se paga 3.2 veces.', nivel: 'ok' as const },
        { emoji: '💡', texto: 'La cal en agosto es solo preventiva — hágala únicamente si el pH baja de 5.0 en julio.', nivel: 'ok' as const },
      ],
      queHacer: ['Aplicar en los meses indicados.', 'No saltar la aplicación foliar de abril — es cuando el grano más lo necesita.'],
    } as InterpretacionEstructurada,
    aplicaciones: [
      { id: 'a1', orden: 1, producto: 'NPK 18-5-15-6-2(MgO-S) granulado', dosis_por_ha: '350 kg/ha', metodo: 'Al suelo, banda lateral', mes_aplicacion: 'Marzo 2026', costo_estimado_usd: 185, notas: 'Primera fertilización después de la floración. Poner a 20cm del tallo en la corona.' },
      { id: 'a2', orden: 2, producto: 'Foliar K₂O + B + Zn (micronutrientes)', dosis_por_ha: '3 L/ha', metodo: 'Aspersión foliar', mes_aplicacion: 'Abril 2026', costo_estimado_usd: 45, notas: 'Complemento de K y micronutrientes. Fase de expansión del fruto.' },
      { id: 'a3', orden: 3, producto: 'NPK 18-5-15-6-2(MgO-S) granulado', dosis_por_ha: '300 kg/ha', metodo: 'Al suelo, banda lateral', mes_aplicacion: 'Junio 2026', costo_estimado_usd: 160, notas: 'Segunda aplicación para llenado de grano. Reducir si hay mucha lluvia.' },
      { id: 'a4', orden: 4, producto: 'Cal dolomítica (enmienda)', dosis_por_ha: '500 kg/ha', metodo: 'Al voleo incorporado', mes_aplicacion: 'Agosto 2026', costo_estimado_usd: 65, notas: 'Solo si el pH baja de 5.0 en análisis de julio.' },
    ],
  },
  {
    id: 'plan2', parcela_id: 'p2', parcela_nombre: 'Finca El Roble — Lote Central',
    ciclo: '2026', objetivo: 'Corregir acidez y aluminio — sin esto no sirve fertilizar',
    status: 'borrador', created_at: '2026-02-20', nivel_confianza: 'Alto',
    interpretacion: {
      resumen: '⛔ Plan condicionado: primero hay que corregir la acidez del suelo. Sin encalar, el abono NPK se desperdicia en un 60-70%.',
      hallazgos: [
        { emoji: '🔴', texto: 'El suelo tiene tanto aluminio que "bloquea" la absorción. Primero se encala, luego se fertiliza.', nivel: 'critical' as const },
        { emoji: '💰', texto: 'Costo total: $945/ha. Es alto, pero sin corrección la inversión en NPK se pierde.', nivel: 'warning' as const },
        { emoji: '📅', texto: 'Análisis de control en septiembre es obligatorio para verificar que la corrección funcionó.', nivel: 'ok' as const },
      ],
      queHacer: ['Seguir el orden exacto: cal → compost → NPK.', 'No adelantar la fertilización química.', 'Hacer análisis de control en septiembre.'],
    } as InterpretacionEstructurada,
    aplicaciones: [
      { id: 'a5', orden: 1, producto: 'Cal dolomítica', dosis_por_ha: '1500 kg/ha', metodo: 'Al voleo incorporado', mes_aplicacion: 'Marzo 2026', costo_estimado_usd: 195, notas: 'Corrección de aluminio y pH. Aplicar 60 días antes de la primera fertilización.' },
      { id: 'a6', orden: 2, producto: 'Bocashi compostado', dosis_por_ha: '3000 kg/ha', metodo: 'En corona, incorporar', mes_aplicacion: 'Abril 2026', costo_estimado_usd: 280, notas: 'Para reconstruir la materia orgánica del suelo.' },
      { id: 'a7', orden: 3, producto: 'NPK 20-5-20 + S', dosis_por_ha: '400 kg/ha', metodo: 'Al suelo, media luna', mes_aplicacion: 'Mayo 2026', costo_estimado_usd: 220, notas: 'Solo después de que actúe la cal.' },
      { id: 'a8', orden: 4, producto: 'Foliar multimineral (Zn+B+Cu+Mn)', dosis_por_ha: '4 L/ha', metodo: 'Aspersión foliar', mes_aplicacion: 'Junio 2026', costo_estimado_usd: 55, notas: 'Aporte rápido de micronutrientes mientras el suelo se corrige.' },
      { id: 'a9', orden: 5, producto: 'NPK 20-5-20 + S', dosis_por_ha: '350 kg/ha', metodo: 'Al suelo, media luna', mes_aplicacion: 'Agosto 2026', costo_estimado_usd: 195, notas: 'Segunda dosis.' },
    ],
  },
  {
    id: 'plan3', parcela_id: 'p3', parcela_nombre: 'Finca Las Nubes',
    ciclo: '2026', objetivo: 'Mantenimiento — finca en excelente estado',
    status: 'activo', created_at: '2026-02-18', nivel_confianza: 'Alto',
    interpretacion: {
      resumen: '🌟 Plan sencillo de mantenimiento. Todo está bien, solo hay que reponer lo que la cosecha se lleva.',
      hallazgos: [
        { emoji: '✅', texto: 'Parcela en excelente condición. Solo se repone lo que se extrae.', nivel: 'ok' as const },
        { emoji: '💰', texto: 'Costo: $405/ha — la parcela más eficiente. Solo 2 aplicaciones al suelo + 1 foliar.', nivel: 'ok' as const },
        { emoji: '💡', texto: 'Geisha necesita más Zinc y Boro que otras variedades. La foliar de mayo es clave.', nivel: 'ok' as const },
      ],
      queHacer: ['Aplicar según calendario.', 'No saltar el foliar de Zn+B de mayo — es requisito para Geisha.'],
    } as InterpretacionEstructurada,
    aplicaciones: [
      { id: 'a10', orden: 1, producto: 'NPK 17-6-18-2(MgO) granulado', dosis_por_ha: '300 kg/ha', metodo: 'Al suelo, banda lateral', mes_aplicacion: 'Marzo 2026', costo_estimado_usd: 165, notas: 'Fertilización de mantenimiento.' },
      { id: 'a11', orden: 2, producto: 'Foliar Zn+B+Mn (especialidad Geisha)', dosis_por_ha: '3 L/ha', metodo: 'Aspersión foliar', mes_aplicacion: 'Mayo 2026', costo_estimado_usd: 75, notas: 'Importante para Geisha. 3 aplicaciones mínimo por ciclo.' },
      { id: 'a12', orden: 3, producto: 'NPK 17-6-18-2(MgO) granulado', dosis_por_ha: '300 kg/ha', metodo: 'Al suelo, banda lateral', mes_aplicacion: 'Julio 2026', costo_estimado_usd: 165, notas: 'Segunda dosis.' },
    ],
  },
  {
    id: 'plan4', parcela_id: 'p4', parcela_nombre: 'Finca Agua Dulce — Lote Norte',
    ciclo: '2025', objetivo: 'Recuperación de parcela degradada — primer año de 3',
    status: 'completado', created_at: '2025-03-10', nivel_confianza: 'Medio',
    interpretacion: {
      resumen: 'Plan de recuperación ejecutado en 2025 (año 1 de 3). Resultados parciales: el suelo mejoró pero aún no es suficiente.',
      hallazgos: [
        { emoji: '📈', texto: 'pH subió de 4.3 a 4.7 (falta llegar a 5.0-5.2). MO subió de 1.8% a 2.4% (objetivo: 3.5%).', nivel: 'warning' as const },
        { emoji: '⚠️', texto: 'Confianza MEDIA porque no se hizo análisis foliar. Se necesita para el ciclo 2.', nivel: 'warning' as const },
        { emoji: '💰', texto: 'Inversión: $800/ha. Alta pero necesaria — sin corrección la parcela no produce.', nivel: 'ok' as const },
      ],
      queHacer: ['Continuar con ciclo 2 en 2026 para alcanzar niveles productivos mínimos.', 'Hacer análisis foliar este año.'],
    } as InterpretacionEstructurada,
    aplicaciones: [
      { id: 'a13', orden: 1, producto: 'Cal viva', dosis_por_ha: '2000 kg/ha', metodo: 'Al voleo', mes_aplicacion: 'Marzo 2025', costo_estimado_usd: 240, notas: 'Corrección severa de pH y aluminio.' },
      { id: 'a14', orden: 2, producto: 'Compost + gallinaza', dosis_por_ha: '5000 kg/ha', metodo: 'En corona incorporado', mes_aplicacion: 'Mayo 2025', costo_estimado_usd: 420, notas: 'Aporte masivo para reconstruir la vida del suelo.' },
      { id: 'a15', orden: 3, producto: 'NPK 15-15-15 (balanceado)', dosis_por_ha: '250 kg/ha', metodo: 'Al suelo', mes_aplicacion: 'Julio 2025', costo_estimado_usd: 140, notas: 'Fertilización inicial después de corrección.' },
    ],
  },
];

// ── Scoring helpers ──

type NutrientStatus = 'ok' | 'warning' | 'critical' | 'unknown';

function evalRange(value: number | null, rango: { bajo: number; optMin: number; optMax: number; alto: number }, invertForAl = false): NutrientStatus {
  if (value == null) return 'unknown';
  if (invertForAl) {
    if (value > rango.alto) return 'critical';
    if (value > rango.optMax) return 'warning';
    return 'ok';
  }
  if (value < rango.bajo) return 'critical';
  if (value < rango.optMin) return 'warning';
  if (value > rango.alto) return 'warning';
  return 'ok';
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'ok': return <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />;
    case 'warning': return <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />;
    case 'critical': return <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />;
    default: return <HelpCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    ok: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    critical: 'bg-destructive/10 text-destructive border-destructive/20',
    unknown: 'bg-muted text-muted-foreground border-border',
  };
  const labels: Record<string, string> = { ok: 'Óptimo', warning: 'Atención', critical: 'Crítico', unknown: 'Sin datos' };
  return <Badge variant="outline" className={variants[status] ?? variants.unknown}>{labels[status] ?? status}</Badge>;
}

const PLAN_STATUS_COLORS: Record<string, string> = {
  borrador: 'bg-muted text-muted-foreground',
  activo: 'bg-success/10 text-success border-success/20',
  completado: 'bg-primary/10 text-primary border-primary/20',
};

function NutrientRow({ label, value, rango, invert }: { label: string; value: number | null; rango: { bajo: number; optMin: number; optMax: number; alto: number; unidad: string }; invert?: boolean }) {
  const st = evalRange(value, rango, invert);
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-1.5">
        <StatusIcon status={st} />
        <span className="text-xs text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="font-mono font-semibold text-foreground">{value != null ? value : '—'}</span>
        <span className="text-muted-foreground">{rango.unidad}</span>
        <span className="text-[10px] text-muted-foreground/60">({rango.optMin}–{rango.optMax})</span>
      </div>
    </div>
  );
}

// ── Structured Interpretation Component ──

function InterpretacionPanel({ data }: { data: InterpretacionEstructurada }) {
  const [showTecnica, setShowTecnica] = useState(false);
  return (
    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
      <div className="flex items-center gap-1.5">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-primary">Interpretación Nova Silva</span>
      </div>

      {/* Resumen en lenguaje simple */}
      <p className="text-sm font-medium text-foreground leading-relaxed">{data.resumen}</p>

      {/* Hallazgos como lista visual */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">¿Qué encontramos?</p>
        {data.hallazgos.map((h, i) => (
          <div key={i} className={`flex items-start gap-2 text-sm rounded-md p-2 ${
            h.nivel === 'critical' ? 'bg-destructive/5' :
            h.nivel === 'warning' ? 'bg-warning/5' : 'bg-muted/30'
          }`}>
            <span className="text-base leading-none mt-0.5">{h.emoji}</span>
            <span className="text-foreground/80 leading-relaxed">{h.texto}</span>
          </div>
        ))}
      </div>

      {/* Qué hacer */}
      {data.queHacer.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">¿Qué debe hacer?</p>
          {data.queHacer.map((paso, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-foreground/80 pl-1">
              <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span>{paso}</span>
            </div>
          ))}
        </div>
      )}

      {/* Nota técnica colapsable */}
      {data.notaTecnica && (
        <div>
          <button
            onClick={() => setShowTecnica(!showTecnica)}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${showTecnica ? 'rotate-180' : ''}`} />
            {showTecnica ? 'Ocultar detalle técnico' : 'Ver detalle técnico'}
          </button>
          {showTecnica && (
            <p className="text-[11px] text-muted-foreground mt-1 pl-4 font-mono leading-relaxed">{data.notaTecnica}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Upload Soil Study Component ──

function UploadSoilStudy() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<InterpretacionEstructurada | null>(null);

  const handleUpload = () => {
    if (!file) return;
    setProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setResult({
        resumen: 'Análisis procesado exitosamente. El suelo presenta acidez moderada con deficiencia de fósforo y potasio. Materia orgánica en nivel medio.',
        hallazgos: [
          { emoji: '⚠️', texto: 'pH 4.8 — acidez moderada. Las plantas pueden tener dificultad para absorber algunos nutrientes.', nivel: 'warning' },
          { emoji: '⚠️', texto: 'Fósforo disponible bajo (8 ppm). Limita la floración y producción de frutos.', nivel: 'warning' },
          { emoji: '✅', texto: 'Materia orgánica 3.5% — nivel aceptable. El suelo tiene actividad biológica.', nivel: 'ok' },
          { emoji: '⚠️', texto: 'Potasio bajo (0.25 cmol/kg). Afecta la resistencia a enfermedades y calidad del grano.', nivel: 'warning' },
          { emoji: '✅', texto: 'Calcio y Magnesio en rangos aceptables. Relación Ca/Mg 3.5:1 correcta.', nivel: 'ok' },
          { emoji: '⚠️', texto: 'Aluminio 0.6 cmol/kg — por encima del umbral de alerta (0.5). Monitorear.', nivel: 'warning' },
        ],
        queHacer: [
          'Aplicar cal dolomítica (500 kg/ha) para corregir pH y bajar el aluminio.',
          'Incorporar fuente de fósforo: DAP o roca fosfórica al inicio de lluvias.',
          'Aumentar potasio en la próxima fertilización (considerar KCl o sulfato de potasio).',
          'Repetir análisis en 6 meses para verificar que las correcciones funcionaron.',
        ],
        notaTecnica: 'CICE estimada 10.5 cmol/kg. Sat. Bases 48%. Ca/Mg 3.5:1. Al/CICE ~5.7%. Textura franco-arcillosa.',
      });
      setProcessing(false);
    }, 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="h-4 w-4" />
          Cargar estudio de suelo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            Cargar Estudio de Suelos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Suba el PDF del análisis de laboratorio y Nova Silva lo interpreta automáticamente en lenguaje claro, con recomendaciones para su finca.
          </p>

          {!result ? (
            <>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-3">
                <FileUp className="h-10 w-10 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-sm font-medium text-foreground">Seleccione el archivo del análisis</p>
                  <p className="text-xs text-muted-foreground">PDF del laboratorio (máx 20 MB)</p>
                </div>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="max-w-xs mx-auto"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>

              {file && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 text-sm">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!file || processing}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Nova Silva está analizando el estudio...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-1" />
                    Interpretar con Nova Silva
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 rounded-md bg-success/10 text-success text-sm">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Análisis procesado correctamente</span>
              </div>

              <InterpretacionPanel data={result} />

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setResult(null); setFile(null); }}>
                  Cargar otro estudio
                </Button>
                <Button size="sm" onClick={() => setIsOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ──

export default function NutricionTab() {
  const [subTab, setSubTab] = useState<'estado' | 'analisis' | 'planes'>('estado');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        {[
          { key: 'estado' as const, icon: Sprout, label: 'Estado Nutricional' },
          { key: 'analisis' as const, icon: FlaskConical, label: 'Análisis' },
          { key: 'planes' as const, icon: FileText, label: 'Planes' },
        ].map(t => (
          <Button key={t.key} size="sm" variant={subTab === t.key ? 'default' : 'outline'} onClick={() => setSubTab(t.key)}>
            <t.icon className="h-4 w-4 mr-1" /> {t.label}
          </Button>
        ))}
        <div className="flex-1" />
        <UploadSoilStudy />
      </div>

      {subTab === 'estado' && <EstadoSection />}
      {subTab === 'analisis' && <AnalisisSection />}
      {subTab === 'planes' && <PlanesSection />}
    </div>
  );
}

// ── Estado Nutricional (expandable cards) ──

function EstadoSection() {
  return (
    <Accordion type="single" collapsible className="space-y-3">
      {DEMO_PARCELAS_ESTADO.map(p => {
        const phSt = evalRange(p.suelo.ph, RANGOS_SUELO.ph);
        const moSt = evalRange(p.suelo.mo_pct, RANGOS_SUELO.mo_pct);
        const alSt = evalRange(p.suelo.al_cmol, RANGOS_SUELO.al_cmol, true);
        const overall = [phSt, moSt, alSt].includes('critical') ? 'critical'
          : [phSt, moSt, alSt].includes('warning') ? 'warning'
          : 'ok';

        return (
          <AccordionItem key={p.parcela_id} value={p.parcela_id} className="border rounded-lg bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3 w-full mr-2">
                <Sprout className="h-5 w-5 text-primary shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.parcela_nombre}</p>
                  <p className="text-xs text-muted-foreground">{p.variedad} · {p.altitud_msnm} msnm · {p.edad_anios} años</p>
                </div>
                <StatusBadge status={overall} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              {/* Context */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  { label: 'Densidad', value: `${p.densidad_plantas_ha.toLocaleString()} pl/ha` },
                  { label: 'Sombra', value: `${p.sombra_pct}%` },
                  { label: 'Pendiente', value: `${p.pendiente_pct}%` },
                  { label: 'Altitud', value: `${p.altitud_msnm} m` },
                ].map(m => (
                  <div key={m.label} className="text-center p-2 rounded-md bg-muted/50">
                    <p className="text-muted-foreground">{m.label}</p>
                    <p className="font-semibold text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Soil full breakdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Droplets className="h-4 w-4 text-primary" />
                  <span>Análisis de Suelo</span>
                  <span className="ml-auto text-muted-foreground text-[10px]">{new Date(p.suelo.fecha).toLocaleDateString('es')} · {p.suelo.textura}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 bg-muted/20 rounded-md p-3">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Macronutrientes & pH</p>
                    <NutrientRow label="pH" value={p.suelo.ph} rango={RANGOS_SUELO.ph} />
                    <NutrientRow label="Materia Orgánica" value={p.suelo.mo_pct} rango={RANGOS_SUELO.mo_pct} />
                    <NutrientRow label="Fósforo (P)" value={p.suelo.p_ppm} rango={RANGOS_SUELO.p_ppm} />
                    <NutrientRow label="Potasio (K)" value={p.suelo.k_cmol} rango={RANGOS_SUELO.k_cmol} />
                    <NutrientRow label="Calcio (Ca)" value={p.suelo.ca_cmol} rango={RANGOS_SUELO.ca_cmol} />
                    <NutrientRow label="Magnesio (Mg)" value={p.suelo.mg_cmol} rango={RANGOS_SUELO.mg_cmol} />
                    <NutrientRow label="Azufre (S)" value={p.suelo.s_ppm} rango={RANGOS_SUELO.s_ppm} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Micronutrientes & Capacidad</p>
                    <NutrientRow label="Aluminio (Al)" value={p.suelo.al_cmol} rango={RANGOS_SUELO.al_cmol} invert />
                    <NutrientRow label="Hierro (Fe)" value={p.suelo.fe_ppm} rango={RANGOS_SUELO.fe_ppm} />
                    <NutrientRow label="Manganeso (Mn)" value={p.suelo.mn_ppm} rango={RANGOS_SUELO.mn_ppm} />
                    <NutrientRow label="Cobre (Cu)" value={p.suelo.cu_ppm} rango={RANGOS_SUELO.cu_ppm} />
                    <NutrientRow label="Zinc (Zn)" value={p.suelo.zn_ppm} rango={RANGOS_SUELO.zn_ppm} />
                    <NutrientRow label="Boro (B)" value={p.suelo.b_ppm} rango={RANGOS_SUELO.b_ppm} />
                    <NutrientRow label="CICE" value={p.suelo.cice} rango={RANGOS_SUELO.cice} />
                    <NutrientRow label="Sat. Bases" value={p.suelo.sat_bases_pct} rango={RANGOS_SUELO.sat_bases_pct} />
                  </div>
                </div>

                {/* Relaciones catiónicas */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: 'Ca/Mg', value: (p.suelo.ca_cmol / p.suelo.mg_cmol).toFixed(1), ideal: '3.0–5.0' },
                    { label: 'Ca/K', value: (p.suelo.ca_cmol / p.suelo.k_cmol).toFixed(1), ideal: '5.0–25.0' },
                    { label: 'Mg/K', value: (p.suelo.mg_cmol / p.suelo.k_cmol).toFixed(1), ideal: '2.5–15.0' },
                  ].map(r => (
                    <div key={r.label} className="text-center p-2 rounded-md bg-muted/50">
                      <p className="text-muted-foreground">{r.label}</p>
                      <p className="font-semibold text-foreground">{r.value}</p>
                      <p className="text-[10px] text-muted-foreground/60">ideal: {r.ideal}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Foliar full breakdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Leaf className="h-4 w-4 text-primary" />
                  <span>Análisis Foliar</span>
                  {p.foliar && <span className="ml-auto text-muted-foreground text-[10px]">{new Date(p.foliar.fecha).toLocaleDateString('es')}</span>}
                </div>
                {p.foliar ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 bg-muted/20 rounded-md p-3">
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Macronutrientes</p>
                      <NutrientRow label="Nitrógeno (N)" value={p.foliar.n_pct} rango={RANGOS_FOLIAR.n_pct} />
                      <NutrientRow label="Fósforo (P)" value={p.foliar.p_pct} rango={RANGOS_FOLIAR.p_pct} />
                      <NutrientRow label="Potasio (K)" value={p.foliar.k_pct} rango={RANGOS_FOLIAR.k_pct} />
                      <NutrientRow label="Calcio (Ca)" value={p.foliar.ca_pct} rango={RANGOS_FOLIAR.ca_pct} />
                      <NutrientRow label="Magnesio (Mg)" value={p.foliar.mg_pct} rango={RANGOS_FOLIAR.mg_pct} />
                      <NutrientRow label="Azufre (S)" value={p.foliar.s_pct} rango={RANGOS_FOLIAR.s_pct} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Micronutrientes</p>
                      <NutrientRow label="Hierro (Fe)" value={p.foliar.fe_ppm} rango={RANGOS_FOLIAR.fe_ppm} />
                      <NutrientRow label="Manganeso (Mn)" value={p.foliar.mn_ppm} rango={RANGOS_FOLIAR.mn_ppm} />
                      <NutrientRow label="Cobre (Cu)" value={p.foliar.cu_ppm} rango={RANGOS_FOLIAR.cu_ppm} />
                      <NutrientRow label="Zinc (Zn)" value={p.foliar.zn_ppm} rango={RANGOS_FOLIAR.zn_ppm} />
                      <NutrientRow label="Boro (B)" value={p.foliar.b_ppm} rango={RANGOS_FOLIAR.b_ppm} />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-md bg-destructive/5 border border-destructive/20 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                    Sin análisis foliar — se recomienda toma de muestras urgente.
                  </div>
                )}
              </div>

              {/* Interpretación Nova Silva - Structured */}
              <InterpretacionPanel data={p.interpretacion} />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

// ── Análisis ──

function AnalisisSection() {
  const [tipo, setTipo] = useState<'suelo' | 'foliar'>('suelo');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={tipo === 'suelo' ? 'default' : 'outline'} onClick={() => setTipo('suelo')}>
          <Droplets className="h-4 w-4 mr-1" /> Suelo ({DEMO_SUELO.length})
        </Button>
        <Button size="sm" variant={tipo === 'foliar' ? 'default' : 'outline'} onClick={() => setTipo('foliar')}>
          <Leaf className="h-4 w-4 mr-1" /> Foliar ({DEMO_HOJA.length})
        </Button>
      </div>

      {tipo === 'suelo' && (
        <Accordion type="single" collapsible className="space-y-2">
          {DEMO_SUELO.map(s => (
            <AccordionItem key={s.id} value={s.id} className="border rounded-lg bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 w-full mr-2">
                  <Droplets className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-left flex-1 truncate">{s.parcela_nombre}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={evalRange(s.ph, RANGOS_SUELO.ph)} />
                    <Badge variant="outline" className="text-[10px]">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(s.fecha_muestreo).toLocaleDateString('es')}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 bg-muted/20 rounded-md p-3">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Macronutrientes & pH</p>
                    <NutrientRow label="pH" value={s.ph} rango={RANGOS_SUELO.ph} />
                    <NutrientRow label="MO" value={s.mo_pct} rango={RANGOS_SUELO.mo_pct} />
                    <NutrientRow label="P (Bray II)" value={s.p_ppm} rango={RANGOS_SUELO.p_ppm} />
                    <NutrientRow label="K" value={s.k_cmol} rango={RANGOS_SUELO.k_cmol} />
                    <NutrientRow label="Ca" value={s.ca_cmol} rango={RANGOS_SUELO.ca_cmol} />
                    <NutrientRow label="Mg" value={s.mg_cmol} rango={RANGOS_SUELO.mg_cmol} />
                    <NutrientRow label="S" value={s.s_ppm} rango={RANGOS_SUELO.s_ppm} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Micro, Al & Capacidad</p>
                    <NutrientRow label="Al" value={s.al_cmol} rango={RANGOS_SUELO.al_cmol} invert />
                    <NutrientRow label="Fe" value={s.fe_ppm} rango={RANGOS_SUELO.fe_ppm} />
                    <NutrientRow label="Mn" value={s.mn_ppm} rango={RANGOS_SUELO.mn_ppm} />
                    <NutrientRow label="Cu" value={s.cu_ppm} rango={RANGOS_SUELO.cu_ppm} />
                    <NutrientRow label="Zn" value={s.zn_ppm} rango={RANGOS_SUELO.zn_ppm} />
                    <NutrientRow label="B" value={s.b_ppm} rango={RANGOS_SUELO.b_ppm} />
                    <NutrientRow label="CICE" value={s.cice} rango={RANGOS_SUELO.cice} />
                    <NutrientRow label="Sat. Bases" value={s.sat_bases_pct} rango={RANGOS_SUELO.sat_bases_pct} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Textura: {s.textura}</p>
                {/* Relaciones catiónicas */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: 'Ca/Mg', value: (s.ca_cmol / s.mg_cmol).toFixed(1), ideal: '3–5' },
                    { label: 'Ca/K', value: (s.ca_cmol / s.k_cmol).toFixed(1), ideal: '5–25' },
                    { label: 'Mg/K', value: (s.mg_cmol / s.k_cmol).toFixed(1), ideal: '2.5–15' },
                  ].map(r => (
                    <div key={r.label} className="text-center p-1.5 rounded bg-muted/50">
                      <p className="text-muted-foreground">{r.label}</p>
                      <p className="font-semibold text-foreground">{r.value}</p>
                      <p className="text-[10px] text-muted-foreground/60">{r.ideal}</p>
                    </div>
                  ))}
                </div>
                {/* Interpretación */}
                <InterpretacionPanel data={s.interpretacion} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {tipo === 'foliar' && (
        <Accordion type="single" collapsible className="space-y-2">
          {DEMO_HOJA.map(h => (
            <AccordionItem key={h.id} value={h.id} className="border rounded-lg bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 w-full mr-2">
                  <Leaf className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-left flex-1 truncate">{h.parcela_nombre}</span>
                  <Badge variant="outline" className="text-[10px]">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(h.fecha_muestreo).toLocaleDateString('es')}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 bg-muted/20 rounded-md p-3">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Macronutrientes</p>
                    <NutrientRow label="N" value={h.n_pct} rango={RANGOS_FOLIAR.n_pct} />
                    <NutrientRow label="P" value={h.p_pct} rango={RANGOS_FOLIAR.p_pct} />
                    <NutrientRow label="K" value={h.k_pct} rango={RANGOS_FOLIAR.k_pct} />
                    <NutrientRow label="Ca" value={h.ca_pct} rango={RANGOS_FOLIAR.ca_pct} />
                    <NutrientRow label="Mg" value={h.mg_pct} rango={RANGOS_FOLIAR.mg_pct} />
                    <NutrientRow label="S" value={h.s_pct} rango={RANGOS_FOLIAR.s_pct} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Micronutrientes</p>
                    <NutrientRow label="Fe" value={h.fe_ppm} rango={RANGOS_FOLIAR.fe_ppm} />
                    <NutrientRow label="Mn" value={h.mn_ppm} rango={RANGOS_FOLIAR.mn_ppm} />
                    <NutrientRow label="Cu" value={h.cu_ppm} rango={RANGOS_FOLIAR.cu_ppm} />
                    <NutrientRow label="Zn" value={h.zn_ppm} rango={RANGOS_FOLIAR.zn_ppm} />
                    <NutrientRow label="B" value={h.b_ppm} rango={RANGOS_FOLIAR.b_ppm} />
                  </div>
                </div>
                <InterpretacionPanel data={h.interpretacion} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

// ── Planes ──

function PlanesSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Planes de fertilización generados por el motor de nutrición</p>
        <Button size="sm"><Zap className="h-4 w-4 mr-1" /> Generar Plan</Button>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {DEMO_PLANES.map(plan => {
          const totalCost = plan.aplicaciones.reduce((sum, a) => sum + a.costo_estimado_usd, 0);

          return (
            <AccordionItem key={plan.id} value={plan.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 w-full mr-2">
                  <Sprout className="h-5 w-5 text-primary shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{plan.parcela_nombre} — {plan.ciclo}</p>
                    <p className="text-xs text-muted-foreground truncate">{plan.objetivo}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${PLAN_STATUS_COLORS[plan.status] ?? ''}`}>{plan.status}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                    <DollarSign className="h-3 w-3" />${totalCost.toFixed(0)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                {/* Nivel de confianza */}
                <div className="flex items-center gap-2 text-xs">
                  <Gauge className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Nivel de Confianza:</span>
                  <Badge variant="outline" className={
                    plan.nivel_confianza === 'Alto' ? 'bg-success/10 text-success border-success/20' :
                    plan.nivel_confianza === 'Medio' ? 'bg-warning/10 text-warning border-warning/20' :
                    'bg-destructive/10 text-destructive border-destructive/20'
                  }>{plan.nivel_confianza}</Badge>
                </div>

                {/* Interpretación Nova Silva - Structured */}
                <InterpretacionPanel data={plan.interpretacion} />

                {/* Aplicaciones */}
                <div className="space-y-2">
                  {plan.aplicaciones.map(app => (
                    <div key={app.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/30 text-sm">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {app.orden}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{app.producto}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                          <span>Dosis: {app.dosis_por_ha}</span>
                          <span>Método: {app.metodo}</span>
                          <span><Calendar className="h-3 w-3 inline mr-0.5" />{app.mes_aplicacion}</span>
                          <span><DollarSign className="h-3 w-3 inline" />{app.costo_estimado_usd} USD</span>
                        </div>
                        {app.notas && <p className="text-xs text-muted-foreground/70 mt-1">{app.notas}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
