import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, AlertTriangle, ClipboardCheck, Ruler, Layers, Beaker, Camera, FlaskConical, Grape, Clock } from 'lucide-react';
import { getNutricionStats } from '@/lib/demo-data';

/* ── Protocolo mínimo obligatorio (§3.2.1 Fase 3) ── */
interface ProtocolItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const PROTOCOL_ITEMS: ProtocolItem[] = [
  { id: 'submuestras', label: '15–20 submuestras/ha', description: 'Recolectar entre 15 y 20 submuestras distribuidas en zigzag por hectárea.', icon: Layers },
  { id: 'profundidad', label: 'Profundidad 0–20 cm', description: 'Profundidad estandarizada o definida por ruleset regional.', icon: Ruler },
  { id: 'homogeneizacion', label: 'Homogeneización adecuada', description: 'Mezclar todas las submuestras en un recipiente limpio antes de tomar la muestra compuesta.', icon: ClipboardCheck },
  { id: 'exclusion', label: 'Evitar bordes y anomalías', description: 'No muestrear bordes, caminos, debajo de árboles de sombra ni manchas anómalas.', icon: AlertTriangle },
  { id: 'identificacion', label: 'Identificación parcela + fecha', description: 'Etiqueta clara con código de parcela, fecha de muestreo y responsable.', icon: ClipboardCheck },
  { id: 'metodo_p', label: 'Método P declarado', description: 'Indicar método de fósforo: Bray II, Olsen o Mehlich según laboratorio.', icon: Beaker },
  { id: 'evidencia', label: 'Evidencia fotográfica', description: 'Foto de la bolsa etiquetada como respaldo de trazabilidad.', icon: Camera },
];

/* ── Demo data — placeholder until ag_sampling_protocol_logs exists ── */
interface SamplingLog {
  id: string;
  parcela: string;
  fecha: string;
  submuestras: number;
  profundidad: number;
  metodoP: string;
  cumplimiento: number;
  validado: boolean;
}

const DEMO_LOGS: SamplingLog[] = [
  { id: '1', parcela: 'Parcela El Roble — 2.5 ha', fecha: '2026-01-15', submuestras: 18, profundidad: 20, metodoP: 'Bray II', cumplimiento: 95, validado: true },
  { id: '2', parcela: 'Parcela La Ceiba — 1.8 ha', fecha: '2026-01-20', submuestras: 12, profundidad: 20, metodoP: 'Olsen', cumplimiento: 60, validado: false },
  { id: '3', parcela: 'Parcela Los Pinos — 3.0 ha', fecha: '2026-02-05', submuestras: 20, profundidad: 15, metodoP: 'Bray II', cumplimiento: 85, validado: true },
  { id: '4', parcela: 'Parcela Río Claro — 1.2 ha', fecha: '2026-02-10', submuestras: 8, profundidad: 10, metodoP: 'Mehlich', cumplimiento: 40, validado: false },
];

function CumplimientoBadge({ pct }: { pct: number }) {
  if (pct >= 80) return <Badge className="bg-primary/15 text-primary border-primary/30">Válido ({pct}%)</Badge>;
  if (pct >= 50) return <Badge variant="secondary">Heurístico ({pct}%)</Badge>;
  return <Badge variant="destructive">Rechazado ({pct}%)</Badge>;
}

export default function ProtocoloMuestreoTab() {
  const validados = DEMO_LOGS.filter(l => l.validado).length;
  const cumplimientoPromedio = Math.round(DEMO_LOGS.reduce((s, l) => s + l.cumplimiento, 0) / DEMO_LOGS.length);
  const stats = getNutricionStats();

  return (
    <div className="space-y-6">
      {/* ── Calidad de datos §3.8.2 ── */}
      <Card className="border-dashed border-accent">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-accent-foreground" />
            Calidad de datos — Indicadores operativos
          </CardTitle>
          <CardDescription>§3.8.2 — Métricas de completitud y vigencia de los análisis de suelo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Análisis válidos vs total */}
            <div className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Análisis válidos
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.analisisValidos}/{stats.analisisTotales}</p>
              <Progress value={Math.round((stats.analisisValidos / stats.analisisTotales) * 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">{Math.round((stats.analisisValidos / stats.analisisTotales) * 100)}% vigentes</p>
            </div>

            {/* Análisis vencidos */}
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4 text-destructive" />
                Análisis vencidos
              </div>
              <p className="text-2xl font-bold text-destructive">{stats.analisisVencidos}</p>
              <p className="text-xs text-muted-foreground">Requieren nuevo muestreo para ser válidos</p>
            </div>

            {/* Parcelas sin variedad */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Grape className="h-4 w-4 text-amber-600" />
                Sin variedad definida
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.parcelasSinVariedad}</p>
              <p className="text-xs text-muted-foreground">Parcelas sin variedad — afecta cálculo de dosis</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Resumen ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Muestreos registrados</p>
            <p className="text-2xl font-bold text-foreground">{DEMO_LOGS.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Validados</p>
            <p className="text-2xl font-bold text-foreground">{validados}/{DEMO_LOGS.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Cumplimiento promedio</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={cumplimientoPromedio} className="h-2 flex-1" />
              <span className="text-sm font-semibold text-foreground">{cumplimientoPromedio}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Checklist protocolo ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Protocolo mínimo obligatorio
          </CardTitle>
          <CardDescription>
            Requisitos para que un análisis de suelo sea aceptado como válido (§3.2.1)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PROTOCOL_ITEMS.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <item.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Tabla registros ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registros de muestreo</CardTitle>
          <CardDescription>
            Datos demo — se conectarán a <code>ag_sampling_protocol_logs</code> cuando la tabla exista.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parcela</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-center">Submuestras</TableHead>
                <TableHead className="text-center">Prof. (cm)</TableHead>
                <TableHead>Método P</TableHead>
                <TableHead>Cumplimiento</TableHead>
                <TableHead className="text-center">Validado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_LOGS.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.parcela}</TableCell>
                  <TableCell>{log.fecha}</TableCell>
                  <TableCell className="text-center">{log.submuestras}</TableCell>
                  <TableCell className="text-center">{log.profundidad}</TableCell>
                  <TableCell>{log.metodoP}</TableCell>
                  <TableCell><CumplimientoBadge pct={log.cumplimiento} /></TableCell>
                  <TableCell className="text-center">
                    {log.validado
                      ? <CheckCircle2 className="h-4 w-4 text-primary mx-auto" />
                      : <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
