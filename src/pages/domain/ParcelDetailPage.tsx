/**
 * Ficha de parcela como hub central.
 * Ruta: /produccion/parcelas/:id
 * Tabs: Resumen, Producción, Nutrición, Nova Guard, Nova Yield, Protocolo VITAL, Evidencias
 */
import { useParams, Link } from 'react-router-dom';
import { MainHeader } from '@/components/layout/MainHeader';
import { useParcelHubSummaryDemoAware } from '@/hooks/useParcelHubSummaryDemoAware';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Sprout, FlaskConical, Bug, BarChart3, Shield, FileImage, ArrowRight } from 'lucide-react';
import { EudrSignalBadge } from '@/components/domain/EudrSignalBadge';
import { DemoFallbackBadge } from '@/components/domain/DemoFallbackBadge';

const TABS = [
  { key: 'resumen', label: 'Resumen', icon: Sprout },
  { key: 'produccion', label: 'Producción', icon: Sprout },
  { key: 'nutricion', label: 'Nutrición', icon: FlaskConical },
  { key: 'guard', label: 'Nova Guard', icon: Bug },
  { key: 'yield', label: 'Nova Yield', icon: BarChart3 },
  { key: 'vital', label: 'Protocolo VITAL', icon: Shield },
  { key: 'evidencias', label: 'Evidencias', icon: FileImage },
] as const;

function TabContentResumen({
  parcelId,
  summary,
}: {
  parcelId: string;
  summary?: { parcela_nombre?: string | null; productor_nombre?: string | null; ultimo_plan_nutricion_estado?: string | null; ultimo_diagnostico_guard_riesgo?: string | null; tiene_evidencias?: boolean; tiene_eudr?: boolean; tiene_novacup?: boolean } | null;
}) {
  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 text-sm">
          {summary.parcela_nombre && (
            <p><span className="text-muted-foreground">Parcela:</span> {summary.parcela_nombre}</p>
          )}
          {summary.productor_nombre && (
            <p><span className="text-muted-foreground">Productor:</span> {summary.productor_nombre}</p>
          )}
          {summary.ultimo_plan_nutricion_estado && (
            <p><span className="text-muted-foreground">Último plan nutrición:</span> {summary.ultimo_plan_nutricion_estado}</p>
          )}
          {summary.ultimo_diagnostico_guard_riesgo && (
            <p><span className="text-muted-foreground">Riesgo Guard:</span> {summary.ultimo_diagnostico_guard_riesgo}</p>
          )}
          <div className="flex gap-2">
            {summary.tiene_evidencias && <span className="text-xs px-2 py-0.5 rounded bg-green-500/15 text-green-700 dark:text-green-400">Evidencias</span>}
            {summary.tiene_eudr && <span className="text-xs px-2 py-0.5 rounded bg-green-500/15 text-green-700 dark:text-green-400">EUDR</span>}
            {summary.tiene_novacup && <span className="text-xs px-2 py-0.5 rounded bg-green-500/15 text-green-700 dark:text-green-400">Nova Cup</span>}
          </div>
        </div>
      )}
      <p className="text-muted-foreground text-sm">
        Vista general de la parcela. Resumen de estado y enlaces a módulos.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Link to={`/agronomia/nutricion?parcela=${parcelId}`}>
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between">
              <span className="font-medium">Nutrición</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Plan nutricional y recomendaciones</p>
            </CardContent>
          </Card>
        </Link>
        <Link to={`/agronomia/guard?parcela=${parcelId}`}>
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between">
              <span className="font-medium">Nova Guard</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Alertas y sanidad vegetal</p>
            </CardContent>
          </Card>
        </Link>
        <Link to={`/agronomia/yield?parcela=${parcelId}`}>
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between">
              <span className="font-medium">Nova Yield</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Estimaciones y rendimiento</p>
            </CardContent>
          </Card>
        </Link>
        <Link to={`/resiliencia/vital?parcela=${parcelId}`}>
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between">
              <span className="font-medium">Protocolo VITAL</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Resiliencia climática</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function TabContentPlaceholder({ title, deepLink }: { title: string; deepLink: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-muted-foreground mb-4">{title}</p>
      <Link to={deepLink} className="text-primary hover:underline text-sm">
        Ir a {title} →
      </Link>
    </div>
  );
}

export default function ParcelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const parcelId = id ?? '';
  const { data: hubSummary, isFallback } = useParcelHubSummaryDemoAware(parcelId);

  const displayName = hubSummary?.parcela_nombre ?? `Parcela ${parcelId}`;
  const eudrStatus = hubSummary?.tiene_eudr ? 'compliant' : 'pending';

  return (
    <>
      <MainHeader
        title={displayName}
        subtitle={hubSummary?.productor_nombre ? `Productor: ${hubSummary.productor_nombre}` : 'Hub central de la parcela'}
        actions={
          <div className="flex items-center gap-2">
            <DemoFallbackBadge show={isFallback} />
            <EudrSignalBadge status={eudrStatus} />
          </div>
        }
      />
      <Tabs defaultValue="resumen" className="mt-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.key} value={tab.key} className="gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
        <TabsContent value="resumen" className="mt-4">
          <TabContentResumen parcelId={parcelId} summary={hubSummary ?? undefined} />
        </TabsContent>
        <TabsContent value="produccion">
          <TabContentPlaceholder title="Producción" deepLink={`/produccion?parcela=${parcelId}`} />
        </TabsContent>
        <TabsContent value="nutricion">
          <TabContentPlaceholder title="Nutrición" deepLink={`/agronomia/nutricion?parcela=${parcelId}`} />
        </TabsContent>
        <TabsContent value="guard">
          <TabContentPlaceholder title="Nova Guard" deepLink={`/agronomia/guard?parcela=${parcelId}`} />
        </TabsContent>
        <TabsContent value="yield">
          <TabContentPlaceholder title="Nova Yield" deepLink={`/agronomia/yield?parcela=${parcelId}`} />
        </TabsContent>
        <TabsContent value="vital">
          <TabContentPlaceholder title="Protocolo VITAL" deepLink={`/resiliencia/vital?parcela=${parcelId}`} />
        </TabsContent>
        <TabsContent value="evidencias">
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Evidencias y documentación de la parcela</p>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
