/**
 * Calibration Review — Version Detail
 * Shows snapshot_before / snapshot_after diff and changes_applied.
 */
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalibrationShell } from '@/components/calibration/CalibrationShell';
import { BackendUnavailable } from '@/components/calibration/BackendUnavailable';
import { FullPageSkeleton } from '@/components/calibration/CalibrationLoadingSkeleton';
import { useRuleVersionDetail } from '@/hooks/useCalibrationData';
import { fmtDateTime } from '@/lib/calibrationLabels';
import { ArrowLeft, Shield, Clock, GitBranch, FileJson } from 'lucide-react';

export default function CalibrationVersionDetail() {
  const { versionId } = useParams<{ versionId: string }>();
  const navigate = useNavigate();
  const { data: version, isLoading, backendStatus } = useRuleVersionDetail(versionId);

  if (backendStatus === 'unavailable') {
    return <CalibrationShell><BackendUnavailable status="unavailable" table="sales_rule_versions" /></CalibrationShell>;
  }

  if (isLoading) {
    return <CalibrationShell><FullPageSkeleton /></CalibrationShell>;
  }

  if (!version) {
    return (
      <CalibrationShell>
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">Versión no encontrada</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/admin/sales/calibration/versions')}>
              Volver a versiones
            </Button>
          </CardContent>
        </Card>
      </CalibrationShell>
    );
  }

  return (
    <CalibrationShell>
      <div className="space-y-4">
        {/* Back + header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin/sales/calibration/versions')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground font-mono">{version.id.slice(0, 8)}</h2>
              {version.is_active && (
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary gap-1">
                  <Shield className="h-2.5 w-2.5" /> Activa
                </Badge>
              )}
            </div>
            {version.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{version.description}</p>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetaBlock label="Desplegada" value={version.deployed_at ? fmtDateTime(version.deployed_at) : '—'} icon={Clock} />
          <MetaBlock label="ID" value={version.id.slice(0, 12) + '...'} icon={GitBranch} mono />
          <MetaBlock label="Parent" value="—" icon={GitBranch} mono />
          <MetaBlock label="Estado" value={version.is_active ? 'Activa' : 'Inactiva'} icon={Shield} />
        </div>

        {/* Changes applied */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileJson className="h-3.5 w-3.5 text-primary" />
              Cambios aplicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {version.changes_applied ? (
              <pre className="text-xs font-mono bg-muted/50 rounded-lg p-4 overflow-x-auto max-h-60 border border-border/50">
                {JSON.stringify(version.changes_applied, null, 2)}
              </pre>
            ) : (
              <p className="text-xs text-muted-foreground py-2">Sin registro de cambios</p>
            )}
          </CardContent>
        </Card>

        {/* Snapshots removed — columns not in current schema */}
      </div>
    </CalibrationShell>
  );
}

function MetaBlock({ label, value, icon: Icon, mono }: {
  label: string; value: string; icon: React.ElementType; mono?: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
        <p className={`text-sm font-medium text-foreground ${mono ? 'font-mono' : ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function SnapshotCard({ title, data }: { title: string; data: Record<string, unknown> | null }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data ? (
          <pre className="text-xs font-mono bg-muted/50 rounded-lg p-4 overflow-x-auto max-h-48 border border-border/50">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <p className="text-xs text-muted-foreground py-2">Sin snapshot registrado</p>
        )}
      </CardContent>
    </Card>
  );
}
