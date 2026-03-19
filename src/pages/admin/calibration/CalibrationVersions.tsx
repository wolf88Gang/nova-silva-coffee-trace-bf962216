/**
 * Calibration Review — Rule Versions
 */
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalibrationShell } from '@/components/calibration/CalibrationShell';
import { BackendUnavailable } from '@/components/calibration/BackendUnavailable';
import { TableSkeleton } from '@/components/calibration/CalibrationLoadingSkeleton';
import { useRuleVersions } from '@/hooks/useCalibrationData';
import { fmtDateTime } from '@/lib/calibrationLabels';
import { GitBranch, Shield, ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalibrationVersions() {
  const versions = useRuleVersions();
  const navigate = useNavigate();

  if (versions.backendStatus === 'unavailable') {
    return <CalibrationShell><BackendUnavailable status="unavailable" table="sales_rule_versions" /></CalibrationShell>;
  }

  if (versions.isLoading) {
    return <CalibrationShell><TableSkeleton rows={6} /></CalibrationShell>;
  }

  const data = versions.data ?? [];

  return (
    <CalibrationShell>
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Versiones de reglas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Historial de versiones del motor de calibración</p>
        </div>

        {data.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <GitBranch className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin versiones registradas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {data.map((v, idx) => (
              <Card
                key={v.id}
                className={cn(
                  'cursor-pointer hover:border-primary/30 transition-colors',
                  v.is_active && 'border-primary/40 bg-primary/[0.02]'
                )}
                onClick={() => navigate(`/admin/sales/calibration/versions/${v.id}`)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center gap-1">
                      <div className={cn(
                        'h-3 w-3 rounded-full border-2',
                        v.is_active ? 'border-primary bg-primary' : 'border-muted-foreground/30 bg-background'
                      )} />
                      {idx < data.length - 1 && <div className="w-px h-4 bg-border" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground font-mono">{v.id.slice(0, 8)}</span>
                        {v.is_active && (
                          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary gap-1">
                            <Shield className="h-2.5 w-2.5" /> Activa
                          </Badge>
                        )}
                        
                      </div>
                      {v.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{v.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        {v.deployed_at ? fmtDateTime(v.deployed_at) : 'Sin fecha de despliegue'}
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CalibrationShell>
  );
}
