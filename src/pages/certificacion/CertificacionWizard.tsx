/**
 * Certification Wizard — Conditional evidence collection assistant.
 * Not linear: adapts based on scheme, scope (parcela vs org), and blocking conditions.
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Upload, Info, AlertTriangle,
  Shield, Leaf, Users, Coffee, Globe, Sprout, Award, FileText,
} from 'lucide-react';
import {
  CERTIFICATION_SCHEMES,
  getSeverityLabel,
  getSeverityColor,
  type SchemeKey,
  type CertificationRequirement,
  type RequirementScope,
} from '@/lib/certificationEngine';
import { cn } from '@/lib/utils';

type WizardStep = 'scheme' | 'scope' | 'requirements' | 'summary';

const SCHEME_ICONS: Record<string, React.ElementType> = {
  Shield, Leaf, Users, Coffee, Globe, Sprout, Award,
};

export default function CertificacionWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>('scheme');
  const [selectedScheme, setSelectedScheme] = useState<SchemeKey | null>(null);
  const [selectedScope, setSelectedScope] = useState<RequirementScope | null>(null);
  const [completedReqs, setCompletedReqs] = useState<Set<string>>(new Set());
  const [currentReqIdx, setCurrentReqIdx] = useState(0);

  const scheme = selectedScheme ? CERTIFICATION_SCHEMES.find(s => s.key === selectedScheme) : null;

  const filteredRequirements = useMemo(() => {
    if (!scheme) return [];
    const allReqs = scheme.categories.flatMap(c => c.requirements);
    if (!selectedScope) return allReqs;
    return allReqs.filter(r => r.scope === selectedScope || r.scope === 'organizacion');
  }, [scheme, selectedScope]);

  const currentReq = filteredRequirements[currentReqIdx];
  const progress = filteredRequirements.length > 0
    ? Math.round(((currentReqIdx + (completedReqs.has(currentReq?.id ?? '') ? 1 : 0)) / filteredRequirements.length) * 100)
    : 0;

  function handleMarkComplete() {
    if (currentReq) {
      setCompletedReqs(prev => new Set([...prev, currentReq.id]));
      if (currentReqIdx < filteredRequirements.length - 1) {
        setCurrentReqIdx(currentReqIdx + 1);
      } else {
        setStep('summary');
      }
    }
  }

  function handleSkip() {
    if (currentReqIdx < filteredRequirements.length - 1) {
      setCurrentReqIdx(currentReqIdx + 1);
    } else {
      setStep('summary');
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => {
          if (step === 'scheme') navigate('/certificacion');
          else if (step === 'scope') setStep('scheme');
          else if (step === 'requirements') { setStep('scope'); setCurrentReqIdx(0); }
          else setStep('requirements');
        }}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Asistente de certificación</h1>
          <p className="text-xs text-muted-foreground">Recolección guiada de evidencia</p>
        </div>
      </div>

      {/* Step: Scheme selection */}
      {step === 'scheme' && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Seleccione el esquema de certificación a evaluar</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CERTIFICATION_SCHEMES.map(s => {
              const Icon = SCHEME_ICONS[s.icon] || Shield;
              return (
                <Card
                  key={s.key}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    selectedScheme === s.key ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/30',
                  )}
                  onClick={() => setSelectedScheme(s.key)}
                >
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">{s.shortName}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{s.typeLabel}</Badge>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{s.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="flex justify-end mt-4">
            <Button disabled={!selectedScheme} onClick={() => setStep('scope')}>
              Continuar <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Scope selection */}
      {step === 'scope' && scheme && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Seleccione el alcance de la evaluación para {scheme.shortName}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              { key: null, label: 'Todos los requisitos', desc: 'Evaluación completa' },
              { key: 'parcela', label: 'Por parcela', desc: 'Requisitos a nivel de finca' },
              { key: 'organizacion', label: 'Organización', desc: 'Requisitos corporativos' },
              { key: 'productor', label: 'Por productor', desc: 'Requisitos individuales' },
            ] as { key: RequirementScope | null; label: string; desc: string }[]).map(s => (
              <Card
                key={s.label}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  selectedScope === s.key ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/30',
                )}
                onClick={() => setSelectedScope(s.key)}
              >
                <CardContent className="pt-4 pb-3 px-4 text-center">
                  <p className="text-sm font-medium text-foreground">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => { setStep('requirements'); setCurrentReqIdx(0); }}>
              Iniciar evaluación <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Requirements walkthrough */}
      {step === 'requirements' && currentReq && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline">{scheme?.shortName}</Badge>
            <span className="text-xs text-muted-foreground">{currentReqIdx + 1} de {filteredRequirements.length}</span>
          </div>
          <Progress value={progress} className="h-2 mb-6" />

          <Card className={cn(
            currentReq.severity === 'tolerancia_cero' ? 'border-destructive/30' : 'border-primary/20',
          )}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getSeverityColor(currentReq.severity)}>{getSeverityLabel(currentReq.severity)}</Badge>
                <Badge variant="outline" className="text-[10px]">{currentReq.category}</Badge>
              </div>

              <h2 className="text-lg font-semibold text-foreground mb-2">{currentReq.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">{currentReq.description}</p>

              {/* Why it matters */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mb-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Por qué importa</span>
                </div>
                <p className="text-xs text-muted-foreground">{currentReq.whyItMatters}</p>
              </div>

              {/* Blocking condition warning */}
              {currentReq.severity === 'tolerancia_cero' && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs font-medium text-destructive">Condición bloqueante</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    El incumplimiento de este requisito bloquea la certificación o exportación. No es negociable ni remediable progresivamente.
                  </p>
                </div>
              )}

              {/* Evidence needed */}
              <div className="mb-4">
                <p className="text-xs font-medium text-foreground mb-2">Evidencia requerida</p>
                <div className="space-y-1.5">
                  {currentReq.evidenceTypes.map(et => (
                    <div key={et} className="flex items-center justify-between p-2 rounded border border-border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-foreground">{et}</span>
                      </div>
                      <Button variant="outline" size="sm" className="text-[10px] h-6">
                        <Upload className="h-3 w-3 mr-1" /> Cargar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cross-scheme */}
              {currentReq.crossSchemeOverlap.length > 0 && (
                <div className="p-2 rounded bg-muted/30 text-xs text-muted-foreground mb-4">
                  Esta evidencia también satisface: {currentReq.crossSchemeOverlap.map(s =>
                    CERTIFICATION_SCHEMES.find(sc => sc.key === s)?.shortName
                  ).filter(Boolean).join(', ')}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleSkip}>
                  Omitir por ahora
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs" onClick={handleSkip}>
                    Evidencia pendiente
                  </Button>
                  <Button size="sm" className="text-xs" onClick={handleMarkComplete}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Evidencia completa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Summary */}
      {step === 'summary' && (
        <Card className="border-primary/20">
          <CardContent className="pt-5 pb-4">
            <div className="text-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-2" />
              <h2 className="text-lg font-semibold text-foreground">Evaluación completada</h2>
              <p className="text-sm text-muted-foreground">{scheme?.shortName}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-foreground">{filteredRequirements.length}</p>
                <p className="text-[10px] text-muted-foreground">Requisitos evaluados</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/5">
                <p className="text-2xl font-bold text-primary">{completedReqs.size}</p>
                <p className="text-[10px] text-muted-foreground">Con evidencia completa</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-destructive/5">
                <p className="text-2xl font-bold text-destructive">{filteredRequirements.length - completedReqs.size}</p>
                <p className="text-[10px] text-muted-foreground">Pendientes</p>
              </div>
            </div>

            {/* Missing items */}
            {filteredRequirements.filter(r => !completedReqs.has(r.id)).length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-foreground mb-2">Requisitos pendientes de evidencia</p>
                <div className="space-y-1">
                  {filteredRequirements.filter(r => !completedReqs.has(r.id)).map(r => (
                    <div key={r.id} className="p-2 rounded border border-border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge className={cn('text-[10px]', getSeverityColor(r.severity))}>{getSeverityLabel(r.severity)}</Badge>
                        <span className="text-foreground">{r.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate('/certificacion')}>Volver al motor</Button>
              <Button onClick={() => navigate('/certificacion/dossier')}>Ver dossier de auditoría</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
