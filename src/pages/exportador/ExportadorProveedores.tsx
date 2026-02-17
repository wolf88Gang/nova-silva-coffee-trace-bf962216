import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, TrendingUp } from 'lucide-react';

const proveedores = [
  { id: '1', nombre: 'Cooperativa Café de la Selva', pais: 'Guatemala', region: 'Huehuetenango', productores: 120, volumenHistorico: '450 sacos', compliance: 'compliant' as const },
  { id: '2', nombre: 'Cooperativa Los Altos', pais: 'Guatemala', region: 'Antigua', productores: 85, volumenHistorico: '320 sacos', compliance: 'compliant' as const },
  { id: '3', nombre: 'Cooperativa Montaña Verde', pais: 'Costa Rica', region: 'Tarrazú', productores: 200, volumenHistorico: '680 sacos', compliance: 'pending' as const },
];

const eudrBadge = (estado: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    compliant: { label: 'Cumple EUDR', variant: 'default' },
    pending: { label: 'Pendiente', variant: 'secondary' },
    'non-compliant': { label: 'No cumple', variant: 'destructive' },
  };
  const { label, variant } = map[estado] ?? map.pending;
  return <Badge variant={variant}>{label}</Badge>;
};

export default function ExportadorProveedores() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Cooperativas Proveedoras</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {proveedores.map((p) => (
            <div key={p.id} className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-foreground">{p.nombre}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" /><span>{p.region}, {p.pais}</span>
                  </div>
                </div>
                {eudrBadge(p.compliance)}
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                <span><Users className="h-3 w-3 inline mr-1" />{p.productores} productores</span>
                <span><TrendingUp className="h-3 w-3 inline mr-1" />{p.volumenHistorico}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
