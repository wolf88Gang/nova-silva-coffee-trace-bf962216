import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, MapPin } from 'lucide-react';

const parcelas = [
  { id: '1', nombre: 'El Mirador', productor: 'Juan Pérez López', area: 2.0, variedad: 'Caturra', estadoEUDR: 'compliant', comunidad: 'San Miguel' },
  { id: '2', nombre: 'La Esperanza', productor: 'Juan Pérez López', area: 1.5, variedad: 'Bourbon', estadoEUDR: 'compliant', comunidad: 'San Miguel' },
  { id: '3', nombre: 'Cerro Verde', productor: 'María Santos García', area: 3.2, variedad: 'Catuaí', estadoEUDR: 'compliant', comunidad: 'El Progreso' },
  { id: '4', nombre: 'Las Nubes', productor: 'Pedro Ramírez Cruz', area: 1.8, variedad: 'Caturra', estadoEUDR: 'pending', comunidad: 'Las Flores' },
  { id: '5', nombre: 'San José', productor: 'Ana López Martínez', area: 3.0, variedad: 'Bourbon', estadoEUDR: 'compliant', comunidad: 'San Miguel' },
  { id: '6', nombre: 'El Cafetal', productor: 'Carlos Hernández', area: 2.5, variedad: 'Catuaí', estadoEUDR: 'non-compliant', comunidad: 'El Progreso' },
];

const eudrBadge = (estado: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    compliant: { label: 'Cumple', variant: 'default' },
    pending: { label: 'Pendiente', variant: 'secondary' },
    'non-compliant': { label: 'No cumple', variant: 'destructive' },
  };
  const { label, variant } = map[estado] ?? map.pending;
  return <Badge variant={variant}>{label}</Badge>;
};

export default function TecnicoParcelas() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Map className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Total parcelas</span></div>
          <p className="text-2xl font-bold text-foreground">{parcelas.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><MapPin className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Hectáreas totales</span></div>
          <p className="text-2xl font-bold text-foreground">{parcelas.reduce((s, p) => s + p.area, 0).toFixed(1)} ha</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Map className="h-5 w-5 text-primary" /> Parcelas de Productores Asignados</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4">Parcela</th><th className="pb-2 pr-4">Productor</th><th className="pb-2 pr-4">Comunidad</th><th className="pb-2 pr-4">Área</th><th className="pb-2 pr-4">Variedad</th><th className="pb-2">EUDR</th>
              </tr></thead>
              <tbody>
                {parcelas.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-foreground">{p.nombre}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{p.productor}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{p.comunidad}</td>
                    <td className="py-3 pr-4 text-foreground">{p.area} ha</td>
                    <td className="py-3 pr-4 text-muted-foreground">{p.variedad}</td>
                    <td className="py-3">{eudrBadge(p.estadoEUDR)}</td>
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
