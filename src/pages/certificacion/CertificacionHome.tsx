/**
 * Certification Home — Compliance engine dashboard.
 * Shows scheme readiness, risk alerts, critical gaps, and evidence status.
 * Connected to real Supabase data via useCertificationReadiness.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield, AlertTriangle, CheckCircle2, FileWarning,
  ChevronRight, ArrowRight, Clock, XCircle,
  Leaf, Users, Coffee, Award, Globe, Sprout, Database,
} from 'lucide-react';
import {
  CERTIFICATION_SCHEMES,
  getSeverityLabel,
  getSeverityColor,
  RISK_ITEMS,
  type SchemeReadiness,
  type SchemeKey,
} from '@/lib/certificationEngine';
import { useCertificationReadiness } from '@/hooks/useCertificationData';
import { cn } from '@/lib/utils';

const SCHEME_ICONS: Record<string, React.ElementType> = {
  Shield, Leaf, Users, Coffee, Globe, Sprout, Award,
};

function getSchemeIcon(iconName: string) {
  return SCHEME_ICONS[iconName] || Shield;
}

const RISK_COLORS: Record<string, string> = {
  bajo: 'bg-primary/10 text-primary border-primary/30',
  medio: 'bg-accent/10 text-accent-foreground border-accent/30',
  alto: 'bg-destructive/10 text-destructive border-destructive/30',
  critico: 'bg-destructive text-destructive-foreground',
};

const RISK_LABELS: Record<string, string> = {
  bajo: 'Riesgo bajo',
  medio: 'Riesgo medio',
  alto: 'Riesgo alto',
  critico: 'Riesgo crítico',
};

export default function CertificacionHome() {
  const navigate = useNavigate();
  const { data, isLoading } = useCertificationReadiness();

  const readiness = data?.readiness ?? [];
  const gaps = data?.gaps ?? [];
  const correctives = data?.correctives ?? [];
  const dataSource = data?.dataSource ?? 'demo';

  const totalSchemes = readiness.length;
  const avgReadiness = totalSchemes > 0 ? Math.round(readiness.reduce((a, r) => a + r.readinessPercent, 0) / totalSchemes) : 0;
  const criticalCount = correctives.filter(c => c.severity === 'tolerancia_cero' || c.status === 'vencido' || c.status === 'escalado').length;
  const pendingActions = correctives.filter(c => c.status !== 'resuelto').length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Motor de Certificación
          </h1>
          {dataSource === 'demo' && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1"><Database className="h-2.5 w-2.5" /> Datos demo</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Gestión de evidencia, detección de brechas y preparación de auditoría para todos los esquemas activos
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Preparación promedio" value={`${avgReadiness}%`} sub={`${totalSchemes} esquemas activos`} icon={CheckCircle2} />
        <KpiCard label="Alertas críticas" value={String(criticalCount)} sub="Tolerancia cero o vencidas" icon={AlertTriangle} variant={criticalCount > 0 ? 'danger' : 'default'} />
        <KpiCard label="Acciones pendientes" value={String(pendingActions)} sub="Correctivas abiertas" icon={Clock} />
        <KpiCard label="Riesgos sistémicos" value={String(RISK_ITEMS.length)} sub="Puntos de falla monitoreados" icon={FileWarning} />
      </div>

      {/* Scheme readiness cards */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Preparación por esquema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {readiness.map(r => {
            const scheme = CERTIFICATION_SCHEMES.find(s => s.key === r.scheme)!;
            const Icon = getSchemeIcon(scheme.icon);
            return (
              <Card
                key={r.scheme}
                className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
                onClick={() => navigate(`/certificacion/esquema/${r.scheme}`)}
              >
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{scheme.shortName}</span>
                    </div>
                    <Badge className={cn('text-[10px]', RISK_COLORS[r.riskLevel])}>{RISK_LABELS[r.riskLevel]}</Badge>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Preparación</span>
                      <span className="font-medium text-foreground">{r.readinessPercent}%</span>
                    </div>
                    <Progress value={r.readinessPercent} className="h-2" />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" />{r.compliant} ok</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.partial} parcial</span>
                    <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" />{r.missing} faltante</span>
                  </div>
                  {r.criticalGaps > 0 && (
                    <div className="mt-2 text-[11px] text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {r.criticalGaps} brecha(s) crítica(s)
                    </div>
                  )}
                  <div className="flex justify-end mt-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Critical gaps */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Brechas críticas de evidencia
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/certificacion/evidencia')}>
            Centro de evidencia <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {gaps.slice(0, 5).map(g => {
              const scheme = CERTIFICATION_SCHEMES.find(s => s.key === g.scheme);
              return (
                <div key={g.requirementId} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer"
                  onClick={() => navigate(`/certificacion/esquema/${g.scheme}`)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{g.requirementName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{scheme?.shortName} · {g.impact.slice(0, 80)}...</p>
                    </div>
                    <Badge className={getSeverityColor(g.severity)}>{getSeverityLabel(g.severity)}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {g.missingEvidence.map(e => (
                      <Badge key={e} variant="outline" className="text-[10px] border-destructive/30 text-destructive">{e}</Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Corrective actions summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent-foreground" /> Acciones correctivas
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/certificacion/correctivas')}>
            Ver todas <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {correctives.filter(c => c.status !== 'resuelto').slice(0, 4).map(c => {
              const scheme = CERTIFICATION_SCHEMES.find(s => s.key === c.scheme);
              return (
                <div key={c.id} className={cn(
                  'p-3 rounded-lg border',
                  c.status === 'vencido' || c.status === 'escalado' ? 'border-destructive/30 bg-destructive/5' : 'border-border'
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{c.issue}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{scheme?.shortName} · {c.owner} · Vence: {c.dueDate}</p>
                    </div>
                    <div className="flex gap-1">
                      <Badge className={getSeverityColor(c.severity)}>{getSeverityLabel(c.severity)}</Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {c.status === 'pendiente' ? 'Pendiente' : c.status === 'en_progreso' ? 'En progreso' : c.status === 'vencido' ? 'Vencido' : 'Escalado'}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Systemic risks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Riesgos sistémicos monitoreados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {RISK_ITEMS.map(r => (
              <div key={r.id} className="p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.risk}</p>
                    <p className="text-xs text-destructive mt-0.5">{r.impact}</p>
                    <p className="text-xs text-muted-foreground mt-1">{r.control}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick navigation */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Centro de evidencia', url: '/certificacion/evidencia', icon: FileWarning },
          { label: 'Acciones correctivas', url: '/certificacion/correctivas', icon: Clock },
          { label: 'Vista cruzada', url: '/certificacion/cruzada', icon: Globe },
          { label: 'Dossier de auditoría', url: '/certificacion/dossier', icon: CheckCircle2 },
          { label: 'Asistente', url: '/certificacion/wizard', icon: Sprout },
        ].map(a => (
          <Button key={a.label} variant="outline" className="h-auto py-3 flex flex-col items-center gap-1.5" onClick={() => navigate(a.url)}>
            <a.icon className="h-5 w-5 text-primary" />
            <span className="text-xs">{a.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, variant = 'default' }: {
  label: string; value: string; sub: string; icon: React.ElementType; variant?: 'default' | 'danger';
}) {
  return (
    <Card className={variant === 'danger' ? 'border-destructive/30' : ''}>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn('h-4 w-4', variant === 'danger' ? 'text-destructive' : 'text-primary')} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={cn('text-2xl font-bold', variant === 'danger' ? 'text-destructive' : 'text-foreground')}>{value}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
