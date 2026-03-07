import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, AlertTriangle, Loader2 } from 'lucide-react';
import { useLotesComerciales } from '@/hooks/useLotesComerciales';

const estadoBadge = (estado: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    en_formacion: { label: 'En formación', variant: 'secondary' },
    listo: { label: 'Listo', variant: 'default' },
    en_transito: { label: 'En tránsito', variant: 'outline' },
    entregado: { label: 'Entregado', variant: 'default' },
  };
  const { label, variant } = map[estado] ?? map.en_formacion;
  return <Badge variant={variant}>{label}</Badge>;
};

export default function ExportadorLotes() {
  const { data: lotes = [], isLoading } = useLotesComerciales();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
          Integración con lotes de acopio pendiente — La vinculación automática entre lotes de acopio de cooperativas y lotes comerciales estará disponible próximamente.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Lotes Comerciales</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4">Código ICO</th><th className="pb-2 pr-4">Origen</th><th className="pb-2 pr-4">Sacos</th><th className="pb-2 pr-4">Tipo</th><th className="pb-2 pr-4">SCA</th><th className="pb-2 pr-4">EUDR</th><th className="pb-2">Estado</th>
              </tr></thead>
              <tbody>
                {DEMO_LOTES_COMERCIALES.map((l) => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-foreground">{l.codigoICO}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{l.origen}</td>
                    <td className="py-3 pr-4 text-foreground">{l.pesoSacos}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{l.tipoCafe}</td>
                    <td className="py-3 pr-4 font-medium text-foreground">{l.puntajeSCA}</td>
                    <td className="py-3 pr-4"><Badge variant={l.estadoEUDR === 'compliant' ? 'default' : 'secondary'}>{l.estadoEUDR === 'compliant' ? 'Cumple' : 'Pendiente'}</Badge></td>
                    <td className="py-3">{estadoBadge(l.estado)}</td>
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
