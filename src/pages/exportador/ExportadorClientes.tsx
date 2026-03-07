import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, MapPin } from 'lucide-react';
import { useClientesCompradores } from '@/hooks/useClientesCompradores';

function getContratosActivos(c: Record<string, unknown>): number {
  return (c.contratos_activos ?? c.contratosActivos ?? 0) as number;
}

const DEMO_CLIENTES = [
  { id: '1', nombre: 'European Coffee Trading GmbH', pais: 'Alemania', contacto: 'Hans Mueller', email: 'hans@ect-coffee.de', contratos_activos: 1 },
  { id: '2', nombre: 'Nordic Roasters AB', pais: 'Suecia', contacto: 'Erik Johansson', email: 'erik@nordic-roasters.se', contratos_activos: 1 },
  { id: '3', nombre: 'Specialty Imports LLC', pais: 'Estados Unidos', contacto: 'Sarah Johnson', email: 'sarah@specialty-imports.com', contratos_activos: 0 },
];

export default function ExportadorClientes() {
  const { data: clientesRaw, isLoading } = useClientesCompradores();
  const clientes = (clientesRaw?.length ? clientesRaw : DEMO_CLIENTES) as typeof DEMO_CLIENTES;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Clientes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando clientes…</p>
          ) : (
          clientes.map((c) => (
            <div key={c.id} className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{c.nombre}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1"><MapPin className="h-3 w-3" /><span>{c.pais}</span></div>
                  <p className="text-sm text-muted-foreground mt-1">Contacto: {c.contacto} — {c.email}</p>
                </div>
                <span className="text-sm text-muted-foreground">{getContratosActivos(c)} contrato{getContratosActivos(c) !== 1 ? 's' : ''} activo{getContratosActivos(c) !== 1 ? 's' : ''}</span>
              </div>
            </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
