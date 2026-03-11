import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Package, ShieldCheck, FolderOpen, FileText, ArrowRight } from 'lucide-react';

const sections = [
  { title: 'Trazabilidad', description: 'Cadena de custodia por lote y origen', icon: Eye, path: '/cumplimiento/trazabilidad', stat: '98% trazado' },
  { title: 'Lotes', description: 'Composición, origen y estado de lotes comerciales', icon: Package, path: '/cumplimiento/lotes', stat: '34 lotes activos' },
  { title: 'Dossiers EUDR', description: 'Declaraciones de debida diligencia y polígonos verificados', icon: ShieldCheck, path: '/cumplimiento/eudr', stat: '12 dossiers' },
  { title: 'Data Room', description: 'Repositorio documental de evidencia y certificaciones', icon: FolderOpen, path: '/cumplimiento/data-room', stat: '256 documentos' },
  { title: 'Auditorías', description: 'Sesiones de auditoría y verificación de terceros', icon: FileText, path: '/cumplimiento/auditorias', stat: '3 sesiones activas' },
];

export default function CumplimientoIndex() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader title="Cumplimiento" description="Evidencia, trazabilidad y verificación regulatoria" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(s => (
          <Card key={s.path} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(s.path)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
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
    </div>
  );
}
