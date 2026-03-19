/**
 * SalesSessionResultsPage — deal summary for operators.
 * What is blocking? What to do next?
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SalesSessionService } from '@/modules/sales/SalesSessionService';
import { SCORE_LABELS, OBJECTION_LABELS, REC_TYPE_LABELS } from '@/modules/sales/salesUiConstants';
import { OutcomeCaptureCard } from '@/components/sales/OutcomeCaptureCard';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function SalesSessionResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['sales_session_summary', sessionId],
    queryFn: () => SalesSessionService.getSessionSummary(sessionId!),
    enabled: !!sessionId,
  });

  if (!sessionId) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Sesión no encontrada" />
        <Alert variant="destructive" className="py-2">
          <AlertDescription>ID de sesión inválido</AlertDescription>
        </Alert>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/sales"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Volver</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Resultados" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Error" />
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Sesión no encontrada o eliminada'}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/sales"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Volver</Link>
        </Button>
      </div>
    );
  }

  const { scores, objections, recommendations } = data;
  const leadInfo = [data.lead_name, data.lead_company].filter(Boolean).join(' · ') || null;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Resultados"
        description={leadInfo ?? `${data.commercial_stage}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/sales"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Volver</Link>
          </Button>
        }
      />

      {/* Outcome capture — compact, always visible for completed sessions */}
      {data.status === 'completed' && (
        <OutcomeCaptureCard sessionId={sessionId!} outcome={data.outcome} />
      )}

      {/* Score + Next steps in one row */}
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        {/* Score block */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2" title="Suma de sub-scores (escala abierta)">
              Score
            </p>
            <p className="text-3xl font-bold tabular-nums">{scores.score_total}</p>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {(Object.entries(scores) as [string, number][]).map(([key, val]) =>
                key !== 'score_total' ? (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{SCORE_LABELS[key] ?? key}</span>
                    <span className="font-medium tabular-nums">{val}</span>
                  </div>
                ) : null
              )}
            </div>
          </CardContent>
        </Card>

        {/* Próximos pasos — primary */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Próximos pasos
            </p>
            {recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ninguno</p>
            ) : (
              <div className="space-y-2">
                {recommendations
                  .sort((a, b) => a.priority - b.priority)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <Badge variant="secondary" className="shrink-0 h-5 text-[10px]">
                        {REC_TYPE_LABELS[r.recommendation_type] ?? r.recommendation_type}
                      </Badge>
                      <div className="min-w-0">
                        <p className="font-medium">{r.title}</p>
                        {r.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bloqueadores */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Bloqueadores
          </p>
          {objections.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ninguno</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {objections.map((o, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="font-normal py-1 px-2"
                >
                  {OBJECTION_LABELS[o.objection_type] ?? o.objection_type}
                  <span className="ml-1.5 text-muted-foreground tabular-nums">
                    {(o.effective_confidence * 100).toFixed(0)}%
                  </span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session meta — collapsed */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-mono">{sessionId.slice(0, 8)}…</span>
        <span>{data.status}</span>
        <span>{data.commercial_stage}</span>
      </div>
    </div>
  );
}
