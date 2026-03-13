import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Bug, MapPin, Clock, TrendingUp, Plus, Shield, FlaskConical, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useGuardOverview } from '@/hooks/useViewData';
import { getGuardKPIs, getDemoDiagnosticosGuard, getGuardPorEnfermedad } from '@/lib/demoSeedData';
import GuardDiagnosticWizard from '@/components/guard/GuardDiagnosticWizard';
import GuardTreatmentPlan from '@/components/guard/GuardTreatmentPlan';
import GuardExecutionTracker from '@/components/guard/GuardExecutionTracker';

const severityColor: Record<string, string> = { Alta: 'destructive', Media: 'secondary', Baja: 'outline' };
const estadoColor: Record<string, string> = { Activo: 'destructive', 'En tratamiento': 'secondary', Resuelto: 'outline' };

export default function GuardIndex() {
  const { data, isLoading } = useGuardOverview();
  const overview = data?.[0] ?? null;
  const demoKPIs = getGuardKPIs();
  const diagnosticos = getDemoDiagnosticosGuard();
  const porEnfermedad = getGuardPorEnfermedad();

  const [activeTab, setActiveTab] = useState('brotes');
  const [showWizard, setShowWizard] = useState(false);

  const brotes = diagnosticos.filter(d => d.estado === 'Activo' || d.estado === 'En tratamiento');
  const resueltos = diagnosticos.filter(d => d.estado === 'Resuelto');

  const kpis = [
    { label: 'Brotes activos', value: overview?.brotes_activos ?? demoKPIs.brotes_activos, icon: Bug, color: 'text-destructive' },
    { label: 'Parcelas en riesgo', value: overview?.parcelas_riesgo ?? demoKPIs.parcelas_riesgo, icon: MapPin, color: 'text-warning' },
    { label: 'Incidencias (30d)', value: overview?.incidencias_30d ?? demoKPIs.incidencias_30d, icon: Clock, color: 'text-muted-foreground' },
    { label: 'Tendencia', value: overview?.tendencia ?? demoKPIs.tendencia, icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Nova Guard" description="Diagnóstico fitosanitario, planes de tratamiento y seguimiento de ejecución" />
        <div className="flex items-center gap-2">
          <DemoBadge />
          <Button size="sm" className="gap-1" onClick={() => { setShowWizard(true); setActiveTab('diagnostico'); }}>
            <Plus className="h-4 w-4" /> Nuevo diagnóstico
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <k.icon className={`h-5 w-5 ${k.color}`} />
                <div>
                  {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{String(k.value)}</p>}
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="brotes"><Bug className="h-3.5 w-3.5 mr-1" /> Brotes activos</TabsTrigger>
          <TabsTrigger value="diagnostico"><Plus className="h-3.5 w-3.5 mr-1" /> Diagnóstico</TabsTrigger>
          <TabsTrigger value="planes"><Shield className="h-3.5 w-3.5 mr-1" /> Planes de tratamiento</TabsTrigger>
          <TabsTrigger value="ejecucion"><Calendar className="h-3.5 w-3.5 mr-1" /> Ejecución</TabsTrigger>
          <TabsTrigger value="enfermedad"><FlaskConical className="h-3.5 w-3.5 mr-1" /> Por enfermedad</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="brotes" className="mt-4 space-y-3">
          {brotes.slice(0, 12).map((b, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{b.parcela}</p>
                    <p className="text-xs text-muted-foreground">{b.productor} · {b.fecha} · Incidencia: {b.incidencia}%</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{b.enfermedad}</span>
                    <Badge variant={(severityColor[b.severidad] as any) || 'secondary'}>{b.severidad}</Badge>
                    <Badge variant={(estadoColor[b.estado] as any) || 'secondary'} className="text-xs">{b.estado}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="diagnostico" className="mt-4">
          {showWizard ? (
            <GuardDiagnosticWizard
              onSaved={() => { setShowWizard(false); setActiveTab('planes'); }}
              onCancel={() => { setShowWizard(false); setActiveTab('brotes'); }}
            />
          ) : (
            <div className="text-center py-10 space-y-3">
              <Bug className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Registra un nuevo diagnóstico fitosanitario paso a paso</p>
              <Button size="sm" className="gap-1" onClick={() => setShowWizard(true)}>
                <Plus className="h-4 w-4" /> Iniciar diagnóstico
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="planes" className="mt-4">
          <GuardTreatmentPlan onGeneratePlan={() => { setShowWizard(true); setActiveTab('diagnostico'); }} />
        </TabsContent>

        <TabsContent value="ejecucion" className="mt-4">
          <GuardExecutionTracker />
        </TabsContent>

        <TabsContent value="enfermedad" className="mt-4">
          <Card>
            <CardContent className="pt-5">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porEnfermedad} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="enfermedad" type="category" width={120} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    <Bar dataKey="casos" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="mt-4 space-y-3">
          {resueltos.slice(0, 10).map((r, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{r.parcela} – {r.enfermedad}</p>
                    <p className="text-xs text-muted-foreground">{r.productor} · {r.fecha}</p>
                  </div>
                  <Badge variant="outline">Resuelto</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
