import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, FileText, Coffee, ArrowRight } from 'lucide-react';

const sections = [
  { title: 'Lotes comerciales', description: 'Consolidación, composición y estado de lotes', icon: Package, path: '/comercial/lotes', stat: '28 lotes activos' },
  { title: 'Contratos', description: 'Contratos de venta y compromisos con clientes', icon: FileText, path: '/comercial/contratos', stat: '12 contratos' },
  { title: 'Mezclas', description: 'Composición y recetas de mezclas comerciales', icon: Coffee, path: '/comercial/mezclas', stat: '6 mezclas' },
  { title: 'Trazabilidad', description: 'Cadena lote-parcela-proveedor de cada venta', icon: FileText, path: '/comercial/trazabilidad', stat: '98% trazado' },
];

export default function ComercialIndex() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader title="Comercial" description="Lotes, contratos, mezclas y trazabilidad comercial" />

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(s => (
          <Card key={s.path} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(s.path)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-accent/10 text-accent"><s.icon className="h-5 w-5" /></div>
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
    </div>
  );
}
