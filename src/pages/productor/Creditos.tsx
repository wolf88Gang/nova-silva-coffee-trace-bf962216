import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wallet, AlertTriangle } from 'lucide-react';

const creditos = [
  { id: '1', monto: 15000, saldo: 8500, estado: 'activo' as const, tipo: 'Insumos', fechaVencimiento: '2026-06-30', proximoPago: '2026-03-15' },
  { id: '2', monto: 5000, saldo: 0, estado: 'pagado' as const, tipo: 'Emergencia', fechaVencimiento: '2025-12-31', proximoPago: null },
];

const estadoBadge = (estado: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    activo: { label: 'Activo', variant: 'default' },
    pagado: { label: 'Pagado', variant: 'secondary' },
    vencido: { label: 'Vencido', variant: 'destructive' },
  };
  const { label, variant } = map[estado] ?? map.activo;
  return <Badge variant={variant}>{label}</Badge>;
};

export default function Creditos() {
  const activos = creditos.filter(c => c.estado === 'activo');
  const saldoTotal = activos.reduce((s, c) => s + c.saldo, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Wallet className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Créditos activos</span></div>
          <p className="text-2xl font-bold text-foreground">{activos.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4 text-accent" /><span className="text-xs text-muted-foreground">Saldo pendiente</span></div>
          <p className="text-2xl font-bold text-foreground">Q {saldoTotal.toLocaleString()}</p>
        </CardContent></Card>
      </div>

      <div className="space-y-4">
        {creditos.map((c) => (
          <Card key={c.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{c.tipo}</CardTitle>
                {estadoBadge(c.estado)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monto aprobado</span>
                <span className="font-medium text-foreground">Q {c.monto.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Saldo pendiente</span>
                <span className="font-medium text-foreground">Q {c.saldo.toLocaleString()}</span>
              </div>
              <Progress value={((c.monto - c.saldo) / c.monto) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">{Math.round(((c.monto - c.saldo) / c.monto) * 100)}% pagado</p>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Vencimiento: {c.fechaVencimiento}</span>
                {c.proximoPago && <span>Próximo pago: {c.proximoPago}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
