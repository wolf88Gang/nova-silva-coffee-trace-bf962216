/**
 * Cross-Scheme View — Shows evidence reuse, duplicated requirements avoided, remaining gaps per scheme.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Share2, FileText, CheckCircle2, XCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  getCrossSchemeOverlap,
  CERTIFICATION_SCHEMES,
  getAllRequirements,
  generateDemoReadiness,
  getEvidenceStatusLabel,
  getEvidenceStatusColor,
} from '@/lib/certificationEngine';
import { cn } from '@/lib/utils';

export default function CertificacionCrossScheme() {
  const navigate = useNavigate();
  const overlaps = useMemo(() => getCrossSchemeOverlap(), []);
  const readiness = useMemo(() => generateDemoReadiness(), []);
  const allReqs = getAllRequirements();

  // Count cross-scheme requirements
  const crossReqs = allReqs.filter(r => r.crossSchemeOverlap.length > 0);
  const uniqueEvidence = overlaps.length;
  const totalSchemesCovered = new Set(overlaps.flatMap(o => o.evidence.reusedInSchemes)).size;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/certificacion')}><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" /> Vista cruzada de esquemas
          </h1>
          <p className="text-xs text-muted-foreground">Evidencia compartida, requisitos superpuestos y brechas remanentes</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-primary/20">
          <CardContent className="pt-4 pb-3 px-4 text-center">
            <p className="text-2xl font-bold text-primary">{uniqueEvidence}</p>
            <p className="text-xs text-muted-foreground">Documentos reutilizados</p>
            <p className="text-[10px] text-muted-foreground mt-1">Un documento sirve para múltiples esquemas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4 text-center">
            <p className="text-2xl font-bold text-foreground">{crossReqs.length}</p>
            <p className="text-xs text-muted-foreground">Requisitos con superposición</p>
            <p className="text-[10px] text-muted-foreground mt-1">Recolección única satisface varios esquemas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalSchemesCovered}</p>
            <p className="text-xs text-muted-foreground">Esquemas beneficiados</p>
            <p className="text-[10px] text-muted-foreground mt-1">Esquemas que comparten evidencia</p>
          </CardContent>
        </Card>
      </div>

      {/* Shared evidence */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" /> Evidencia compartida entre esquemas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {overlaps.map(o => (
              <div key={o.evidence.id} className="p-3 rounded-lg border border-primary/10 bg-primary/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{o.evidence.fileName}</p>
                      <p className="text-xs text-muted-foreground">{o.evidence.type}</p>
                    </div>
                  </div>
                  <Badge className={cn('text-[10px]', getEvidenceStatusColor(o.evidence.status))}>
                    {getEvidenceStatusLabel(o.evidence.status)}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {o.schemes.map(s => (
                    <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Readiness per scheme */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Brechas remanentes por esquema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {readiness.map(r => {
              const scheme = CERTIFICATION_SCHEMES.find(s => s.key === r.scheme)!;
              return (
                <div key={r.scheme} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{scheme.shortName}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" /> {r.compliant}</span>
                      <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" /> {r.missing}</span>
                      {r.criticalGaps > 0 && (
                        <span className="flex items-center gap-1 text-destructive"><AlertTriangle className="h-3 w-3" /> {r.criticalGaps} críticas</span>
                      )}
                      <span className="font-medium text-foreground">{r.readinessPercent}%</span>
                    </div>
                  </div>
                  <Progress value={r.readinessPercent} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cross-scheme requirement overlap matrix hint */}
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            La ontología unificada de Nova Silva elimina la duplicación de esfuerzos: un solo polígono georreferenciado satisface EUDR, Rainforest Alliance y 4C simultáneamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
