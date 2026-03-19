/**
 * Calibration Review — Recommendation Analysis
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { CalibrationShell } from '@/components/calibration/CalibrationShell';
import { BackendUnavailable } from '@/components/calibration/BackendUnavailable';
import { FullPageSkeleton } from '@/components/calibration/CalibrationLoadingSkeleton';
import {
  useCalibrationSessions, useCalibrationRecommendations,
  computeRecommendationAnalysis,
} from '@/hooks/useCalibrationData';
import { fmtPct } from '@/lib/calibrationLabels';
import { Lightbulb, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalibrationRecommendations() {
  const sessions = useCalibrationSessions();
  const recs = useCalibrationRecommendations();

  if (recs.backendStatus === 'unavailable') {
    return <CalibrationShell><BackendUnavailable status="unavailable" table="sales_recommendations" /></CalibrationShell>;
  }

  if (recs.isLoading || sessions.isLoading) {
    return <CalibrationShell><FullPageSkeleton /></CalibrationShell>;
  }

  const analysis = computeRecommendationAnalysis(recs.data, sessions.data);
  const avgCount = analysis.length > 0 ? analysis.reduce((s, a) => s + a.count, 0) / analysis.length : 0;
  const overused = analysis.filter(a => a.count > avgCount * 2 && a.winRate < 40);

  return (
    <CalibrationShell>
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Análisis de próximos pasos</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Win rate por tipo de recomendación y patrones de uso</p>
        </div>

        {analysis.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <Lightbulb className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin datos de recomendaciones</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Recomendaciones generadas</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Tipo</TableHead>
                      <TableHead className="text-right">Usos</TableHead>
                      <TableHead className="text-right">Won</TableHead>
                      <TableHead className="text-right">Lost</TableHead>
                      <TableHead className="text-right pr-6">Win rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.map(a => (
                      <TableRow key={a.type}>
                        <TableCell className="pl-6 font-medium">{a.type}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{a.count}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-success">{a.sessionsWithWin}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-destructive">{a.sessionsWithLoss}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Badge
                            variant="outline"
                            className={cn('font-mono text-xs',
                              a.winRate > 60 ? 'border-success/40 text-success' :
                              a.winRate < 30 ? 'border-destructive/40 text-destructive' :
                              'border-muted-foreground/30'
                            )}
                          >
                            {fmtPct(a.winRate)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Overused signal */}
            {overused.length > 0 && (
              <Card className="border-warning/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    Recomendaciones potencialmente sobreutilizadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">
                    Uso significativamente sobre el promedio ({Math.round(avgCount)} usos) con win rate bajo
                  </p>
                  <div className="space-y-1.5">
                    {overused.map(o => (
                      <div key={o.type} className="flex justify-between p-2 rounded bg-warning/5 text-xs">
                        <span className="font-medium">{o.type}</span>
                        <span className="text-muted-foreground">{o.count} usos, {fmtPct(o.winRate)} win</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top performing */}
            {analysis.filter(a => a.winRate > 60 && a.count >= 3).length > 0 && (
              <Card className="border-success/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                    Recomendaciones con mejor rendimiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {analysis.filter(a => a.winRate > 60 && a.count >= 3).map(o => (
                      <div key={o.type} className="flex justify-between p-2 rounded bg-success/5 text-xs">
                        <span className="font-medium">{o.type}</span>
                        <span className="text-muted-foreground">{o.count} usos, {fmtPct(o.winRate)} win</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </CalibrationShell>
  );
}
