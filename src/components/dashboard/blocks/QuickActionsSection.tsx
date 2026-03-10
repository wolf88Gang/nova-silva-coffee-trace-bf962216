import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { hasModule, type OrgModule } from '@/lib/org-modules';
import { getNewActorLabel } from '@/lib/org-terminology';
import { UserPlus, Package, Shield, Wallet, FileText, Map, Leaf, ShieldCheck, Building2, Boxes, Coffee, Sprout, BarChart3 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  label: string;
  icon: LucideIcon;
  route: string;
  module?: OrgModule;
}

function getActions(role: string | null, orgTipo: string | null): QuickAction[] {
  const newActorLabel = getNewActorLabel(orgTipo);

  switch (role) {
    case 'cooperativa':
      return [
        { label: newActorLabel, icon: UserPlus, route: '/cooperativa/productores-hub', module: 'productores' },
        { label: 'Nueva Entrega', icon: Package, route: '/cooperativa/acopio', module: 'entregas' },
        { label: 'Ejecutar VITAL', icon: Shield, route: '/cooperativa/vital', module: 'vital' },
        { label: 'Aprobar Crédito', icon: Wallet, route: '/cooperativa/finanzas-hub', module: 'creditos' },
        { label: 'Plan Nutrición', icon: Sprout, route: '/cooperativa/nutricion', module: 'nutricion' },
        { label: 'Nueva Catación', icon: Coffee, route: '/cooperativa/calidad', module: 'calidad' },
        { label: 'Comité Crédito', icon: BarChart3, route: '/cooperativa/finanzas-hub', module: 'creditos' },
      ];
    case 'exportador':
      return [
        { label: 'Crear Lote Comercial', icon: Package, route: '/exportador/lotes', module: 'lotes_comerciales' },
        { label: 'Generar Dossier EUDR', icon: ShieldCheck, route: '/exportador/eudr', module: 'eudr' },
        { label: 'Nuevo Contrato', icon: FileText, route: '/exportador/contratos', module: 'contratos' },
      ];
    case 'productor':
      return [
        { label: 'Registrar Entrega', icon: Package, route: '/productor/produccion' },
        { label: 'Actualizar Parcela', icon: Map, route: '/productor/produccion', module: 'parcelas' },
        { label: 'Ver Score VITAL', icon: Leaf, route: '/productor/sostenibilidad', module: 'vital' },
      ];
    case 'tecnico':
      return [
        { label: 'Evaluar VITAL', icon: Shield, route: '/tecnico/vital', module: 'vital' },
        { label: 'Visitar Parcela', icon: Map, route: '/tecnico/parcelas', module: 'parcelas' },
      ];
    case 'admin':
      return [
        { label: 'Crear Organización', icon: Building2, route: '/admin' },
        { label: 'Ver Blockchain', icon: Boxes, route: '/admin' },
      ];
    default:
      return [];
  }
}

interface QuickActionsSectionProps {
  role: string | null;
  orgTipo: string | null;
  activeModules: OrgModule[];
}

export function QuickActionsSection({ role, orgTipo, activeModules }: QuickActionsSectionProps) {
  const navigate = useNavigate();
  const allActions = getActions(role, orgTipo);
  const actions = allActions.filter(a => !a.module || hasModule(activeModules, a.module));

  if (actions.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-5 pb-5 px-5">
        <h3 className="font-semibold text-foreground mb-4 text-sm">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map(a => (
            <Button
              key={a.label}
              variant="outline"
              className="h-auto py-4 px-3 flex flex-col gap-2"
              onClick={() => navigate(a.route)}
            >
              <a.icon className="h-5 w-5 text-primary" />
              <span className="text-xs">{a.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
