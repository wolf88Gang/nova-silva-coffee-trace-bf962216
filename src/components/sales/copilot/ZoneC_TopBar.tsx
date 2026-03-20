/**
 * Zone C — lead summary, fit %, suggested plan (Commercial Copilot).
 */

import { Badge } from '@/components/ui/badge';

interface ZoneC_TopBarProps {
  orgName: string;
  leadName?: string;
  leadCompany?: string;
  leadType?: string;
  fitPercent: number;
  planSummary: string;
  routeLabel: string;
}

export function ZoneC_TopBar({
  orgName,
  leadName,
  leadCompany,
  leadType,
  fitPercent,
  planSummary,
  routeLabel,
}: ZoneC_TopBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b bg-muted/30 px-4 py-2.5 text-sm">
      <span className="font-medium">{orgName}</span>
      {leadName && <span className="text-muted-foreground">{leadName}</span>}
      {leadCompany && <span className="text-muted-foreground text-xs">({leadCompany})</span>}
      {leadType && (
        <Badge variant="secondary" className="text-[10px] uppercase">
          {leadType}
        </Badge>
      )}
      <span className="ml-auto tabular-nums text-xs text-muted-foreground">
        Fit ~{fitPercent}%
      </span>
      <Badge variant="outline" className="max-w-[220px] truncate text-[10px]" title={routeLabel}>
        {routeLabel}
      </Badge>
      <span className="text-xs text-muted-foreground max-w-md truncate" title={planSummary}>
        {planSummary}
      </span>
    </div>
  );
}
