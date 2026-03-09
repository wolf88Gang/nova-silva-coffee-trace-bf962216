/**
 * SoilIntelligenceCard — Tarjeta visual de diagnóstico edáfico.
 * Muestra: toxicidad, encalado Kamprath, IFBS, suficiencia de nutrientes.
 * Se alimenta de datos de nutricion_analisis_suelo.
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, ShieldCheck, ShieldX, Beaker, Leaf, Layers, FlaskConical, Ban, CheckCircle2 } from 'lucide-react';
import {
  type SoilAnalysisInput,
  type SoilIntelligenceResult,
  type NutrientStatus,
  analyzeSoil,
} from '@/lib/soilIntelligenceEngine';

interface SoilIntelligenceCardProps {
  /** Datos del análisis de suelo — de nutricion_analisis_suelo */
  soilData: SoilAnalysisInput;
  /** Nombre de la parcela (opcional) */
  parcelaName?: string;
}

const STATUS_CONFIG: Record<NutrientStatus, { label: string; color: string }> = {
  critico: { label: 'Crítico', color: 'bg-destructive text-destructive-foreground' },
  bajo: { label: 'Bajo', color: 'bg-accent text-accent-foreground' },
  optimo: { label: 'Óptimo', color: 'bg-primary text-primary-foreground' },
  alto: { label: 'Alto', color: 'bg-primary/80 text-primary-foreground' },
  exceso: { label: 'Exceso', color: 'bg-destructive/80 text-destructive-foreground' },
};

const IFBS_NIVEL_CONFIG: Record<string, { label: string; color: string }> = {
  muy_alto: { label: 'Muy Alto', color: 'bg-primary text-primary-foreground' },
  alto: { label: 'Alto', color: 'bg-primary/15 text-primary border border-primary/30' },
  medio: { label: 'Medio', color: 'bg-accent/15 text-accent-foreground border border-accent/30' },
  bajo: { label: 'Bajo', color: 'bg-destructive/15 text-destructive border border-destructive/30' },
  muy_bajo: { label: 'Muy Bajo', color: 'bg-destructive/15 text-destructive border border-destructive/30' },
};

function IFBSBar({ label, score, weight }: { label: string; score: number; weight: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label} <span className="opacity-60">({(weight * 100).toFixed(0)}%)</span></span>
        <span className="font-semibold text-foreground">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 60 ? 'bg-primary' : pct >= 40 ? 'bg-accent' : 'bg-destructive'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SoilIntelligenceCard({ soilData, parcelaName }: SoilIntelligenceCardProps) {
  const result: SoilIntelligenceResult = analyzeSoil(soilData);
  const { toxicity, liming, ifbs, sufficiency, canRecommendNPK } = result;

  return (
    <div className="space-y-4">
      {/* ── Toxicidad / Bloqueo ── */}
      {toxicity.blocked && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <Ban className="h-5 w-5" />
              Bloqueo por Toxicidad Edáfica
            </CardTitle>
            <CardDescription className="text-destructive/80">
              Fertilización NPK bloqueada — se requiere encalado correctivo previo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {toxicity.alerts.filter(a => a.severity === 'critico').map((alert, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <ShieldX className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-destructive/90">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Alertas no críticas ── */}
      {toxicity.alerts.filter(a => a.severity !== 'critico').length > 0 && !toxicity.blocked && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4 space-y-2">
            {toxicity.alerts.filter(a => a.severity !== 'critico').map((alert, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-amber-800 dark:text-amber-400">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* ── Encalado Kamprath ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Beaker className="h-5 w-5 text-primary" />
              Recomendación de Encalado
            </CardTitle>
            <CardDescription>Algoritmo de Kamprath — corrección de acidez</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              {liming.required ? (
                <Badge className="bg-destructive text-destructive-foreground">Encalado requerido</Badge>
              ) : (
                <Badge className="bg-primary text-primary-foreground">Sin encalado necesario</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Sat. Al: {liming.alSatPct}% (máx: {liming.alSatMaxTolerated}%)
              </span>
            </div>

            {liming.required && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{liming.doseKgHa.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">kg CaCO₃/ha</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{liming.doseSacosHa}</p>
                  <p className="text-xs text-muted-foreground">sacos (50kg)/ha</p>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">{liming.reason}</p>
            <details className="text-xs">
              <summary className="text-muted-foreground cursor-pointer hover:text-foreground">Trazabilidad del cálculo</summary>
              <p className="mt-1 p-2 rounded bg-muted text-muted-foreground font-mono text-[10px] break-all">{liming.formula}</p>
            </details>
          </CardContent>
        </Card>

        {/* ── IFBS ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              IFBS — Salud Biológica del Suelo
            </CardTitle>
            <CardDescription>Índice Funcional Biológico (§4 Whitepaper)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className={IFBS_NIVEL_CONFIG[ifbs.nivel]?.color ?? ''}>
                {IFBS_NIVEL_CONFIG[ifbs.nivel]?.label}
              </Badge>
              <span className={`text-4xl font-bold ${ifbs.scorePct >= 60 ? 'text-primary' : ifbs.scorePct >= 40 ? 'text-accent-foregroundound' : 'text-destructive'}`}>
                {ifbs.scorePct}
              </span>
            </div>
            <Progress value={ifbs.scorePct} className="h-2.5" />

            <div className="space-y-2 mt-3">
              <IFBSBar label="Carbono / MO" score={ifbs.subindices.carbono.score} weight={ifbs.subindices.carbono.weight} />
              <IFBSBar label="Acidez / pH" score={ifbs.subindices.acidez.score} weight={ifbs.subindices.acidez.weight} />
              <IFBSBar label="Nutrición / Balance" score={ifbs.subindices.nutricion.score} weight={ifbs.subindices.nutricion.weight} />
              <IFBSBar label="Integridad / Manejo" score={ifbs.subindices.integridad.score} weight={ifbs.subindices.integridad.weight} />
            </div>

            <p className="text-xs text-muted-foreground italic mt-2">{ifbs.interpretation}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Suficiencia nutricional ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Suficiencia Nutricional
            {canRecommendNPK ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
            ) : (
              <ShieldX className="h-4 w-4 text-destructive ml-auto" />
            )}
          </CardTitle>
          <CardDescription>
            {canRecommendNPK
              ? 'Clasificación de nutrientes según umbrales edáficos para café'
              : 'Bloqueado — corregir toxicidad antes de prescribir NPK'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {sufficiency.map(n => {
              const cfg = STATUS_CONFIG[n.status];
              return (
                <div key={n.nutrient} className="rounded-lg border border-border p-2.5 text-center space-y-1">
                  <p className="text-xs text-muted-foreground truncate">{n.nutrient}</p>
                  <p className="text-lg font-bold text-foreground">
                    {n.value?.toFixed(n.unit === 'cmol' ? 2 : 1) ?? '—'}
                    {n.unit && <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{n.unit}</span>}
                  </p>
                  <Badge className={`${cfg.color} text-[10px] px-1.5 py-0`}>{cfg.label}</Badge>
                  <p className="text-[9px] text-muted-foreground">{n.range}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Resumen ── */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-2">
          {canRecommendNPK ? (
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          ) : (
            <ShieldX className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-xs font-semibold text-primary mb-0.5">
              Interpretación Nova Silva {parcelaName ? `— ${parcelaName}` : ''}
            </p>
            <p className="text-sm text-muted-foregr whitespace-pre-lineound">{result.summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
