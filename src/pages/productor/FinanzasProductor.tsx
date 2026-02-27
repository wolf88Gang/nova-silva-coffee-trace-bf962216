import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, DollarSign, Wallet, TrendingDown, Plus, Leaf, Calendar } from 'lucide-react';

// ── Entregas data ──
const entregas = [
  { id: '1', fecha: '2026-02-10', pesoKg: 460, tipoCafe: 'Pergamino', precio: 3200, estadoPago: 'pagado' as const },
  { id: '2', fecha: '2026-01-28', pesoKg: 230, tipoCafe: 'Pergamino', precio: 3100, estadoPago: 'parcial' as const },
  { id: '3', fecha: '2026-01-15', pesoKg: 345, tipoCafe: 'Cereza', precio: 1750, estadoPago: 'pagado' as const },
  { id: '4', fecha: '2025-12-20', pesoKg: 575, tipoCafe: 'Pergamino', precio: 3000, estadoPago: 'pagado' as const },
];

// ── Finanzas data ──
const transacciones = [
  { fecha: '2026-02-10', concepto: 'Pago entrega #460kg', monto: 1472000, tipo: 'ingreso' },
  { fecha: '2026-01-28', concepto: 'Pago parcial entrega #230kg', monto: 357000, tipo: 'ingreso' },
  { fecha: '2026-02-01', concepto: 'Cuota crédito insumos', monto: -25000, tipo: 'egreso' },
  { fecha: '2026-01-15', concepto: 'Pago entrega #345kg', monto: 603750, tipo: 'ingreso' },
];

// ── Créditos data ──
const creditos = [
  { id: '1', tipo: 'Insumos agrícolas', monto: 150000, saldo: 75000, cuota: 25000, otorgado: '14 sep 2024', cuotas: '3/6', estado: 'activo' as const },
  { id: '2', tipo: 'Capital de trabajo', monto: 80000, saldo: 40000, cuota: 20000, otorgado: '31 may 2024', cuotas: '2/4', estado: 'activo' as const },
];

const creditosKPIs = [
  { label: 'Saldo Pendiente', value: '₡95,000', sub: '2 créditos activos', icon: TrendingDown },
  { label: 'Créditos Activos', value: '2', sub: 'En proceso de pago', icon: Wallet },
  { label: 'Próximo Pago', value: '26 feb', sub: '₡25,000 aprox.', icon: Calendar },
];

const pagoBadge = (estado: string) => {
  if (estado === 'pagado') return <Badge variant="default">Pagado</Badge>;
  if (estado === 'parcial') return <Badge variant="secondary">Parcial</Badge>;
  return <Badge variant="destructive">Pendiente</Badge>;
};

export default function FinanzasProductor() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm text-muted-foreground">Entregas, transacciones, créditos y activos de carbono</p>
      </div>

      <Tabs defaultValue="entregas">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="entregas" className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Entregas</TabsTrigger>
          <TabsTrigger value="finanzas" className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Finanzas</TabsTrigger>
          <TabsTrigger value="creditos" className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Créditos</TabsTrigger>
          <TabsTrigger value="carbono" className="flex items-center gap-1.5"><Leaf className="h-3.5 w-3.5" /> Carbono</TabsTrigger>
        </TabsList>

        {/* ── ENTREGAS ── */}
        <TabsContent value="entregas" className="space-y-4 mt-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Mis entregas</h2>
            <p className="text-sm text-muted-foreground">Historial de entregas de café a la organización</p>
          </div>

          <div className="space-y-3">
            {entregas.map((e) => (
              <Card key={e.id}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.pesoKg} kg — {e.tipoCafe}</p>
                      <p className="text-xs text-muted-foreground">{e.fecha} • ₡{e.precio.toLocaleString()}/kg</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-foreground">₡{(e.pesoKg * e.precio).toLocaleString()}</p>
                      {pagoBadge(e.estadoPago)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── FINANZAS ── */}
        <TabsContent value="finanzas" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Ingresos (periodo)</span></div>
              <p className="text-2xl font-bold text-primary">₡2,432,750</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-accent" /><span className="text-xs text-muted-foreground">Egresos</span></div>
              <p className="text-2xl font-bold text-foreground">₡25,000</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1"><Wallet className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Balance neto</span></div>
              <p className="text-2xl font-bold text-primary">₡2,407,750</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Movimientos recientes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {transacciones.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.concepto}</p>
                    <p className="text-xs text-muted-foreground">{t.fecha}</p>
                  </div>
                  <p className={`text-sm font-bold ${t.tipo === 'ingreso' ? 'text-primary' : 'text-accent'}`}>
                    {t.tipo === 'ingreso' ? '+' : ''}₡{Math.abs(t.monto).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CRÉDITOS ── */}
        <TabsContent value="creditos" className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /> Mis Créditos</h2>
              <p className="text-sm text-muted-foreground">Consulta el estado de tus créditos con la organización.</p>
            </div>
            <Button><Plus className="h-4 w-4 mr-1" /> Solicitar Crédito</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {creditosKPIs.map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Créditos Activos</CardTitle>
              <p className="text-xs text-muted-foreground">Detalle de tus créditos con la organización</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {creditos.map((c) => (
                <Card key={c.id} className="border border-border">
                  <CardContent className="pt-4 pb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{c.tipo}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Otorgado: {c.otorgado}</p>
                      </div>
                      <Badge variant="default">Activo</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Monto otorgado</p>
                        <p className="font-bold text-foreground">₡{c.monto.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                        <p className="font-bold text-accent">₡{c.saldo.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cuota mensual</p>
                        <p className="font-bold text-foreground">₡{c.cuota.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progreso de pago</span>
                        <span>{c.cuotas} cuotas</span>
                      </div>
                      <Progress value={((c.monto - c.saldo) / c.monto) * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CARBONO ── */}
        <TabsContent value="carbono" className="space-y-4 mt-4">
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <Leaf className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <h2 className="text-lg font-semibold text-foreground">Activos de Carbono</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Próximamente podrás visualizar tus créditos de carbono generados por tus prácticas agrícolas sostenibles.
              </p>
              <Badge variant="outline">Próximamente</Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
