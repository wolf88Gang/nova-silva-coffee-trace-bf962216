/**
 * Audit Dossier — Full compliance summary, evidence completeness, export-ready structure.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Download, CheckCircle2, XCircle, Clock,
  FileText, Shield, AlertTriangle, Printer,
} from 'lucide-react';
import {
  CERTIFICATION_SCHEMES,
  generateDemoReadiness,
  generateDemoEvidence,
  generateDemoCorrectiveActions,
  getAllRequirements,
  getEvidenceStatusColor,
  getEvidenceStatusLabel,
  getSeverityColor,
  getSeverityLabel,
  type SchemeKey,
} from '@/lib/certificationEngine';
import { cn } from '@/lib/utils';

export default function CertificacionAuditDossier() {
  const navigate = useNavigate();
  const readiness = useMemo(() => generateDemoReadiness(), []);
  const evidence = useMemo(() => generateDemoEvidence(), []);
  const correctives = useMemo(() => generateDemoCorrectiveActions(), []);
  const allReqs = getAllRequirements();

  const totalEvidence = evidence.length;
  const completeEvidence = evidence.filter(e => e.status === 'completo').length;
  const completeness = totalEvidence > 0 ? Math.round((completeEvidence / totalEvidence) * 100) : 0;
  const openCorrectives = correctives.filter(c => c.status !== 'resuelto').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/certificacion')}><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Dossier de auditoría
            </h1>
            <p className="text-xs text-muted-foreground">Resumen ejecutivo de cumplimiento exportable</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs"><Printer className="h-3 w-3 mr-1" /> Imprimir</Button>
          <Button size="sm" className="text-xs"><Download className="h-3 w-3 mr-1" /> Exportar dossier</Button>
        </div>
      </div>

      {/* Executive summary */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumen ejecutivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{readiness.length}</p>
              <p className="text-xs text-muted-foreground">Esquemas evaluados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{allReqs.length}</p>
              <p className="text-xs text-muted-foreground">Requisitos totales</p>
            </div>
            <div className="text-center">
              <p className={cn('text-3xl font-bold', completeness >= 70 ? 'text-primary' : 'text-destructive')}>{completeness}%</p>
              <p className="text-xs text-muted-foreground">Completitud de evidencia</p>
            </div>
            <div className="text-center">
              <p className={cn('text-3xl font-bold', openCorrectives > 0 ? 'text-destructive' : 'text-primary')}>{openCorrectives}</p>
              <p className="text-xs text-muted-foreground">Correctivas abiertas</p>
            </div>
          </div>
          <Separator className="my-3" />
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-sm text-foreground font-medium mb-1">Estado general de preparación</p>
            <p className="text-xs text-muted-foreground">
              La organización tiene {completeness}% de su evidencia completa. Existen {openCorrectives} acciones correctivas pendientes,
              de las cuales {correctives.filter(c => c.severity === 'tolerancia_cero').length} son de tolerancia cero y requieren atención inmediata antes de cualquier auditoría.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Per-scheme summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Preparación por esquema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {readiness.map(r => {
              const scheme = CERTIFICATION_SCHEMES.find(s => s.key === r.scheme)!;
              const schemeCorrectiveCount = correctives.filter(c => c.scheme === r.scheme && c.status !== 'resuelto').length;
              return (
                <div key={r.scheme} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{scheme.name}</p>
                      <Badge variant="outline" className="text-[10px] mt-0.5">{scheme.typeLabel}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{r.readinessPercent}%</p>
                      {r.criticalGaps > 0 && (
                        <span className="text-[10px] text-destructive flex items-center gap-1 justify-end">
                          <AlertTriangle className="h-3 w-3" /> {r.criticalGaps} brechas críticas
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress value={r.readinessPercent} className="h-2 mb-2" />
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span><CheckCircle2 className="h-3 w-3 inline text-primary" /> {r.compliant} completo</span>
                    <span><Clock className="h-3 w-3 inline" /> {r.partial} parcial</span>
                    <span><XCircle className="h-3 w-3 inline text-destructive" /> {r.missing} faltante</span>
                    {schemeCorrectiveCount > 0 && (
                      <span className="text-destructive">{schemeCorrectiveCount} correctiva(s) abierta(s)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Evidence inventory */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Inventario de evidencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {evidence.map(e => (
              <div key={e.id} className="flex items-center justify-between text-xs p-2 rounded border border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-foreground">{e.fileName}</span>
                  <span className="text-muted-foreground">({e.type})</span>
                </div>
                <div className="flex items-center gap-2">
                  {e.reusedInSchemes.length > 1 && (
                    <span className="text-[10px] text-primary">{e.reusedInSchemes.length} esquemas</span>
                  )}
                  <Badge className={cn('text-[10px]', getEvidenceStatusColor(e.status))}>{getEvidenceStatusLabel(e.status)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Open corrective actions */}
      {openCorrectives > 0 && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Acciones correctivas pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {correctives.filter(c => c.status !== 'resuelto').map(c => {
                const scheme = CERTIFICATION_SCHEMES.find(s => s.key === c.scheme);
                return (
                  <div key={c.id} className="p-3 rounded-lg border border-border">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-foreground">{c.issue}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{scheme?.shortName} · {c.owner} · Vence: {c.dueDate}</p>
                      </div>
                      <Badge className={getSeverityColor(c.severity)}>{getSeverityLabel(c.severity)}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
