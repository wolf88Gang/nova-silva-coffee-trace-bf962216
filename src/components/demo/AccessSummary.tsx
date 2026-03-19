import { getOrgById } from '@/config/demoArchitecture';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import type { DemoOrganization, DemoProfile } from '@/config/demoArchitecture';

interface AccessSummaryProps {
  org: DemoOrganization;
  profile: DemoProfile;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function AccessSummary({ org, profile, onConfirm, isLoading }: AccessSummaryProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-white/60 text-center">
        Confirmá el acceso para ingresar al dashboard
      </p>
      <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl p-5 space-y-4">
        <div>
          <p className="text-xs text-white/50 uppercase tracking-wider">Organización</p>
          <p className="font-semibold text-white">{org.name}</p>
          <p className="text-xs text-white/40 mt-0.5">
            {org.orgType} · {org.modules.filter((m) => m.active).length} módulos
          </p>
        </div>
        <div>
          <p className="text-xs text-white/50 uppercase tracking-wider">Perfil</p>
          <p className="font-semibold text-white">{profile.name}</p>
          <p className="text-xs text-white/40">{profile.role}</p>
        </div>
      </div>
      <Button
        className="w-full bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white"
        size="lg"
        onClick={onConfirm}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Ingresando…
          </span>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" />
            Ingresar al dashboard
          </>
        )}
      </Button>
    </div>
  );
}
