import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, DollarSign, TrendingUp } from 'lucide-react';

const creditos = [
  { id: '1', monto: 15000, saldo: 8500, estado: 'activo' as const, tipo: 'Insumos', vencimiento: '2026-06-30', proximoPago: '2026-03-15' },
  { id: '2', monto: 5000, saldo: 0, estado: 'pagado' as const, tipo: 'Emergencia', vencimiento: '2025-12-31', proximoPago: null },
];

const pagos = [
  { fecha: '2026-02-10', entrega: '460 kg pergamino', monto: 1472000, estado: 'pagado' },
  { fecha: '2026-01-28', entrega: '230 kg pergamino', monto: 713000, estado: 'pagado' },
  { fecha: '2025-12-15', entrega: '380 kg cereza', monto: 684000, estado: 'pagado' },
  { fecha: '2025-11-20', entrega: '520 kg pergamino', monto: 1612000, estado: 'pagado' },
];

export default function FinanzasHub() {
  const activos = creditos.filter(c => c.estado === 'activo');
  const saldoTotal = activos.reduce((s, c) => s + c.saldo, 0);
  const totalPagos = pagos.reduce((s, p) => s + p.monto, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Wallet className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Créditos Activos</span></div><p className="text-2xl font-bold text-foreground">{activos.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-accent" /><span className="text-xs text-muted-foreground">Saldo Pendiente</span></div><p className="text-2xl font-bold text-foreground">₡{saldoTotal.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-emerald-600" /><span className="text-xs text-muted-foreground">Total Recibido (periodo)</span></div><p className="text-2xl font-bold text-foreground">₡{totalPagos.toLocaleString()}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="creditos">
        <TabsList>
          <TabsTrigger value="creditos">Créditos</TabsTrigger>
          <TabsTrigger value="pagos">Pagos por Entregas</TabsTrigger>
        </TabsList>

        <TabsContent value="creditos" className="space-y-4 mt-4">
          {creditos.map(c => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{c.tipo}</CardTitle>
                  <Badge variant={c.estado === 'activo' ? 'default' : 'secondary'}>{c.estado === 'activo' ? 'Activo' : 'Pagado'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Monto aprobado</span><span className="font-medium text-foreground">₡{c.monto.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Saldo pendiente</span><span className="font-medium text-foreground">₡{c.saldo.toLocaleString()}</span></div>
                <Progress value={((c.monto - c.saldo) / c.monto) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">{Math.round(((c.monto - c.saldo) / c.monto) * 100)}% pagado — Vencimiento: {c.vencimiento}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pagos" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="pb-2 pr-4">Fecha</th><th className="pb-2 pr-4">Entrega</th><th className="pb-2 pr-4">Monto</th><th className="pb-2">Estado</th></tr></thead>
                  <tbody>
                    {pagos.map((p, i) => (
                      <tr key={i} className="border-b border-border/50"><td className="py-3 pr-4 text-foreground">{p.fecha}</td><td className="py-3 pr-4 text-muted-foreground">{p.entrega}</td><td className="py-3 pr-4 font-medium text-foreground">₡{p.monto.toLocaleString()}</td><td className="py-3"><Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Pagado</Badge></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
