import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Mail, User, Loader2 } from 'lucide-react';
import { useClientesCompradores } from '@/hooks/useClientesCompradores';
import { useContratos } from '@/hooks/useContratos';

export default function ExportadorClientes() {
  const { data: clientes = [], isLoading } = useClientesCompradores();
  const { data: contratos = [] } = useContratos();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  // Count active contracts per client name for cross-reference
  const contratosActivosPorCliente = (nombre: string) =>
    contratos.filter(c => c.estado !== 'cerrado' && c.cliente === nombre).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes Compradores</h1>
          <p className="text-sm text-muted-foreground">{clientes.length} clientes registrados</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Directorio</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {clientes.map((c) => {
            const activos = contratosActivosPorCliente(c.nombre);
            return (
              <div key={c.id} className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{c.nombre}</p>
                    {c.pais && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" /><span>{c.pais}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {c.contacto && <span className="flex items-center gap-1"><User className="h-3 w-3" />{c.contacto}</span>}
                      {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                    </div>
                  </div>
                  <Badge variant={activos > 0 ? 'default' : 'secondary'}>
                    {activos} contrato{activos !== 1 ? 's' : ''} activo{activos !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
