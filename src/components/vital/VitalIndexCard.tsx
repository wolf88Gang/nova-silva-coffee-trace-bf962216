/**
 * VitalIndexCard — Componente visual principal del Protocolo VITAL.
 * Grid 2 columnas: Score + barras a la izquierda, radar a la derecha.
 * 
 * Source: Guía Completa del Protocolo VITAL v2.0
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Cloud, Sprout, RefreshCcw, AlertTriangle } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

export type NivelResiliencia = 'vulnerable' | 'en_riesgo' | 'estable' | 'resiliente';

interface VitalIndexCardProps {
  indiceGlobal: number;            // 0-100
  climaEntorno: number;            // 0-100 (Exposición)
  estructuraProductiva: number;    // 0-100 (Sensibilidad)
  respuestaAdaptativa: number;     // 0-100 (Capacidad)
  nivelResiliencia: NivelResiliencia;
  falsaResiliencia?: boolean;
  gapComponentes?: number;
  interpretacion?: string;
}

const NIVEL_CONFIG: Record<NivelResiliencia, { label: string; color: string }> = {
  vulnerable:  { label: 'Vulnerable',  color: 'bg-destructive/10 text-destructive border-destructive/30' },
  en_riesgo:   { label: 'En Riesgo',   color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  estable:     { label: 'Estable',      color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  resiliente:  { label: 'Resiliente',   color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
};

function getProgressColor(value: number): string {
  if (value >= 75) return 'bg-emerald-500';
  if (value >= 55) return 'bg-blue-500';
  if (value >= 35) return 'bg-amber-500';
  return 'bg-destructive';
}

function getScoreColor(value: number): string {
  if (value >= 75) return 'text-emerald-600';
  if (value >= 55) return 'text-blue-500';
  if (value >= 35) return 'text-amber-500';
  return 'text-destructive';
}

const COMPONENTES = [
  { key: 'clima', label: 'Clima y Entorno', icon: Cloud, descripcion: 'Factores externos de riesgo', peso: '35%' },
  { key: 'estructura', label: 'Estructura Productiva', icon: Sprout, descripcion: 'Vulnerabilidad del sistema', peso: '30%' },
  { key: 'respuesta', label: 'Respuesta Adaptativa', icon: RefreshCcw, descripcion: 'Capacidad de respuesta', peso: '35%' },
] as const;

export default function VitalIndexCard({
  indiceGlobal,
  climaEntorno,
  estructuraProductiva,
  respuestaAdaptativa,
  nivelResiliencia,
  falsaResiliencia = false,
  gapComponentes,
  interpretacion,
}: VitalIndexCardProps) {
  const config = NIVEL_CONFIG[nivelResiliencia];
  const values = { clima: climaEntorno, estructura: estructuraProductiva, respuesta: respuestaAdaptativa };

  const radarData = [
    { dim: 'Clima y Entorno', value: climaEntorno, fullMark: 100 },
    { dim: 'Estructura Productiva', value: estructuraProductiva, fullMark: 100 },
    { dim: 'Respuesta Adaptativa', value: respuestaAdaptativa, fullMark: 100 },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          Índice Global de Resiliencia (IGRN)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Columna 1: Score + barras */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={config.color}>{config.label}</Badge>
              <span className={`text-7xl font-bold ${getScoreColor(indiceGlobal)}`}>
                {indiceGlobal}
              </span>
            </div>
            <Progress value={indiceGlobal} className="h-3" />

            <div className="space-y-3 mt-4">
              {COMPONENTES.map(comp => {
                const val = values[comp.key];
                return (
                  <div key={comp.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <comp.icon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-sm font-medium text-foreground">{comp.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">({comp.peso})</span>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${getScoreColor(val)}`}>{val}/100</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${getProgressColor(val)}`} style={{ width: `${val}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{comp.descripcion}</p>
                  </div>
                );
              })}
            </div>

            {falsaResiliencia && (
              <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Alerta de Falsa Resiliencia</p>
                    <p className="text-xs text-amber-700 dark:text-amber-500">
                      Diferencia de {gapComponentes ? Math.round(gapComponentes * 100) : '40+'} puntos entre componentes.
                      Un puntaje global aceptable puede enmascarar vulnerabilidades críticas en dimensiones específicas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {interpretacion && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-semibold text-primary mb-1">Interpretación Nova Silva</p>
                <p className="text-sm text-muted-foreground">{interpretacion}</p>
              </div>
            )}
          </div>

          {/* Columna 2: Radar */}
          <div className="flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="dim" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Radar name="IGRN" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-3 w-full mt-2">
              {COMPONENTES.map(comp => {
                const val = values[comp.key];
                return (
                  <div key={comp.key} className="text-center p-2 rounded-lg border border-border">
                    <p className={`text-lg font-bold ${getScoreColor(val)}`}>{val}%</p>
                    <p className="text-[10px] text-muted-foreground">{comp.label}</p>
                    <p className="text-[9px] text-muted-foreground">{comp.peso}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
