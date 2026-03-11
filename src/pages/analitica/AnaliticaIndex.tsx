import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, AlertTriangle, Map, ArrowRight } from 'lucide-react';

const sections = [
  { title: 'Señales de riesgo', description: 'Alertas agronómicas agregadas por zona y proveedor', icon: AlertTriangle, path: '/analitica/riesgo', stat: '8 señales activas' },
  { title: 'Recomendaciones agregadas', description: 'Intervenciones sugeridas por clúster de proveedores', icon: TrendingUp, path: '/analitica/recomendaciones', stat: '12 recomendaciones' },
  { title: 'Riesgo fitosanitario', description: 'Presión fitosanitaria por zona y tendencias Guard', icon: Map, path: '/analitica/fitosanitario', stat: '3 zonas críticas' },
  { title: 'Potencial productivo', description: 'Yield proxy por región, variedad y proveedor', icon: BarChart3, path: '/analitica/productivo', stat: '32K qq proyectados' },
];

export default function AnaliticaIndex() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader title="Analítica Agronómica" description="Insights agregados de origen, riesgo y potencial productivo" />

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(s => (
          <Card key={s.path} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(s.path)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-primary/10 text-primary"><s.icon className="h-5 w-5" /></div>
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
