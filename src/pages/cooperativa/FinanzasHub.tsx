import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp, TrendingDown, Wallet, Users, Plus, Eye, CreditCard,
  FileText, CheckCircle, XCircle, Clock, AlertTriangle, Shield, Leaf,
  Package, BarChart3, Download, Send, MessageSquare,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { tooltipStyle, tooltipItemStyle, tooltipLabelStyle, chartCursorStyle } from '@/lib/chartStyles';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DEMO_PRODUCTORES, DEMO_CREDITOS } from '@/lib/demo-data';

// ── Financial data ──
const flujo = [
  { mes: 'Sep', ingresos: 38000000, egresos: 28000000 },
  { mes: 'Oct', ingresos: 42000000, egresos: 30000000 },
  { mes: 'Nov', ingresos: 48000000, egresos: 33000000 },
  { mes: 'Dic', ingresos: 30000000, egresos: 25000000 },
  { mes: 'Ene', ingresos: 40000000, egresos: 29000000 },
  { mes: 'Feb', ingresos: 45200000, egresos: 31800000 },
];

const distribucion = [
  { name: 'Compras cafe', value: 60, color: 'hsl(var(--primary))' },
  { name: 'Operaciones', value: 20, color: 'hsl(var(--accent))' },
  { name: 'Personal', value: 15, color: 'hsl(210, 60%, 50%)' },
  { name: 'Otros', value: 5, color: 'hsl(var(--muted-foreground))' },
];

interface Movimiento {
  id: string; fecha: string; desc: string; cat: string; tipo: 'Ingreso' | 'Egreso'; monto: number; ref: string;
}

const movimientosIniciales: Movimiento[] = [
  { id: '1', fecha: '2026-02-24', desc: 'Compra cafe pergamino - Lote 048', cat: 'Compras cafe', tipo: 'Egreso', monto: 4800000, ref: 'EG-2026-0198' },
  { id: '2', fecha: '2026-02-24', desc: 'Venta lote exportacion - Cliente Volcafe', cat: 'Ventas', tipo: 'Ingreso', monto: 12500000, ref: 'IN-2026-0087' },
  { id: '3', fecha: '2026-02-23', desc: 'Nomina cuadrillas Febrero (parcial)', cat: 'Personal', tipo: 'Egreso', monto: 2800000, ref: 'EG-2026-0197' },
  { id: '4', fecha: '2026-02-23', desc: 'Compra fertilizante 18-5-15', cat: 'Insumos', tipo: 'Egreso', monto: 1200000, ref: 'EG-2026-0196' },
  { id: '5', fecha: '2026-02-22', desc: 'Contribucion cafetera', cat: 'Impuestos', tipo: 'Egreso', monto: 950000, ref: 'EG-2026-0195' },
  { id: '6', fecha: '2026-02-22', desc: 'Venta cafe tostado - Tienda local', cat: 'Ventas', tipo: 'Ingreso', monto: 3200000, ref: 'IN-2026-0086' },
  { id: '7', fecha: '2026-02-21', desc: 'Compra sacos de yute', cat: 'Empaque', tipo: 'Egreso', monto: 680000, ref: 'EG-2026-0194' },
  { id: '8', fecha: '2026-02-21', desc: 'Desembolso credito - Ana Betancourt', cat: 'Creditos', tipo: 'Egreso', monto: 1500000, ref: 'CR-2026-0034' },
];

const CATEGORIAS_MOV = ['Ventas', 'Compras cafe', 'Insumos', 'Personal', 'Empaque', 'Impuestos', 'Creditos', 'Mantenimiento', 'Transporte', 'Otros'];

// ── Credit data ──
interface Credito {
  id: string; productorId: string; productorNombre: string; monto: number; saldo: number;
  estado: 'activo' | 'pagado' | 'vencido' | 'en_arreglo';
  tipo: string; fechaDesembolso: string; fechaVencimiento: string;
  cuotas: number; cuotasPagadas: number; tasaInteres: number;
  garantia: string; observaciones: string;
}

const creditosIniciales: Credito[] = [
  { id: '1', productorId: '1', productorNombre: 'Juan Perez Lopez', monto: 1500000, saldo: 850000, estado: 'activo', tipo: 'Insumos', fechaDesembolso: '2025-09-15', fechaVencimiento: '2026-06-30', cuotas: 6, cuotasPagadas: 4, tasaInteres: 8, garantia: 'Cosecha comprometida', observaciones: 'Buen pagador' },
  { id: '2', productorId: '3', productorNombre: 'Pedro Ramirez Cruz', monto: 500000, saldo: 500000, estado: 'vencido', tipo: 'Emergencia', fechaDesembolso: '2025-07-01', fechaVencimiento: '2026-01-15', cuotas: 4, cuotasPagadas: 0, tasaInteres: 12, garantia: 'Ninguna', observaciones: 'Sin pagos registrados' },
  { id: '3', productorId: '2', productorNombre: 'Maria Santos Garcia', monto: 2000000, saldo: 0, estado: 'pagado', tipo: 'Inversion', fechaDesembolso: '2025-03-01', fechaVencimiento: '2025-12-31', cuotas: 6, cuotasPagadas: 6, tasaInteres: 6, garantia: 'Parcela', observaciones: 'Completado anticipadamente' },
  { id: '4', productorId: '4', productorNombre: 'Ana Lopez Martinez', monto: 1000000, saldo: 600000, estado: 'activo', tipo: 'Insumos', fechaDesembolso: '2025-10-01', fechaVencimiento: '2026-09-30', cuotas: 8, cuotasPagadas: 3, tasaInteres: 8, garantia: 'Cosecha comprometida', observaciones: '' },
  { id: '5', productorId: '5', productorNombre: 'Carlos Hernandez', monto: 300000, saldo: 200000, estado: 'en_arreglo', tipo: 'Emergencia', fechaDesembolso: '2025-08-15', fechaVencimiento: '2026-02-15', cuotas: 4, cuotasPagadas: 1, tasaInteres: 10, garantia: 'Ninguna', observaciones: 'Solicitud de arreglo aprobada - pago parcial temporal' },
];

// ── Solicitudes ──
interface Solicitud {
  id: string; productorNombre: string; tipo: 'nuevo_credito' | 'arreglo'; monto: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'contraoferta';
  fechaSolicitud: string; motivo: string; scoreSCP?: number;
}

const solicitudesIniciales: Solicitud[] = [
  { id: '1', productorNombre: 'Rosa Mendez Jimenez', tipo: 'nuevo_credito', monto: 800000, estado: 'pendiente', fechaSolicitud: '2026-02-22', motivo: 'Compra de fertilizante para temporada', scoreSCP: 78 },
  { id: '2', productorNombre: 'Luis Torres Paz', tipo: 'nuevo_credito', monto: 1200000, estado: 'pendiente', fechaSolicitud: '2026-02-20', motivo: 'Renovacion de plantacion - 0.5 ha', scoreSCP: 62 },
  { id: '3', productorNombre: 'Carlos Hernandez', tipo: 'arreglo', monto: 200000, estado: 'aprobada', fechaSolicitud: '2026-02-18', motivo: 'Pago parcial temporal por perdida de cosecha', scoreSCP: 38 },
  { id: '4', productorNombre: 'Elena Castillo Ramos', tipo: 'nuevo_credito', monto: 500000, estado: 'contraoferta', fechaSolicitud: '2026-02-15', motivo: 'Equipo de secado solar', scoreSCP: 70 },
];

// ── Pre-loaded Messages ──
const MENSAJES_CREDITO = {
  aprobada: (s: Solicitud) => `Estimado(a) ${s.productorNombre},\n\nNos complace informarle que su solicitud de ${s.tipo === 'nuevo_credito' ? 'crédito' : 'arreglo de pago'} por ${fmtCRC(s.monto)} ha sido APROBADA.\n\nMotivo de solicitud: ${s.motivo}\n\nUn representante se comunicará con usted para coordinar los detalles del desembolso y la firma de documentos.\n\nAtentamente,\nComité de Crédito\nCooperativa NovaAgro`,
  rechazada: (s: Solicitud) => `Estimado(a) ${s.productorNombre},\n\nLamentamos informarle que su solicitud de ${s.tipo === 'nuevo_credito' ? 'crédito' : 'arreglo de pago'} por ${fmtCRC(s.monto)} no ha sido aprobada en esta ocasión.\n\nMotivo de solicitud: ${s.motivo}\nRazón: El perfil de riesgo actual no cumple con los requisitos mínimos de aprobación.\n\nLe invitamos a contactar a su técnico asignado para mejorar su calificación y volver a aplicar en el futuro.\n\nAtentamente,\nComité de Crédito\nCooperativa NovaAgro`,
  contraoferta: (s: Solicitud) => `Estimado(a) ${s.productorNombre},\n\nHemos revisado su solicitud de ${s.tipo === 'nuevo_credito' ? 'crédito' : 'arreglo de pago'} por ${fmtCRC(s.monto)}.\n\nTras evaluar su perfil, le proponemos una contraoferta:\n- Monto aprobado: ${fmtCRC(Math.round(s.monto * 0.7))}\n- Condición: Garantía de cosecha comprometida\n\nSi acepta estas condiciones, por favor confirme con su técnico asignado para proceder.\n\nAtentamente,\nComité de Crédito\nCooperativa NovaAgro`,
};

const fmtCRC = (n: number) => `₡${n.toLocaleString()}`;

// ── SCP Scoring ──
function calcularSCP(productorId: string, creditos: Credito[]): { score: number; nivel: string; factores: Record<string, number> } {
  const productor = DEMO_PRODUCTORES.find(p => p.id === productorId);
  if (!productor) return { score: 50, nivel: 'Medio', factores: {} };

  const vitalScore = Math.min(30, Math.round(productor.puntajeVITAL * 0.3));
  const eudrScore = productor.estadoEUDR === 'compliant' ? 20 : productor.estadoEUDR === 'pending' ? 10 : 0;
  const creditHist = creditos.filter(c => c.productorId === productorId);
  const pagados = creditHist.filter(c => c.estado === 'pagado').length;
  const vencidos = creditHist.filter(c => c.estado === 'vencido').length;
  const histScore = Math.min(25, (pagados * 10) - (vencidos * 15) + 10);
  const volumenScore = Math.min(15, Math.round(productor.hectareas * 2.5));
  const garantiaScore = productor.parcelas >= 2 ? 10 : 5;

  const total = Math.max(0, Math.min(100, vitalScore + eudrScore + Math.max(0, histScore) + volumenScore + garantiaScore));
  const nivel = total >= 75 ? 'Alto' : total >= 50 ? 'Medio' : 'Bajo';

  return {
    score: total,
    nivel,
    factores: {
      'Protocolo VITAL': vitalScore,
      'Cumplimiento EUDR': eudrScore,
      'Historial crediticio': Math.max(0, histScore),
      'Volumen productivo': volumenScore,
      'Garantias': garantiaScore,
    },
  };
}

// fmtCRC defined above

const estadoCreditoBadge = (e: string) => {
  if (e === 'activo') return <Badge className="bg-emerald-600 text-white border-0">Activo</Badge>;
  if (e === 'pagado') return <Badge variant="secondary">Pagado</Badge>;
  if (e === 'vencido') return <Badge variant="destructive">Vencido</Badge>;
  if (e === 'en_arreglo') return <Badge className="bg-amber-500 text-white border-0">En arreglo</Badge>;
  return <Badge variant="outline">{e}</Badge>;
};

const estadoSolicitudBadge = (e: string) => {
  if (e === 'pendiente') return <Badge className="bg-blue-500 text-white border-0"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
  if (e === 'aprobada') return <Badge className="bg-emerald-600 text-white border-0"><CheckCircle className="h-3 w-3 mr-1" />Aprobada</Badge>;
  if (e === 'rechazada') return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazada</Badge>;
  if (e === 'contraoferta') return <Badge className="bg-amber-500 text-white border-0">Contraoferta</Badge>;
  return <Badge variant="outline">{e}</Badge>;
};

const scpColor = (score: number) => {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-500';
  return 'text-destructive';
};

export default function FinanzasHub() {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState(movimientosIniciales);
  const [creditos, setCreditos] = useState(creditosIniciales);
  const [solicitudes, setSolicitudes] = useState(solicitudesIniciales);

  const [showNuevoMov, setShowNuevoMov] = useState(false);
  const [showNuevoCredito, setShowNuevoCredito] = useState(false);
  const [showDetCredito, setShowDetCredito] = useState<Credito | null>(null);
  const [showDetSolicitud, setShowDetSolicitud] = useState<Solicitud | null>(null);
  const [showSCP, setShowSCP] = useState<string | null>(null);
  const [solicitudAction, setSolicitudAction] = useState<'aprobada' | 'rechazada' | 'contraoferta' | null>(null);
  const [mensajeSolicitud, setMensajeSolicitud] = useState('');
  const [pagoCustom, setPagoCustom] = useState(false);
  const [pagoMonto, setPagoMonto] = useState('');

  // Forms
  const [movForm, setMovForm] = useState({ desc: '', cat: 'Ventas', tipo: 'Ingreso' as 'Ingreso' | 'Egreso', monto: '', ref: '' });
  const [credForm, setCredForm] = useState({ productorId: '', monto: '', tipo: 'Insumos', cuotas: '6', tasaInteres: '8', garantia: '', observaciones: '' });

  const totalIngresos = movimientos.filter(m => m.tipo === 'Ingreso').reduce((s, m) => s + m.monto, 0);
  const totalEgresos = movimientos.filter(m => m.tipo === 'Egreso').reduce((s, m) => s + m.monto, 0);
  const carteraActiva = creditos.filter(c => c.estado === 'activo' || c.estado === 'en_arreglo').reduce((s, c) => s + c.saldo, 0);
  const creditosVencidos = creditos.filter(c => c.estado === 'vencido').length;

  const handleNuevoMov = () => {
    if (!movForm.desc || !movForm.monto) { toast.error('Complete descripcion y monto'); return; }
    const nuevo: Movimiento = {
      id: String(Date.now()), fecha: new Date().toISOString().slice(0, 10),
      desc: movForm.desc, cat: movForm.cat, tipo: movForm.tipo, monto: Number(movForm.monto),
      ref: movForm.ref || `${movForm.tipo === 'Ingreso' ? 'IN' : 'EG'}-${Date.now().toString().slice(-6)}`,
    };
    setMovimientos(prev => [nuevo, ...prev]);
    toast.success(`${movForm.tipo} registrado: ${fmtCRC(Number(movForm.monto))}`);
    setShowNuevoMov(false);
    setMovForm({ desc: '', cat: 'Ventas', tipo: 'Ingreso', monto: '', ref: '' });
  };

  const handleNuevoCredito = () => {
    if (!credForm.productorId || !credForm.monto) { toast.error('Seleccione productor y monto'); return; }
    const prod = DEMO_PRODUCTORES.find(p => p.id === credForm.productorId);
    const nuevo: Credito = {
      id: String(Date.now()), productorId: credForm.productorId,
      productorNombre: prod?.nombre || '', monto: Number(credForm.monto), saldo: Number(credForm.monto),
      estado: 'activo', tipo: credForm.tipo,
      fechaDesembolso: new Date().toISOString().slice(0, 10),
      fechaVencimiento: new Date(Date.now() + Number(credForm.cuotas) * 30 * 86400000).toISOString().slice(0, 10),
      cuotas: Number(credForm.cuotas), cuotasPagadas: 0, tasaInteres: Number(credForm.tasaInteres),
      garantia: credForm.garantia, observaciones: credForm.observaciones,
    };
    setCreditos(prev => [nuevo, ...prev]);
    toast.success(`Credito desembolsado: ${fmtCRC(Number(credForm.monto))} a ${prod?.nombre}`);
    setShowNuevoCredito(false);
    setCredForm({ productorId: '', monto: '', tipo: 'Insumos', cuotas: '6', tasaInteres: '8', garantia: '', observaciones: '' });
  };

  const handleSolicitudAction = (id: string, action: 'aprobada' | 'rechazada' | 'contraoferta') => {
    setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, estado: action } : s));
    const actionLabel = action === 'aprobada' ? 'aprobada' : action === 'rechazada' ? 'rechazada' : 'contraoferta enviada';
    toast.success(`Solicitud ${actionLabel}. Mensaje enviado al productor.`);
    setShowDetSolicitud(null);
    setSolicitudAction(null);
    setMensajeSolicitud('');
  };

  const handlePrepareMessage = (action: 'aprobada' | 'rechazada' | 'contraoferta', solicitud?: Solicitud) => {
    const target = solicitud || showDetSolicitud;
    if (!target) return;
    if (solicitud) setShowDetSolicitud(solicitud);
    setSolicitudAction(action);
    setMensajeSolicitud(MENSAJES_CREDITO[action](target));
  };

  const handleRegistrarPago = (creditoId: string) => {
    setCreditos(prev => prev.map(c => {
      if (c.id !== creditoId) return c;
      const cuotaMonto = c.monto / c.cuotas;
      const nuevoSaldo = Math.max(0, c.saldo - cuotaMonto);
      const nuevasCuotas = c.cuotasPagadas + 1;
      return {
        ...c, saldo: Math.round(nuevoSaldo), cuotasPagadas: nuevasCuotas,
        estado: nuevoSaldo <= 0 ? 'pagado' as const : c.estado,
      };
    }));
    toast.success('Pago registrado');
    setShowDetCredito(null);
  };

  const scpData = showSCP ? calcularSCP(showSCP, creditos) : null;

  const fmt = (v: number) => `₡${(v / 1000000).toFixed(1)}M`;

  const kpis = [
    { label: 'Ingresos del Periodo', value: fmtCRC(totalIngresos), icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Egresos del Periodo', value: fmtCRC(totalEgresos), icon: TrendingDown, color: 'text-destructive' },
    { label: 'Cartera de Creditos', value: fmtCRC(carteraActiva), icon: CreditCard, color: 'text-primary' },
    { label: 'Creditos Vencidos', value: String(creditosVencidos), icon: AlertTriangle, color: creditosVencidos > 0 ? 'text-destructive' : 'text-primary' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Finanzas</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success('Reporte financiero generado')}>
            <Download className="h-4 w-4 mr-1" /> Exportar
          </Button>
          <Button size="sm" onClick={() => setShowNuevoMov(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo Movimiento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <k.icon className={`h-4 w-4 ${k.color}`} />
                <span className="text-xs text-muted-foreground">{k.label}</span>
              </div>
              <p className={`text-xl font-bold ${k.color || 'text-foreground'}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="creditos">Creditos a Productores</TabsTrigger>
          <TabsTrigger value="solicitudes">Solicitudes ({solicitudes.filter(s => s.estado === 'pendiente').length})</TabsTrigger>
        </TabsList>

        {/* ═══ RESUMEN ═══ */}
        <TabsContent value="resumen" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Flujo de Caja Mensual</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={flujo}>
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={fmt} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} formatter={(v: number) => [fmtCRC(v)]} />
                    <Line type="monotone" dataKey="ingresos" stroke="hsl(142, 60%, 40%)" strokeWidth={2} name="Ingresos" dot={false} />
                    <Line type="monotone" dataKey="egresos" stroke="hsl(0, 65%, 50%)" strokeWidth={2} name="Egresos" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Distribucion de Egresos</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={distribucion} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                      {distribucion.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} formatter={(v: number) => [`${v}%`]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Cartera overview */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Resumen de Cartera</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-muted-foreground text-xs">Creditos activos</p>
                  <p className="text-xl font-bold text-foreground">{creditos.filter(c => c.estado === 'activo').length}</p>
                </div>
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-muted-foreground text-xs">Saldo total</p>
                  <p className="text-xl font-bold text-foreground">{fmtCRC(carteraActiva)}</p>
                </div>
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-muted-foreground text-xs">En arreglo</p>
                  <p className="text-xl font-bold text-amber-500">{creditos.filter(c => c.estado === 'en_arreglo').length}</p>
                </div>
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-muted-foreground text-xs">Vencidos</p>
                  <p className="text-xl font-bold text-destructive">{creditosVencidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ MOVIMIENTOS ═══ */}
        <TabsContent value="movimientos">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Movimientos Financieros</CardTitle>
                <Button size="sm" onClick={() => setShowNuevoMov(true)}><Plus className="h-4 w-4 mr-1" /> Registrar</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Descripcion</th>
                      <th className="px-4 py-3 font-medium">Categoria</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Monto</th>
                      <th className="px-4 py-3 font-medium">Referencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((m) => (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{m.fecha}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{m.desc}</td>
                        <td className="px-4 py-3">{m.cat}</td>
                        <td className="px-4 py-3">
                          <Badge className={m.tipo === 'Ingreso' ? 'bg-emerald-500 text-white border-0' : 'bg-destructive text-destructive-foreground border-0'}>{m.tipo}</Badge>
                        </td>
                        <td className="px-4 py-3 font-medium">{fmtCRC(m.monto)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{m.ref}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ CREDITOS A PRODUCTORES ═══ */}
        <TabsContent value="creditos" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Cartera de creditos a productores asociados</p>
            <Button size="sm" onClick={() => setShowNuevoCredito(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo Credito</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="px-4 py-3 font-medium">Productor</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Monto</th>
                      <th className="px-4 py-3 font-medium">Saldo</th>
                      <th className="px-4 py-3 font-medium">Cuotas</th>
                      <th className="px-4 py-3 font-medium">Tasa</th>
                      <th className="px-4 py-3 font-medium">Vencimiento</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">SCP</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditos.map((c) => {
                      const scp = calcularSCP(c.productorId, creditos);
                      return (
                        <tr key={c.id} className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${c.estado === 'vencido' ? 'bg-destructive/5' : ''}`}>
                          <td className="px-4 py-3 font-medium text-foreground">{c.productorNombre}</td>
                          <td className="px-4 py-3">{c.tipo}</td>
                          <td className="px-4 py-3">{fmtCRC(c.monto)}</td>
                          <td className="px-4 py-3 font-bold">{fmtCRC(c.saldo)}</td>
                          <td className="px-4 py-3">{c.cuotasPagadas}/{c.cuotas}</td>
                          <td className="px-4 py-3">{c.tasaInteres}%</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{c.fechaVencimiento}</td>
                          <td className="px-4 py-3">{estadoCreditoBadge(c.estado)}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => setShowSCP(c.productorId)} className={`font-bold ${scpColor(scp.score)} hover:underline`}>{scp.score}</button>
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="sm" onClick={() => setShowDetCredito(c)}><Eye className="h-4 w-4" /></Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ SOLICITUDES ═══ */}
        <TabsContent value="solicitudes" className="space-y-4">
          <p className="text-sm text-muted-foreground">Solicitudes de credito y arreglos de pago pendientes de revision</p>
          <div className="space-y-3">
            {solicitudes.map(s => {
              const scp = s.scoreSCP || 50;
              return (
                <Card key={s.id} className={s.estado === 'pendiente' ? 'border-l-4 border-l-blue-500' : ''}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{s.productorNombre}</span>
                          {estadoSolicitudBadge(s.estado)}
                          <Badge variant="outline" className="text-xs">{s.tipo === 'nuevo_credito' ? 'Nuevo credito' : 'Arreglo de pago'}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{s.motivo}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Monto: <span className="font-bold text-foreground">{fmtCRC(s.monto)}</span></span>
                          <span>Fecha: {s.fechaSolicitud}</span>
                          <span>SCP: <span className={`font-bold ${scpColor(scp)}`}>{scp}</span></span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setShowDetSolicitud(s); setSolicitudAction(null); setMensajeSolicitud(''); }}><Eye className="h-4 w-4" /></Button>
                        {s.estado === 'pendiente' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => navigate('/cooperativa/comite-credito')}>
                              <BarChart3 className="h-4 w-4 mr-1" /> Analizar
                            </Button>
                            <Button size="sm" variant="default" onClick={() => handlePrepareMessage('aprobada', s)}><CheckCircle className="h-4 w-4 mr-1" /> Aprobar</Button>
                            <Button size="sm" variant="destructive" onClick={() => handlePrepareMessage('rechazada', s)}><XCircle className="h-4 w-4" /></Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ NUEVO MOVIMIENTO DIALOG ═══ */}
      <Dialog open={showNuevoMov} onOpenChange={setShowNuevoMov}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /> Registrar Movimiento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={movForm.tipo} onValueChange={v => setMovForm(s => ({ ...s, tipo: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Ingreso">Ingreso</SelectItem><SelectItem value="Egreso">Egreso</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Descripcion *</Label>
              <Input value={movForm.desc} onChange={e => setMovForm(s => ({ ...s, desc: e.target.value }))} placeholder="Descripcion del movimiento" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Select value={movForm.cat} onValueChange={v => setMovForm(s => ({ ...s, cat: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS_MOV.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Monto (₡) *</Label>
                <Input type="number" value={movForm.monto} onChange={e => setMovForm(s => ({ ...s, monto: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Referencia</Label>
              <Input value={movForm.ref} onChange={e => setMovForm(s => ({ ...s, ref: e.target.value }))} placeholder="Auto-generada si vacia" />
            </div>
            <Button className="w-full" onClick={handleNuevoMov}>Registrar {movForm.tipo}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ NUEVO CREDITO DIALOG ═══ */}
      <Dialog open={showNuevoCredito} onOpenChange={setShowNuevoCredito}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Nuevo Credito a Productor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Productor *</Label>
              <Select value={credForm.productorId} onValueChange={v => setCredForm(s => ({ ...s, productorId: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>{DEMO_PRODUCTORES.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {credForm.productorId && (() => {
              const scp = calcularSCP(credForm.productorId, creditos);
              return (
                <div className={`p-3 rounded-lg border ${scp.score >= 75 ? 'border-emerald-500/30 bg-emerald-500/5' : scp.score >= 50 ? 'border-amber-500/30 bg-amber-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Score SCP</span>
                    <span className={`text-xl font-bold ${scpColor(scp.score)}`}>{scp.score} - {scp.nivel}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{scp.score >= 75 ? 'Recomendado para aprobacion' : scp.score >= 50 ? 'Requiere revision adicional' : 'Alto riesgo - considerar garantias adicionales'}</p>
                </div>
              );
            })()}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Monto (₡) *</Label>
                <Input type="number" value={credForm.monto} onChange={e => setCredForm(s => ({ ...s, monto: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={credForm.tipo} onValueChange={v => setCredForm(s => ({ ...s, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Insumos">Insumos</SelectItem>
                    <SelectItem value="Inversion">Inversion</SelectItem>
                    <SelectItem value="Emergencia">Emergencia</SelectItem>
                    <SelectItem value="Renovacion">Renovacion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Cuotas</Label>
                <Input type="number" min="1" max="24" value={credForm.cuotas} onChange={e => setCredForm(s => ({ ...s, cuotas: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Tasa interes (%)</Label>
                <Input type="number" min="0" max="30" value={credForm.tasaInteres} onChange={e => setCredForm(s => ({ ...s, tasaInteres: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Garantia</Label>
              <Input value={credForm.garantia} onChange={e => setCredForm(s => ({ ...s, garantia: e.target.value }))} placeholder="Ej: Cosecha comprometida, parcela..." />
            </div>
            <div className="space-y-1">
              <Label>Observaciones</Label>
              <Textarea value={credForm.observaciones} onChange={e => setCredForm(s => ({ ...s, observaciones: e.target.value }))} rows={2} />
            </div>
            <Button className="w-full" onClick={handleNuevoCredito}>Desembolsar Credito</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ DETALLE CREDITO DIALOG ═══ */}
      <Dialog open={!!showDetCredito} onOpenChange={() => setShowDetCredito(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {showDetCredito && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> {showDetCredito.productorNombre}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{fmtCRC(showDetCredito.saldo)}</p>
                  <p className="text-xs text-muted-foreground">saldo pendiente de {fmtCRC(showDetCredito.monto)}</p>
                  <div className="mt-2">{estadoCreditoBadge(showDetCredito.estado)}</div>
                </div>
                <Progress value={(showDetCredito.cuotasPagadas / showDetCredito.cuotas) * 100} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">{showDetCredito.cuotasPagadas} de {showDetCredito.cuotas} cuotas pagadas</p>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Tipo</span><p className="font-medium text-foreground">{showDetCredito.tipo}</p></div>
                  <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Tasa</span><p className="font-medium text-foreground">{showDetCredito.tasaInteres}%</p></div>
                  <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Desembolso</span><p className="font-medium text-foreground">{showDetCredito.fechaDesembolso}</p></div>
                  <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Vencimiento</span><p className="font-medium text-foreground">{showDetCredito.fechaVencimiento}</p></div>
                  <div className="p-2 rounded border border-border col-span-2"><span className="text-muted-foreground text-xs">Garantia</span><p className="font-medium text-foreground">{showDetCredito.garantia || 'Ninguna'}</p></div>
                </div>

                {showDetCredito.observaciones && (
                  <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Observaciones</span><p className="text-sm text-foreground">{showDetCredito.observaciones}</p></div>
                )}

                {(showDetCredito.estado === 'activo' || showDetCredito.estado === 'en_arreglo') && (
                  <Button className="w-full" onClick={() => handleRegistrarPago(showDetCredito.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Registrar Pago de Cuota ({fmtCRC(Math.round(showDetCredito.monto / showDetCredito.cuotas))})
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ DETALLE SOLICITUD + SCP DIALOG ═══ */}
      <Dialog open={!!showDetSolicitud} onOpenChange={() => { setShowDetSolicitud(null); setSolicitudAction(null); setMensajeSolicitud(''); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {showDetSolicitud && (() => {
            const prod = DEMO_PRODUCTORES.find(p => p.nombre === showDetSolicitud.productorNombre);
            const scp = prod ? calcularSCP(prod.id, creditos) : null;
            return (
              <>
                <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Solicitud de {showDetSolicitud.productorNombre}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Tipo</span><p className="font-medium text-foreground">{showDetSolicitud.tipo === 'nuevo_credito' ? 'Nuevo Credito' : 'Arreglo de Pago'}</p></div>
                    <div className="p-2 rounded border border-border"><span className="text-muted-foreground text-xs">Monto</span><p className="font-bold text-foreground">{fmtCRC(showDetSolicitud.monto)}</p></div>
                    <div className="p-2 rounded border border-border col-span-2"><span className="text-muted-foreground text-xs">Motivo</span><p className="text-foreground">{showDetSolicitud.motivo}</p></div>
                  </div>

                  {/* SCP Analysis */}
                  {scp && (
                    <Card className={scp.score >= 75 ? 'border-emerald-500/30' : scp.score >= 50 ? 'border-amber-500/30' : 'border-destructive/30'}>
                      <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Calificacion SCP</CardTitle></CardHeader>
                      <CardContent>
                        <div className="text-center mb-3">
                          <p className={`text-4xl font-bold ${scpColor(scp.score)}`}>{scp.score}</p>
                          <p className="text-sm text-muted-foreground">Nivel: {scp.nivel}</p>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(scp.factores).map(([factor, val]) => (
                            <div key={factor} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-36">{factor}</span>
                              <Progress value={val * 4} className="h-1.5 flex-1" />
                              <span className="text-xs font-bold text-foreground w-8 text-right">{val}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                          {scp.score >= 75 ? 'Recomendacion: Aprobar. Productor con buen historial y cumplimiento.' :
                           scp.score >= 50 ? 'Recomendacion: Revisar garantias adicionales antes de aprobar.' :
                           'Recomendacion: Alto riesgo. Considerar contraoferta con monto reducido o rechazar.'}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Producer info */}
                  {prod && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="p-2 rounded border border-border text-center">
                        <Leaf className="h-4 w-4 text-primary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">VITAL</p>
                        <p className="font-bold text-foreground">{prod.puntajeVITAL}</p>
                      </div>
                      <div className="p-2 rounded border border-border text-center">
                        <Shield className="h-4 w-4 text-primary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">EUDR</p>
                        <p className="font-bold text-foreground">{prod.estadoEUDR}</p>
                      </div>
                      <div className="p-2 rounded border border-border text-center">
                        <Package className="h-4 w-4 text-primary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Hectareas</p>
                        <p className="font-bold text-foreground">{prod.hectareas}</p>
                      </div>
                    </div>
                  )}

                  {showDetSolicitud.estado === 'pendiente' && !solicitudAction && (
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => handlePrepareMessage('aprobada')}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                      </Button>
                      <Button variant="outline" onClick={() => handlePrepareMessage('contraoferta')}>Contraoferta</Button>
                      <Button variant="destructive" onClick={() => handlePrepareMessage('rechazada')}>
                        <XCircle className="h-4 w-4 mr-1" /> Rechazar
                      </Button>
                    </div>
                  )}

                  {solicitudAction && (
                    <div className="space-y-3 border-t border-border pt-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          Mensaje de {solicitudAction === 'aprobada' ? 'aprobación' : solicitudAction === 'rechazada' ? 'rechazo' : 'contraoferta'}
                        </span>
                        <Badge variant="outline" className="text-[10px]">Pre-cargado</Badge>
                      </div>
                      <Textarea value={mensajeSolicitud} onChange={e => setMensajeSolicitud(e.target.value)} rows={8} className="text-xs" />
                      <p className="text-[10px] text-muted-foreground">Puede editar el mensaje antes de enviarlo al productor.</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => { setSolicitudAction(null); setMensajeSolicitud(''); }}>Volver</Button>
                        <Button className="flex-1" onClick={() => handleSolicitudAction(showDetSolicitud.id, solicitudAction)}>
                          <Send className="h-4 w-4 mr-1" /> Enviar y confirmar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ═══ SCP DETAIL DIALOG ═══ */}
      <Dialog open={!!showSCP} onOpenChange={() => setShowSCP(null)}>
        <DialogContent className="max-w-sm">
          {showSCP && scpData && (() => {
            const prod = DEMO_PRODUCTORES.find(p => p.id === showSCP);
            return (
              <>
                <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> SCP: {prod?.nombre}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className={`text-5xl font-bold ${scpColor(scpData.score)}`}>{scpData.score}</p>
                    <p className="text-sm text-muted-foreground mt-1">Nivel: {scpData.nivel}</p>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(scpData.factores).map(([factor, val]) => (
                      <div key={factor}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{factor}</span>
                          <span className="font-bold text-foreground">{val}</span>
                        </div>
                        <Progress value={val * 4} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                    El SCP (Sistema de Calificacion de Productores) integra datos de VITAL, EUDR, historial crediticio, volumen productivo y garantias para generar una calificacion objetiva.
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
