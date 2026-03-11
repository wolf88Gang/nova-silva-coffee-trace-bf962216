import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Package, ShieldCheck, FolderOpen, FileText, ArrowRight } from 'lucide-react';
import { useComplianceOverview } from '@/hooks/useViewData';
import { getCumplimientoKPIs, getDemoDossiersEUDR } from '@/lib/demoSeedData';

const estadoColorEudr: Record<string, string> = { Verde: 'default', Ámbar: 'secondary', Rojo: 'destructive' };

const sections = [
  { title: 'Trazabilidad', description: 'Cadena de custodia por lote y origen', icon: Eye, path: '/cumplimiento/trazabilidad', statKey: 'trazabilidad_pct' },
  { title: 'Lotes', description: 'Composición, origen y estado de lotes comerciales', icon: Package, path: '/cumplimiento/lotes', statKey: 'lotes_activos' },
  { title: 'Dossiers EUDR', description: 'Declaraciones de debida diligencia y polígonos verificados', icon: ShieldCheck, path: '/cumplimiento/eudr', statKey: 'dossiers_count' },
  { title: 'Data Room', description: 'Repositorio documental de evidencia y certificaciones', icon: FolderOpen, path: '/cumplimiento/data-room', statKey: 'documentos_count' },
  { title: 'Auditorías', description: 'Sesiones de auditoría y verificación de terceros', icon: FileText, path: '/cumplimiento/auditorias', statKey: 'sesiones_activas' },
];

export default function CumplimientoIndex() {
  const navigate = useNavigate();
  const { data, isLoading } = useComplianceOverview();
  const overview = data?.[0] ?? null;
  const demoKPIs = getCumplimientoKPIs();
  const dossiers = getDemoDossiersEUDR();

  const getValue = (key: string) => overview?.[key] ?? (demoKPIs as any)[key] ?? '—';
  const verdes = dossiers.filter(d => d.estado === 'Verde').length;
  const ambar = dossiers.filter(d => d.estado === 'Ámbar').length;
  const rojos = dossiers.filter(d => d.estado === 'Rojo').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Cumplimiento" description="Evidencia, trazabilidad y verificación regulatoria" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(s => (
          <Card key={s.path} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(s.path)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-primary/10 text-primary"><s.icon className="h-5 w-5" /></div>
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

      {/* EUDR semáforo */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Estado EUDR por dossier</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10"><span className="h-2 w-2 rounded-full bg-primary" /><span className="text-sm font-medium">{verdes} Verde</span></div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10"><span className="h-2 w-2 rounded-full bg-warning" /><span className="text-sm font-medium">{ambar} Ámbar</span></div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10"><span className="h-2 w-2 rounded-full bg-destructive" /><span className="text-sm font-medium">{rojos} Rojo</span></div>
          </div>
          <div className="space-y-2">
            {dossiers.slice(0, 12).map((d, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{d.lote}</p>
                  <p className="text-xs text-muted-foreground">{d.origen} · {d.parcelas} parcelas · {d.fecha}</p>
                </div>
                <div className="flex items-center gap-2">
                  {d.documentosFaltantes > 0 && <span className="text-xs text-warning">{d.documentosFaltantes} docs faltantes</span>}
                  <Badge variant={(estadoColorEudr[d.estado] as any) || 'secondary'}>{d.estado}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}