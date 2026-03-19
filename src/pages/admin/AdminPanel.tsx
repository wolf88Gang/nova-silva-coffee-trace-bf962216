import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Shield, Users, Database, Activity, Settings, Layers, Box } from 'lucide-react';

export default function AdminPanel() {
  const kpis = [
    { label: 'Organizaciones', value: 3, icon: Building2 },
    { label: 'Usuarios totales', value: 6, icon: Users },
    { label: 'Tablas activas', value: 57, icon: Database },
    { label: 'Edge functions', value: 22, icon: Activity },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-foreground mb-3">Organizaciones registradas</h3>
          <div className="space-y-2">
            {[
              { nombre: 'Cooperativa Demo Nova Silva', tipo: 'cooperativa', plan: 'premium', pais: 'Costa Rica', estado: 'active' },
              { nombre: 'Exportadora Sol de América', tipo: 'exportador', plan: 'premium', pais: 'Guatemala', estado: 'active' },
              { nombre: 'CertifiCafé Internacional', tipo: 'certificadora', plan: 'enterprise', pais: 'Costa Rica', estado: 'active' },
            ].map((o, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{o.nombre}</p>
                  <p className="text-xs text-muted-foreground">{o.pais} — {o.tipo}</p>
                </div>
                <Badge variant="outline">{o.plan}</Badge>
                <Badge variant="default">{o.estado}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link to="/admin/modules">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-medium">Module Explorer</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/components">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-2">
              <Box className="h-4 w-4 text-primary" />
              <span className="font-medium">Component Playground</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
