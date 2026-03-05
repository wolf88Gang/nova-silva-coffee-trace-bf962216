import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Package, Truck, Plus, HandCoins, Eye, TrendingUp, BarChart3,
  Brain, DollarSign, Lightbulb, Send, MessageSquare, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from 'recharts';
import { tooltipStyle, tooltipItemStyle, tooltipLabelStyle } from '@/lib/chartStyles';
import { DEMO_LOTES_ACOPIO, DEMO_ENTREGAS, DEMO_PRODUCTORES } from '@/lib/demo-data';
import { toast } from 'sonner';

const estadoLoteBadge = (s: string) => {
  if (s === 'disponible') return <Badge variant="default">Disponible</Badge>;
  if (s === 'en_proceso') return <Badge variant="secondary">En proceso</Badge>;
  return <Badge variant="outline">Vendido</Badge>;
};
const estadoPagoBadge = (s: string) => {
  if (s === 'pagado') return <Badge variant="default">Pagado</Badge>;
  if (s === 'pendiente') return <Badge variant="secondary">Pendiente</Badge>;
  return <Badge variant="outline">Parcial</Badge>;
};

// ── Chart data ──
const entregasMes = [
  { mes: 'Sep', kg: 8200 }, { mes: 'Oct', kg: 12400 }, { mes: 'Nov', kg: 18600 },
  { mes: 'Dic', kg: 22100 }, { mes: 'Ene', kg: 15800 }, { mes: 'Feb', kg: 11300 },
];
const tipoCafeDist = [
  { name: 'Pergamino', value: 62, color: 'hsl(var(--primary))' },
  { name: 'Cereza', value: 28, color: 'hsl(var(--accent))' },
  { name: 'Oro', value: 10, color: 'hsl(210, 60%, 50%)' },
];
const tendenciaAcopio = [
  { mes: 'Sep', acumulado: 8200 }, { mes: 'Oct', acumulado: 20600 }, { mes: 'Nov', acumulado: 39200 },
  { mes: 'Dic', acumulado: 61300 }, { mes: 'Ene', acumulado: 77100 }, { mes: 'Feb', acumulado: 88400 },
];

// ── Market prices ──
const preciosMercado = [
  { fecha: 'Sep', nyc: 185, local: 210, premium: 245 },
  { fecha: 'Oct', nyc: 192, local: 218, premium: 252 },
  { fecha: 'Nov', nyc: 205, local: 230, premium: 268 },
  { fecha: 'Dic', nyc: 198, local: 224, premium: 260 },
  { fecha: 'Ene', nyc: 210, local: 238, premium: 275 },
  { fecha: 'Feb', nyc: 218, local: 245, premium: 285 },
];

// ── Smart recommendations ──
const recomendaciones = [
  { id: '1', tipo: 'precio' as const, titulo: 'Vender lote LOT-2026-048 esta semana', desc: 'El precio NYC subió 3.8% este mes. Los futuros de marzo indican posible corrección. Volumen: 30 QQ pergamino SHB.', impacto: '+₡285,000 vs precio promedio mensual', urgencia: 'alta' as const },
  { id: '2', tipo: 'calidad' as const, titulo: 'Separar microlote Finca El Roble', desc: 'Score de catación estimado 86+ pts. Mercado specialty paga 40% premium sobre commodity. Recomendamos enviar muestra a Nordic Approach.', impacto: '+₡120,000/QQ premium', urgencia: 'media' as const },
  { id: '3', tipo: 'logistica' as const, titulo: 'Consolidar entregas zona Huehuetenango', desc: '4 productores con entregas pendientes en la misma zona. Reducir costos de transporte coordinando recolección conjunta.', impacto: 'Ahorro ₡45,000 en flete', urgencia: 'baja' as const },
  { id: '4', tipo: 'mercado' as const, titulo: 'Tendencia alcista en cafés naturales', desc: 'Demanda global de procesos naturales creció 22% este trimestre. Considerar ofrecer lotes de cereza procesada natural a compradores europeos.', impacto: 'Nuevo segmento +15% margen', urgencia: 'media' as const },
];

// ── Ofertas demo ──
const ofertasDemo = [
  { id: '1', exportador: 'Volcafe S.A.', lote: 'LOT-2026-048', volumen: '30 QQ', precio: '₡285,000/QQ', precioNum: 285000, fecha: '2026-02-20', estado: 'pendiente' },
  { id: '2', exportador: 'CECA Trading', lote: 'LOT-2026-045', volumen: '20 QQ', precio: '₡278,000/QQ', precioNum: 278000, fecha: '2026-02-18', estado: 'aceptada' },
  { id: '3', exportador: 'Mercon Coffee', lote: 'LOT-2026-023', volumen: '50 QQ', precio: '₡292,000/QQ', precioNum: 292000, fecha: '2026-02-15', estado: 'pendiente' },
  { id: '4', exportador: 'Nordic Approach', lote: 'LOT-2026-023', volumen: '15 QQ', precio: '₡320,000/QQ', precioNum: 320000, fecha: '2026-02-12', estado: 'rechazada' },
];

// ── Pre-loaded messages ──
const MENSAJES_OFERTA = {
  aceptar: (o: typeof ofertasDemo[0]) => `Estimado equipo de ${o.exportador},\n\nConfirmamos la aceptación de su oferta por ${o.volumen} del lote ${o.lote} al precio de ${o.precio}.\n\nProcederemos a coordinar la logística de despacho. Por favor envíen la orden de compra formal para iniciar el proceso.\n\nSaludos cordiales,\nCooperativa NovaAgro`,
  rechazar: (o: typeof ofertasDemo[0]) => `Estimado equipo de ${o.exportador},\n\nAgradecemos su interés en nuestro lote ${o.lote}. Lamentablemente, en esta ocasión no podemos aceptar la oferta de ${o.precio} ya que no se ajusta a nuestras expectativas de precio para este lote.\n\nQuedamos abiertos a futuras negociaciones.\n\nSaludos cordiales,\nCooperativa NovaAgro`,
  contraoferta: (o: typeof ofertasDemo[0]) => `Estimado equipo de ${o.exportador},\n\nGracias por su oferta de ${o.precio} por ${o.volumen} del lote ${o.lote}.\n\nTras revisar las condiciones actuales del mercado y la calidad de este lote, nos permitimos hacer una contraoferta de ₡${Math.round(o.precioNum * 1.05).toLocaleString()}/QQ.\n\nQuedamos atentos a su respuesta.\n\nSaludos cordiales,\nCooperativa NovaAgro`,
};

const ofertaBadge = (e: string) => {
  if (e === 'aceptada') return <Badge className="bg-emerald-600 text-white border-0">Aceptada</Badge>;
  if (e === 'rechazada') return <Badge variant="destructive">Rechazada</Badge>;
  return <Badge className="bg-blue-500 text-white border-0">Pendiente</Badge>;
};

const urgenciaBadge = (u: string) => {
  if (u === 'alta') return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
  if (u === 'media') return <Badge className="bg-amber-500 text-white border-0 text-xs">Media</Badge>;
  return <Badge variant="outline" className="text-xs">Baja</Badge>;
};

// ── KPI Detail Dialog ──
function KPIDetailDialog({ open, onClose, type }: { open: boolean; onClose: () => void; type: string }) {
  if (type === 'acopiado') {
    const porProductor = DEMO_PRODUCTORES.map(p => ({
      nombre: p.nombre,
      kg: DEMO_ENTREGAS.filter(e => e.productorNombre === p.nombre).reduce((s, e) => s + e.pesoKg, 0),
    })).filter(p => p.kg > 0).sort((a, b) => b.kg - a.kg);
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Detalle de Acopio Total</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-foreground">{DEMO_ENTREGAS.reduce((s, e) => s + e.pesoKg, 0).toLocaleString()} kg</p>
              <p className="text-xs text-muted-foreground">{DEMO_ENTREGAS.length} entregas de {porProductor.length} productores</p>
            </div>
            <p className="text-xs font-medium text-muted-foreground">Acopio por productor</p>
            {porProductor.map(p => (
              <div key={p.nombre} className="flex items-center justify-between text-sm p-2 rounded border border-border">
                <span className="text-foreground">{p.nombre}</span>
                <span className="font-bold text-foreground">{p.kg.toLocaleString()} kg</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  if (type === 'lotes') {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Lotes Disponibles</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {DEMO_LOTES_ACOPIO.filter(l => l.estado === 'disponible').map(l => (
              <Card key={l.id}>
                <CardContent className="pt-4 pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{l.codigo}</span>
                    {estadoLoteBadge(l.estado)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Peso</span><p className="font-medium text-foreground">{l.pesoQQ} QQ ({l.pesoKg.toLocaleString()} kg)</p></div>
                    <div><span className="text-muted-foreground">Tipo</span><p className="font-medium text-foreground">{l.tipoCafe}</p></div>
                    <div><span className="text-muted-foreground">Productores</span><p className="font-medium text-foreground">{l.productores}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs">Ver trazabilidad</Button>
                    <Button size="sm" className="text-xs">Publicar en subasta</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {DEMO_LOTES_ACOPIO.filter(l => l.estado === 'disponible').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No hay lotes disponibles</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  if (type === 'entregas') {
    const esteMes = DEMO_ENTREGAS; // all demo are "this month"
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Entregas este Mes</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {esteMes.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded border border-border text-sm">
                <div>
                  <p className="font-medium text-foreground">{e.productorNombre}</p>
                  <p className="text-xs text-muted-foreground">{e.fecha} · {e.tipoCafe}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{e.pesoKg} kg</p>
                  <p className="text-xs text-muted-foreground">₡{e.precioUnitario.toLocaleString()}/kg</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  if (type === 'ofertas') {
    const pendientes = ofertasDemo.filter(o => o.estado === 'pendiente');
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><HandCoins className="h-5 w-5 text-primary" /> Ofertas Pendientes</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {pendientes.map(o => (
              <div key={o.id} className="p-3 rounded border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{o.exportador}</span>
                  <span className="font-bold text-primary">{o.precio}</span>
                </div>
                <p className="text-xs text-muted-foreground">Lote: {o.lote} · {o.volumen} · {o.fecha}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  return null;
}

export default function AcopioHub() {
  const [showNuevaEntrega, setShowNuevaEntrega] = useState(false);
  const [showNuevoLote, setShowNuevoLote] = useState(false);
  const [selectedOferta, setSelectedOferta] = useState<typeof ofertasDemo[0] | null>(null);
  const [ofertaAction, setOfertaAction] = useState<'aceptar' | 'rechazar' | 'contraoferta' | null>(null);
  const [mensajeOferta, setMensajeOferta] = useState('');
  const [kpiDetail, setKpiDetail] = useState<string | null>(null);
  const [ofertas, setOfertas] = useState(ofertasDemo);

  const [entregaForm, setEntregaForm] = useState({ productor: '', kg: '', tipo: 'Pergamino', precio: '' });
  const [loteForm, setLoteForm] = useState({ codigo: '', tipo: 'Pergamino' });

  const totalKg = DEMO_ENTREGAS.reduce((s, e) => s + e.pesoKg, 0);
  const lotesDisponibles = DEMO_LOTES_ACOPIO.filter(l => l.estado === 'disponible').length;

  const handleNuevaEntrega = () => {
    if (!entregaForm.productor || !entregaForm.kg) { toast.error('Productor y peso son requeridos'); return; }
    toast.success(`Entrega registrada: ${entregaForm.kg} kg de ${entregaForm.tipo}`);
    setShowNuevaEntrega(false);
    setEntregaForm({ productor: '', kg: '', tipo: 'Pergamino', precio: '' });
  };

  const handleNuevoLote = () => {
    if (!loteForm.codigo) { toast.error('Código de lote requerido'); return; }
    toast.success(`Lote ${loteForm.codigo} creado exitosamente`);
    setShowNuevoLote(false);
    setLoteForm({ codigo: '', tipo: 'Pergamino' });
  };

  const handleOfertaAction = (action: 'aceptar' | 'rechazar' | 'contraoferta') => {
    if (!selectedOferta) return;
    setOfertaAction(action);
    setMensajeOferta(MENSAJES_OFERTA[action](selectedOferta));
  };

  const handleEnviarMensajeOferta = () => {
    if (!selectedOferta || !ofertaAction) return;
    const nuevoEstado = ofertaAction === 'aceptar' ? 'aceptada' : ofertaAction === 'rechazar' ? 'rechazada' : 'pendiente';
    setOfertas(prev => prev.map(o => o.id === selectedOferta.id ? { ...o, estado: nuevoEstado } : o));
    const actionLabel = ofertaAction === 'aceptar' ? 'aceptada' : ofertaAction === 'rechazar' ? 'rechazada' : 'contraoferta enviada';
    toast.success(`Oferta ${actionLabel}. Mensaje enviado a ${selectedOferta.exportador}`);
    setSelectedOferta(null);
    setOfertaAction(null);
    setMensajeOferta('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Acopio y Comercial</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNuevaEntrega(true)}>
            <Plus className="h-4 w-4 mr-1" /> Registrar Entrega
          </Button>
          <Button size="sm" onClick={() => setShowNuevoLote(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo Lote
          </Button>
        </div>
      </div>

      {/* KPIs - Clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setKpiDetail('acopiado')}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1"><Truck className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Total Acopiado</span></div>
            <p className="text-xl font-bold text-foreground">{totalKg.toLocaleString()} kg</p>
            <p className="text-[10px] text-primary mt-1">Ver detalle →</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setKpiDetail('lotes')}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Lotes Disponibles</span></div>
            <p className="text-xl font-bold text-foreground">{lotesDisponibles}</p>
            <p className="text-[10px] text-primary mt-1">Ver lotes →</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setKpiDetail('entregas')}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Entregas este mes</span></div>
            <p className="text-xl font-bold text-foreground">{DEMO_ENTREGAS.length}</p>
            <p className="text-[10px] text-primary mt-1">Ver entregas →</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setKpiDetail('ofertas')}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1"><HandCoins className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Ofertas Pendientes</span></div>
            <p className="text-xl font-bold text-foreground">{ofertas.filter(o => o.estado === 'pendiente').length}</p>
            <p className="text-[10px] text-primary mt-1">Ver ofertas →</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Entregas por Mes (kg)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={entregasMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} formatter={(v: number) => [`${v.toLocaleString()} kg`]} />
                <Bar dataKey="kg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Distribución por Tipo</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={tipoCafeDist} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {tipoCafeDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} formatter={(v: number) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Acopio Acumulado</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={tendenciaAcopio}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}t`} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} formatter={(v: number) => [`${v.toLocaleString()} kg`]} />
                <Area type="monotone" dataKey="acumulado" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Module */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" /> Inteligencia Comercial
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Market Prices */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Precios del Mercado</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">NYC (C Contract)</p>
                  <p className="text-lg font-bold text-foreground">$2.18/lb</p>
                  <div className="flex items-center justify-center gap-1 text-xs text-emerald-600"><ArrowUpRight className="h-3 w-3" />+3.8%</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Local (SHB)</p>
                  <p className="text-lg font-bold text-foreground">₡245k/QQ</p>
                  <div className="flex items-center justify-center gap-1 text-xs text-emerald-600"><ArrowUpRight className="h-3 w-3" />+2.1%</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Specialty (86+)</p>
                  <p className="text-lg font-bold text-foreground">₡285k/QQ</p>
                  <div className="flex items-center justify-center gap-1 text-xs text-destructive"><ArrowDownRight className="h-3 w-3" />-1.2%</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={preciosMercado}>
                  <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
                  <Line type="monotone" dataKey="nyc" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="NYC" />
                  <Line type="monotone" dataKey="local" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Local" />
                  <Line type="monotone" dataKey="premium" stroke="hsl(142, 60%, 40%)" strokeWidth={2} dot={false} name="Premium" />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground text-center">Fuentes: ICE Futures, Anacafé, mercado local</p>
            </CardContent>
          </Card>

          {/* Smart Recommendations */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /> Recomendaciones Inteligentes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {recomendaciones.map(r => (
                <div key={r.id} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{r.titulo}</p>
                    {urgenciaBadge(r.urgencia)}
                  </div>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">{r.impacto}</span>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toast.info(`Acción aplicada: ${r.titulo}`)}>
                      Aplicar →
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="lotes">
        <TabsList>
          <TabsTrigger value="lotes"><Package className="h-4 w-4 mr-1" /> Lotes de Acopio</TabsTrigger>
          <TabsTrigger value="entregas"><Truck className="h-4 w-4 mr-1" /> Entregas</TabsTrigger>
          <TabsTrigger value="ofertas"><HandCoins className="h-4 w-4 mr-1" /> Ofertas Recibidas</TabsTrigger>
        </TabsList>

        <TabsContent value="lotes" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="px-4 py-3 font-medium">Código</th>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Peso (QQ)</th>
                      <th className="px-4 py-3 font-medium">Peso (kg)</th>
                      <th className="px-4 py-3 font-medium">Productores</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_LOTES_ACOPIO.map(l => (
                      <tr key={l.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{l.codigo}</td>
                        <td className="px-4 py-3 text-muted-foreground">{l.fecha}</td>
                        <td className="px-4 py-3 font-bold">{l.pesoQQ}</td>
                        <td className="px-4 py-3">{l.pesoKg.toLocaleString()}</td>
                        <td className="px-4 py-3">{l.productores}</td>
                        <td className="px-4 py-3">{l.tipoCafe}</td>
                        <td className="px-4 py-3">{estadoLoteBadge(l.estado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entregas" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="px-4 py-3 font-medium">Productor</th>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Peso (kg)</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Precio/kg</th>
                      <th className="px-4 py-3 font-medium">Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_ENTREGAS.map(e => (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{e.productorNombre}</td>
                        <td className="px-4 py-3 text-muted-foreground">{e.fecha}</td>
                        <td className="px-4 py-3">{e.pesoKg}</td>
                        <td className="px-4 py-3">{e.tipoCafe}</td>
                        <td className="px-4 py-3">₡{e.precioUnitario.toLocaleString()}</td>
                        <td className="px-4 py-3">{estadoPagoBadge(e.estadoPago)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ofertas" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><HandCoins className="h-4 w-4 text-primary" /> Ofertas de Exportadores</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {ofertas.map(o => (
                <div key={o.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{o.exportador}</p>
                    <p className="text-xs text-muted-foreground">Lote: {o.lote} · {o.volumen} · {o.fecha}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-primary">{o.precio}</p>
                    {ofertaBadge(o.estado)}
                    {o.estado === 'pendiente' && (
                      <Button variant="ghost" size="sm" onClick={() => setSelectedOferta(o)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* KPI Detail */}
      <KPIDetailDialog open={!!kpiDetail} onClose={() => setKpiDetail(null)} type={kpiDetail || ''} />

      {/* ═══ NUEVA ENTREGA ═══ */}
      <Dialog open={showNuevaEntrega} onOpenChange={setShowNuevaEntrega}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Entrega</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Productor</Label>
              <Select value={entregaForm.productor} onValueChange={v => setEntregaForm(f => ({ ...f, productor: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar productor" /></SelectTrigger>
                <SelectContent>
                  {DEMO_PRODUCTORES.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Peso (kg)</Label><Input type="number" value={entregaForm.kg} onChange={e => setEntregaForm(f => ({ ...f, kg: e.target.value }))} placeholder="460" /></div>
              <div><Label>Tipo de café</Label>
                <Select value={entregaForm.tipo} onValueChange={v => setEntregaForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Pergamino', 'Cereza', 'Oro'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Precio/kg (₡)</Label><Input type="number" value={entregaForm.precio} onChange={e => setEntregaForm(f => ({ ...f, precio: e.target.value }))} placeholder="3200" /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleNuevaEntrega}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ NUEVO LOTE ═══ */}
      <Dialog open={showNuevoLote} onOpenChange={setShowNuevoLote}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear Lote de Acopio</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Código del lote</Label><Input value={loteForm.codigo} onChange={e => setLoteForm(f => ({ ...f, codigo: e.target.value }))} placeholder="LOT-2026-XXX" /></div>
            <div><Label>Tipo de café</Label>
              <Select value={loteForm.tipo} onValueChange={v => setLoteForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Pergamino', 'Cereza', 'Oro'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Las entregas se asociarán al lote después de crearlo.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleNuevoLote}>Crear Lote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ OFERTA DETAIL with Pre-loaded Messages ═══ */}
      <Dialog open={!!selectedOferta} onOpenChange={() => { setSelectedOferta(null); setOfertaAction(null); setMensajeOferta(''); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Oferta de {selectedOferta?.exportador}</DialogTitle></DialogHeader>
          {selectedOferta && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg border border-border"><p className="text-xs text-muted-foreground">Lote</p><p className="font-bold text-foreground">{selectedOferta.lote}</p></div>
                <div className="p-3 rounded-lg border border-border"><p className="text-xs text-muted-foreground">Volumen</p><p className="font-bold text-foreground">{selectedOferta.volumen}</p></div>
                <div className="p-3 rounded-lg border border-border"><p className="text-xs text-muted-foreground">Precio</p><p className="font-bold text-primary">{selectedOferta.precio}</p></div>
                <div className="p-3 rounded-lg border border-border"><p className="text-xs text-muted-foreground">Fecha</p><p className="font-bold text-foreground">{selectedOferta.fecha}</p></div>
              </div>

              {!ofertaAction ? (
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => handleOfertaAction('aceptar')}>Aceptar Oferta</Button>
                  <Button variant="outline" className="flex-1" onClick={() => handleOfertaAction('contraoferta')}>Contraoferta</Button>
                  <Button variant="destructive" className="flex-1" onClick={() => handleOfertaAction('rechazar')}>Rechazar</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Mensaje {ofertaAction === 'aceptar' ? 'de aceptación' : ofertaAction === 'rechazar' ? 'de rechazo' : 'de contraoferta'}
                    </span>
                    <Badge variant="outline" className="text-[10px]">Pre-cargado</Badge>
                  </div>
                  <Textarea value={mensajeOferta} onChange={e => setMensajeOferta(e.target.value)} rows={8} className="text-xs" />
                  <p className="text-[10px] text-muted-foreground">Puede editar el mensaje antes de enviarlo.</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => { setOfertaAction(null); setMensajeOferta(''); }}>Volver</Button>
                    <Button className="flex-1" onClick={handleEnviarMensajeOferta}>
                      <Send className="h-4 w-4 mr-1" /> Enviar y confirmar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
