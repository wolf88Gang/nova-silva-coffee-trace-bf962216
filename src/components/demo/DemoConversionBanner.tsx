/**
 * Banner contextual en demo: "Este demo refleja tu operación" + Crear cuenta / Solicitar demo.
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDemoSetup } from '@/contexts/DemoSetupContext';
import { useDemoContext } from '@/contexts/DemoContext';
import {
  WIZARD_ORG_OPTIONS,
  WIZARD_OP_MODEL_OPTIONS,
} from '@/config/demoSetupConfig';
import { DemoLeadCaptureModal } from '@/components/demo/DemoLeadCaptureModal';
import { Sparkles } from 'lucide-react';

export function DemoConversionBanner() {
  const { config, hasConfig } = useDemoSetup();
  const { isDemoSession } = useDemoContext();
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const { pathname } = useLocation();

  if (!isDemoSession || !hasConfig || !config) return null;

  const orgLabel = WIZARD_ORG_OPTIONS.find((o) => o.value === config.orgType)?.label ?? config.orgType;
  const opLabel = WIZARD_OP_MODEL_OPTIONS.find((o) => o.value === config.operatingModel)?.label ?? config.operatingModel;

  return (
    <>
      <div className="h-9 px-4 flex items-center justify-between gap-2 text-xs bg-[hsl(var(--accent-orange))]/10 border-b border-[hsl(var(--accent-orange))]/20">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--accent-orange))]" />
          <span>
            Este demo refleja una operación de tipo: <strong className="text-foreground">{orgLabel}</strong>
            {opLabel && (
              <> + <strong className="text-foreground">{opLabel}</strong></>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setLeadModalOpen(true)}
            className="px-3 py-1.5 rounded-md border border-[hsl(var(--accent-orange))]/50 text-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/10 font-medium text-xs transition-colors"
          >
            Solicitar demo
          </button>
          <Link
            to="/demo/create-account"
            className="px-3 py-1.5 rounded-md bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white font-medium text-xs transition-colors"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
      <DemoLeadCaptureModal
        open={leadModalOpen}
        onOpenChange={setLeadModalOpen}
        ctaSource="demo_conversion_banner"
        demoOrgType={config.orgType}
        demoProfileLabel={opLabel}
        demoRoute={pathname}
      />
    </>
  );
}
