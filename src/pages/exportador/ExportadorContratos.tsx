import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { useContratos } from '@/hooks/useContratos';

const DEMO_CONTRATOS = [
  { id: 'C-001', numero: 'NS-2026-001', cliente: 'European Coffee Trading GmbH', volumen: '250 sacos', precio: 'USD 4.20/lb', incoterm: 'FOB', ventana: 'Mar-Abr 2026', estado: 'activo' },
  { id: 'C-002', numero: 'NS-2026-002', cliente: 'Nordic Roasters AB', volumen: '180 sacos', precio: 'USD 4.50/lb', incoterm: 'CIF', ventana: 'Feb-Mar 2026', estado: 'en_ejecucion' },
  { id: 'C-003', numero: 'NS-2025-015', cliente: 'Specialty Imports LLC', volumen: '320 sacos', precio: 'USD 3.80/lb', incoterm: 'FOB', ventana: 'Nov-Dic 2025', estado: 'cerrado' },
];

function toDisplayRow(c: Record<string, unknown>) {
  return {
    id: c.id ?? c.numero,
    numero: (c.numero ?? c.referencia ?? c.id) as string,
    cliente: (c.cliente ?? c.cliente_nombre ?? c.comprador_nombre ?? '-') as string,
    volumen: (c.volumen ?? c.volumen_kg ? `${c.volumen_kg} kg` : '-') as string,
    precio: (c.precio ?? c.precio_unitario ? `USD ${c.precio_unitario}/lb` : '-') as string,
    incoterm: (c.incoterm ?? '-') as string,
    ventana: (c.ventana ?? c.ventana_entrega ?? '-') as string,
    estado: (c.estado ?? 'activo') as string,
  };
}

export default function ExportadorContratos() {
  const { data: contratosRaw, isLoading } = useContratos();
  const contratos = (contratosRaw?.length ? contratosRaw.map(toDisplayRow) : DEMO_CONTRATOS) as typeof DEMO_CONTRATOS;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Contratos</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando contratos…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Número</th><th className="pb-2 pr-4">Cliente</th><th className="pb-2 pr-4">Volumen</th><th className="pb-2 pr-4">Precio</th><th className="pb-2 pr-4">Incoterm</th><th className="pb-2 pr-4">Ventana</th><th className="pb-2">Estado</th>
                </tr></thead>
                <tbody>
                  {contratos.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 pr-4 font-medium text-foreground">{c.numero}</td>
                      <td className="py-3 pr-4 text-foreground">{c.cliente}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{c.volumen}</td>
                      <td className="py-3 pr-4 text-foreground">{c.precio}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{c.incoterm}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{c.ventana}</td>
                      <td className="py-3"><Badge variant={c.estado === 'activo' ? 'default' : c.estado === 'cerrado' ? 'secondary' : 'outline'}>{c.estado === 'en_ejecucion' ? 'En ejecución' : c.estado === 'cerrado' ? 'Cerrado' : 'Activo'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
