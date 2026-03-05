import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Shield, TrendingDown, FileText, ChevronRight } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import type { ResultadoClimaProductor } from '@/lib/climaScoring';
import { BLOQUES_INFO } from '@/config/climaProductor';
import { generarInterpretacion, type NivelRiesgoProductor } from '@/lib/climaInterpretacion';

interface Props {
  resultado: ResultadoClimaProductor;
  compact?: boolean;
  nombre?: string;
  comunidad?: string;
}

const nivelBadgeClass: Record<string, string> = {
  Resiliente: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'En Construcción': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  Fragilidad: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Crítica': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function mapNivelToRiesgo(nivel: string): NivelRiesgoProductor {
  switch (nivel) {
    case 'Resiliente': return 'bajo';
    case 'En Construcción': return 'medio';
    case 'Fragilidad': return 'alto';
    case 'Crítica': return 'critico';
    default: return 'medio';
  }
}

function scoreToNivelRiesgo(score: number): NivelRiesgoProductor {
  if (score <= 0.25) return 'bajo';
  if (score <= 0.50) return 'medio';
  if (score <= 0.75) return 'alto';
  return 'critico';
}

export default function VitalResultadoCard({ resultado, compact = false, nombre, comunidad }: Props) {
  const radarData = [
    { dim: 'Exposición', value: Math.round(resultado.exposicion * 100) },
    { dim: 'Sensibilidad', value: Math.round(resultado.sensibilidad * 100) },
    { dim: 'Cap. Adaptativa', value: Math.round(resultado.capacidadAdaptativa * 100) },
  ];

  // Generate interpretation
  const interpretacion = useMemo(() => {
    const nivelRiesgo = mapNivelToRiesgo(resultado.nivel);
    return generarInterpretacion({
      productor: { nombre: nombre ?? 'Productor', comunidad },
      indice_clima: resultado.indiceGlobal,
      nivel_riesgo_global: nivelRiesgo,
      puntaje_exposicion: Math.round(resultado.exposicion * 100),
      puntaje_sensibilidad: Math.round(resultado.sensibilidad * 100),
      puntaje_capacidad_adaptativa: Math.round(resultado.capacidadAdaptativa * 100),
      riesgo_exposicion: scoreToNivelRiesgo(resultado.exposicion),
      riesgo_sensibilidad: scoreToNivelRiesgo(resultado.sensibilidad),
      riesgo_capacidad_adaptativa: scoreToNivelRiesgo(1 - resultado.capacidadAdaptativa),
      factores_riesgo: resultado.factoresRiesgo.slice(0, 5).map(f => ({
        codigo: f.codigo,
        bloque: f.bloque,
        pregunta: f.texto,
        dimension: 'exposicion',
        impacto: f.impacto >= 3 ? 'alto' as const : 'medio' as const,
      })),
    });
  }, [resultado, nombre, comunidad]);

  return (
    <div className="space-y-4">
      {/* Score principal */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            Índice Global de Resiliencia (IGRN)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={nivelBadgeClass[resultado.nivel] ?? ''}>{resultado.nivel}</Badge>
            <span className={`text-4xl font-bold ${resultado.nivelColor}`}>{resultado.indiceGlobal}</span>
          </div>
          <Progress value={resultado.indiceGlobal} className="h-3" />

          {resultado.falsaResiliencia && (
            <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-400">{resultado.mensajeFalsaResiliencia}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!compact && (
        <>
          {/* Radar de dimensiones */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Dimensiones de Resiliencia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Radar name="Puntaje" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {radarData.map(d => (
                  <div key={d.dim} className="text-center">
                    <p className="text-lg font-bold text-foreground">{d.value}%</p>
                    <p className="text-xs text-muted-foreground">{d.dim}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interpretación Nova Silva */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Interpretación Nova Silva
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-primary mb-1">Qué es el Protocolo VITAL</p>
                <p className="text-sm text-muted-foreground">{interpretacion.queEsDiagnostico}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary mb-1">Resumen de tu situación</p>
                <p className="text-sm text-muted-foreground">{interpretacion.resumenSituacion}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary mb-1">Análisis por Dimensión</p>
                <div className="space-y-2">
                  {Object.entries(interpretacion.analisisDimensiones).map(([key, dim]) => (
                    <div key={key} className="p-2 rounded-lg border border-border">
                      <p className="text-sm font-medium text-foreground">{dim.titulo} — {dim.nivel}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{dim.texto}</p>
                    </div>
                  ))}
                </div>
              </div>

              {interpretacion.factoresCriticos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">Factores Críticos</p>
                  <div className="space-y-2">
                    {interpretacion.factoresCriticos.map((f, i) => (
                      <div key={i} className="p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="destructive" className="text-[10px]">{f.nivelRiesgo}</Badge>
                          <span className="text-sm font-medium text-foreground">{f.titulo}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{f.queHacer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {interpretacion.pasosCorto.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">Pasos a corto plazo (6-12 meses)</p>
                  <ul className="space-y-1">
                    {interpretacion.pasosCorto.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {interpretacion.pasosMediano.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">Pasos a mediano plazo (1-3 años)</p>
                  <ul className="space-y-1">
                    {interpretacion.pasosMediano.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-primary mb-1">Cómo te puede apoyar tu organización</p>
                <ul className="space-y-1">
                  {interpretacion.apoyoCooperativa.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />{a}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Bloques */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Puntaje por Bloque Temático</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resultado.bloques.map(b => {
                const info = BLOQUES_INFO[b.bloque];
                return (
                  <div key={b.bloque} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{info?.titulo ?? b.bloque}</span>
                      <span className="font-medium text-foreground">{b.puntaje}/100</span>
                    </div>
                    <Progress value={b.puntaje} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Factores de riesgo */}
          {resultado.factoresRiesgo.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Principales Factores de Riesgo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {resultado.factoresRiesgo.slice(0, 5).map(f => (
                  <div key={f.codigo} className="flex items-start gap-3 p-2 rounded-md bg-destructive/5">
                    <Badge variant="destructive" className="text-[10px] shrink-0 mt-0.5">
                      {f.impacto === 3 ? 'Alto' : 'Medio'}
                    </Badge>
                    <div>
                      <p className="text-sm text-foreground">{f.texto}</p>
                      <p className="text-xs text-muted-foreground capitalize">{BLOQUES_INFO[f.bloque]?.titulo ?? f.bloque}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
