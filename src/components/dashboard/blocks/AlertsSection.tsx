import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle } from 'lucide-react';
import { hasModule, type OrgModule } from '@/lib/org-modules';
import { DEMO_ALERTAS } from '@/lib/demo-data';

interface AlertsSectionProps {
  activeModules: OrgModule[];
  role: string | null;
}

const MODULE_ALERT_MAP: Record<string, OrgModule> = {
  fitosanitaria: 'parcelas',
  vital: 'vital',
  credito: 'creditos',
  eudr: 'eudr',
};

const nivelColor: Record<string, string> = {
  rojo: 'bg-destructive',
  ambar: 'bg-warning',
  verde: 'bg-success',
};

export function AlertsSection({ activeModules, role }: AlertsSectionProps) {
  // Productor has simplified alerts
  if (role === 'productor' || role === 'tecnico') return null;

  const alerts = DEMO_ALERTAS.filter(a => {
    const mod = MODULE_ALERT_MAP[a.tipo];
    if (!mod) return true;
    return hasModule(activeModules, mod);
  });

  if (alerts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-accent" />
          Alertas Recientes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[280px]">
          <div className="space-y-0">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3 border-b last:border-0">
                <span className={`mt-1 inline-block w-2 h-2 rounded-full shrink-0 ${nivelColor[a.nivel] || 'bg-muted'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{a.titulo}</p>
                  <p className="text-xs text-muted-foreground">{a.fecha}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{a.tipo}</Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
