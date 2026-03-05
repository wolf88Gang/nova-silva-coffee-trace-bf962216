import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Bug, CloudRain, MapPin, AlertTriangle, Plus, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { tooltipStyle, tooltipItemStyle, tooltipLabelStyle, chartCursorStyle } from '@/lib/chartStyles';
import { toast } from 'sonner';

interface Alerta {
  id: number;
  titulo: string;
  zona: string;
  fecha: string;
  severity: 'destructive' | 'warning' | 'success';
  tipo: string;
  descripcion: string;
  acciones: string;
}

const alertasIniciales: Alerta[] = [
  { id: 1, titulo: 'Brote de Broca en Sector Norte', zona: 'Zona Norte — Veredas El Progreso, La Unión', fecha: '2026-02-24', severity: 'destructive', tipo: 'Broca', descripcion: 'Incidencia de broca del café detectada al 15.4%, superando el umbral económico de 5%. Se requiere intervención inmediata con Beauveria bassiana.', acciones: 'Aplicar Beauveria bassiana en parcelas afectadas. Revisar trampas de alcohol-metanol. Programar monitoreo semanal.' },
  { id: 2, titulo: 'Condiciones favorables para Roya', zona: 'Zona Central — Humedad relativa >85%', fecha: '2026-02-23', severity: 'warning', tipo: 'Roya', descripcion: 'Humedad relativa persistente superior al 85% con temperaturas entre 20-25°C. Condiciones ideales para el desarrollo de Hemileia vastatrix.', acciones: 'Aplicación preventiva de fungicida cúprico. Aumentar frecuencia de monitoreo en parcelas susceptibles.' },
  { id: 3, titulo: 'Aplicación preventiva completada', zona: 'Zona Sur — 12 fincas tratadas', fecha: '2026-02-22', severity: 'success', tipo: 'Preventivo', descripcion: 'Aplicación exitosa de caldo bordelés en 12 fincas de Zona Sur como parte del plan preventivo mensual.', acciones: 'Seguimiento a los 15 días post-aplicación. Registrar observaciones de eficacia.' },
];

// Chart data
const incidenciaMensual = [
  { mes: 'Sep', roya: 2.5, broca: 3.1, ojo: 0.5 },
  { mes: 'Oct', roya: 3.2, broca: 4.8, ojo: 0.8 },
  { mes: 'Nov', roya: 2.8, broca: 6.2, ojo: 1.2 },
  { mes: 'Dic', roya: 1.9, broca: 8.5, ojo: 0.6 },
  { mes: 'Ene', roya: 2.1, broca: 12.3, ojo: 0.9 },
  { mes: 'Feb', roya: 3.5, broca: 15.4, ojo: 1.1 },
];

const zonasAfectadas = [
  { zona: 'Norte', incidencia: 15.4 },
  { zona: 'Central', incidencia: 6.2 },
  { zona: 'Sur', incidencia: 2.1 },
  { zona: 'Este', incidencia: 4.8 },
];

const insumosSanidad = [
  { name: 'Beauveria bassiana', value: 35, color: 'hsl(var(--primary))' },
  { name: 'Caldo bordelés', value: 25, color: 'hsl(142, 60%, 45%)' },
  { name: 'Extracto de neem', value: 20, color: 'hsl(var(--accent))' },
  { name: 'Trichoderma', value: 12, color: 'hsl(210, 60%, 50%)' },
  { name: 'Otros', value: 8, color: 'hsl(var(--muted-foreground))' },
];

const climaTendencia = [
  { dia: '18', temp: 26, hr: 78 },
  { dia: '19', temp: 27, hr: 80 },
  { dia: '20', temp: 28, hr: 85 },
  { dia: '21', temp: 27, hr: 82 },
  { dia: '22', temp: 29, hr: 76 },
  { dia: '23', temp: 28, hr: 88 },
  { dia: '24', temp: 28, hr: 78 },
];

const severityBadge = (s: string) => {
  if (s === 'destructive') return <Badge variant="destructive">Crítica</Badge>;
  if (s === 'warning') return <Badge className="bg-amber-500 text-white border-0">Moderada</Badge>;
  return <Badge className="bg-emerald-500 text-white border-0">Resuelta</Badge>;
};

const PARCELAS_DEMO = ['La Esperanza', 'El Porvenir', 'Finca Alta', 'Los Cedros', 'Monte Verde'];

const OBSERVACIONES = [
  { id: 'fumigando', icon: '🧪', titulo: 'Vecinos fumigando', desc: 'Noto actividad de aplicación en fincas cercanas' },
  { id: 'olor', icon: '👃', titulo: 'Olor extraño', desc: 'Percibo olores químicos o de descomposición' },
  { id: 'insectos', icon: '🪰', titulo: 'Muchos insectos volando', desc: 'Aumento inusual de insectos en la zona' },
  { id: 'marchitas', icon: '🥀', titulo: 'Plantas marchitas en la zona', desc: 'Veo plantas afectadas en fincas vecinas' },
  { id: 'rumores', icon: '💬', titulo: 'Rumores de plaga en comunidad', desc: 'Otros productores mencionan problemas' },
];

export default function NovaGuardTab() {
  const [alertas, setAlertas] = useState(alertasIniciales);
  const [showDetalle, setShowDetalle] = useState<Alerta | null>(null);
  const [showReporte, setShowReporte] = useState(false);
  const [reporteForm, setReporteForm] = useState({ parcela: '', observacion: '', descripcion: '' });

  const handleReportarSospecha = () => {
    if (!reporteForm.observacion) { toast.error('Seleccione qué observa'); return; }
    const obs = OBSERVACIONES.find(o => o.id === reporteForm.observacion);
    const nueva: Alerta = {
      id: Date.now(), titulo: `Sospecha: ${obs?.titulo || reporteForm.observacion}`,
      zona: reporteForm.parcela || 'Sin especificar', fecha: new Date().toISOString().slice(0, 10),
      severity: 'warning', tipo: 'Sospecha vecinal',
      descripcion: reporteForm.descripcion || obs?.desc || 'Indicio reportado desde campo. Pendiente de verificación.',
      acciones: 'Programar visita de verificación técnica. Tomar muestras para diagnóstico.',
    };
    setAlertas(prev => [nueva, ...prev]);
    toast.success('Alerta amarilla enviada. Gracias por tu vigilancia comunitaria.');
    setShowReporte(false);
    setReporteForm({ parcela: '', observacion: '', descripcion: '' });
  };

  const handleResolver = (id: number) => {
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, severity: 'success' as const } : a));
    toast.success('Alerta marcada como resuelta');
    setShowDetalle(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">Monitoreo fitosanitario y alertas de campo</p>
        <Button size="sm" onClick={() => setShowReporte(true)}>
          <Plus className="h-4 w-4 mr-1" /> Reportar Sospecha
        </Button>
      </div>

      {/* Incidence cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><Bug className="h-5 w-5 text-primary" /><span className="font-bold text-foreground">Roya</span></div>
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">Normal</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Incidencia en parcelas monitoreadas</p>
            <p className="text-3xl font-bold text-primary mt-1">2.1%</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><Bug className="h-5 w-5 text-destructive" /><span className="font-bold text-foreground">Broca</span></div>
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0">⚠ ALERTA</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Umbral económico: 5%</p>
            <p className="text-3xl font-bold text-destructive mt-1">15.4%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><CloudRain className="h-5 w-5 text-blue-500" /><span className="font-bold text-foreground">Clima</span></div>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0">Estable</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Condiciones actuales promedio</p>
            <p className="text-xl font-bold text-foreground mt-1">28°C / 78% HR</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Tendencia de Incidencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={incidenciaMensual}>
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} formatter={(v: number) => [`${v}%`]} />
                <Area type="monotone" dataKey="broca" stroke="hsl(0, 65%, 50%)" fill="hsl(0, 65%, 50%)" fillOpacity={0.15} strokeWidth={2} name="Broca" />
                <Area type="monotone" dataKey="roya" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} name="Roya" />
                <Area type="monotone" dataKey="ojo" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.05} strokeWidth={1} name="Ojo de gallo" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Incidencia por Zona
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={zonasAfectadas} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="zona" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={60} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={chartCursorStyle} formatter={(v: number) => [`${v}%`]} />
                <Bar dataKey="incidencia" radius={[0, 4, 4, 0]} name="Incidencia">
                  {zonasAfectadas.map((d, i) => (
                    <Cell key={i} fill={d.incidencia > 10 ? 'hsl(0, 65%, 50%)' : d.incidencia > 5 ? 'hsl(45, 90%, 50%)' : 'hsl(142, 60%, 45%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Proyección de Insumos Fitosanitarios</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={insumosSanidad} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                  {insumosSanidad.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} formatter={(v: number) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Clima 7 Días (Temp. y HR)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={climaTendencia}>
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
                <Line type="monotone" dataKey="temp" stroke="hsl(0, 65%, 50%)" strokeWidth={2} name="Temp (°C)" dot={false} />
                <Line type="monotone" dataKey="hr" stroke="hsl(210, 60%, 50%)" strokeWidth={2} name="HR (%)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-accent" /> Alertas Activas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alertas.map((a) => (
            <div key={a.id} className="p-3 rounded-md bg-muted/50 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.zona}</p>
                  <p className="text-xs text-muted-foreground">{a.fecha}</p>
                </div>
                {severityBadge(a.severity)}
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setShowDetalle(a)}>Ver detalles</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ═══ DETALLE ALERTA DIALOG ═══ */}
      <Dialog open={!!showDetalle} onOpenChange={() => setShowDetalle(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {showDetalle && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" /> {showDetalle.titulo}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {severityBadge(showDetalle.severity)}
                  <Badge variant="outline">{showDetalle.tipo}</Badge>
                  <span className="text-xs text-muted-foreground">{showDetalle.fecha}</span>
                </div>
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">ZONA AFECTADA</p>
                  <p className="text-sm text-foreground">{showDetalle.zona}</p>
                </div>
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">DESCRIPCIÓN</p>
                  <p className="text-sm text-foreground">{showDetalle.descripcion}</p>
                </div>
                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">ACCIONES RECOMENDADAS</p>
                  <p className="text-sm text-foreground">{showDetalle.acciones}</p>
                </div>
                {showDetalle.severity !== 'success' && (
                  <Button className="w-full" onClick={() => handleResolver(showDetalle.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Marcar como Resuelta
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ REPORTAR SOSPECHA VECINAL ═══ */}
      <Dialog open={showReporte} onOpenChange={setShowReporte}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center h-8 w-8 rounded-full border border-amber-500 text-amber-500">👁</span>
              Reportar Sospecha Vecinal
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Tu observación ayuda a la comunidad. Reporta indicios aunque no tengas síntomas confirmados.</p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Parcela selector */}
            <div className="space-y-2">
              <Label>Parcela</Label>
              <Select value={reporteForm.parcela} onValueChange={v => setReporteForm(s => ({ ...s, parcela: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccione parcela..." /></SelectTrigger>
                <SelectContent>{PARCELAS_DEMO.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Observation cards */}
            <div className="space-y-1.5">
              <Label>¿Qué observas?</Label>
              <div className="space-y-2">
                {OBSERVACIONES.map(obs => (
                  <button
                    key={obs.id}
                    type="button"
                    onClick={() => setReporteForm(s => ({ ...s, observacion: s.observacion === obs.id ? '' : obs.id }))}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      reporteForm.observacion === obs.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground/40 hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-xl shrink-0">{obs.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{obs.titulo}</p>
                      <p className="text-xs text-muted-foreground">{obs.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>¿Qué observaste?</Label>
              <Textarea
                value={reporteForm.descripcion}
                onChange={e => setReporteForm(s => ({ ...s, descripcion: e.target.value }))}
                rows={3}
                placeholder="Describe lo que viste: color, ubicación en la planta, cantidad de plantas afectadas..."
              />
            </div>

            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={handleReportarSospecha}>
              <MapPin className="h-4 w-4 mr-1" /> Enviar Alerta Amarilla
            </Button>
            <p className="text-xs text-center text-muted-foreground">Las alertas amarillas son indicios de baja certeza que ayudan a la vigilancia comunitaria.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
