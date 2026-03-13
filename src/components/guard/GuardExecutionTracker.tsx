import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, Clock, AlertTriangle, Camera, Calendar,
  FlaskConical, TrendingDown, TrendingUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface EjecucionItem {
  plan: string;
  parcela: string;
  producto: string;
  tipo: string;
  dosis: string;
  fechaProgramada: string;
  fechaAplicacion: string | null;
  estado: 'Aplicado' | 'Programado' | 'Atrasado';
  eficacia: string | null;
}

const DEMO_EJECUCIONES: EjecucionItem[] = [
  { plan: 'PT-2026-001', parcela: 'El Cedro', producto: 'Caldo bordelés 1%', tipo: 'químico', dosis: '400 L/ha', fechaProgramada: '2026-03-12', fechaAplicacion: '2026-03-12', estado: 'Aplicado', eficacia: '72% reducción roya' },
  { plan: 'PT-2026-001', parcela: 'El Cedro', producto: 'Regulación de sombra', tipo: 'cultural', dosis: '—', fechaProgramada: '2026-03-10', fechaAplicacion: '2026-03-11', estado: 'Aplicado', eficacia: 'Sombra 65% → 45%' },
  { plan: 'PT-2026-001', parcela: 'El Cedro', producto: 'Poda sanitaria', tipo: 'cultural', dosis: '—', fechaProgramada: '2026-03-11', fechaAplicacion: '2026-03-12', estado: 'Aplicado', eficacia: '3 ramas eliminadas/planta' },
  { plan: 'PT-2026-001', parcela: 'El Cedro', producto: 'Trichoderma harzianum', tipo: 'biológico', dosis: '2 kg/ha', fechaProgramada: '2026-03-19', fechaAplicacion: null, estado: 'Programado', eficacia: null },
  { plan: 'PT-2026-001', parcela: 'El Cedro', producto: 'Caldo bordelés 1% (2da)', tipo: 'químico', dosis: '400 L/ha', fechaProgramada: '2026-03-27', fechaAplicacion: null, estado: 'Programado', eficacia: null },
  { plan: 'PT-2026-002', parcela: 'La Esperanza', producto: 'Beauveria bassiana', tipo: 'biológico', dosis: '2×10¹² conidios/ha', fechaProgramada: '2026-03-15', fechaAplicacion: null, estado: 'Atrasado', eficacia: null },
  { plan: 'PT-2026-002', parcela: 'La Esperanza', producto: 'Trampas etanol-metanol', tipo: 'cultural', dosis: '20 trampas/ha', fechaProgramada: '2026-03-12', fechaAplicacion: null, estado: 'Atrasado', eficacia: null },
];

const eficaciaData = [
  { semana: 'S1', incidencia: 15.4, color: 'hsl(var(--destructive))' },
  { semana: 'S2', incidencia: 12.1, color: 'hsl(var(--destructive))' },
  { semana: 'S3', incidencia: 8.5, color: 'hsl(var(--accent))' },
  { semana: 'S4', incidencia: 5.2, color: 'hsl(var(--accent))' },
  { semana: 'Actual', incidencia: 4.3, color: 'hsl(var(--primary))' },
];

const estadoIcon = (estado: string) => {
  if (estado === 'Aplicado') return <CheckCircle2 className="h-4 w-4 text-primary" />;
  if (estado === 'Atrasado') return <AlertTriangle className="h-4 w-4 text-destructive" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
};

const estadoBadge: Record<string, string> = { Aplicado: 'default', Programado: 'secondary', Atrasado: 'destructive' };

interface Props {
  parcelaFilter?: string;
}

export default function GuardExecutionTracker({ parcelaFilter }: Props) {
  const ejecuciones = parcelaFilter
    ? DEMO_EJECUCIONES.filter(e => e.parcela === parcelaFilter)
    : DEMO_EJECUCIONES;

  const aplicados = ejecuciones.filter(e => e.estado === 'Aplicado').length;
  const atrasados = ejecuciones.filter(e => e.estado === 'Atrasado').length;
  const programados = ejecuciones.filter(e => e.estado === 'Programado').length;
  const pctCompletado = ejecuciones.length > 0 ? Math.round((aplicados / ejecuciones.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-primary">{aplicados}</p>
            <p className="text-xs text-muted-foreground">Aplicados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{programados}</p>
            <p className="text-xs text-muted-foreground">Programados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-destructive">{atrasados}</p>
            <p className="text-xs text-muted-foreground">Atrasados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Progress value={pctCompletado} className="flex-1 h-2" />
              <span className="text-sm font-bold">{pctCompletado}%</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">Ejecución global</p>
          </CardContent>
        </Card>
      </div>

      {/* Efficacy chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-primary" /> Evolución de incidencia (roya — El Cedro)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eficaciaData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="semana" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(v: number) => [`${v}%`, 'Incidencia']}
                />
                <Bar dataKey="incidencia" radius={[4, 4, 0, 0]}>
                  {eficaciaData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <TrendingDown className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">
              Incidencia reducida de 15.4% a 4.3% (−72%) en 4 semanas de tratamiento
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Execution list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="h-4 w-4" /> Cronograma de aplicaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ejecuciones.map((e, i) => (
              <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-start gap-2.5">
                  {estadoIcon(e.estado)}
                  <div>
                    <p className="text-sm font-medium">{e.producto}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.parcela} · {e.dosis} · Plan: {e.plan}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Programado: {e.fechaProgramada}
                      {e.fechaAplicacion && ` · Aplicado: ${e.fechaAplicacion}`}
                    </p>
                    {e.eficacia && (
                      <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> {e.eficacia}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={(estadoBadge[e.estado] as any) || 'secondary'} className="text-xs">{e.estado}</Badge>
                  {e.estado !== 'Aplicado' && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      <Camera className="h-3 w-3" /> Registrar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
