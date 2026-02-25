import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Building2, CheckCircle, FileText, Calendar, ArrowRight } from 'lucide-react';

export default function DashboardCertificadora() {
  const navigate = useNavigate();

  const kpis = [
    { label: 'Auditorías programadas', value: 5, icon: ClipboardList, route: '/certificadora/auditorias' },
    { label: 'Organizaciones activas', value: 3, icon: Building2, route: '/certificadora/orgs' },
    { label: 'Verificaciones completadas', value: 12, icon: CheckCircle, route: '/certificadora/verificar' },
    { label: 'Reportes generados', value: 8, icon: FileText, route: '/certificadora/reportes' },
    { label: 'Próxima auditoría', value: '2026-02-25', icon: Calendar, route: '/certificadora/auditorias' },
  ];

  const auditorias = [
    { org: 'Cooperativa Café de la Selva', tipo: 'Rainforest Alliance', fecha: '2026-02-10', estado: 'completada' },
    { org: 'Exportadora Sol de América', tipo: 'EUDR Compliance', fecha: '2026-02-25', estado: 'programada' },
    { org: 'Cooperativa Los Altos', tipo: 'Fair Trade', fecha: '2026-03-05', estado: 'programada' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 stagger-children">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(kpi.route)}>
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Auditorías recientes</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/certificadora/auditorias')}>Ver todo <ArrowRight className="h-3 w-3 ml-1" /></Button>
          </div>
          <div className="space-y-2">
            {auditorias.map((a, i) => (
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
