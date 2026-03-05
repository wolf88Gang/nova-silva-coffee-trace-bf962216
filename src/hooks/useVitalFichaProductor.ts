/**
 * useVitalFichaProductor — Hook para fichas de campo VITAL del productor.
 * 
 * Las fichas son completadas por técnicos en visitas de campo.
 * Mientras no hay tablas reales, devuelve datos demo.
 * 
 * Source: Guía Completa del Protocolo VITAL v2.0, Sección 4
 */

import { useMemo } from 'react';
import {
  calcularResultadoFicha,
  generarAlertasFicha,
  type ResultadoFicha,
  type AlertaFicha,
} from '@/lib/climaFichaScoring';

export interface FichaProductor {
  id: string;
  productorId: string;
  productorNombre: string;
  tecnicoNombre: string;
  fecha: string;
  resultado: ResultadoFicha;
  alertas: AlertaFicha[];
  observaciones?: string;
}

// ── Demo data ──

const DEMO_FICHAS: FichaProductor[] = [
  buildDemoFicha('f1', '1', 'Juan Pérez', 'Ing. Roberto Castañeda', '2026-02-15', {
    produccion: [1.0, 0.5, 1.5], clima_agua: [0.5, 1.0, 0.5],
    suelo_manejo: [1.0, 1.5, 1.0], plagas_enfermedades: [2.0, 1.5, 2.5],
    diversificacion_ingresos: [1.0, 1.0], capacidades_servicios: [0.5, 0.5, 1.0],
  }),
  buildDemoFicha('f2', '3', 'Pedro González', 'Ing. Sofía Villagrán', '2026-01-28', {
    produccion: [2.0, 2.5, 2.0], clima_agua: [1.5, 2.0, 1.5],
    suelo_manejo: [2.5, 2.0, 2.5], plagas_enfermedades: [2.5, 3.0, 2.5],
    diversificacion_ingresos: [2.0, 2.5], capacidades_servicios: [1.5, 2.0, 2.0],
  }),
  buildDemoFicha('f3', '5', 'Luis Morales', 'Ing. Sofía Villagrán', '2025-12-20', {
    produccion: [2.5, 3.0, 2.5], clima_agua: [2.0, 2.5, 2.0],
    suelo_manejo: [3.0, 2.5, 3.0], plagas_enfermedades: [2.0, 2.0, 2.5],
    diversificacion_ingresos: [2.5, 3.0], capacidades_servicios: [2.5, 2.5, 3.0],
  }),
];

function buildDemoFicha(
  id: string,
  productorId: string,
  productorNombre: string,
  tecnicoNombre: string,
  fecha: string,
  bloques: Record<string, number[]>,
): FichaProductor {
  // Derive dimensions from blocks (simplified mapping)
  const dimensiones: Record<string, number[]> = {
    exposicion: [...(bloques['clima_agua'] ?? []), ...(bloques['plagas_enfermedades'] ?? [])],
    sensibilidad: [...(bloques['produccion'] ?? []), ...(bloques['suelo_manejo'] ?? [])],
    capacidad_adaptativa: [...(bloques['diversificacion_ingresos'] ?? []), ...(bloques['capacidades_servicios'] ?? [])],
  };

  const resultado = calcularResultadoFicha(bloques, dimensiones);
  const alertas = generarAlertasFicha(resultado);

  return { id, productorId, productorNombre, tecnicoNombre, fecha, resultado, alertas };
}

/**
 * Hook para obtener fichas de campo de un productor o todas.
 */
export function useVitalFichaProductor(productorId?: string) {
  const fichas = useMemo(() => {
    if (productorId) {
      return DEMO_FICHAS.filter(f => f.productorId === productorId);
    }
    return DEMO_FICHAS;
  }, [productorId]);

  return {
    fichas,
    isLoading: false,
    totalFichas: fichas.length,
  };
}
