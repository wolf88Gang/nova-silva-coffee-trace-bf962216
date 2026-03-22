/**
 * Evidence Center — Central place to manage, upload, and view evidence reuse across schemes.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, FileText, Upload, Search, CheckCircle2, Clock,
  XCircle, AlertTriangle, Share2,
} from 'lucide-react';
import {
  generateDemoEvidence,
  getEvidenceStatusLabel,
  getEvidenceStatusColor,
  getSchemeByKey,
  getRequirementById,
  type EvidenceItem,
} from '@/lib/certificationEngine';
import { cn } from '@/lib/utils';

export default function CertificacionEvidenceCenter() {
  const navigate = useNavigate();
  const evidence = useMemo(() => generateDemoEvidence(), []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const filtered = evidence.filter(e => {
    if (filter !== 'all' && e.status !== filter) return false;
    if (search && !e.fileName.toLowerCase().includes(search.toLowerCase()) && !e.type.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: evidence.length,
    completo: evidence.filter(e => e.status === 'completo').length,
    parcial: evidence.filter(e => e.status === 'parcial').length,
    faltante: evidence.filter(e => e.status === 'faltante').length,
    vencido: evidence.filter(e => e.status === 'vencido').length,
    reused: evidence.filter(e => e.reusedInSchemes.length > 1).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/certificacion')}><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Centro de evidencia</h1>
          <p className="text-xs text-muted-foreground">Gestión centralizada de documentos de cumplimiento</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <StatCard label="Total" value={stats.total} icon={FileText} />
        <StatCard label="Completos" value={stats.completo} icon={CheckCircle2} variant="success" />
        <StatCard label="Parciales" value={stats.parcial} icon={Clock} />
        <StatCard label="Faltantes" value={stats.faltante} icon={XCircle} variant="danger" />
        <StatCard label="Vencidos" value={stats.vencido} icon={AlertTriangle} variant="danger" />
        <StatCard label="Reutilizados" value={stats.reused} icon={Share2} variant="success" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o tipo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'completo', label: 'Completos' },
            { key: 'parcial', label: 'Parciales' },
            { key: 'faltante', label: 'Faltantes' },
            { key: 'vencido', label: 'Vencidos' },
          ].map(f => (
            <Button key={f.key} variant={filter === f.key ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setFilter(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Upload CTA */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="py-6 flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-primary/50" />
          <p className="text-sm text-muted-foreground">Arrastre archivos o haga clic para cargar nueva evidencia</p>
          <Button variant="outline" size="sm" className="text-xs mt-1">
            <Upload className="h-3 w-3 mr-1" /> Cargar documento
          </Button>
        </CardContent>
      </Card>

      {/* Evidence list */}
      <div className="space-y-2">
        {filtered.map(e => {
          const req = getRequirementById(e.requirementId);
          return (
            <Card key={e.id} className={cn(
              'hover:shadow-sm transition-all',
              e.status === 'vencido' ? 'border-destructive/20' : '',
            )}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{e.fileName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{e.type} · Cargado: {e.uploadDate}</p>
                      {req && <p className="text-xs text-muted-foreground">Requisito: {req.name}</p>}
                      {e.expirationDate && (
                        <p className={cn('text-xs mt-0.5', e.status === 'vencido' ? 'text-destructive' : 'text-muted-foreground')}>
                          {e.status === 'vencido' ? 'Vencido: ' : 'Vence: '}{e.expirationDate}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge className={cn('text-[10px]', getEvidenceStatusColor(e.status))}>{getEvidenceStatusLabel(e.status)}</Badge>
                    {e.reusedInSchemes.length > 1 && (
                      <div className="flex items-center gap-1">
                        <Share2 className="h-3 w-3 text-primary" />
                        <span className="text-[10px] text-primary">{e.reusedInSchemes.length} esquemas</span>
                      </div>
                    )}
                  </div>
                </div>
                {e.reusedInSchemes.length > 1 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {e.reusedInSchemes.map(s => (
                      <Badge key={s} variant="outline" className="text-[10px]">{getSchemeByKey(s)?.shortName}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No se encontró evidencia con los filtros aplicados</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, variant = 'default' }: {
  label: string; value: number; icon: React.ElementType; variant?: 'default' | 'success' | 'danger';
}) {
  return (
    <Card>
      <CardContent className="pt-3 pb-2 px-3 text-center">
        <Icon className={cn('h-4 w-4 mx-auto mb-1',
          variant === 'success' ? 'text-primary' : variant === 'danger' ? 'text-destructive' : 'text-muted-foreground')} />
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
