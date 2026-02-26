import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { hasModule, type OrgModule } from '@/lib/org-modules';
import { Shield, ShieldCheck, Wallet, Boxes, Users as UsersIcon, Package } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface ModuleStatus {
  module: OrgModule;
  label: string;
  icon: LucideIcon;
  value: string;
  progress?: number;
}

const ALL_STATUSES: ModuleStatus[] = [
  { module: 'vital', label: 'Protocolo VITAL', icon: Shield, value: '65% cobertura', progress: 65 },
  { module: 'eudr', label: 'EUDR', icon: ShieldCheck, value: '3 contenedores pendientes' },
  { module: 'creditos', label: 'Créditos', icon: Wallet, value: '2 aprobaciones pendientes' },
  { module: 'jornales', label: 'Jornales', icon: UsersIcon, value: 'Campaña activa' },
  { module: 'inventario', label: 'Inventario', icon: Boxes, value: '4 lotes disponibles' },
  { module: 'lotes_comerciales', label: 'Lotes Comerciales', icon: Package, value: '3 en formación' },
];

interface ModuleStatusSectionProps {
  activeModules: OrgModule[];
}

export function ModuleStatusSection({ activeModules }: ModuleStatusSectionProps) {
  const visible = ALL_STATUSES.filter(s => hasModule(activeModules, s.module));

  if (visible.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {visible.map((s) => (
        <Card key={s.module} className="border-l-4 border-l-primary/30">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{s.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{s.value}</p>
            {s.progress !== undefined && (
              <Progress value={s.progress} className="h-1.5 mt-2" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
