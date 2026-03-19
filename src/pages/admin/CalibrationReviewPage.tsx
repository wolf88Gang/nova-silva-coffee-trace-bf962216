/**
 * CalibrationReviewPage — Calibration workspace for Sales Intelligence.
 * Validation, score analysis, objection analysis, rule candidates.
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalibrationService } from '@/modules/sales/CalibrationService';
import { computeRuleCandidates } from '@/modules/sales/calibrationAnalytics';
import {
  ScoreAnalysisBlock,
  ObjectionAnalysisBlock,
  RuleCandidatesBlock,
} from '@/components/sales/CalibrationBlocks';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const SCORE_DIMS = ['pain', 'maturity', 'urgency', 'fit', 'budget_readiness'];

export default function CalibrationReviewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['calibration_summary'],
    queryFn: () => CalibrationService.getCalibrationSummary(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Calibration Review" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Calibration Review" />
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Backend no disponible'}
          </AlertDescription>
        </Alert>
        <p className="text-xs text-muted-foreground">
          Verifica que las migraciones 20250323000001, 20250323000002, 20250324000001 y 20250324000002 estén aplicadas.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/sales"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Volver</Link>
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Calibration Review" />
        <p className="text-sm text-muted-foreground">Sin datos</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/sales"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Volver</Link>
        </Button>
      </div>
    );
  }

  const { validation, outcome_distribution, score_bucket_analysis, objection_analysis, sample, rows_for_rec } = data;

  const ruleCandidates = useMemo(
    () => computeRuleCandidates(score_bucket_analysis, objection_analysis, rows_for_rec),
    [score_bucket_analysis, objection_analysis, rows_for_rec]
  );

  const withOutcome = validation.with_outcome;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Calibration Review"
        description="Validación del dataset y resumen para calibración"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/sales"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Volver</Link>
          </Button>
        }
      />

      {/* Validation summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Sesiones completadas
            </p>
            <p className="text-2xl font-bold tabular-nums">{validation.total_sessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Con outcome
            </p>
            <p className="text-2xl font-bold tabular-nums">{validation.with_outcome}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Sin outcome (huérfanas)
            </p>
            <p className="text-2xl font-bold tabular-nums">{validation.without_outcome}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Distribución
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {outcome_distribution.map(({ outcome, count }) => (
                <Badge key={outcome} variant="secondary" className="text-[10px]">
                  {outcome}: {count}
                </Badge>
              ))}
              {outcome_distribution.length === 0 && (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score analysis */}
      {withOutcome >= 5 && (
        <ScoreAnalysisBlock results={score_bucket_analysis} dimensions={SCORE_DIMS} />
      )}

      {/* Objection analysis */}
      {withOutcome >= 5 && (
        <ObjectionAnalysisBlock results={objection_analysis} />
      )}

      {/* Rule adjustment candidates */}
      <RuleCandidatesBlock candidates={ruleCandidates} />

      {/* Empty state */}
      {validation.total_sessions === 0 && (
        <Card>
          <CardContent className="pt-6 pb-6">
            <p className="text-sm text-muted-foreground">
              No hay sesiones completadas. Ejecuta diagnósticos en Sales Intelligence y registra outcomes para habilitar la calibración.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/admin/sales/new">Ir a Sales Intelligence</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sample table (when data exists) */}
      {sample.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Muestra (primeras 50)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Session</th>
                    <th className="text-left py-2 font-medium">Outcome</th>
                    <th className="text-right py-2 font-medium">Score</th>
                    <th className="text-right py-2 font-medium">Obj</th>
                  </tr>
                </thead>
                <tbody>
                  {sample.map((r) => (
                    <tr key={r.session_id} className="border-b border-border/60">
                      <td className="py-1.5 font-mono truncate max-w-[120px]" title={r.session_id}>
                        {r.session_id.slice(0, 8)}…
                      </td>
                      <td className="py-1.5">{r.outcome ?? '—'}</td>
                      <td className="py-1.5 text-right tabular-nums">{r.total_score ?? 0}</td>
                      <td className="py-1.5 text-right tabular-nums">{r.objection_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
