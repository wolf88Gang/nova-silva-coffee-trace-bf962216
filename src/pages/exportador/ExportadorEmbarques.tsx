import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ship } from 'lucide-react';

const embarques = [
  { id: '1', bl: 'BL-2026-0045', puertoOrigen: 'Puerto Quetzal, GT', puertoDestino: 'Hamburgo, DE', fechaSalida: '2026-02-20', llegadaEstimada: '2026-03-25', contenedores: 1, estado: 'programado' },
  { id: '2', bl: 'BL-2026-0038', puertoOrigen: 'Puerto Limón, CR', puertoDestino: 'Rotterdam, NL', fechaSalida: '2026-02-10', llegadaEstimada: '2026-03-15', contenedores: 2, estado: 'en_transito' },
  { id: '3', bl: 'BL-2025-0122', puertoOrigen: 'Puerto Quetzal, GT', puertoDestino: 'Bremen, DE', fechaSalida: '2025-12-15', llegadaEstimada: '2026-01-18', contenedores: 1, estado: 'entregado' },
];

export default function ExportadorEmbarques() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Ship className="h-5 w-5 text-primary" /> Embarques</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4">B/L</th><th className="pb-2 pr-4">Origen</th><th className="pb-2 pr-4">Destino</th><th className="pb-2 pr-4">Salida</th><th className="pb-2 pr-4">Llegada Est.</th><th className="pb-2 pr-4">Cont.</th><th className="pb-2">Estado</th>
              </tr></thead>
              <tbody>
                {embarques.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-foreground">{e.bl}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{e.puertoOrigen}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{e.puertoDestino}</td>
                    <td className="py-3 pr-4 text-foreground">{e.fechaSalida}</td>
                    <td className="py-3 pr-4 text-foreground">{e.llegadaEstimada}</td>
                    <td className="py-3 pr-4 text-foreground">{e.contenedores}</td>
                    <td className="py-3"><Badge variant={e.estado === 'en_transito' ? 'default' : e.estado === 'entregado' ? 'secondary' : 'outline'}>{e.estado === 'en_transito' ? 'En tránsito' : e.estado === 'entregado' ? 'Entregado' : 'Programado'}</Badge></td>
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
