import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, Sprout, Bug, TrendingUp, Shield, FolderOpen, ArrowRight, ChevronLeft } from 'lucide-react';

// Demo data for a sample parcel
const parcelData = {
  nombre: 'Lote El Cedro',
  productor: 'María Solano',
  organizacion: 'Cooperativa Montes Verdes',
  variedad: 'Caturra',
  area: '4.2 ha',
  altitud: '1,450 msnm',
  estado: 'Activa',
  edad: '8 años',
  ultimoAnalisis: '2026-01-15',
  planNutricional: 'Vigente',
  ejecucionPlan: '65%',
  rendimientoObjetivo: '32 qq/ha',
  costoEstimado: '₡ 2,450,000',
  riesgoGuard: 'Medio',
  ultimaEstimacion: '28.5 qq/ha',
  scoreVital: 72,
};

export default function ParcelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const p = parcelData;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2 gap-1" onClick={() => navigate('/produccion/parcelas')}>
          <ChevronLeft className="h-4 w-4" />
          Parcelas
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{p.nombre}</h1>
            <p className="text-sm text-muted-foreground">{p.productor} · {p.organizacion}</p>
          </div>
          <Badge variant="default">{p.estado}</Badge>
        </div>
      </div>

      {/* Quick info */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
        {[
          { label: 'Variedad', value: p.variedad },
          { label: 'Área', value: p.area },
          { label: 'Altitud', value: p.altitud },
          { label: 'Edad', value: p.edad },
          { label: 'Rendimiento objetivo', value: p.rendimientoObjetivo },
          { label: 'Score VITAL', value: String(p.scoreVital) },
        ].map(f => (
          <div key={f.label} className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">{f.label}</p>
            <p className="font-medium text-sm mt-0.5">{f.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs: connected modules */}
      <Tabs defaultValue="resumen">
        <TabsList className="flex-wrap">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="produccion">Producción</TabsTrigger>
          <TabsTrigger value="nutricion">Nutrición</TabsTrigger>
          <TabsTrigger value="guard">Nova Guard</TabsTrigger>
          <TabsTrigger value="yield">Nova Yield</TabsTrigger>
          <TabsTrigger value="vital">Protocolo VITAL</TabsTrigger>
          <TabsTrigger value="evidencias">Evidencias</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Estado general</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Último análisis de suelo</span><span>{p.ultimoAnalisis}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plan nutricional</span><Badge variant="default" className="text-xs">{p.planNutricional}</Badge></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ejecución del plan</span><span>{p.ejecucionPlan}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Costo estimado</span><span>{p.costoEstimado}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Señales activas</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded bg-warning/10 border border-warning/20"><Bug className="h-4 w-4 text-warning" /><span className="text-sm">Riesgo fitosanitario: {p.riesgoGuard}</span></div>
                <div className="flex items-center gap-2 p-2 rounded bg-primary/10 border border-primary/20"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-sm">Última estimación: {p.ultimaEstimacion}</span></div>
                <div className="flex items-center gap-2 p-2 rounded bg-accent/10 border border-accent/20"><Shield className="h-4 w-4 text-accent" /><span className="text-sm">Score VITAL: {p.scoreVital}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="produccion" className="mt-4">
          <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Historial de entregas, rendimientos y actividad productiva de esta parcela.</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="nutricion" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Estado nutricional</CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/agronomia/nutricion')}>
                  Abrir módulo Nutrición <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Último análisis</span><span>{p.ultimoAnalisis}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plan</span><Badge variant="default" className="text-xs">{p.planNutricional}</Badge></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ejecución</span><span>{p.ejecucionPlan}</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guard" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Diagnóstico fitosanitario</CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/agronomia/guard')}>
                  Abrir Nova Guard <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <Bug className="h-4 w-4 text-warning" />
                <div>
                  <p className="text-sm font-medium">Riesgo: {p.riesgoGuard}</p>
                  <p className="text-xs text-muted-foreground">Último diagnóstico: presencia leve de roya</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yield" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Estimación de cosecha</CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/agronomia/yield')}>
                  Abrir Nova Yield <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-center"><p className="text-2xl font-bold text-primary">{p.ultimaEstimacion}</p><p className="text-xs text-muted-foreground">Última estimación</p></div>
                <div className="text-center"><p className="text-lg font-medium">{p.rendimientoObjetivo}</p><p className="text-xs text-muted-foreground">Objetivo</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vital" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Protocolo VITAL</CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/resiliencia/vital')}>
                  Abrir VITAL <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-center"><p className={`text-3xl font-bold ${p.scoreVital >= 70 ? 'text-primary' : p.scoreVital >= 50 ? 'text-warning' : 'text-destructive'}`}>{p.scoreVital}</p><p className="text-xs text-muted-foreground">Score VITAL</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidencias" className="mt-4">
          <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Estudios de suelo, fotografías, PDFs y evidencia documental de esta parcela.</p></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
