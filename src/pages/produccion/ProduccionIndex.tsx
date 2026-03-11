import { useNavigate } from 'react-router-dom';
import { useOrgContext } from '@/hooks/useOrgContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Map, Package, Sprout, FolderOpen, ArrowRight } from 'lucide-react';

const sections = [
  { title: 'Productores', description: 'Registro y estado de socios productores', icon: Users, path: '/produccion/productores', stat: '420 activos', color: 'text-primary' },
  { title: 'Parcelas', description: 'Catálogo de parcelas con estado agronómico y VITAL', icon: Map, path: '/produccion/parcelas', stat: '860 registradas', color: 'text-accent' },
  { title: 'Cultivos', description: 'Variedades, edades y catálogo productivo', icon: Sprout, path: '/produccion/cultivos', stat: '4 variedades', color: 'text-chart-3' },
  { title: 'Entregas', description: 'Recibos, trazabilidad y consolidación', icon: Package, path: '/produccion/entregas', stat: '2,340 entregas', color: 'text-chart-2' },
  { title: 'Documentos y evidencias', description: 'Estudios de suelo, PDFs, evidencia fotográfica', icon: FolderOpen, path: '/produccion/documentos', stat: '156 archivos', color: 'text-muted-foreground' },
];

export default function ProduccionIndex() {
  const navigate = useNavigate();
  const { orgTipo } = useOrgContext();
  const isProducer = orgTipo === 'productor_privado' || orgTipo === 'productor';

  return (
    <div className="space-y-6">
      <PageHeader title={isProducer ? 'Mi Producción' : 'Producción'} description="Núcleo operativo de datos productivos de la organización" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(s => (
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
              <Badge variant="secondary" className="text-xs">{s.stat}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick alerts connected to agronomy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Señales conectadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <span className="h-2 w-2 rounded-full bg-warning" />
              <span className="text-sm">12 parcelas sin análisis de suelo reciente</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-sm">3 alertas fitosanitarias activas</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-sm">8 estimaciones Yield pendientes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
