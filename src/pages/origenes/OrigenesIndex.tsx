import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Map, ShieldCheck, AlertTriangle, TrendingUp, Award, ArrowRight } from 'lucide-react';
import { getDemoProveedores, getCupKPIs } from '@/lib/demoSeedData';

export default function OrigenesIndex() {
  const navigate = useNavigate();
  const proveedores = getDemoProveedores();
  const cupKPIs = getCupKPIs();
  const regiones = [...new Set(proveedores.map(p => p.region))];
  const alertas = proveedores.filter(p => p.eudr === 'Riesgo').length;
  const conforme = proveedores.filter(p => p.eudr === 'Conforme').length;

  const sections = [
    { title: 'Proveedores', description: 'Red de productores, cooperativas y fincas proveedoras', icon: Users, path: '/origenes/proveedores', stat: `${proveedores.length} activos` },
    { title: 'Regiones', description: 'Zonas de origen, perfiles de taza y riesgo por región', icon: Map, path: '/origenes/regiones', stat: `${regiones.length} regiones` },
    { title: 'Riesgo de origen', description: 'Score de riesgo por proveedor, zona y cumplimiento EUDR', icon: AlertTriangle, path: '/origenes/riesgo', stat: `${alertas} alertas` },
    { title: 'Potencial productivo', description: 'Estimaciones Yield agregadas por zona y proveedor', icon: TrendingUp, path: '/origenes/potencial', stat: `${(proveedores.length * 8).toLocaleString()} qq estimados` },
    { title: 'Calidad por origen', description: 'Tendencias Nova Cup por región y proveedor', icon: Award, path: '/origenes/calidad', stat: `${cupKPIs.score_promedio} prom.` },
    { title: 'EUDR por proveedor', description: 'Estado de cumplimiento por proveedor y zona', icon: ShieldCheck, path: '/origenes/eudr', stat: `${Math.round(conforme / proveedores.length * 100)}% conforme` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Orígenes" description="Red de proveedores, regiones y señales de origen" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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