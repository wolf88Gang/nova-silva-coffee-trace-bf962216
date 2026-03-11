import { useNavigate } from 'react-router-dom';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useProduccionOverview } from '@/hooks/useViewData';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Map, Package, Sprout, FolderOpen, ArrowRight } from 'lucide-react';

const defaultSections = [
  { title: 'Productores', description: 'Registro y estado de socios productores', icon: Users, path: '/produccion/productores', statKey: 'productores_count', fallback: '—', color: 'text-primary' },
  { title: 'Parcelas', description: 'Catálogo de parcelas con estado agronómico y VITAL', icon: Map, path: '/produccion/parcelas', statKey: 'parcelas_count', fallback: '—', color: 'text-accent' },
  { title: 'Cultivos', description: 'Variedades, edades y catálogo productivo', icon: Sprout, path: '/produccion/cultivos', statKey: 'variedades_count', fallback: '—', color: 'text-chart-3' },
  { title: 'Entregas', description: 'Recibos, trazabilidad y consolidación', icon: Package, path: '/produccion/entregas', statKey: 'entregas_count', fallback: '—', color: 'text-chart-2' },
  { title: 'Documentos y evidencias', description: 'Estudios de suelo, PDFs, evidencia fotográfica', icon: FolderOpen, path: '/produccion/documentos', statKey: 'documentos_count', fallback: '—', color: 'text-muted-foreground' },
];

export default function ProduccionIndex() {
  const navigate = useNavigate();
  const { orgTipo } = useOrgContext();
  const { data, isLoading } = useProduccionOverview();
  const isProducer = orgTipo === 'productor_privado' || orgTipo === 'productor';

  // Use first row from view if available
  const overview = data?.[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title={isProducer ? 'Mi Producción' : 'Producción'} description="Núcleo operativo de datos productivos de la organización" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {defaultSections.map(s => (
          <Card key={s.path} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(s.path)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardTitle className="text-base mt-2">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{s.description}</p>
              {isLoading ? (
                <Skeleton className="h-5 w-20" />
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {overview?.[s.statKey] != null ? String(overview[s.statKey]) : s.fallback}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Señales conectadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <span className="h-2 w-2 rounded-full bg-warning" />
              <span className="text-sm">{String(overview?.parcelas_sin_analisis ?? '—')} parcelas sin análisis reciente</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-sm">{String(overview?.alertas_guard ?? '—')} alertas fitosanitarias activas</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-sm">{String(overview?.estimaciones_pendientes ?? '—')} estimaciones Yield pendientes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
