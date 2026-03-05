/**
 * ClimaFichaResumen — Resumen visual de una ficha de campo completada.
 * Muestra cards por bloque y dimensión con semáforo de riesgo.
 * 
 * Source: Guía Completa del Protocolo VITAL v2.0, Sección 4
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Shield, Sprout, Droplets, Bug, Wallet, GraduationCap, Cloud } from 'lucide-react';
import {
  type ResultadoFicha,
  type AlertaFicha,
  BLOQUES_LABELS,
  getNivelRiesgoFicha,
  getNivelRiesgoColor,
} from '@/lib/climaFichaScoring';

interface ClimaFichaResumenProps {
  resultado: ResultadoFicha;
  alertas: AlertaFicha[];
  tecnicoNombre?: string;
  fecha?: string;
}

const BLOQUE_ICONS: Record<string, typeof Sprout> = {
  produccion: Sprout,
  clima_agua: Droplets,
  suelo_manejo: Cloud,
  plagas_enfermedades: Bug,
  diversificacion_ingresos: Wallet,
  capacidades_servicios: GraduationCap,
};

function getRiskBadgeStyle(nivel: string): string {
  switch (nivel) {
    case 'bajo': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    case 'medio': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    case 'alto': return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
    case 'critico': return 'bg-destructive/10 text-destructive border-destructive/30';
    default: return '';
  }
}

function getRiskLabel(nivel: string): string {
  switch (nivel) {
    case 'bajo': return 'Bajo';
    case 'medio': return 'Medio';
    case 'alto': return 'Alto';
    case 'critico': return 'Crítico';
    default: return nivel;
  }
}

export default function ClimaFichaResumen({ resultado, alertas, tecnicoNombre, fecha }: ClimaFichaResumenProps) {
  const nivelGlobal = resultado.nivel_riesgo_global;
  const bloqueScores: [string, number][] = [
    ['produccion', resultado.riesgo_produccion],
    ['clima_agua', resultado.riesgo_clima_agua],
    ['suelo_manejo', resultado.riesgo_suelo_manejo],
    ['plagas_enfermedades', resultado.riesgo_plagas],
    ['diversificacion_ingresos', resultado.riesgo_diversificacion],
    ['capacidades_servicios', resultado.riesgo_capacidades],
  ];

  const dimensionScores: [string, number][] = [
    ['Exposición', resultado.exposicion_score],
    ['Sensibilidad', resultado.sensibilidad_score],
    ['Capacidad Adaptativa', resultado.capacidad_adaptativa_score],
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            Resumen de Ficha de Campo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {tecnicoNombre && `Evaluada por ${tecnicoNombre}`}
                {fecha && ` — ${fecha}`}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Índice Global: <span className={`font-bold ${getNivelRiesgoColor(nivelGlobal)}`}>
                  {resultado.indice_global.toFixed(2)}/3.00
                </span>
              </p>
            </div>
            <Badge className={getRiskBadgeStyle(nivelGlobal)}>
              Riesgo {getRiskLabel(nivelGlobal)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {alertas.length > 0 && (
        <Card className="border-orange-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold text-foreground">Alertas Prioritarias</span>
            </div>
            <div className="space-y-2">
              {alertas.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <span className="text-sm text-foreground">{a.label}</span>
                  <Badge className={getRiskBadgeStyle(a.nivel)}>
                    {a.valor.toFixed(1)}/3.0
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bloques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {bloqueScores.map(([key, score]) => {
          const nivel = getNivelRiesgoFicha(score);
          const Icon = BLOQUE_ICONS[key] ?? Sprout;
          const pct = (score / 3) * 100;
          return (
            <Card key={key} className="overflow-hidden">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {BLOQUES_LABELS[key] ?? key}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${getNivelRiesgoColor(nivel)}`}>
                    {score.toFixed(1)}/3.0
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      nivel === 'bajo' ? 'bg-emerald-500' :
                      nivel === 'medio' ? 'bg-amber-500' :
                      nivel === 'alto' ? 'bg-orange-500' : 'bg-destructive'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dimensiones */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Dimensiones IPCC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {dimensionScores.map(([label, score]) => {
              const nivel = getNivelRiesgoFicha(score);
              return (
                <div key={label} className="text-center p-3 rounded-lg border border-border">
                  <p className={`text-lg font-bold ${getNivelRiesgoColor(nivel)}`}>
                    {score.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <Badge variant="outline" className={`mt-1 text-[10px] ${getRiskBadgeStyle(nivel)}`}>
                    {getRiskLabel(nivel)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
