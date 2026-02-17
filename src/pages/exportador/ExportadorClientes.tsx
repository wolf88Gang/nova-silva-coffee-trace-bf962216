import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, MapPin } from 'lucide-react';

const clientes = [
  { id: '1', nombre: 'European Coffee Trading GmbH', pais: 'Alemania', contacto: 'Hans Mueller', email: 'hans@ect-coffee.de', contratosActivos: 1 },
  { id: '2', nombre: 'Nordic Roasters AB', pais: 'Suecia', contacto: 'Erik Johansson', email: 'erik@nordic-roasters.se', contratosActivos: 1 },
  { id: '3', nombre: 'Specialty Imports LLC', pais: 'Estados Unidos', contacto: 'Sarah Johnson', email: 'sarah@specialty-imports.com', contratosActivos: 0 },
];

export default function ExportadorClientes() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Clientes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {clientes.map((c) => (
            <div key={c.id} className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{c.nombre}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1"><MapPin className="h-3 w-3" /><span>{c.pais}</span></div>
                  <p className="text-sm text-muted-foreground mt-1">Contacto: {c.contacto} — {c.email}</p>
                </div>
                <span className="text-sm text-muted-foreground">{c.contratosActivos} contrato{c.contratosActivos !== 1 ? 's' : ''} activo{c.contratosActivos !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
