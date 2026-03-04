import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package, Truck, Plus, HandCoins, Eye, TrendingUp, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area,
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

// ── Ofertas demo ──
const ofertasDemo = [
  { id: '1', exportador: 'Volcafe S.A.', lote: 'LOT-2026-048', volumen: '30 QQ', precio: '₡285,000/QQ', fecha: '2026-02-20', estado: 'pendiente' },
  { id: '2', exportador: 'CECA Trading', lote: 'LOT-2026-045', volumen: '20 QQ', precio: '₡278,000/QQ', fecha: '2026-02-18', estado: 'aceptada' },
  { id: '3', exportador: 'Mercon Coffee', lote: 'LOT-2026-023', volumen: '50 QQ', precio: '₡292,000/QQ', fecha: '2026-02-15', estado: 'pendiente' },
  { id: '4', exportador: 'Nordic Approach', lote: 'LOT-2026-023', volumen: '15 QQ', precio: '₡320,000/QQ', fecha: '2026-02-12', estado: 'rechazada' },
];

const ofertaBadge = (e: string) => {
  if (e === 'aceptada') return <Badge className="bg-emerald-600 text-white border-0">Aceptada</Badge>;
  if (e === 'rechazada') return <Badge variant="destructive">Rechazada</Badge>;
  return <Badge className="bg-blue-500 text-white border-0">Pendiente</Badge>;
};

export default function AcopioHub() {
  const [showNuevaEntrega, setShowNuevaEntrega] = useState(false);
  const [showNuevoLote, setShowNuevoLote] = useState(false);
  const [selectedOferta, setSelectedOferta] = useState<typeof ofertasDemo[0] | null>(null);

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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1"><Truck className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Total Acopiado</span></div>
          <p className="text-xl font-bold text-foreground">{totalKg.toLocaleString()} kg</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Lotes Disponibles</span></div>
          <p className="text-xl font-bold text-foreground">{lotesDisponibles}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Entregas este mes</span></div>
          <p className="text-xl font-bold text-foreground">{DEMO_ENTREGAS.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1"><HandCoins className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Ofertas Pendientes</span></div>
          <p className="text-xl font-bold text-foreground">{ofertasDemo.filter(o => o.estado === 'pendiente').length}</p>
        </CardContent></Card>
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
              {ofertasDemo.map(o => (
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

      {/* ═══ OFERTA DETAIL ═══ */}
      <Dialog open={!!selectedOferta} onOpenChange={() => setSelectedOferta(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Oferta de {selectedOferta?.exportador}</DialogTitle></DialogHeader>
          {selectedOferta && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg border border-border"><p className="text-xs text-muted-foreground">Lote</p><p className="font-bold text-foreground">{selectedOferta.lote}</p></div>
                <div className="p-3 rounded-lg border border-border"><p className="text-xs text-muted-foreground">Volumen</p><p className="font-bold text-foreground">{selectedOferta.volumen}</p></div>
                <div className="p-3 rounded-lg border border-border"><p className="text-xs text-muted-foreground">Precio</p><p className="font-bold text-primary">{selectedOferta.precio}</p></div>
                <div className="p-3 rounded-lg border border-border"><p className="text-xs text-muted-foreground">Fecha</p><p className="font-bold text-foreground">{selectedOferta.fecha}</p></div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => { toast.success('Oferta aceptada'); setSelectedOferta(null); }}>Aceptar Oferta</Button>
                <Button variant="outline" className="flex-1" onClick={() => { toast.info('Oferta rechazada'); setSelectedOferta(null); }}>Rechazar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
