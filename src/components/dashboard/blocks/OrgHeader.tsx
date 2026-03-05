import { Badge } from '@/components/ui/badge';
import { getOrgTypeLabel } from '@/lib/org-terminology';
import { hasModule, type OrgModule } from '@/lib/org-modules';
import { Building2, Shield, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getGreeting } from '@/lib/genderHelper';

interface OrgHeaderProps {
  orgName: string | null;
  orgTipo: string | null;
  activeModules: OrgModule[];
  userName?: string | null;
  /** Demo data — will be replaced by real queries */
  vitalScore?: number;
  eudrStatus?: string;
  plan?: string;
}

export function OrgHeader({ orgName, orgTipo, activeModules, userName, vitalScore, eudrStatus, plan }: OrgHeaderProps) {
  const typeLabel = getOrgTypeLabel(orgTipo);
  const greeting = getGreeting(userName);
  const firstName = userName?.split(' ')[0] || '';

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            {firstName ? `${greeting}, ${firstName}` : (orgName || 'Mi Organización')}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
            {plan && <Badge variant="secondary" className="text-xs">{plan}</Badge>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {hasModule(activeModules, 'vital') && vitalScore !== undefined && (
          <div className="flex items-center gap-2 min-w-[140px]">
            <Shield className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-muted-foreground">VITAL</span>
                <span className="font-bold text-foreground">{vitalScore}/100</span>
              </div>
              <Progress value={vitalScore} className="h-1.5" />
            </div>
          </div>
        )}
        {hasModule(activeModules, 'eudr') && eudrStatus && (
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">EUDR:</span>
            <Badge variant="default" className="text-[10px] h-5">{eudrStatus}</Badge>
          </div>
        )}
      </div>
    </div>
  );
}
