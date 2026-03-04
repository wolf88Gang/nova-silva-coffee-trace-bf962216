import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Package, Ship, FileCheck, Globe, TrendingUp, AlertTriangle,
  ChevronRight, ExternalLink, DollarSign, Users, ShieldCheck, Truck,
} from 'lucide-react';

/* ── Demo data ── */
const volumenOrigen = [
  { origen: 'Coopetarrazú', kg: 18500 },
  { origen: 'CoopeDota', kg: 14200 },
  { origen: 'Coopecafé', kg: 11800 },
  { origen: 'Finca El Sol', kg: 8400 },
  { origen: 'Beneficio Central', kg: 6200 },
];

const precioTendencia = [
  { mes: 'Sep', usd: 2.85 },
  { mes: 'Oct', usd: 2.92 },
  { mes: 'Nov', usd: 3.05 },
  { mes: 'Dic', usd: 3.12 },
  { mes: 'Ene', usd: 3.28 },
  { mes: 'Feb', usd: 3.35 },
];

const destinoDistribucion = [
  { name: 'Europa', value: 42, color: 'hsl(var(--primary))' },
  { name: 'USA/Canadá', value: 28, color: 'hsl(var(--accent))' },
  { name: 'Asia', value: 18, color: 'hsl(142 71% 45%)' },
  { name: 'Otros', value: 12, color: 'hsl(var(--muted-foreground))' },
];

const lotesPendientes = [
  { id: 'LOT-EXP-041', origen: 'Coopetarrazú', kg: 4600, tipo: 'SHB EP', score: 86, eudr: 'compliant', destino: 'Hamburgo', embarque: '2026-03-15' },
  { id: 'LOT-EXP-039', origen: 'CoopeDota', kg: 3200, tipo: 'HB', score: 82, eudr: 'compliant', destino: 'New York', embarque: '2026-03-10' },
  { id: 'LOT-EXP-038', origen: 'Finca El Sol', kg: 2100, tipo: 'SHB EP', score: 88, eudr: 'pendiente', destino: 'Tokio', embarque: '2026-03-22' },
  { id: 'LOT-EXP-035', origen: 'Coopecafé', kg: 5800, tipo: 'GW', score: 79, eudr: 'compliant', destino: 'Rotterdam', embarque: '2026-03-08' },
];

const alertas = [
  { id: 'al1', texto: 'LOT-EXP-038: Documentación EUDR incompleta — embarque en 18 días', nivel: 'rojo' as const },
  { id: 'al2', texto: 'Contrato #CT-2026-012 próximo a vencer — 5 días', nivel: 'ambar' as const },
  { id: 'al3', texto: 'Precio FOB USA subió 4.2% esta semana', nivel: 'verde' as const },
];

export default function DashboardExportador() {
  const navigate = useNavigate();
  const [selectedLote, setSelectedLote] = useState<typeof lotesPendientes[0] | null>(null);

  const totalKg = volumenOrigen.reduce((s, v) => s + v.kg, 0);
  const eudrCompliant = lotesPendientes.filter(l => l.eudr === 'compliant').length;
  const eudrPct = Math.round((eudrCompliant / lotesPendientes.length) * 100);

  const kpis = [
    { label: 'Volumen en tránsito', value: `${(totalKg / 1000).toFixed(1)} ton`, icon: Package, route: '/exportador/lotes', sub: `${lotesPendientes.length} lotes activos` },
    { label: 'Precio promedio', value: `$${precioTendencia[precioTendencia.length - 1].usd}/lb`, icon: DollarSign, route: '/exportador/contratos', sub: '+4.2% vs mes anterior' },
    { label: 'EUDR Compliance', value: `${eudrPct}%`, icon: ShieldCheck, route: '/exportador/eudr', sub: `${eudrCompliant}/${lotesPendientes.length} lotes` },
    { label: 'Proveedores activos', value: `${volumenOrigen.length}`, icon: Users, route: '/exportador/proveedores', sub: 'Ver directorio' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Centro de Exportación</h1>
        <p className="text-sm text-muted-foreground">Consolidación, cumplimiento y logística comercial</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group" onClick={() => navigate(kpi.route)}>
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

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volumen por origen — Horizontal Bar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Volumen por Origen</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={volumenOrigen} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="origen" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={90} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} formatter={(v: number) => [`${v.toLocaleString()} kg`, 'Volumen']} />
                <Bar dataKey="kg" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Precio tendencia USD/lb — Area */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> Precio FOB (USD/lb)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={precioTendencia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[2.7, 3.5]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} formatter={(v: number) => [`$${v.toFixed(2)}/lb`, 'Precio']} />
                <Area type="monotone" dataKey="usd" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Destinos — Pie */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Destinos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={destinoDistribucion} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3} label={({ name, value }) => `${name} ${value}%`}>
                  {destinoDistribucion.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lotes + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Ship className="h-4 w-4 text-primary" /> Lotes Próximos a Embarcar</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/exportador/lotes')}>Ver todos <ExternalLink className="h-3 w-3 ml-1" /></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lotesPendientes.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/20 transition-all cursor-pointer group" onClick={() => setSelectedLote(l)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{l.id}</p>
                      <Badge variant={l.eudr === 'compliant' ? 'default' : 'destructive'} className="text-[10px]">
                        {l.eudr === 'compliant' ? '✓ EUDR' : '⚠ EUDR'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{l.origen} · {l.kg.toLocaleString()} kg {l.tipo} · Score {l.score}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-xs font-medium text-foreground">{l.destino}</p>
                      <p className="text-[10px] text-muted-foreground">{l.embarque}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-accent" /> Alertas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertas.map((a) => (
              <div key={a.id} className={`p-3 rounded-md border ${a.nivel === 'rojo' ? 'bg-destructive/5 border-destructive/20' : a.nivel === 'ambar' ? 'bg-accent/5 border-accent/20' : 'bg-primary/5 border-primary/20'}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${a.nivel === 'rojo' ? 'text-destructive' : a.nivel === 'ambar' ? 'text-accent' : 'text-primary'}`} />
                  <p className="text-sm text-foreground">{a.texto}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full text-xs" onClick={() => navigate('/alerts')}>Ver todas las alertas</Button>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Nuevo Lote', icon: Package, route: '/exportador/lotes' },
          { label: 'Due Diligence EUDR', icon: FileCheck, route: '/exportador/eudr' },
          { label: 'Contratos', icon: DollarSign, route: '/exportador/contratos' },
          { label: 'Embarques', icon: Ship, route: '/exportador/embarques' },
        ].map(a => (
          <Button key={a.label} variant="outline" className="h-auto py-3 flex flex-col items-center gap-1.5" onClick={() => navigate(a.route)}>
            <a.icon className="h-5 w-5 text-primary" />
            <span className="text-xs">{a.label}</span>
          </Button>
        ))}
      </div>

      {/* Lote detail dialog */}
      <Dialog open={!!selectedLote} onOpenChange={(o) => !o && setSelectedLote(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de Lote</DialogTitle>
          </DialogHeader>
          {selectedLote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: 'Lote', v: selectedLote.id },
                  { l: 'Origen', v: selectedLote.origen },
                  { l: 'Peso', v: `${selectedLote.kg.toLocaleString()} kg` },
                  { l: 'Tipo', v: selectedLote.tipo },
                  { l: 'Score', v: `${selectedLote.score}/100` },
                  { l: 'Destino', v: selectedLote.destino },
                  { l: 'Embarque', v: selectedLote.embarque },
                  { l: 'EUDR', v: selectedLote.eudr === 'compliant' ? '✓ Compliant' : '⚠ Pendiente' },
                ].map(i => (
                  <div key={i.l} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">{i.l}</p>
                    <p className="text-sm font-medium text-foreground">{i.v}</p>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={() => { setSelectedLote(null); navigate('/exportador/lotes'); }}>Ver en Lotes Comerciales</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
