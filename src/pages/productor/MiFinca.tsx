import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Sprout, Mountain, Eye } from 'lucide-react';

const parcelas = [
  { id: '1', nombre: 'El Mirador', area: 2.0, variedad: 'Caturra', altitud: 1450, estadoEUDR: 'compliant' as const, coordenadas: '15.4052, -91.4718' },
  { id: '2', nombre: 'La Esperanza', area: 1.5, variedad: 'Bourbon', altitud: 1380, estadoEUDR: 'compliant' as const, coordenadas: '15.4098, -91.4685' },
  { id: '3', nombre: 'Cerro Verde', area: 1.0, variedad: 'Catuaí', altitud: 1520, estadoEUDR: 'pending' as const, coordenadas: '15.4125, -91.4750' },
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

export default function MiFinca() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1"><MapPin className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Parcelas</span></div>
            <p className="text-2xl font-bold text-foreground">{parcelas.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1"><Sprout className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Hectáreas totales</span></div>
            <p className="text-2xl font-bold text-foreground">{parcelas.reduce((s, p) => s + p.area, 0).toFixed(1)} ha</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1"><Mountain className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Altitud promedio</span></div>
            <p className="text-2xl font-bold text-foreground">{Math.round(parcelas.reduce((s, p) => s + p.altitud, 0) / parcelas.length)} msnm</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Mis Parcelas</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {parcelas.map((p) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{p.nombre}</p>
                    {eudrBadge(p.estadoEUDR)}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{p.area} ha</span>
                    <span>Variedad: {p.variedad}</span>
                    <span>{p.altitud} msnm</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.coordenadas}</p>
                </div>
                <Button variant="outline" size="sm"><Eye className="h-3 w-3 mr-1" /> Ver detalle</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
