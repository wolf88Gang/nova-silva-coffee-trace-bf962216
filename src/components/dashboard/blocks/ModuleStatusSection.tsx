import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { hasModule, type OrgModule } from '@/lib/org-modules';
import { Shield, ShieldCheck, Wallet, Boxes, Users as UsersIcon, Package, Sprout, Coffee, BarChart3, MessageSquare } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ModuleStatus {
  module: OrgModule;
  label: string;
  icon: LucideIcon;
  value: string;
  progress?: number;
  path: string;
}

const ALL_STATUSES: ModuleStatus[] = [
  { module: 'vital', label: 'Protocolo VITAL', icon: Shield, value: '65% cobertura', progress: 65, path: '/cooperativa/vital' },
  { module: 'eudr', label: 'EUDR', icon: ShieldCheck, value: '3 contenedores pendientes', path: '/cooperativa/acopio' },
  { module: 'nutricion', label: 'Nutrición', icon: Sprout, value: '3 planes activos, 45% ejecución promedio', progress: 45, path: '/cooperativa/nutricion' },
  { module: 'creditos', label: 'Créditos', icon: Wallet, value: '2 solicitudes pendientes en comité', path: '/cooperativa/finanzas-hub' },
  { module: 'calidad', label: 'NovaCup (Cataciones)', icon: Coffee, value: '12 muestras evaluadas, promedio 84.5', progress: 84, path: '/cooperativa/calidad' },
  { module: 'jornales', label: 'Jornales', icon: UsersIcon, value: 'Campaña activa', path: '/cooperativa/operaciones' },
  { module: 'inventario', label: 'Inventario', icon: Boxes, value: '4 lotes disponibles', path: '/cooperativa/operaciones' },
  { module: 'lotes_comerciales', label: 'Lotes Comerciales', icon: Package, value: '3 en formación', path: '/cooperativa/calidad' },
  { module: 'mensajes', label: 'Comunicación', icon: MessageSquare, value: '5 avisos activos', path: '/cooperativa/comunicacion' },
];

interface ModuleStatusSectionProps {
  activeModules: OrgModule[];
}

export function ModuleStatusSection({ activeModules }: ModuleStatusSectionProps) {
  const navigate = useNavigate();
  const visible = ALL_STATUSES.filter(s => hasModule(activeModules, s.module));

  if (visible.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {visible.map((s) => (
        <Card
          key={s.module}
          className="border-l-4 border-l-primary/30 cursor-pointer hover:border-l-primary hover:shadow-md transition-all"
          onClick={() => navigate(s.path)}
        >
          <CardContent className="py-4 px-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
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
