import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Package, MapPin, DollarSign, Shield, CloudSun, AlertTriangle,
  Truck, TrendingUp, ChevronRight, ExternalLink, Bug, Droplets,
} from 'lucide-react';
import { getProductorStats } from '@/lib/demo-data';
import { tooltipStyle, tooltipItemStyle, tooltipLabelStyle, chartCursorStyle } from '@/lib/chartStyles';
import CooperativaAssociationCard from '@/components/productor/CooperativaAssociationCard';

/* ── demo data ── */

const entregasMensuales = [
  { mes: 'Sep', kg: 320, full: 'Septiembre 2025' },
  { mes: 'Oct', kg: 480, full: 'Octubre 2025' },
  { mes: 'Nov', kg: 575, full: 'Noviembre 2025' },
  { mes: 'Dic', kg: 690, full: 'Diciembre 2025' },
  { mes: 'Ene', kg: 460, full: 'Enero 2026' },
  { mes: 'Feb', kg: 345, full: 'Febrero 2026' },
];

const preciosTendencia = [
  { mes: 'Sep', precio: 2800 },
  { mes: 'Oct', precio: 2950 },
  { mes: 'Nov', precio: 3000 },
  { mes: 'Dic', precio: 3100 },
  { mes: 'Ene', precio: 3200 },
  { mes: 'Feb', precio: 3150 },
];

const ultimasEntregas = [
  { id: 'e1', fecha: '2026-02-10', kg: 460, tipo: 'Pergamino', estado: 'pagado' as const, precio: 3150, lote: 'LOT-2026-014', humedad: 11.2, factor: 92 },
  { id: 'e2', fecha: '2026-01-28', kg: 230, tipo: 'Pergamino', estado: 'parcial' as const, precio: 3200, lote: 'LOT-2026-009', humedad: 11.8, factor: 90 },
  { id: 'e3', fecha: '2026-01-15', kg: 345, tipo: 'Cereza', estado: 'pagado' as const, precio: 1200, lote: 'LOT-2026-005', humedad: 62.0, factor: 0 },
  { id: 'e4', fecha: '2025-12-20', kg: 575, tipo: 'Pergamino', estado: 'pagado' as const, precio: 3100, lote: 'LOT-2025-048', humedad: 11.5, factor: 91 },
  { id: 'e5', fecha: '2025-11-20', kg: 520, tipo: 'Pergamino', estado: 'pagado' as const, precio: 3000, lote: 'LOT-2025-041', humedad: 12.0, factor: 89 },
];

const alertasClima = [
  { id: 'a1', texto: 'Lluvia intensa prevista para el 2 de marzo', nivel: 'ambar' as const, route: '/productor/sostenibilidad', icon: Droplets, detail: 'Se esperan precipitaciones de 45-60mm entre el 2 y 3 de marzo. Recomendación: cubrir café en secado, revisar drenajes en parcelas bajas.' },
  { id: 'a2', texto: 'Broca detectada en sector norte — El Mirador', nivel: 'rojo' as const, route: '/productor/sanidad', icon: Bug, detail: 'Nivel de infestación: 3.2% (umbral 2%). Se recomienda iniciar trampeo intensivo y evaluación Nova Guard inmediata.' },
];

export default function DashboardProductor() {
  const navigate = useNavigate();
  const s = getProductorStats();
  const totalKg = ultimasEntregas.reduce((sum, e) => sum + e.kg, 0);

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedEntrega, setSelectedEntrega] = useState<typeof ultimasEntregas[0] | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<typeof alertasClima[0] | null>(null);

  const kpis = [
    { label: 'Total entregado', value: `${totalKg.toLocaleString()} kg`, icon: Package, route: '/productor/produccion', sub: `${ultimasEntregas.length} entregas` },
    { label: 'Parcelas activas', value: s.parcelas, icon: MapPin, route: '/productor/produccion', sub: 'Ver parcelas' },
    { label: 'Próximo pago est.', value: '₡125,000', icon: DollarSign, route: '/productor/finanzas', sub: 'Ver finanzas' },
    { label: 'Score VITAL', value: `${s.puntajeVITAL}/100`, icon: Shield, route: '/productor/sostenibilidad', sub: 'Ver resultados' },
  ];

  /* chart bar click */
  const monthEntregas = selectedMonth
    ? ultimasEntregas.filter(e => {
        const d = new Date(e.fecha);
        const m = d.toLocaleString('es', { month: 'short' });
        return m.charAt(0).toUpperCase() + m.slice(1, 3) === selectedMonth;
      })
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs — clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
            onClick={() => navigate(kpi.route)}
          >
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <kpi.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-[11px] text-primary/70 mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts — interactive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Entregas por mes (kg)
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/productor/produccion')}>
              Ver todas <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={entregasMensuales} onClick={(state) => {
                if (state?.activeLabel) setSelectedMonth(state.activeLabel as string);
              }} style={{ cursor: 'pointer' }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={chartCursorStyle}
                  formatter={(value: number) => [`${value} kg`, 'Volumen']}
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <Bar dataKey="kg" radius={[4, 4, 0, 0]}>
                  {entregasMensuales.map((entry) => (
                    <Cell
                      key={entry.mes}
                      fill={selectedMonth === entry.mes ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
                      stroke={selectedMonth === entry.mes ? 'hsl(var(--accent))' : 'none'}
                      strokeWidth={selectedMonth === entry.mes ? 2 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {selectedMonth && (
              <div className="mt-3 p-3 rounded-lg border border-accent/30 bg-accent/5 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">
                    Detalle — {entregasMensuales.find(m => m.mes === selectedMonth)?.full}
                  </p>
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setSelectedMonth(null)}>Cerrar</Button>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Volumen: <span className="font-semibold text-foreground">{entregasMensuales.find(m => m.mes === selectedMonth)?.kg} kg</span>
                </p>
                {monthEntregas.length > 0 ? (
                  <div className="space-y-1 mt-2">
                    {monthEntregas.map(e => (
                      <div key={e.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-background cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEntrega(e)}>
                        <span>{e.fecha} — {e.kg}kg {e.tipo}</span>
                        <Badge variant={e.estado === 'pagado' ? 'default' : 'secondary'} className="text-[10px]">{e.estado}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No hay entregas registradas en este mes (datos demo).</p>
                )}
                <Button size="sm" variant="outline" className="mt-2 text-xs w-full" onClick={() => navigate('/productor/produccion')}>
                  Ver historial completo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Tendencia de precios (₡/kg)
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/productor/finanzas')}>
              Finanzas <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={preciosTendencia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={chartCursorStyle}
                  formatter={(value: number) => [`₡${value.toLocaleString()}`, 'Precio/kg']}
                />
                <Area type="monotone" dataKey="precio" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Mín: ₡2,800</span>
              <span className="text-primary font-medium">Actual: ₡3,150</span>
              <span>Máx: ₡3,200</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent entregas + alerts — clickable */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Últimas entregas
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/productor/produccion')}>
              Ver todas <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ultimasEntregas.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/20 transition-all cursor-pointer group"
                  onClick={() => setSelectedEntrega(e)}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{e.kg} kg — {e.tipo}</p>
                    <p className="text-xs text-muted-foreground">{e.fecha} · Lote {e.lote}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={e.estado === 'pagado' ? 'default' : 'secondary'}>
                      {e.estado === 'pagado' ? 'Pagado' : 'Parcial'}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CloudSun className="h-4 w-4 text-accent" /> Alertas y clima
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertasClima.map((a) => (
              <div
                key={a.id}
                className={`p-3 rounded-md border cursor-pointer transition-all hover:shadow-sm group ${
                  a.nivel === 'rojo'
                    ? 'bg-destructive/5 border-destructive/20 hover:border-destructive/40'
                    : 'bg-accent/5 border-accent/20 hover:border-accent/40'
                }`}
                onClick={() => setSelectedAlert(a)}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${a.nivel === 'rojo' ? 'text-destructive' : 'text-accent'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{a.texto}</p>
                    <p className="text-[11px] text-primary/60 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Clic para ver detalle →</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="p-3 rounded-md bg-muted/50 border border-border cursor-pointer hover:bg-muted transition-colors" onClick={() => navigate('/productor/sostenibilidad')}>
              <p className="text-xs text-muted-foreground">Temperatura: 22°C</p>
              <p className="text-xs text-muted-foreground">Humedad: 78%</p>
              <p className="text-xs text-muted-foreground">Pronóstico: Parcialmente nublado</p>
              <p className="text-[11px] text-primary/60 mt-1">Ver clima completo →</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Entrega Detail Dialog ── */}
      <Dialog open={!!selectedEntrega} onOpenChange={(o) => !o && setSelectedEntrega(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de Entrega</DialogTitle>
          </DialogHeader>
          {selectedEntrega && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="text-sm font-medium text-foreground">{selectedEntrega.fecha}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Lote</p>
                  <p className="text-sm font-medium text-foreground">{selectedEntrega.lote}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Peso</p>
                  <p className="text-sm font-medium text-foreground">{selectedEntrega.kg} kg</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="text-sm font-medium text-foreground">{selectedEntrega.tipo}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Precio/kg</p>
                  <p className="text-sm font-medium text-foreground">₡{selectedEntrega.precio.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-sm font-bold text-primary">₡{(selectedEntrega.kg * selectedEntrega.precio).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Humedad</p>
                  <p className="text-sm font-medium text-foreground">{selectedEntrega.humedad}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Factor rend.</p>
                  <p className="text-sm font-medium text-foreground">{selectedEntrega.factor || '—'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={selectedEntrega.estado === 'pagado' ? 'default' : 'secondary'} className="text-sm">
                  {selectedEntrega.estado === 'pagado' ? '✓ Pagado' : '◔ Pago parcial'}
                </Badge>
                <Button size="sm" onClick={() => { setSelectedEntrega(null); navigate('/productor/produccion'); }}>
                  Ir a entregas
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Alert Detail Dialog ── */}
      <Dialog open={!!selectedAlert} onOpenChange={(o) => !o && setSelectedAlert(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlert && <selectedAlert.icon className={`h-5 w-5 ${selectedAlert.nivel === 'rojo' ? 'text-destructive' : 'text-accent'}`} />}
              {selectedAlert?.nivel === 'rojo' ? 'Alerta Fitosanitaria' : 'Alerta Climática'}
            </DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${selectedAlert.nivel === 'rojo' ? 'bg-destructive/5 border-destructive/20' : 'bg-accent/5 border-accent/20'}`}>
                <p className="text-sm font-medium text-foreground mb-2">{selectedAlert.texto}</p>
                <p className="text-sm text-muted-foreground">{selectedAlert.detail}</p>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={selectedAlert.nivel === 'rojo' ? 'destructive' : 'secondary'}>
                  {selectedAlert.nivel === 'rojo' ? 'Urgente' : 'Precaución'}
                </Badge>
                <Button size="sm" onClick={() => { setSelectedAlert(null); navigate(selectedAlert.route); }}>
                  {selectedAlert.nivel === 'rojo' ? 'Abrir Nova Guard' : 'Ver pronóstico'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
