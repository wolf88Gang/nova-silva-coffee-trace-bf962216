import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

const proveedores = [
  { nombre: 'Cooperativa Café de la Selva', productoresMapeados: 118, totalProductores: 120, parcelasVerificadas: 95, estado: 'compliant' },
  { nombre: 'Cooperativa Los Altos', productoresMapeados: 85, totalProductores: 85, parcelasVerificadas: 100, estado: 'compliant' },
  { nombre: 'Cooperativa Montaña Verde', productoresMapeados: 160, totalProductores: 200, parcelasVerificadas: 72, estado: 'pending' },
];

export default function ExportadorEUDR() {
  const totalCompliant = proveedores.filter(p => p.estado === 'compliant').length;
  const pctCompliance = Math.round((totalCompliant / proveedores.length) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><ShieldCheck className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Compliance EUDR</span></div>
          <p className="text-2xl font-bold text-foreground">{pctCompliance}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <span className="text-xs text-muted-foreground">Proveedores compliant</span>
          <p className="text-2xl font-bold text-foreground">{totalCompliant}/{proveedores.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4 text-accent" /><span className="text-xs text-muted-foreground">Alertas de riesgo</span></div>
          <p className="text-2xl font-bold text-foreground">{proveedores.filter(p => p.estado !== 'compliant').length}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Estado por Proveedor</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {proveedores.map((p, i) => (
            <div key={i} className="p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-foreground">{p.nombre}</p>
                <Badge variant={p.estado === 'compliant' ? 'default' : 'secondary'}>{p.estado === 'compliant' ? 'Cumple' : 'Pendiente'}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Productores mapeados</span><span className="text-foreground">{p.productoresMapeados}/{p.totalProductores}</span></div>
                <Progress value={(p.productoresMapeados / p.totalProductores) * 100} className="h-2" />
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Parcelas verificadas</span><span className="text-foreground">{p.parcelasVerificadas}%</span></div>
                <Progress value={p.parcelasVerificadas} className="h-2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
