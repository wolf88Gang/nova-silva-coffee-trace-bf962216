import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sprout, Mountain, Leaf, Shield, BookOpen, AlertTriangle } from 'lucide-react';

/* ── Generic fetch for catalog tables ── */
function useCatalog<T>(table: string) {
  return useQuery({
    queryKey: ['ag_catalog', table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

/* ── Types ── */
interface Variedad {
  id: string; nombre_comun: string; grupo_morfologico: string;
  factor_demanda_base: number; micros_multiplier: number;
  limite_yield_sostenible_kg_ha: number | null;
  sens_exceso_n: string; sens_deficit_k: string;
  tolerancia_sequia: string; tolerancia_calor: string;
  activo: boolean;
}
interface ReglaSuelo {
  id: string; ruleset_version: string; variable: string; operador: string;
  umbral_min: number | null; umbral_max: number | null;
  accion_tipo: string; accion_objetivo: string; accion_valor: number | null;
  severidad: string; mensaje: string | null; explain_code: string; activo: boolean;
}
interface ParamFenologico {
  id: string; fase: string; dias_post_floracion_min: number | null;
  dias_post_floracion_max: number | null; gda_min: number | null; gda_max: number | null;
  nutrientes_clave: string[] | null; proporcion_pct: number | null;
  zona_altitudinal: string | null;
}
interface ParamAltitud {
  id: string; zona: string; altitud_min: number; altitud_max: number;
  shift_cronograma_dias: number; factor_eficiencia_n: number; notas: string | null;
}
interface RulesetVersion {
  id: string; version: string; descripcion: string | null; activo: boolean;
}

const GRUPO_COLORS: Record<string, string> = {
  compacto: 'bg-primary/10 text-primary border-primary/20',
  alto: 'bg-accent/10 text-accent-foreground border-accent/20',
  compuesto: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
  exotico: 'bg-warning/10 text-warning border-warning/20',
  f1: 'bg-success/10 text-success border-success/20',
};

const SEVERIDAD_COLORS: Record<string, string> = {
  roja: 'bg-destructive/10 text-destructive',
  naranja: 'bg-warning/10 text-warning',
  amarilla: 'bg-yellow-500/10 text-yellow-600',
  verde: 'bg-success/10 text-success',
};

const FASE_LABELS: Record<string, string> = {
  cabeza_alfiler: 'Cabeza de alfiler',
  expansion_rapida: 'Expansión rápida',
  llenado_grano: 'Llenado de grano',
  maduracion: 'Maduración',
};

function LoadingSkeleton() {
  return <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card><CardContent className="p-6 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </CardContent></Card>
  );
}

/* ── Variedades Tab ── */
function VariedadesTab() {
  const { data, isLoading, error } = useCatalog<Variedad>('ag_variedades');
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorCard message="Error cargando variedades" />;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Variedad</TableHead>
            <TableHead>Grupo</TableHead>
            <TableHead className="text-right">Factor Demanda</TableHead>
            <TableHead className="text-right">Micros ×</TableHead>
            <TableHead className="text-right">Yield Máx</TableHead>
            <TableHead>Exc. N</TableHead>
            <TableHead>Déf. K</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map(v => (
            <TableRow key={v.id}>
              <TableCell className="font-medium">{v.nombre_comun}</TableCell>
              <TableCell>
                <Badge variant="outline" className={GRUPO_COLORS[v.grupo_morfologico] ?? ''}>
                  {v.grupo_morfologico}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono">{v.factor_demanda_base.toFixed(2)}</TableCell>
              <TableCell className="text-right font-mono">{v.micros_multiplier.toFixed(2)}</TableCell>
              <TableCell className="text-right">{v.limite_yield_sostenible_kg_ha ?? '—'}</TableCell>
              <TableCell><SensBadge value={v.sens_exceso_n} /></TableCell>
              <TableCell><SensBadge value={v.sens_deficit_k} /></TableCell>
              <TableCell>
                <Badge variant={v.activo ? 'default' : 'secondary'}>
                  {v.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground mt-2">{data?.length ?? 0} variedades registradas</p>
    </div>
  );
}

function SensBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    baja: 'bg-success/10 text-success',
    media: 'bg-warning/10 text-warning',
    alta: 'bg-destructive/10 text-destructive',
  };
  return <Badge variant="outline" className={colors[value] ?? ''}>{value}</Badge>;
}

/* ── Reglas de Suelo Tab ── */
function ReglasTab() {
  const { data, isLoading, error } = useCatalog<ReglaSuelo>('ag_reglas_suelo');
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorCard message="Error cargando reglas de suelo" />;

  const grouped = (data ?? []).reduce<Record<string, ReglaSuelo[]>>((acc, r) => {
    (acc[r.variable] = acc[r.variable] || []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([variable, rules]) => (
        <Card key={variable}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              {variable}
              <Badge variant="outline" className="ml-auto">{rules.length} reglas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {rules.map(r => (
                <div key={r.id} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/30">
                  <Badge variant="outline" className={SEVERIDAD_COLORS[r.severidad] ?? ''}>
                    {r.severidad}
                  </Badge>
                  <span className="font-mono text-muted-foreground">
                    {r.operador} {r.umbral_min != null && r.umbral_min !== -999999 ? r.umbral_min : ''}{r.umbral_max != null ? `–${r.umbral_max}` : ''}
                  </span>
                  <span className="text-foreground">→ {r.accion_tipo}: {r.accion_objetivo}</span>
                  {r.accion_valor != null && <span className="font-mono">({r.accion_valor})</span>}
                  <code className="ml-auto text-muted-foreground/70">{r.explain_code}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      <p className="text-xs text-muted-foreground">{data?.length ?? 0} reglas en total</p>
    </div>
  );
}

/* ── Parámetros Fenológicos Tab ── */
function FenologicosTab() {
  const { data, isLoading, error } = useCatalog<ParamFenologico>('ag_parametros_fenologicos');
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorCard message="Error cargando parámetros fenológicos" />;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fase</TableHead>
            <TableHead>Zona</TableHead>
            <TableHead className="text-right">DPF Min</TableHead>
            <TableHead className="text-right">DPF Max</TableHead>
            <TableHead className="text-right">GDA Min</TableHead>
            <TableHead className="text-right">GDA Max</TableHead>
            <TableHead className="text-right">Proporción %</TableHead>
            <TableHead>Nutrientes Clave</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map(p => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{FASE_LABELS[p.fase] ?? p.fase}</TableCell>
              <TableCell><Badge variant="outline">{p.zona_altitudinal ?? 'general'}</Badge></TableCell>
              <TableCell className="text-right font-mono">{p.dias_post_floracion_min ?? '—'}</TableCell>
              <TableCell className="text-right font-mono">{p.dias_post_floracion_max ?? '—'}</TableCell>
              <TableCell className="text-right font-mono">{p.gda_min ?? '—'}</TableCell>
              <TableCell className="text-right font-mono">{p.gda_max ?? '—'}</TableCell>
              <TableCell className="text-right font-mono">{p.proporcion_pct ?? '—'}%</TableCell>
              <TableCell className="text-xs">{p.nutrientes_clave?.join(', ') ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground mt-2">{data?.length ?? 0} registros</p>
    </div>
  );
}

/* ── Altitud Tab ── */
function AltitudTab() {
  const { data, isLoading, error } = useCatalog<ParamAltitud>('ag_parametros_altitud');
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorCard message="Error cargando parámetros de altitud" />;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {data?.map(z => (
        <Card key={z.id}>
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2">
              <Mountain className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-foreground capitalize">{z.zona}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 rounded bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">Rango</p>
                <p className="font-semibold text-foreground">{z.altitud_min}–{z.altitud_max} msnm</p>
              </div>
              <div className="p-2 rounded bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">Shift Crono</p>
                <p className="font-semibold text-foreground">+{z.shift_cronograma_dias} días</p>
              </div>
              <div className="col-span-2 p-2 rounded bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">Factor Eficiencia N</p>
                <p className="font-semibold text-foreground">×{z.factor_eficiencia_n}</p>
              </div>
            </div>
            {z.notas && <p className="text-xs text-muted-foreground">{z.notas}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Rulesets Tab ── */
function RulesetsTab() {
  const { data, isLoading, error } = useCatalog<RulesetVersion>('ag_ruleset_versions');
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorCard message="Error cargando versiones de ruleset" />;

  return (
    <div className="space-y-2">
      {data?.map(r => (
        <Card key={r.id}>
          <CardContent className="p-4 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">v{r.version}</p>
              <p className="text-sm text-muted-foreground">{r.descripcion ?? 'Sin descripción'}</p>
            </div>
            <Badge variant={r.activo ? 'default' : 'secondary'}>{r.activo ? 'Activo' : 'Inactivo'}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Main Page ── */
export default function AdminCatalogos() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Catálogos de Nutrición</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Variedades, reglas de suelo, parámetros fenológicos y altitudinales del motor de decisión §29
        </p>
      </div>

      <Tabs defaultValue="variedades">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="variedades"><Sprout className="h-4 w-4 mr-1" /> Variedades</TabsTrigger>
          <TabsTrigger value="reglas"><Shield className="h-4 w-4 mr-1" /> Reglas Suelo</TabsTrigger>
          <TabsTrigger value="fenologicos"><Leaf className="h-4 w-4 mr-1" /> Fenológicos</TabsTrigger>
          <TabsTrigger value="altitud"><Mountain className="h-4 w-4 mr-1" /> Altitud</TabsTrigger>
          <TabsTrigger value="rulesets"><BookOpen className="h-4 w-4 mr-1" /> Rulesets</TabsTrigger>
        </TabsList>

        <TabsContent value="variedades" className="mt-4"><VariedadesTab /></TabsContent>
        <TabsContent value="reglas" className="mt-4"><ReglasTab /></TabsContent>
        <TabsContent value="fenologicos" className="mt-4"><FenologicosTab /></TabsContent>
        <TabsContent value="altitud" className="mt-4"><AltitudTab /></TabsContent>
        <TabsContent value="rulesets" className="mt-4"><RulesetsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
