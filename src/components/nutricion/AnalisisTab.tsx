import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { applyOrgFilter, applyLegacyOrgFilter, orgWriteFields } from '@/lib/orgFilter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Droplets, Leaf, Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Parcela { id: string; nombre: string; }

interface SueloAnalisis {
  id: string; parcela_id: string; fecha_analisis: string;
  ph: number | null; mo_pct: number | null; p_ppm: number | null;
  k_cmol: number | null; ca_cmol: number | null; mg_cmol: number | null;
  s_ppm: number | null; cice: number | null; textura: string | null;
  al_cmol: number | null;
}

interface HojaAnalisis {
  id: string; parcela_id: string; fecha_muestreo: string;
  n_pct: number | null; p_pct: number | null; k_pct: number | null;
  ca_pct: number | null; mg_pct: number | null; s_pct: number | null;
  fe_ppm: number | null; mn_ppm: number | null; zn_ppm: number | null;
  b_ppm: number | null; cu_ppm: number | null;
  laboratorio: string | null; notas: string | null;
}

export default function AnalisisTab() {
  const { organizationId } = useOrgContext();
  const queryClient = useQueryClient();
  const [showSueloForm, setShowSueloForm] = useState(false);
  const [showHojaForm, setShowHojaForm] = useState(false);
  const [selectedParcela, setSelectedParcela] = useState<string>('');

  // Fetch parcelas (legacy cooperativa_id)
  const { data: parcelas } = useQuery({
    queryKey: ['parcelas_for_nutricion', organizationId],
    queryFn: async () => {
      let q = supabase.from('parcelas').select('id, nombre');
      q = applyLegacyOrgFilter(q, organizationId);
      const { data, error } = await q.order('nombre');
      if (error) throw error;
      return (data ?? []) as Parcela[];
    },
    enabled: !!organizationId,
  });

  // Fetch suelo analyses (real table: nutricion_analisis_suelo)
  const { data: sueloList, isLoading: loadingSuelo } = useQuery({
    queryKey: ['nutricion_analisis_suelo', organizationId, selectedParcela],
    queryFn: async () => {
      let q = supabase.from('nutricion_analisis_suelo').select('*');
      q = applyOrgFilter(q, organizationId);
      if (selectedParcela && selectedParcela !== 'all') q = q.eq('parcela_id', selectedParcela);
      const { data, error } = await q.order('fecha_analisis', { ascending: false }).limit(20);
      if (error) throw error;
      // Map real DB column names to interface
      return (data ?? []).map((r: any) => ({
        id: r.id,
        parcela_id: r.parcela_id,
        fecha_analisis: r.fecha_analisis,
        ph: r.ph_agua ?? r.ph ?? null,
        mo_pct: r.materia_organica_pct ?? r.mo_pct ?? null,
        p_ppm: r.p_disponible ?? r.p_ppm ?? null,
        k_cmol: r.k_intercambiable ?? r.k_cmol ?? null,
        ca_cmol: r.ca_intercambiable ?? r.ca_cmol ?? null,
        mg_cmol: r.mg_intercambiable ?? r.mg_cmol ?? null,
        s_ppm: r.s_ppm ?? null,
        cice: r.cice ?? null,
        textura: r.textura ?? null,
        al_cmol: r.aluminio_intercambiable ?? r.al_cmol ?? null,
      })) as SueloAnalisis[];
    },
    enabled: !!organizationId,
  });

  // Fetch hoja analyses (nutricion_analisis_foliar)
  const { data: hojaList, isLoading: loadingHoja } = useQuery({
    queryKey: ['nutricion_analisis_foliar', organizationId, selectedParcela],
    queryFn: async () => {
      let q = supabase
        .from('nutricion_analisis_foliar' as any)
        .select('*')
        .eq('organization_id', organizationId!);
      if (selectedParcela && selectedParcela !== 'all') q = q.eq('parcela_id', selectedParcela);
      const { data, error } = await q.order('fecha_muestreo', { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as HojaAnalisis[];
    },
    enabled: !!organizationId,
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Label className="text-xs text-muted-foreground">Filtrar por parcela</Label>
          <Select value={selectedParcela} onValueChange={setSelectedParcela}>
            <SelectTrigger><SelectValue placeholder="Todas las parcelas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {parcelas?.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre || p.id.slice(0, 8)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 ml-auto">
          <Dialog open={showSueloForm} onOpenChange={setShowSueloForm}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Análisis de Suelo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nuevo Análisis de Suelo</DialogTitle></DialogHeader>
              <SueloForm
                parcelas={parcelas ?? []}
                organizationId={organizationId}
                onSuccess={() => {
                  setShowSueloForm(false);
                  queryClient.invalidateQueries({ queryKey: ['nutricion_analisis_suelo'] });
                  queryClient.invalidateQueries({ queryKey: ['nutricion_suelo_estado'] });
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showHojaForm} onOpenChange={setShowHojaForm}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Análisis Foliar</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nuevo Análisis Foliar</DialogTitle></DialogHeader>
              <HojaForm
                parcelas={parcelas ?? []}
                organizationId={organizationId}
                onSuccess={() => {
                  setShowHojaForm(false);
                  queryClient.invalidateQueries({ queryKey: ['nutricion_analisis_foliar'] });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sub-tabs: Suelo / Foliar */}
      <Tabs defaultValue="suelo">
        <TabsList>
          <TabsTrigger value="suelo"><Droplets className="h-4 w-4 mr-1" /> Suelo ({sueloList?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="foliar"><Leaf className="h-4 w-4 mr-1" /> Foliar ({hojaList?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="suelo" className="mt-3">
          {loadingSuelo ? (
            <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : !sueloList?.length ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No hay análisis de suelo registrados.</CardContent></Card>
          ) : (
            <div className="space-y-3 stagger-children">
              {sueloList.map(s => (
                <Card key={s.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{parcelas?.find(p => p.id === s.parcela_id)?.nombre ?? s.parcela_id.slice(0, 8)}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(s.fecha_analisis).toLocaleDateString('es')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 text-xs">
                      <Metric label="pH" value={s.ph} />
                      <Metric label="MO %" value={s.mo_pct} />
                      <Metric label="P ppm" value={s.p_ppm} />
                      <Metric label="K cmol" value={s.k_cmol} />
                      <Metric label="Ca cmol" value={s.ca_cmol} />
                      <Metric label="Mg cmol" value={s.mg_cmol} />
                      <Metric label="Al cmol" value={s.al_cmol} highlight={s.al_cmol != null && s.al_cmol > 0.3} />
                    </div>
                    {s.textura && <p className="text-xs text-muted-foreground mt-2">Textura: {s.textura}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="foliar" className="mt-3">
          {loadingHoja ? (
            <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : !hojaList?.length ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No hay análisis foliares registrados.</CardContent></Card>
          ) : (
            <div className="space-y-3 stagger-children">
              {hojaList.map(h => (
                <Card key={h.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{parcelas?.find(p => p.id === h.parcela_id)?.nombre ?? h.parcela_id.slice(0, 8)}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(h.fecha_muestreo).toLocaleDateString('es')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                      <Metric label="N %" value={h.n_pct} />
                      <Metric label="P %" value={h.p_pct} />
                      <Metric label="K %" value={h.k_pct} />
                      <Metric label="Ca %" value={h.ca_pct} />
                      <Metric label="Mg %" value={h.mg_pct} />
                    </div>
                    {h.notas && <p className="text-xs text-muted-foreground mt-2">{h.notas}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: number | null; highlight?: boolean }) {
  return (
    <div className={`text-center p-1.5 rounded ${highlight ? 'bg-destructive/10 ring-1 ring-destructive/30' : 'bg-muted/50'}`}>
      <p className="text-muted-foreground">{label}</p>
      <p className={`font-semibold ${highlight ? 'text-destructive' : 'text-foreground'}`}>{value?.toFixed(value < 1 ? 2 : 1) ?? '—'}</p>
    </div>
  );
}

// ── Suelo Form ──
function SueloForm({ parcelas, organizationId, onSuccess }: { parcelas: Parcela[]; organizationId: string | null; onSuccess: () => void }) {
  const [form, setForm] = useState({
    parcela_id: '', fecha_analisis: new Date().toISOString().split('T')[0],
    ph: '', mo_pct: '', p_ppm: '', k_cmol: '', ca_cmol: '', mg_cmol: '', s_ppm: '', cice: '', al_cmol: '', textura: '',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('nutricion_analisis_suelo').insert({
        parcela_id: form.parcela_id,
        fecha_analisis: form.fecha_analisis,
        ph: form.ph ? parseFloat(form.ph) : null,
        mo_pct: form.mo_pct ? parseFloat(form.mo_pct) : null,
        p_ppm: form.p_ppm ? parseFloat(form.p_ppm) : null,
        k_cmol: form.k_cmol ? parseFloat(form.k_cmol) : null,
        ca_cmol: form.ca_cmol ? parseFloat(form.ca_cmol) : null,
        mg_cmol: form.mg_cmol ? parseFloat(form.mg_cmol) : null,
        s_ppm: form.s_ppm ? parseFloat(form.s_ppm) : null,
        cice: form.cice ? parseFloat(form.cice) : null,
        al_cmol: form.al_cmol ? parseFloat(form.al_cmol) : null,
        textura: form.textura || null,
        ...orgWriteFields(organizationId),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Análisis de suelo registrado'); onSuccess(); },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div>
        <Label>Parcela *</Label>
        <Select value={form.parcela_id} onValueChange={v => set('parcela_id', v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar parcela" /></SelectTrigger>
          <SelectContent>
            {parcelas.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre || p.id.slice(0, 8)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Fecha análisis *</Label>
        <Input type="date" value={form.fecha_analisis} onChange={e => set('fecha_analisis', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>pH</Label><Input type="number" step="0.1" value={form.ph} onChange={e => set('ph', e.target.value)} placeholder="5.2" /></div>
        <div><Label>MO %</Label><Input type="number" step="0.1" value={form.mo_pct} onChange={e => set('mo_pct', e.target.value)} placeholder="4.5" /></div>
        <div><Label>P (ppm)</Label><Input type="number" step="0.1" value={form.p_ppm} onChange={e => set('p_ppm', e.target.value)} /></div>
        <div><Label>K (cmol/L)</Label><Input type="number" step="0.01" value={form.k_cmol} onChange={e => set('k_cmol', e.target.value)} /></div>
        <div><Label>Ca (cmol/L)</Label><Input type="number" step="0.01" value={form.ca_cmol} onChange={e => set('ca_cmol', e.target.value)} /></div>
        <div><Label>Mg (cmol/L)</Label><Input type="number" step="0.01" value={form.mg_cmol} onChange={e => set('mg_cmol', e.target.value)} /></div>
        <div><Label>S (ppm)</Label><Input type="number" step="0.1" value={form.s_ppm} onChange={e => set('s_ppm', e.target.value)} /></div>
        <div><Label>CICE</Label><Input type="number" step="0.1" value={form.cice} onChange={e => set('cice', e.target.value)} /></div>
        <div><Label>Al (cmol)</Label><Input type="number" step="0.01" value={form.al_cmol} onChange={e => set('al_cmol', e.target.value)} placeholder="0.30" /></div>
        <div className="flex items-end"><p className="text-[10px] text-muted-foreground pb-2">Al intercambiable — clave para cálculo de encalado Kamprath</p></div>
      </div>
      <div>
        <Label>Textura</Label>
        <Select value={form.textura} onValueChange={v => set('textura', v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar textura" /></SelectTrigger>
          <SelectContent>
            {['Arcilloso', 'Franco', 'Franco-arcilloso', 'Franco-arenoso', 'Arenoso'].map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!form.parcela_id || mutation.isPending} className="w-full">
        {mutation.isPending ? 'Guardando…' : 'Registrar Análisis de Suelo'}
      </Button>
    </div>
  );
}

// ── Hoja Form ──
function HojaForm({ parcelas, organizationId, onSuccess }: { parcelas: Parcela[]; organizationId: string | null; onSuccess: () => void }) {
  const [form, setForm] = useState({
    parcela_id: '', fecha_muestreo: new Date().toISOString().split('T')[0],
    n_pct: '', p_pct: '', k_pct: '', ca_pct: '', mg_pct: '', s_pct: '',
    fe_ppm: '', mn_ppm: '', zn_ppm: '', b_ppm: '', cu_ppm: '',
    laboratorio: '', notas: '',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('nutricion_analisis_foliar' as any).insert({
        parcela_id: form.parcela_id,
        fecha_muestreo: form.fecha_muestreo,
        n_pct: form.n_pct ? parseFloat(form.n_pct) : null,
        p_pct: form.p_pct ? parseFloat(form.p_pct) : null,
        k_pct: form.k_pct ? parseFloat(form.k_pct) : null,
        ca_pct: form.ca_pct ? parseFloat(form.ca_pct) : null,
        mg_pct: form.mg_pct ? parseFloat(form.mg_pct) : null,
        s_pct: form.s_pct ? parseFloat(form.s_pct) : null,
        fe_ppm: form.fe_ppm ? parseFloat(form.fe_ppm) : null,
        mn_ppm: form.mn_ppm ? parseFloat(form.mn_ppm) : null,
        zn_ppm: form.zn_ppm ? parseFloat(form.zn_ppm) : null,
        b_ppm: form.b_ppm ? parseFloat(form.b_ppm) : null,
        cu_ppm: form.cu_ppm ? parseFloat(form.cu_ppm) : null,
        laboratorio: form.laboratorio || null,
        notas: form.notas || null,
        ...orgWriteFields(organizationId),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Análisis foliar registrado'); onSuccess(); },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div>
        <Label>Parcela *</Label>
        <Select value={form.parcela_id} onValueChange={v => set('parcela_id', v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar parcela" /></SelectTrigger>
          <SelectContent>
            {parcelas.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre || p.id.slice(0, 8)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Fecha análisis *</Label>
        <Input type="date" value={form.fecha_muestreo} onChange={e => set('fecha_muestreo', e.target.value)} />
      </div>
      <p className="text-xs font-medium text-muted-foreground">Macronutrientes (%)</p>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>N</Label><Input type="number" step="0.01" value={form.n_pct} onChange={e => set('n_pct', e.target.value)} /></div>
        <div><Label>P</Label><Input type="number" step="0.01" value={form.p_pct} onChange={e => set('p_pct', e.target.value)} /></div>
        <div><Label>K</Label><Input type="number" step="0.01" value={form.k_pct} onChange={e => set('k_pct', e.target.value)} /></div>
        <div><Label>Ca</Label><Input type="number" step="0.01" value={form.ca_pct} onChange={e => set('ca_pct', e.target.value)} /></div>
        <div><Label>Mg</Label><Input type="number" step="0.01" value={form.mg_pct} onChange={e => set('mg_pct', e.target.value)} /></div>
        <div><Label>S</Label><Input type="number" step="0.01" value={form.s_pct} onChange={e => set('s_pct', e.target.value)} /></div>
      </div>
      <p className="text-xs font-medium text-muted-foreground">Micronutrientes (ppm)</p>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Fe</Label><Input type="number" step="0.1" value={form.fe_ppm} onChange={e => set('fe_ppm', e.target.value)} /></div>
        <div><Label>Mn</Label><Input type="number" step="0.1" value={form.mn_ppm} onChange={e => set('mn_ppm', e.target.value)} /></div>
        <div><Label>Zn</Label><Input type="number" step="0.1" value={form.zn_ppm} onChange={e => set('zn_ppm', e.target.value)} /></div>
        <div><Label>B</Label><Input type="number" step="0.1" value={form.b_ppm} onChange={e => set('b_ppm', e.target.value)} /></div>
        <div><Label>Cu</Label><Input type="number" step="0.1" value={form.cu_ppm} onChange={e => set('cu_ppm', e.target.value)} /></div>
      </div>
      <div>
        <Label>Laboratorio</Label>
        <Input value={form.laboratorio} onChange={e => set('laboratorio', e.target.value)} placeholder="Nombre del laboratorio" />
      </div>
      <div>
        <Label>Notas</Label>
        <Textarea value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Observaciones del análisis..." />
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!form.parcela_id || mutation.isPending} className="w-full">
        {mutation.isPending ? 'Guardando…' : 'Registrar Análisis Foliar'}
      </Button>
    </div>
  );
}
