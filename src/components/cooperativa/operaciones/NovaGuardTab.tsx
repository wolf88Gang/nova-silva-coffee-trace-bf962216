import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bug, CloudRain, MapPin, AlertTriangle, Plus, CheckCircle, TrendingUp, BarChart3,
  Upload, Hash, MessageSquare, ShieldCheck, FileText, Camera, Clock, Leaf,
} from 'lucide-react';
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
  resolucion?: {
    justificacion: string;
    evidencias: string[];
    hash: string;
    tecnico: string;
    comentarioTecnico: string;
    fechaResolucion: string;
    interpretacionNovaSilva: string;
    protocoloVital: string;
  };
}

const alertasIniciales: Alerta[] = [
  {
    id: 1, titulo: 'Brote de Broca en Sector Norte', zona: 'Zona Norte — Veredas El Progreso, La Unión', fecha: '2026-02-24', severity: 'destructive', tipo: 'Broca',
    descripcion: 'Incidencia de broca del café detectada al 15.4%, superando el umbral económico de 5%. Se requiere intervención inmediata con Beauveria bassiana.',
    acciones: 'Aplicar Beauveria bassiana en parcelas afectadas. Revisar trampas de alcohol-metanol. Programar monitoreo semanal.',
  },
  {
    id: 2, titulo: 'Condiciones favorables para Roya', zona: 'Zona Central — Humedad relativa >85%', fecha: '2026-02-23', severity: 'warning', tipo: 'Roya',
    descripcion: 'Humedad relativa persistente superior al 85% con temperaturas entre 20-25°C. Condiciones ideales para el desarrollo de Hemileia vastatrix.',
    acciones: 'Aplicación preventiva de fungicida cúprico. Aumentar frecuencia de monitoreo en parcelas susceptibles.',
  },
  {
    id: 3, titulo: 'Aplicación preventiva completada', zona: 'Zona Sur — 12 fincas tratadas', fecha: '2026-02-22', severity: 'success', tipo: 'Preventivo',
    descripcion: 'Aplicación exitosa de caldo bordelés en 12 fincas de Zona Sur como parte del plan preventivo mensual.',
    acciones: 'Seguimiento a los 15 días post-aplicación. Registrar observaciones de eficacia.',
    resolucion: {
      justificacion: 'Aplicación preventiva completada exitosamente en 12 fincas de Zona Sur.',
      evidencias: ['foto_aplicacion_zona_sur_01.jpg', 'reporte_insumos_usados.pdf'],
      hash: 'sha256:a3f2c8e1b9d4...7f6e',
      tecnico: 'Ing. Pedro Martínez',
      comentarioTecnico: 'Aplicación realizada según protocolo. Condiciones climáticas favorables durante la aplicación. Se recomienda monitoreo de eficacia a los 15 días.',
      fechaResolucion: '2026-02-22',
      interpretacionNovaSilva: 'La aplicación preventiva de caldo bordelés en 12 fincas de Zona Sur se ejecutó dentro de la ventana óptima de manejo integrado. Las condiciones de humedad relativa (76-82%) y temperatura (26-28°C) durante la aplicación permitieron una absorción adecuada del producto. El protocolo VITAL de la zona registra un IGRN promedio de 72 puntos ("En Construcción"), lo que indica que estas fincas están fortaleciendo su resiliencia fitosanitaria. La cobertura de sombra regulada (45%) en estas parcelas reduce la probabilidad de reinfección en un 30% según los modelos epidemiológicos de la plataforma.',
      protocoloVital: 'IGRN Zona Sur: 72/100 · Exposición: 65 · Sensibilidad: 58 · Capacidad Adaptativa: 78',
    },
  },
];

// ── Zone detail data ──
interface ZonaDetalle {
  zona: string;
  incidencia: number;
  parcelas: { nombre: string; area: number; incidencia: number; vitalScore: number; ultimoMonitoreo: string; plaga: string }[];
  tratamientosActivos: { producto: string; parcelas: number; fechaAplicacion: string; eficacia: string }[];
  alertasActivas: number;
  tecnicoAsignado: string;
  promedioVital: number;
  precipitacion7d: number;
  humedadPromedio: number;
  interpretacion: string;
}

const zonasDetalle: Record<string, ZonaDetalle> = {
  Norte: {
    zona: 'Norte', incidencia: 15.4,
    parcelas: [
      { nombre: 'El Progreso', area: 2.5, incidencia: 18.2, vitalScore: 58, ultimoMonitoreo: '2026-02-24', plaga: 'Broca' },
      { nombre: 'La Unión', area: 1.8, incidencia: 14.5, vitalScore: 62, ultimoMonitoreo: '2026-02-23', plaga: 'Broca' },
      { nombre: 'Monte Alto', area: 3.1, incidencia: 12.8, vitalScore: 71, ultimoMonitoreo: '2026-02-22', plaga: 'Broca' },
      { nombre: 'Cerro Azul', area: 2.2, incidencia: 16.1, vitalScore: 55, ultimoMonitoreo: '2026-02-24', plaga: 'Broca' },
    ],
    tratamientosActivos: [
      { producto: 'Beauveria bassiana', parcelas: 4, fechaAplicacion: '2026-02-25', eficacia: 'Pendiente' },
      { producto: 'Trampas alcohol-metanol', parcelas: 4, fechaAplicacion: '2026-02-20', eficacia: '45% captura' },
    ],
    alertasActivas: 2, tecnicoAsignado: 'Ing. Pedro Martínez', promedioVital: 61.5, precipitacion7d: 85, humedadPromedio: 82,
    interpretacion: 'Zona Norte presenta una crisis fitosanitaria activa. La incidencia de broca (15.4%) triplica el umbral económico de 5%, lo que indica una población de Hypothenemus hampei fuera de control. La combinación de temperaturas sostenidas de 26-28°C y humedad relativa promedio de 82% crea condiciones ideales para la reproducción del insecto (ciclo completo en ~28 días). El IGRN promedio de 61.5 ("En Construcción") revela parcelas con capacidad adaptativa limitada — especialmente Cerro Azul (55 pts, "Fragilidad") donde la exposición al viento dificulta la aplicación de biocontroladores. Se recomienda: (1) Intensificar Beauveria bassiana a ciclos de 10 días, (2) Instalar 25 trampas adicionales de etanol-metanol, (3) Coordinar cosecha sanitaria de frutos en suelo para romper el ciclo reproductivo.',
  },
  Central: {
    zona: 'Central', incidencia: 6.2,
    parcelas: [
      { nombre: 'Las Palmas', area: 2.0, incidencia: 7.1, vitalScore: 68, ultimoMonitoreo: '2026-02-23', plaga: 'Roya' },
      { nombre: 'El Mirador', area: 3.5, incidencia: 5.8, vitalScore: 74, ultimoMonitoreo: '2026-02-22', plaga: 'Roya' },
      { nombre: 'San José', area: 1.5, incidencia: 5.5, vitalScore: 72, ultimoMonitoreo: '2026-02-23', plaga: 'Roya' },
    ],
    tratamientosActivos: [
      { producto: 'Caldo bordelés', parcelas: 3, fechaAplicacion: '2026-02-20', eficacia: '72% reducción' },
    ],
    alertasActivas: 1, tecnicoAsignado: 'Ing. Ana López', promedioVital: 71.3, precipitacion7d: 92, humedadPromedio: 86,
    interpretacion: 'Zona Central muestra condiciones pre-epidémicas para roya (Hemileia vastatrix). La humedad relativa sostenida >85% con temperaturas de 20-25°C favorece la germinación de uredosporas. La incidencia actual de 6.2% está por encima del umbral de vigilancia (5%) pero aún controlable. El tratamiento con caldo bordelés muestra eficacia del 72%, dentro del rango esperado. Sin embargo, las precipitaciones de 92mm en 7 días dificultan la persistencia del producto. Se recomienda: (1) Repetir aplicación de caldo bordelés a los 15 días, (2) Evaluar regulación de sombra en Las Palmas donde la incidencia es mayor, (3) Monitoreo bisemanal hasta que HR baje de 80%.',
  },
  Sur: {
    zona: 'Sur', incidencia: 2.1,
    parcelas: [
      { nombre: 'Finca Alta', area: 4.0, incidencia: 1.8, vitalScore: 82, ultimoMonitoreo: '2026-02-22', plaga: 'Ninguna' },
      { nombre: 'Los Cedros', area: 2.8, incidencia: 2.5, vitalScore: 78, ultimoMonitoreo: '2026-02-21', plaga: 'Ojo de gallo' },
    ],
    tratamientosActivos: [
      { producto: 'Caldo bordelés (preventivo)', parcelas: 2, fechaAplicacion: '2026-02-22', eficacia: 'Preventivo' },
    ],
    alertasActivas: 0, tecnicoAsignado: 'Ing. Pedro Martínez', promedioVital: 80, precipitacion7d: 45, humedadPromedio: 72,
    interpretacion: 'Zona Sur se mantiene en estado saludable con incidencia de solo 2.1%, muy por debajo de umbrales de acción. El IGRN promedio de 80 ("En Construcción" alto, próximo a "Resiliente") refleja buenas prácticas de manejo. La sombra regulada al 45% y menor precipitación (45mm/7d) crean un microclima menos favorable para hongos. La aplicación preventiva de caldo bordelés es una medida prudente que refuerza la protección. Recomendación: Mantener calendario preventivo actual y usar esta zona como modelo de buenas prácticas para las zonas con mayor incidencia.',
  },
  Este: {
    zona: 'Este', incidencia: 4.8,
    parcelas: [
      { nombre: 'El Rosario', area: 2.3, incidencia: 5.2, vitalScore: 65, ultimoMonitoreo: '2026-02-23', plaga: 'Broca' },
      { nombre: 'La Esperanza', area: 3.0, incidencia: 4.5, vitalScore: 70, ultimoMonitoreo: '2026-02-22', plaga: 'Roya leve' },
      { nombre: 'Buena Vista', area: 1.9, incidencia: 4.6, vitalScore: 67, ultimoMonitoreo: '2026-02-21', plaga: 'Ninguna' },
    ],
    tratamientosActivos: [
      { producto: 'Beauveria bassiana', parcelas: 1, fechaAplicacion: '2026-02-23', eficacia: 'En evaluación' },
      { producto: 'Trampas de monitoreo', parcelas: 3, fechaAplicacion: '2026-02-18', eficacia: '28% captura' },
    ],
    alertasActivas: 1, tecnicoAsignado: 'Ing. Ana López', promedioVital: 67.3, precipitacion7d: 68, humedadPromedio: 78,
    interpretacion: 'Zona Este se encuentra en el umbral de vigilancia con 4.8% de incidencia. El Rosario ya superó el 5% y requiere atención prioritaria. El IGRN promedio de 67.3 indica capacidad adaptativa moderada. Las trampas de monitoreo muestran capturas del 28%, lo que sugiere presión de broca creciente pero aún manejable. Se recomienda: (1) Intensificar monitoreo en El Rosario, (2) Aplicar Beauveria bassiana preventiva en La Esperanza y Buena Vista, (3) Evaluar cosecha temprana en parcelas con frutos maduros para reducir disponibilidad para broca.',
  },
};

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

function generateHash() {
  const chars = 'abcdef0123456789';
  let h = '';
  for (let i = 0; i < 16; i++) h += chars[Math.floor(Math.random() * chars.length)];
  return `sha256:${h}...${h.slice(0, 4)}`;
}

function generateInterpretacion(alerta: Alerta, justificacion: string): string {
  if (alerta.tipo === 'Broca') {
    return `La resolución de la alerta de broca en ${alerta.zona} se valida tras verificar que la incidencia descendió del 15.4% al rango controlable (<5%). La aplicación de Beauveria bassiana como agente de biocontrol (hongo entomopatógeno) actúa colonizando el exoesqueleto del insecto en 48-72 horas, con una eficacia documentada del 60-80% en condiciones de humedad >70%. El protocolo VITAL de las parcelas afectadas muestra mejora en el indicador de Capacidad Adaptativa (+4 puntos) al implementar trampas de monitoreo, lo que fortalece la detección temprana. La cosecha sanitaria de frutos caídos interrumpió el ciclo reproductivo (el insecto completa su ciclo en ~28 días a 26°C). Justificación del técnico: "${justificacion}"`;
  }
  if (alerta.tipo === 'Roya') {
    return `La resolución de condiciones favorables para roya en ${alerta.zona} se fundamenta en: (1) Descenso de humedad relativa por debajo del 80%, reduciendo la tasa de germinación de uredosporas de Hemileia vastatrix; (2) Aplicación preventiva de caldo bordelés con eficacia comprobada del 72%; (3) Regulación de sombra que mejoró la circulación de aire. El protocolo VITAL registra un IGRN de 71 en la zona, indicando transición hacia resiliencia fitosanitaria. Justificación del técnico: "${justificacion}"`;
  }
  return `Alerta resuelta en ${alerta.zona}. Las acciones correctivas aplicadas cumplen con los protocolos de manejo integrado de la plataforma. El monitoreo de seguimiento confirmará la efectividad de las intervenciones. Justificación del técnico: "${justificacion}"`;
}

export default function NovaGuardTab() {
  const [alertas, setAlertas] = useState(alertasIniciales);
  const [showDetalle, setShowDetalle] = useState<Alerta | null>(null);
  const [showReporte, setShowReporte] = useState(false);
  const [showZona, setShowZona] = useState<ZonaDetalle | null>(null);
  const [showResolucion, setShowResolucion] = useState<Alerta | null>(null);
  const [resolucionForm, setResolucionForm] = useState({ justificacion: '', comentario: '', evidencias: '' });
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

  const handleResolver = (alerta: Alerta) => {
    setShowDetalle(null);
    setShowResolucion(alerta);
    setResolucionForm({ justificacion: '', comentario: '', evidencias: '' });
  };

  const confirmarResolucion = () => {
    if (!resolucionForm.justificacion.trim()) {
      toast.error('Debe proporcionar una justificación para resolver la alerta');
      return;
    }
    const alerta = showResolucion!;
    const hash = generateHash();
    const interpretacion = generateInterpretacion(alerta, resolucionForm.justificacion);
    const evidencias = resolucionForm.evidencias
      ? resolucionForm.evidencias.split(',').map(e => e.trim()).filter(Boolean)
      : [];

    setAlertas(prev => prev.map(a => a.id === alerta.id ? {
      ...a,
      severity: 'success' as const,
      resolucion: {
        justificacion: resolucionForm.justificacion,
        evidencias,
        hash,
        tecnico: 'Ing. Pedro Martínez',
        comentarioTecnico: resolucionForm.comentario || 'Sin comentarios adicionales.',
        fechaResolucion: new Date().toISOString().slice(0, 10),
        interpretacionNovaSilva: interpretacion,
        protocoloVital: `IGRN Zona: ${Math.floor(60 + Math.random() * 25)}/100 · Exposición: ${Math.floor(55 + Math.random() * 30)} · Sensibilidad: ${Math.floor(50 + Math.random() * 30)} · Capacidad: ${Math.floor(60 + Math.random() * 30)}`,
      },
    } : a));
    toast.success('Alerta resuelta con justificación, evidencias y hash de integridad');
    setShowResolucion(null);
  };

  const handleZoneClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.zona) {
      const zona = data.activePayload[0].payload.zona;
      const detalle = zonasDetalle[zona];
      if (detalle) setShowZona(detalle);
    }
  };

  const vitalColor = (score: number) =>
    score >= 81 ? 'text-primary' : score >= 61 ? 'text-accent' : score >= 41 ? 'text-amber-500' : 'text-destructive';

  const vitalLabel = (score: number) =>
    score >= 81 ? 'Resiliente' : score >= 61 ? 'En Construcción' : score >= 41 ? 'Fragilidad' : 'Crítica';

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
              <span className="text-[10px] text-muted-foreground font-normal ml-auto">Click en barra para detalles</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={zonasAfectadas} layout="vertical" onClick={handleZoneClick} style={{ cursor: 'pointer' }}>
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

                {/* Resolution data if resolved */}
                {showDetalle.resolucion && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Resolución
                      </p>

                      <div className="p-3 rounded-lg border border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">JUSTIFICACIÓN</p>
                        <p className="text-sm text-foreground">{showDetalle.resolucion.justificacion}</p>
                      </div>

                      <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                        <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                          <Leaf className="h-3 w-3" /> INTERPRETACIÓN NOVA SILVA
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{showDetalle.resolucion.interpretacionNovaSilva}</p>
                      </div>

                      <div className="p-3 rounded-lg border border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> PROTOCOLO VITAL
                        </p>
                        <p className="text-sm font-mono text-foreground">{showDetalle.resolucion.protocoloVital}</p>
                      </div>

                      <div className="p-3 rounded-lg border border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> COMENTARIO TÉCNICO
                        </p>
                        <p className="text-sm text-foreground">{showDetalle.resolucion.tecnico}</p>
                        <p className="text-sm text-muted-foreground mt-1">{showDetalle.resolucion.comentarioTecnico}</p>
                      </div>

                      {showDetalle.resolucion.evidencias.length > 0 && (
                        <div className="p-3 rounded-lg border border-border">
                          <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                            <Camera className="h-3 w-3" /> EVIDENCIAS ({showDetalle.resolucion.evidencias.length})
                          </p>
                          <div className="space-y-1">
                            {showDetalle.resolucion.evidencias.map((e, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                                <FileText className="h-3 w-3 text-muted-foreground" />
                                {e}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-3 rounded-lg border border-border bg-muted/30">
                        <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                          <Hash className="h-3 w-3" /> HASH DE INTEGRIDAD
                        </p>
                        <p className="text-xs font-mono text-foreground">{showDetalle.resolucion.hash}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {showDetalle.resolucion.fechaResolucion}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {showDetalle.severity !== 'success' && (
                  <Button className="w-full" onClick={() => handleResolver(showDetalle)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Marcar como Resuelta
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ RESOLUCIÓN DIALOG ═══ */}
      <Dialog open={!!showResolucion} onOpenChange={() => setShowResolucion(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {showResolucion && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" /> Resolver Alerta
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium text-foreground">{showResolucion.titulo}</p>
                  <p className="text-xs text-muted-foreground">{showResolucion.zona} · {showResolucion.fecha}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Justificación de resolución *</Label>
                  <Textarea
                    placeholder="Describa por qué esta alerta se considera resuelta. Ej: Incidencia descendió a 3.2% tras aplicación de Beauveria bassiana..."
                    value={resolucionForm.justificacion}
                    onChange={e => setResolucionForm(s => ({ ...s, justificacion: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Comentario técnico</Label>
                  <Textarea
                    placeholder="Observaciones adicionales del técnico de campo..."
                    value={resolucionForm.comentario}
                    onChange={e => setResolucionForm(s => ({ ...s, comentario: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5" /> Evidencias
                  </Label>
                  <Input
                    placeholder="Nombres de archivos separados por coma (ej: foto1.jpg, reporte.pdf)"
                    value={resolucionForm.evidencias}
                    onChange={e => setResolucionForm(s => ({ ...s, evidencias: e.target.value }))}
                  />
                  <p className="text-[10px] text-muted-foreground">Las evidencias recibirán un hash SHA-256 de integridad automáticamente</p>
                </div>

                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <Leaf className="h-3 w-3" /> INTERPRETACIÓN NOVA SILVA
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Se generará automáticamente una interpretación basada en datos del protocolo VITAL, condiciones climáticas y el historial fitosanitario de la zona.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowResolucion(null)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={confirmarResolucion}>
                    <ShieldCheck className="h-4 w-4 mr-1" /> Confirmar Resolución
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ ZONA DETALLE DIALOG ═══ */}
      <Dialog open={!!showZona} onOpenChange={() => setShowZona(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {showZona && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Zona {showZona.zona} — Detalle Fitosanitario
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className={`text-2xl font-bold ${showZona.incidencia > 10 ? 'text-destructive' : showZona.incidencia > 5 ? 'text-amber-500' : 'text-primary'}`}>
                      {showZona.incidencia}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Incidencia</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className={`text-2xl font-bold ${vitalColor(showZona.promedioVital)}`}>{showZona.promedioVital}</p>
                    <p className="text-[10px] text-muted-foreground">VITAL promedio</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold text-foreground">{showZona.humedadPromedio}%</p>
                    <p className="text-[10px] text-muted-foreground">HR promedio</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold text-foreground">{showZona.precipitacion7d}mm</p>
                    <p className="text-[10px] text-muted-foreground">Lluvia 7d</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{showZona.alertasActivas} alertas activas</Badge>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{showZona.tecnicoAsignado}</span>
                </div>

                {/* Parcelas */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Parcelas en la zona</p>
                  <div className="space-y-2">
                    {showZona.parcelas.map(p => (
                      <div key={p.nombre} className="p-3 rounded-lg border border-border flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{p.nombre}</p>
                          <p className="text-xs text-muted-foreground">{p.area} ha · Monitoreo: {p.ultimoMonitoreo}</p>
                        </div>
                        <div className="text-right shrink-0 space-y-0.5">
                          <p className={`text-sm font-bold ${p.incidencia > 10 ? 'text-destructive' : p.incidencia > 5 ? 'text-amber-500' : 'text-primary'}`}>
                            {p.incidencia}%
                          </p>
                          <Badge variant="outline" className={`text-[10px] ${vitalColor(p.vitalScore)}`}>
                            VITAL {p.vitalScore} · {vitalLabel(p.vitalScore)}
                          </Badge>
                          {p.plaga !== 'Ninguna' && (
                            <p className="text-[10px] text-destructive">{p.plaga}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tratamientos */}
                {showZona.tratamientosActivos.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tratamientos activos</p>
                    <div className="space-y-2">
                      {showZona.tratamientosActivos.map((t, i) => (
                        <div key={i} className="p-3 rounded-lg border border-border">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">{t.producto}</p>
                            <Badge variant="outline" className="text-[10px]">{t.eficacia}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{t.parcelas} parcelas · Aplicado: {t.fechaAplicacion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Interpretación */}
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Leaf className="h-3.5 w-3.5 text-primary" /> Interpretación Nova Silva — Zona {showZona.zona}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{showZona.interpretacion}</p>
                </div>
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
            <div className="space-y-2">
              <Label>Parcela</Label>
              <Select value={reporteForm.parcela} onValueChange={v => setReporteForm(s => ({ ...s, parcela: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccione parcela..." /></SelectTrigger>
                <SelectContent>{PARCELAS_DEMO.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>

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
                    <span className="text-2xl">{obs.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{obs.titulo}</p>
                      <p className="text-xs text-muted-foreground">{obs.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción adicional <span className="text-muted-foreground">(opcional)</span></Label>
              <Textarea
                placeholder="Cualquier detalle que considere importante..."
                value={reporteForm.descripcion}
                onChange={e => setReporteForm(s => ({ ...s, descripcion: e.target.value }))}
                rows={3}
              />
            </div>

            <Button className="w-full" onClick={handleReportarSospecha}>
              <AlertTriangle className="h-4 w-4 mr-1" /> Enviar Alerta Amarilla
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
