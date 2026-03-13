import { useNavigate } from 'react-router-dom';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useProduccionOverview } from '@/hooks/useViewData';
import { useVisibilityPolicy } from '@/lib/operatingModel';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Map, Package, Sprout, FolderOpen, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getProduccionKPIs, getEntregasMensuales, getTopVariedades, getDemoProductores, getDemoParcelas } from '@/lib/demoSeedData';

const allSections = [
  { title: 'Productores', description: 'Registro y estado de socios productores', icon: Users, path: '/produccion/productores', statKey: 'productores_count', color: 'text-primary', visKey: 'canSeeProducers' as const },
  { title: 'Parcelas', description: 'Catálogo de parcelas con estado agronómico y VITAL', icon: Map, path: '/produccion/parcelas', statKey: 'parcelas_count', color: 'text-accent', visKey: null },
  { title: 'Cultivos', description: 'Variedades, edades y catálogo productivo', icon: Sprout, path: '/produccion/cultivos', statKey: 'variedades_count', color: 'text-chart-3', visKey: null },
  { title: 'Entregas', description: 'Recibos, trazabilidad y consolidación', icon: Package, path: '/produccion/entregas', statKey: 'entregas_count', color: 'text-chart-2', visKey: 'canSeeDeliveries' as const },
  { title: 'Documentos y evidencias', description: 'Estudios de suelo, PDFs, evidencia fotográfica', icon: FolderOpen, path: '/produccion/documentos', statKey: 'documentos_count', color: 'text-muted-foreground', visKey: null },
];

export default function ProduccionIndex() {
  const navigate = useNavigate();
  const { orgTipo } = useOrgContext();
  const { data, isLoading } = useProduccionOverview();
  const isProducer = orgTipo === 'productor_privado' || orgTipo === 'productor';

  const overview = data?.[0] ?? null;
  const demoKPIs = getProduccionKPIs();
  const entregas = getEntregasMensuales();
  const topVars = getTopVariedades();

  const getValue = (key: string) => overview?.[key] ?? (demoKPIs as any)[key] ?? '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={isProducer ? 'Mi Producción' : 'Producción'} description="Núcleo operativo de datos productivos de la organización" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {defaultSections.map(s => (
          <Card key={s.path} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(s.path)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-muted ${s.color}`}><s.icon className="h-5 w-5" /></div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardTitle className="text-base mt-2">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{s.description}</p>
              {isLoading ? <Skeleton className="h-5 w-20" /> : <Badge variant="secondary" className="text-xs">{String(getValue(s.statKey))}</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entregas mensuales chart */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Entregas mensuales (últimos 12 meses)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entregas}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="entregas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top variedades */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Variedades principales</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topVars.map(v => (
              <div key={v.variedad} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">{v.variedad}</span>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{v.parcelas} parcelas</span>
                  <span>{v.area} ha</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Signals */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Señales conectadas</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <span className="h-2 w-2 rounded-full bg-warning" />
              <span className="text-sm">{String(getValue('parcelas_sin_analisis'))} parcelas sin análisis reciente</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-sm">{String(getValue('alertas_guard'))} alertas fitosanitarias activas</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-sm">{String(getValue('estimaciones_pendientes'))} estimaciones Yield pendientes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}