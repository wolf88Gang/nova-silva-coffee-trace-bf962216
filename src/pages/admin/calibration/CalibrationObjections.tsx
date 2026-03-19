/**
 * Calibration Review — Objection Analysis
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
  useCalibrationSessions, useCalibrationObjections,
  computeObjectionAnalysis,
} from '@/hooks/useCalibrationData';
import { fmtPct } from '@/lib/calibrationLabels';
import { ShieldAlert, AlertTriangle, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalibrationObjections() {
  const sessions = useCalibrationSessions();
  const objections = useCalibrationObjections();

  if (objections.backendStatus === 'unavailable') {
    return <CalibrationShell><BackendUnavailable status="unavailable" table="sales_objections" /></CalibrationShell>;
  }

  if (objections.isLoading || sessions.isLoading) {
    return <CalibrationShell><FullPageSkeleton /></CalibrationShell>;
  }

  const analysis = computeObjectionAnalysis(objections.data, sessions.data);
  const overDetected = analysis.filter(a => a.count > 10 && a.lossRate < 30);
  const underDetected = analysis.filter(a => a.count < 3 && a.lossRate > 70);

  return (
    <CalibrationShell>
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Análisis de bloqueadores</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Frecuencia, correlación con pérdida y señales de calibración</p>
        </div>

        {analysis.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <ShieldAlert className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin datos de bloqueadores</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Main table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Bloqueadores detectados</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Tipo</TableHead>
                      <TableHead className="text-right">Detecciones</TableHead>
                      <TableHead className="text-right">Confianza prom.</TableHead>
                      <TableHead className="text-right">Won</TableHead>
                      <TableHead className="text-right">Lost</TableHead>
                      <TableHead className="text-right pr-6">Loss rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.map(a => (
                      <TableRow key={a.type}>
                        <TableCell className="pl-6 font-medium">{a.type}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{a.count}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{fmtPct(a.avgConfidence * 100, 0)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-success">{a.sessionsWithWin}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-destructive">{a.sessionsWithLoss}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Badge
                            variant="outline"
                            className={cn('font-mono text-xs',
                              a.lossRate > 60 ? 'border-destructive/40 text-destructive' :
                              a.lossRate > 40 ? 'border-warning/40 text-warning' :
                              'border-muted-foreground/30'
                            )}
                          >
                            {fmtPct(a.lossRate)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Signals */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className={overDetected.length > 0 ? 'border-warning/20' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    Potencialmente sobre-detectados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {overDetected.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Ninguno identificado con los umbrales actuales</p>
                  ) : (
                    <div className="space-y-1.5">
                      {overDetected.map(o => (
                        <div key={o.type} className="flex justify-between p-2 rounded bg-warning/5 text-xs">
                          <span className="font-medium">{o.type}</span>
                          <span className="text-muted-foreground">{o.count} detecciones, {fmtPct(o.lossRate)} loss</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={underDetected.length > 0 ? 'border-destructive/20' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    Potencialmente sub-detectados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {underDetected.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Ninguno identificado con los umbrales actuales</p>
                  ) : (
                    <div className="space-y-1.5">
                      {underDetected.map(o => (
                        <div key={o.type} className="flex justify-between p-2 rounded bg-destructive/5 text-xs">
                          <span className="font-medium">{o.type}</span>
                          <span className="text-muted-foreground">{o.count} detecciones, {fmtPct(o.lossRate)} loss</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </CalibrationShell>
  );
}
