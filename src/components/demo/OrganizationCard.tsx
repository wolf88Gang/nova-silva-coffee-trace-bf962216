import { cn } from '@/lib/utils';
import { Building2, Truck, Sprout, ShieldCheck, Factory } from 'lucide-react';
import type { DemoOrganization } from '@/config/demoArchitecture';

const ORG_ICONS: Record<string, React.ElementType> = {
  cooperativa: Building2,
  finca_empresarial: Factory,
  exportador: Truck,
  productor_privado: Sprout,
  certificadora: ShieldCheck,
};

const ORG_LABELS: Record<string, string> = {
  cooperativa: 'Cooperativa',
  finca_empresarial: 'Finca empresarial',
  exportador: 'Exportador',
  productor_privado: 'Productor',
  certificadora: 'Certificadora',
};

interface OrganizationCardProps {
  org: DemoOrganization;
  selected?: boolean;
  onClick: () => void;
}

export function OrganizationCard({ org, selected, onClick }: OrganizationCardProps) {
  const Icon = ORG_ICONS[org.orgType] ?? Building2;
  const label = ORG_LABELS[org.orgType] ?? org.orgType;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full text-left p-5 rounded-xl border transition-all duration-200',
        'bg-white/10 backdrop-blur-xl border-white/20',
        'hover:bg-white/15 hover:border-[hsl(var(--accent-orange))]/50',
        selected && 'ring-2 ring-[hsl(var(--accent-orange))] bg-[hsl(var(--accent-orange))]/10 border-[hsl(var(--accent-orange))]'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-[hsl(var(--accent-orange))]/15 group-hover:bg-[hsl(var(--accent-orange))]/25 transition-colors shrink-0">
          <Icon className="h-5 w-5 text-[hsl(var(--accent-orange))]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-0.5">
            {label}
          </p>
          <p className="font-semibold text-white truncate">{org.name}</p>
          <p className="text-xs text-white/40 mt-1">
            {org.modules.filter((m) => m.active).length} módulos activos
          </p>
        </div>
      </div>
    </button>
  );
}
