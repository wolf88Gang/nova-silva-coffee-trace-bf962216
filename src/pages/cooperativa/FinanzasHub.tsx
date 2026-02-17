import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { DEMO_CREDITOS } from '@/lib/demo-data';

export default function FinanzasHub() {
  const totalColocado = DEMO_CREDITOS.reduce((s, c) => s + c.monto, 0);
  const totalPorCobrar = DEMO_CREDITOS.filter(c => c.estado !== 'pagado').reduce((s, c) => s + c.saldo, 0);
  const mora = DEMO_CREDITOS.filter(c => c.estado === 'vencido').reduce((s, c) => s + c.saldo, 0);
  const indiceRecuperacion = Math.round(((totalColocado - totalPorCobrar) / totalColocado) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Finanzas</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Wallet className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Total colocado</span></div><p className="text-xl font-bold">₡{totalColocado.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-accent" /><span className="text-xs text-muted-foreground">Por cobrar</span></div><p className="text-xl font-bold">₡{totalPorCobrar.toLocaleString()}</p></CardContent></Card>
        <Card className="border-destructive/30"><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><CreditCard className="h-4 w-4 text-destructive" /><span className="text-xs text-muted-foreground">Mora actual</span></div><p className="text-xl font-bold text-destructive">₡{mora.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Recuperación</span></div><p className="text-xl font-bold">{indiceRecuperacion}%</p><Progress value={indiceRecuperacion} className="h-1.5 mt-1" /></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Cartera de créditos</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground text-left">
                <th className="px-4 py-3 font-medium">Productor</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Saldo</th>
                <th className="px-4 py-3 font-medium">Vencimiento</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr></thead>
              <tbody>
                {DEMO_CREDITOS.map(c => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{c.productorNombre}</td>
                    <td className="px-4 py-3">{c.tipo}</td>
                    <td className="px-4 py-3">₡{c.monto.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold">₡{c.saldo.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.fechaVencimiento}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.estado === 'pagado' ? 'default' : c.estado === 'vencido' ? 'destructive' : 'secondary'}>{c.estado}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
