import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Building2, CheckCircle, FileText, Calendar } from 'lucide-react';

export default function DashboardCertificadora() {
  const kpis = [
    { label: 'Auditorías programadas', value: 5, icon: ClipboardList },
    { label: 'Organizaciones activas', value: 3, icon: Building2 },
    { label: 'Verificaciones completadas', value: 12, icon: CheckCircle },
    { label: 'Reportes generados', value: 8, icon: FileText },
    { label: 'Próxima auditoría', value: '2026-02-25', icon: Calendar },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 stagger-children">
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
          <h3 className="font-semibold text-foreground mb-3">Auditorías recientes</h3>
          <div className="space-y-2">
            {[
              { org: 'Cooperativa Café de la Selva', tipo: 'Rainforest Alliance', fecha: '2026-02-10', estado: 'completada' },
              { org: 'Exportadora Sol de América', tipo: 'EUDR Compliance', fecha: '2026-02-25', estado: 'programada' },
              { org: 'Cooperativa Los Altos', tipo: 'Fair Trade', fecha: '2026-03-05', estado: 'programada' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{a.org}</p>
                  <p className="text-xs text-muted-foreground">{a.tipo} — {a.fecha}</p>
                </div>
                <Badge variant={a.estado === 'completada' ? 'default' : 'secondary'}>{a.estado}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
