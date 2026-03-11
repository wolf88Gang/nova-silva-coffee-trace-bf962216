import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Package, FileText, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

const sections = [
  { title: 'Proveedores', description: 'Registro y estado de productores y fincas externas', icon: Users, path: '/abastecimiento/proveedores', stat: '82 activos' },
  { title: 'Recepción de café', description: 'Ingresos, pesaje, calidad de recibo y trazabilidad', icon: Package, path: '/abastecimiento/recepcion', stat: '340 recepciones' },
  { title: 'Compras y lotes', description: 'Compras consolidadas, precios y lotes de origen', icon: FileText, path: '/abastecimiento/compras', stat: '56 lotes' },
  { title: 'Evidencias proveedor', description: 'Documentación, certificados y datos de origen', icon: FileText, path: '/abastecimiento/evidencias', stat: '124 archivos' },
  { title: 'Riesgo de origen', description: 'Score de riesgo por proveedor, zona y cumplimiento', icon: AlertTriangle, path: '/abastecimiento/riesgo', stat: '3 alertas' },
  { title: 'EUDR de abastecimiento', description: 'Estado de cumplimiento EUDR por proveedor y lote', icon: ShieldCheck, path: '/abastecimiento/eudr', stat: '94% conforme' },
];

export default function AbastecimientoIndex() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader title="Abastecimiento" description="Red de proveedores externos, compras y riesgo de origen" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(s => (
          <Card key={s.path} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(s.path)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-accent/10 text-accent">
                  <s.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardTitle className="text-base mt-2">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{s.description}</p>
              <Badge variant="secondary" className="text-xs">{s.stat}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cross signals */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Señales de la red</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <span className="h-2 w-2 rounded-full bg-warning" />
              <span className="text-sm">5 proveedores con documentación pendiente</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-sm">2 alertas de riesgo de deforestación</span>
            </div>
            <div className="flex items-center gap-2 pu-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm">12 lotes pendientes de clasificación</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
