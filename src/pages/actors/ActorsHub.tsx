import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrgContext } from '@/hooks/useOrgContext';
import { hasModule, type OrgModule } from '@/lib/org-modules';
import {
  getActorsLabel, getActorLabel, getNewActorLabel, getActorsEmptyState,
} from '@/lib/org-terminology';
import { DEMO_PRODUCTORES, type DemoProductor } from '@/lib/demo-data';
import { Search, Plus, Download, Users, MapPin, FileText, CreditCard, Leaf, Package } from 'lucide-react';

// ── Helpers ──

const eudrBadge = (s: string) => {
  if (s === 'compliant') return <Badge variant="default">Compliant</Badge>;
  if (s === 'pending') return <Badge variant="secondary">Pendiente</Badge>;
  return <Badge variant="destructive">No Compliant</Badge>;
};

const vitalColor = (v: number) => {
  if (v >= 81) return 'text-emerald-600';
  if (v >= 61) return 'text-primary';
  if (v >= 41) return 'text-yellow-600';
  return 'text-destructive';
};

/** Determine if user can create/edit actors */
function canWrite(role: string | null): boolean {
  return ['admin', 'cooperativa', 'exportador'].includes(role ?? '');
}

// ── Actor Detail Panel ──

function ActorDetail({
  actor, modules, onClose,
}: { actor: DemoProductor; modules: OrgModule[]; onClose: () => void }) {
  const availableTabs: { key: string; label: string; icon: React.ReactNode; requiredModule?: OrgModule }[] = [
    { key: 'resumen', label: 'Resumen', icon: <Users className="h-4 w-4" /> },
    { key: 'parcelas', label: 'Parcelas', icon: <MapPin className="h-4 w-4" />, requiredModule: 'parcelas' },
    { key: 'entregas', label: 'Entregas', icon: <Package className="h-4 w-4" />, requiredModule: 'entregas' },
    { key: 'documentos', label: 'Documentos', icon: <FileText className="h-4 w-4" /> },
    { key: 'creditos', label: 'Créditos', icon: <CreditCard className="h-4 w-4" />, requiredModule: 'creditos' },
    { key: 'vital', label: 'VITAL', icon: <Leaf className="h-4 w-4" />, requiredModule: 'vital' },
  ];

  const visibleTabs = availableTabs.filter(t => !t.requiredModule || hasModule(modules, t.requiredModule));

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{actor.nombre}</DialogTitle>
      </DialogHeader>
      <Tabs defaultValue="resumen" className="mt-2">
        <TabsList className="flex-wrap">
          {visibleTabs.map(t => (
            <TabsTrigger key={t.key} value={t.key} className="gap-1.5 text-xs">
              {t.icon} {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumen" className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Documento:</span> {actor.cedula}</div>
            <div><span className="text-muted-foreground">Comunidad:</span> {actor.comunidad}</div>
            <div><span className="text-muted-foreground">Parcelas:</span> {actor.parcelas}</div>
            <div><span className="text-muted-foreground">Hectáreas:</span> {actor.hectareas}</div>
            {hasModule(modules, 'vital') && (
              <div><span className="text-muted-foreground">VITAL:</span> <span className={`font-bold ${vitalColor(actor.puntajeVITAL)}`}>{actor.puntajeVITAL}</span></div>
            )}
            {hasModule(modules, 'eudr') && (
              <div><span className="text-muted-foreground">EUDR:</span> {eudrBadge(actor.estadoEUDR)}</div>
            )}
          </div>
        </TabsContent>

        {visibleTabs.filter(t => t.key !== 'resumen').map(t => (
          <TabsContent key={t.key} value={t.key} className="pt-2">
            <p className="text-sm text-muted-foreground">Contenido del módulo {t.label} se cargará desde hooks de datos reales.</p>
          </TabsContent>
        ))}
      </Tabs>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cerrar</Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ── Create Actor Dialog ──

function CreateActorDialog({ orgTipo, modules, actorLabel }: { orgTipo: string | null; modules: OrgModule[]; actorLabel: string }) {
  const [open, setOpen] = useState(false);
  const newLabel = getNewActorLabel(orgTipo);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> {newLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{newLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input placeholder={`Nombre del ${actorLabel.toLowerCase()}`} />
          </div>
          {orgTipo !== 'productor_empresarial' && (
            <div className="space-y-1.5">
              <Label>Documento / Cédula</Label>
              <Input placeholder="Número de identificación" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input placeholder="+502 0000 0000" />
          </div>
          <div className="space-y-1.5">
            <Label>Comunidad / Zona</Label>
            <Input placeholder="Comunidad o región" />
          </div>
          {(orgTipo === 'cooperativa' || orgTipo === 'productor_empresarial') && (
            <div className="space-y-1.5">
              <Label>Hectáreas</Label>
              <Input type="number" placeholder="0.0" />
            </div>
          )}
          {hasModule(modules, 'eudr') && (
            <div className="space-y-1.5">
              <Label>Estado EUDR</Label>
              <Select defaultValue="pending">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="compliant">Compliant</SelectItem>
                  <SelectItem value="non-compliant">No Compliant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => setOpen(false)}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ──

export default function ActorsHub() {
  const { orgTipo, role, activeModules, productorId } = useOrgContext();
  const modules = activeModules;

  const pluralLabel = getActorsLabel(orgTipo);
  const singularLabel = getActorLabel(orgTipo);
  const emptyState = getActorsEmptyState(orgTipo);

  const [search, setSearch] = useState('');
  const [comunidad, setComunidad] = useState('todas');
  const [selectedActor, setSelectedActor] = useState<DemoProductor | null>(null);

  // For productor role, filter to own record only
  const baseData = useMemo(() => {
    if (role === 'productor' && productorId) {
      return DEMO_PRODUCTORES.filter(p => p.id === productorId);
    }
    return DEMO_PRODUCTORES;
  }, [role, productorId]);

  const comunidades = useMemo(() => [...new Set(baseData.map(p => p.comunidad))], [baseData]);

  const filtered = useMemo(() => baseData.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) || p.cedula.includes(search);
    const matchCom = comunidad === 'todas' || p.comunidad === comunidad;
    return matchSearch && matchCom;
  }), [baseData, search, comunidad]);

  // Dynamic summary cards
  const summaryCards: { label: string; value: string | number }[] = [
    { label: `Total ${pluralLabel}`, value: filtered.length },
    { label: 'Hectáreas', value: `${filtered.reduce((s, p) => s + p.hectareas, 0).toFixed(1)} ha` },
  ];
  if (hasModule(modules, 'eudr')) {
    summaryCards.push({ label: 'EUDR Compliant', value: filtered.filter(p => p.estadoEUDR === 'compliant').length });
  }
  if (hasModule(modules, 'vital')) {
    summaryCards.push({ label: 'Prom. VITAL', value: Math.round(filtered.reduce((s, p) => s + p.puntajeVITAL, 0) / (filtered.length || 1)) });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{pluralLabel}</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} {pluralLabel.toLowerCase()} registrados</p>
        </div>
        <div className="flex gap-2">
          {canWrite(role) && <CreateActorDialog orgTipo={orgTipo} modules={modules} actorLabel={singularLabel} />}
          <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" /> Exportar</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={`Buscar ${singularLabel.toLowerCase()} por nombre o documento...`} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={comunidad} onValueChange={setComunidad}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Comunidad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {comunidades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className={`grid grid-cols-2 md:grid-cols-${Math.min(summaryCards.length, 4)} gap-4`}>
        {summaryCards.map((sc, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{sc.label}</p>
              <p className="text-xl font-bold">{sc.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{emptyState}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Documento</th>
                    <th className="px-4 py-3 font-medium">Comunidad</th>
                    <th className="px-4 py-3 font-medium">Parcelas</th>
                    <th className="px-4 py-3 font-medium">Hectáreas</th>
                    {hasModule(modules, 'eudr') && <th className="px-4 py-3 font-medium">EUDR</th>}
                    {hasModule(modules, 'vital') && <th className="px-4 py-3 font-medium">VITAL</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setSelectedActor(p)}>
                      <td className="px-4 py-3 font-medium text-foreground">{p.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.cedula}</td>
                      <td className="px-4 py-3">{p.comunidad}</td>
                      <td className="px-4 py-3">{p.parcelas}</td>
                      <td className="px-4 py-3">{p.hectareas}</td>
                      {hasModule(modules, 'eudr') && <td className="px-4 py-3">{eudrBadge(p.estadoEUDR)}</td>}
                      {hasModule(modules, 'vital') && <td className={`px-4 py-3 font-bold ${vitalColor(p.puntajeVITAL)}`}>{p.puntajeVITAL}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actor Detail Dialog */}
      <Dialog open={!!selectedActor} onOpenChange={(o) => !o && setSelectedActor(null)}>
        {selectedActor && <ActorDetail actor={selectedActor} modules={modules} onClose={() => setSelectedActor(null)} />}
      </Dialog>
    </div>
  );
}
