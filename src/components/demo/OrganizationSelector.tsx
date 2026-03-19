import { DEMO_ORGANIZATIONS } from '@/config/demoArchitecture';
import { OrganizationCard } from './OrganizationCard';
import type { DemoOrganization } from '@/config/demoArchitecture';

interface OrganizationSelectorProps {
  organizations?: DemoOrganization[];
  selectedOrgId: string | null;
  onSelect: (orgId: string) => void;
}

export function OrganizationSelector({ organizations, selectedOrgId, onSelect }: OrganizationSelectorProps) {
  const orgs = organizations ?? DEMO_ORGANIZATIONS;
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60 text-center">
        Seleccioná una organización por arquetipo operativo
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {orgs.map((org) => (
          <OrganizationCard
            key={org.id}
            org={org}
            selected={selectedOrgId === org.id}
            onClick={() => onSelect(org.id)}
          />
        ))}
      </div>
    </div>
  );
}
