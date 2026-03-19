import { getProfilesByOrg } from '@/config/demoArchitecture';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';
import type { DemoProfile } from '@/config/demoArchitecture';

const ROLE_LABELS: Record<string, string> = {
  admin_org: 'Administrador',
  tecnico: 'Técnico de campo',
  productor: 'Productor',
  auditor: 'Auditor',
};

interface ProfileSelectorProps {
  orgId: string;
  profiles?: DemoProfile[];
  selectedProfileId: string | null;
  onSelect: (profile: DemoProfile) => void;
}

export function ProfileSelector({ orgId, profiles: profilesProp, selectedProfileId, onSelect }: ProfileSelectorProps) {
  const profiles = profilesProp ?? getProfilesByOrg(orgId);

  if (profiles.length === 0) {
    return (
      <p className="text-sm text-white/60 text-center py-4">
        No hay perfiles para esta organización.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60 text-center">
        Seleccioná un perfil dentro de la organización
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => onSelect(profile)}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl border text-left transition-all',
              'bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15',
              selectedProfileId === profile.id && 'ring-2 ring-[hsl(var(--accent-orange))] border-[hsl(var(--accent-orange))]'
            )}
          >
            <div className="p-2 rounded-lg bg-[hsl(var(--accent-orange))]/15">
              <User className="h-4 w-4 text-[hsl(var(--accent-orange))]" />
            </div>
            <div>
              <p className="font-medium text-white">{profile.name}</p>
              <p className="text-xs text-white/50">
                {ROLE_LABELS[profile.role] ?? profile.role}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
