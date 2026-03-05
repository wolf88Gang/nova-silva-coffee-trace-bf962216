import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useOrgContext } from '@/hooks/useOrgContext';
import { hasModule, type OrgModule } from '@/lib/org-modules';
import {
  getActorsLabel, getActorLabel, getNewActorLabel, getActorsEmptyState,
} from '@/lib/org-terminology';
import { DEMO_PRODUCTORES, DEMO_ENTREGAS, DEMO_CREDITOS, type DemoProductor } from '@/lib/demo-data';
import { Search, Plus, Download, Users, MapPin, FileText, CreditCard, Leaf, Package, Mountain, Sprout, Calendar, DollarSign, Shield, AlertTriangle } from 'lucide-react';

// ── Demo Parcelas (same data as ParcelasHub) ──
interface DemoParcela {
  id: string; nombre: string; productorId: string; area: number; variedad: string; altitud: number; estadoEUDR: 'compliant' | 'pending' | 'non-compliant'; comunidad: string;
}
const DEMO_PARCELAS: DemoParcela[] = [
  { id: '1', nombre: 'El Mirador', productorId: '1', area: 2.0, variedad: 'Caturra', altitud: 1450, estadoEUDR: 'compliant', comunidad: 'San Miguel' },
  { id: '2', nombre: 'La Esperanza', productorId: '1', area: 1.5, variedad: 'Bourbon', altitud: 1380, estadoEUDR: 'compliant', comunidad: 'San Miguel' },
  { id: '3', nombre: 'Cerro Verde', productorId: '2', area: 3.2, variedad: 'Catuaí', altitud: 1520, estadoEUDR: 'compliant', comunidad: 'El Progreso' },
  { id: '4', nombre: 'Las Nubes', productorId: '3', area: 1.8, variedad: 'Caturra', altitud: 1400, estadoEUDR: 'pending', comunidad: 'Las Flores' },
  { id: '5', nombre: 'San José', productorId: '4', area: 3.0, variedad: 'Bourbon', altitud: 1500, estadoEUDR: 'compliant', comunidad: 'San Miguel' },
  { id: '6', nombre: 'El Cafetal', productorId: '5', area: 2.5, variedad: 'Catuaí', altitud: 1350, estadoEUDR: 'non-compliant', comunidad: 'El Progreso' },
  { id: '7', nombre: 'Cerro Alto', productorId: '4', area: 1.8, variedad: 'Caturra', altitud: 1600, estadoEUDR: 'compliant', comunidad: 'San Miguel' },
  { id: '8', nombre: 'El Bosque', productorId: '6', area: 2.2, variedad: 'Bourbon', altitud: 1480, estadoEUDR: 'compliant', comunidad: 'Las Flores' },
];

// ── Demo Documents ──
interface DemoDocumento {
  id: string; productorId: string; nombre: string; tipo: string; fecha: string; estado: 'vigente' | 'vencido' | 'pendiente';
}
const DEMO_DOCUMENTOS: DemoDocumento[] = [
  { id: '1', productorId: '1', nombre: 'Cédula de identidad', tipo: 'Identificación', fecha: '2025-01-15', estado: 'vigente' },
  { id: '2', productorId: '1', nombre: 'Escritura parcela El Mirador', tipo: 'Propiedad', fecha: '2024-06-10', estado: 'vigente' },
  { id: '3', productorId: '1', nombre: 'Certificado orgánico', tipo: 'Certificación', fecha: '2025-12-01', estado: 'vigente' },
  { id: '4', productorId: '2', nombre: 'Cédula de identidad', tipo: 'Identificación', fecha: '2024-03-20', estado: 'vigente' },
  { id: '5', productorId: '2', nombre: 'Constancia de membresía', tipo: 'Cooperativa', fecha: '2025-08-15', estado: 'vigente' },
  { id: '6', productorId: '3', nombre: 'Cédula de identidad', tipo: 'Identificación', fecha: '2023-11-05', estado: 'vigente' },
  { id: '7', productorId: '3', nombre: 'Certificado EUDR pendiente', tipo: 'EUDR', fecha: '2026-01-10', estado: 'pendiente' },
  { id: '8', productorId: '4', nombre: 'Cédula de identidad', tipo: 'Identificación', fecha: '2024-09-01', estado: 'vigente' },
  { id: '9', productorId: '4', nombre: 'Certificado Rainforest Alliance', tipo: 'Certificación', fecha: '2026-01-20', estado: 'vigente' },
  { id: '10', productorId: '5', nombre: 'Documento vencido', tipo: 'Identificación', fecha: '2023-06-01', estado: 'vencido' },
];

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

// ── Actor Detail Panel (fully wired) ──

const eudrBadgeSmall = (s: string) => {
  if (s === 'compliant') return <Badge variant="default" className="text-[10px]">Cumple</Badge>;
  if (s === 'pending') return <Badge variant="secondary" className="text-[10px]">Pendiente</Badge>;
  return <Badge variant="destructive" className="text-[10px]">No cumple</Badge>;
};

const payBadge = (s: string) => {
  if (s === 'pagado') return <Badge variant="default" className="text-[10px]">Pagado</Badge>;
  if (s === 'parcial') return <Badge variant="secondary" className="text-[10px]">Parcial</Badge>;
  return <Badge variant="destructive" className="text-[10px]">Pendiente</Badge>;
};

const docBadge = (s: string) => {
  if (s === 'vigente') return <Badge variant="default" className="text-[10px]">Vigente</Badge>;
  if (s === 'vencido') return <Badge variant="destructive" className="text-[10px]">Vencido</Badge>;
  return <Badge variant="secondary" className="text-[10px]">Pendiente</Badge>;
};

const creditBadge = (s: string) => {
  if (s === 'activo') return <Badge variant="default" className="text-[10px]">Activo</Badge>;
  if (s === 'pagado') return <Badge className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Pagado</Badge>;
  return <Badge variant="destructive" className="text-[10px]">Vencido</Badge>;
};

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

  // Filter data for this actor
  const actorParcelas = DEMO_PARCELAS.filter(p => p.productorId === actor.id);
  const actorEntregas = DEMO_ENTREGAS.filter(e => e.productorNombre === actor.nombre);
  const actorDocumentos = DEMO_DOCUMENTOS.filter(d => d.productorId === actor.id);
  const actorCreditos = DEMO_CREDITOS.filter(c => c.productorNombre === actor.nombre);
  const totalArea = actorParcelas.reduce((s, p) => s + p.area, 0);
  const totalEntregasKg = actorEntregas.reduce((s, e) => s + e.pesoKg, 0);

  // VITAL dimensions mock
  const vitalDimensions = [
    { name: 'Agua', score: Math.min(100, actor.puntajeVITAL + 5) },
    { name: 'Suelo', score: Math.min(100, actor.puntajeVITAL - 3) },
    { name: 'Biodiversidad', score: Math.min(100, actor.puntajeVITAL + 8) },
    { name: 'Económico', score: Math.max(0, actor.puntajeVITAL - 10) },
    { name: 'Social', score: Math.min(100, actor.puntajeVITAL + 2) },
    { name: 'Clima', score: Math.max(0, actor.puntajeVITAL - 5) },
  ];

  return (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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

        {/* ── RESUMEN ── */}
        <TabsContent value="resumen" className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Documento:</span> {actor.cedula}</div>
            <div><span className="text-muted-foreground">Comunidad:</span> {actor.comunidad}</div>
            <div><span className="text-muted-foreground">Parcelas:</span> {actor.parcelas}</div>
            <div><span className="text-muted-foreground">Hectáreas:</span> {actor.hectareas}</div>
            {actor.ultimaEntrega && <div><span className="text-muted-foreground">Última entrega:</span> {actor.ultimaEntrega}</div>}
            {hasModule(modules, 'vital') && (
              <div><span className="text-muted-foreground">VITAL:</span> <span className={`font-bold ${vitalColor(actor.puntajeVITAL)}`}>{actor.puntajeVITAL}</span></div>
            )}
            {hasModule(modules, 'eudr') && (
              <div><span className="text-muted-foreground">EUDR:</span> {eudrBadge(actor.estadoEUDR)}</div>
            )}
          </div>
          {/* Quick summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{actorParcelas.length}</p><p className="text-[11px] text-muted-foreground">Parcelas</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{actorEntregas.length}</p><p className="text-[11px] text-muted-foreground">Entregas</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{actorCreditos.filter(c => c.estado === 'activo').length}</p><p className="text-[11px] text-muted-foreground">Créditos activos</p></CardContent></Card>
          </div>
        </TabsContent>

        {/* ── PARCELAS ── */}
        <TabsContent value="parcelas" className="pt-2">
          {actorParcelas.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              No tiene parcelas registradas.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{actorParcelas.length} parcelas · {totalArea.toFixed(1)} ha totales</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground text-left">
                    <th className="px-3 py-2 font-medium">Parcela</th>
                    <th className="px-3 py-2 font-medium">Área</th>
                    <th className="px-3 py-2 font-medium">Variedad</th>
                    <th className="px-3 py-2 font-medium">Altitud</th>
                    {hasModule(modules, 'eudr') && <th className="px-3 py-2 font-medium">EUDR</th>}
                  </tr></thead>
                  <tbody>
                    {actorParcelas.map(p => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-3 py-2 font-medium text-foreground">{p.nombre}</td>
                        <td className="px-3 py-2">{p.area} ha</td>
                        <td className="px-3 py-2">{p.variedad}</td>
                        <td className="px-3 py-2">{p.altitud} msnm</td>
                        {hasModule(modules, 'eudr') && <td className="px-3 py-2">{eudrBadgeSmall(p.estadoEUDR)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── ENTREGAS ── */}
        <TabsContent value="entregas" className="pt-2">
          {actorEntregas.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              No tiene entregas registradas.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{actorEntregas.length} entregas · {totalEntregasKg.toLocaleString()} kg totales</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground text-left">
                    <th className="px-3 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 font-medium">Peso</th>
                    <th className="px-3 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 font-medium">Precio/kg</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                  </tr></thead>
                  <tbody>
                    {actorEntregas.map(e => (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-3 py-2 text-foreground">{e.fecha}</td>
                        <td className="px-3 py-2 font-medium">{e.pesoKg} kg</td>
                        <td className="px-3 py-2">{e.tipoCafe}</td>
                        <td className="px-3 py-2">Q {e.precioUnitario.toLocaleString()}</td>
                        <td className="px-3 py-2">{payBadge(e.estadoPago)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── DOCUMENTOS ── */}
        <TabsContent value="documentos" className="pt-2">
          {actorDocumentos.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              No tiene documentos registrados.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{actorDocumentos.length} documentos</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground text-left">
                    <th className="px-3 py-2 font-medium">Documento</th>
                    <th className="px-3 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                  </tr></thead>
                  <tbody>
                    {actorDocumentos.map(d => (
                      <tr key={d.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-3 py-2 font-medium text-foreground">{d.nombre}</td>
                        <td className="px-3 py-2">{d.tipo}</td>
                        <td className="px-3 py-2">{d.fecha}</td>
                        <td className="px-3 py-2">{docBadge(d.estado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── CRÉDITOS ── */}
        <TabsContent value="creditos" className="pt-2">
          {actorCreditos.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              No tiene créditos registrados.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{actorCreditos.length} créditos · Saldo total: Q {actorCreditos.reduce((s, c) => s + c.saldo, 0).toLocaleString()}</p>
              {actorCreditos.map(c => (
                <Card key={c.id}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{c.tipo}</span>
                      {creditBadge(c.estado)}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>Monto: <span className="text-foreground font-medium">Q {c.monto.toLocaleString()}</span></div>
                      <div>Saldo: <span className="text-foreground font-medium">Q {c.saldo.toLocaleString()}</span></div>
                      <div>Vence: <span className="text-foreground">{c.fechaVencimiento}</span></div>
                    </div>
                    <Progress value={((c.monto - c.saldo) / c.monto) * 100} className="h-1.5" />
                    <p className="text-[11px] text-muted-foreground text-right">{Math.round(((c.monto - c.saldo) / c.monto) * 100)}% pagado</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── VITAL ── */}
        <TabsContent value="vital" className="pt-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-bold ${vitalColor(actor.puntajeVITAL)}`}>{actor.puntajeVITAL}</div>
              <div>
                <p className="text-sm font-medium">Score VITAL</p>
                <p className="text-xs text-muted-foreground">
                  {actor.puntajeVITAL >= 81 ? 'Ejemplar' : actor.puntajeVITAL >= 61 ? 'Sostenible' : actor.puntajeVITAL >= 41 ? 'En desarrollo' : 'Crítico'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {vitalDimensions.map(d => (
                <div key={d.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className={`font-medium ${vitalColor(d.score)}`}>{d.score}</span>
                  </div>
                  <Progress value={d.score} className="h-1.5" />
                </div>
              ))}
            </div>
            {actor.puntajeVITAL < 60 && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-destructive">Atención requerida</p>
                      <p className="text-muted-foreground mt-1">Este productor necesita acompañamiento técnico para mejorar su puntaje en las dimensiones económica y clima.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
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
