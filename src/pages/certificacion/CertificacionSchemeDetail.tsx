/**
 * Scheme Detail — Shows all requirements for one scheme with evidence status.
 */
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Clock, FileText,
  ChevronDown, ChevronUp, Info, Upload,
} from 'lucide-react';
import {
  CERTIFICATION_SCHEMES,
  getSeverityLabel,
  getSeverityColor,
  getEvidenceStatusLabel,
  getEvidenceStatusColor,
  generateDemoEvidence,
  type CertificationRequirement,
  type SchemeKey,
  type EvidenceStatus,
} from '@/lib/certificationEngine';
import { cn } from '@/lib/utils';

export default function CertificacionSchemeDetail() {
  const { schemeKey } = useParams<{ schemeKey: string }>();
  const navigate = useNavigate();
  const scheme = CERTIFICATION_SCHEMES.find(s => s.key === schemeKey);
  const evidence = useMemo(() => generateDemoEvidence(), []);

  if (!scheme) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Esquema no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/certificacion')}>Volver</Button>
      </div>
    );
  }

  const allReqs = scheme.categories.flatMap(c => c.requirements);
  const reqEvidence = (reqId: string) => evidence.filter(e => e.requirementId === reqId);
  const reqStatus = (reqId: string): EvidenceStatus => {
    const evs = reqEvidence(reqId);
    if (evs.length === 0) return 'faltante';
    if (evs.some(e => e.status === 'vencido')) return 'vencido';
    if (evs.every(e => e.status === 'completo')) return 'completo';
    return 'parcial';
  };

  const compliant = allReqs.filter(r => reqStatus(r.id) === 'completo').length;
  const readiness = allReqs.length > 0 ? Math.round((compliant / allReqs.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/certificacion')}><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
      </div>

      {/* Scheme header */}
      <Card className="border-primary/20">
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">{scheme.name}</h1>
              <Badge variant="outline" className="mt-1 text-xs">{scheme.typeLabel}</Badge>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{scheme.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold text-foreground">{readiness}%</p>
              <p className="text-xs text-muted-foreground">preparación general</p>
              <Progress value={readiness} className="h-2 mt-2 w-40" />
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <InfoBlock label="Corte de deforestación" value={scheme.deforestationCutoff ?? 'No aplica'} />
            <InfoBlock label="Requisito geoespacial" value={scheme.geoRequirement} />
            <InfoBlock label="Trazabilidad" value={scheme.traceability} />
            <InfoBlock label="Frecuencia de auditoría" value={scheme.auditFrequency} />
          </div>
        </CardContent>
      </Card>

      {/* Requirements by category */}
      {scheme.categories.map(cat => (
        <div key={cat.key}>
          <h2 className="text-base font-semibold text-foreground mb-3">{cat.label}</h2>
          <div className="space-y-3">
            {cat.requirements.map(req => (
              <RequirementCard
                key={req.id}
                requirement={req}
                status={reqStatus(req.id)}
                evidenceItems={reqEvidence(req.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RequirementCard({ requirement: req, status, evidenceItems }: {
  requirement: CertificationRequirement;
  status: EvidenceStatus;
  evidenceItems: { id: string; type: string; fileName: string; status: EvidenceStatus }[];
}) {
  const [expanded, setExpanded] = useState(status === 'faltante' || status === 'vencido');

  return (
    <Card className={cn(
      'transition-all',
      status === 'faltante' || status === 'vencido' ? 'border-destructive/30' : '',
      status === 'completo' ? 'border-primary/20' : '',
    )}>
      <CardContent className="pt-4 pb-3 px-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getSeverityColor(req.severity)}>{getSeverityLabel(req.severity)}</Badge>
              <Badge className={cn('text-[10px]', getEvidenceStatusColor(status))}>{getEvidenceStatusLabel(status)}</Badge>
              {req.crossSchemeOverlap.length > 0 && (
                <Badge variant="outline" className="text-[10px]">Reutilizable en {req.crossSchemeOverlap.length} esquema(s)</Badge>
              )}
            </div>
            <p className="text-sm font-medium text-foreground mt-1.5">{req.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{req.description}</p>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-4 space-y-4">
            {/* Why it matters */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-1.5 mb-1">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">Por qué importa</span>
              </div>
              <p className="text-xs text-muted-foreground">{req.whyItMatters}</p>
            </div>

            {/* Evidence needed */}
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Evidencia requerida</p>
              <div className="flex flex-wrap gap-1.5">
                {req.evidenceTypes.map(et => {
                  const hasIt = evidenceItems.some(e => e.type === et && e.status === 'completo');
                  return (
                    <Badge key={et} variant={hasIt ? 'default' : 'outline'}
                      className={cn('text-[10px]', !hasIt && 'border-destructive/30 text-destructive')}>
                      {hasIt && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {et}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Current evidence */}
            {evidenceItems.length > 0 && (
              <div>
                <p className="text-xs font-medium text-foreground mb-2">Evidencia cargada</p>
                <div className="space-y-1">
                  {evidenceItems.map(e => (
                    <div key={e.id} className="flex items-center justify-between text-xs p-2 rounded border border-border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-foreground">{e.fileName}</span>
                      </div>
                      <Badge className={cn('text-[10px]', getEvidenceStatusColor(e.status))}>{getEvidenceStatusLabel(e.status)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing evidence */}
            {status !== 'completo' && (
              <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                <p className="text-xs font-medium text-destructive mb-1">Evidencia faltante</p>
                <p className="text-xs text-muted-foreground">
                  {req.evidenceTypes.filter(et => !evidenceItems.some(e => e.type === et && e.status === 'completo')).join(', ')}
                </p>
                <Button variant="outline" size="sm" className="mt-2 text-xs">
                  <Upload className="h-3 w-3 mr-1" /> Cargar evidencia
                </Button>
              </div>
            )}

            {/* Cross-scheme overlap */}
            {req.crossSchemeOverlap.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Esta evidencia también sirve para: {req.crossSchemeOverlap.map(s =>
                  CERTIFICATION_SCHEMES.find(sc => sc.key === s)?.shortName
                ).filter(Boolean).join(', ')}
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <InfoBlock label="Alcance" value={req.scope === 'parcela' ? 'Por parcela' : req.scope === 'organizacion' ? 'Organización' : req.scope === 'productor' ? 'Por productor' : req.scope === 'lote' ? 'Por lote' : 'Por trabajador'} />
              <InfoBlock label="Frecuencia" value={req.frequency} />
              <InfoBlock label="ID" value={req.id} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded bg-muted/50">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}
