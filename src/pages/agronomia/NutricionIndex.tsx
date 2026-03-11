import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sprout, FileText, ClipboardList, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const parcelas = [
  { nombre: 'Lote El Cedro', productor: 'María Solano', plan: 'Vigente', ejecucion: '65%', ultimoAnalisis: '2026-01-15' },
  { nombre: 'Parcela Norte', productor: 'Carlos Méndez', plan: 'Vencido', ejecucion: '100%', ultimoAnalisis: '2025-08-20' },
  { nombre: 'Lote La Cumbre', productor: 'Ana Jiménez', plan: 'Vigente', ejecucion: '30%', ultimoAnalisis: '2026-02-10' },
  { nombre: 'Parcela Sur', productor: 'José Rodríguez', plan: 'Sin plan', ejecucion: '—', ultimoAnalisis: '2025-05-12' },
];

const planColor: Record<string, string> = { Vigente: 'default', Vencido: 'destructive', 'Sin plan': 'secondary' };

export default function NutricionIndex() {
  return (
    <div className="space-y-6">
      <PageHeader title="Nutrición" description="Análisis de suelo, planes nutricionales y ejecución por parcela" />

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Planes activos', value: '312', icon: Sprout, color: 'text-primary' },
          { label: 'Análisis pendientes', value: '14', icon: FileText, color: 'text-warning' },
          { label: 'Planes por ejecutar', value: '28', icon: ClipboardList, color: 'text-accent' },
          { label: 'Alertas cruzadas', value: '5', icon: AlertTriangle, color: 'text-destructive' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <k.icon className={`h-5 w-5 ${k.color}`} />
                <div>
                  <p className="text-2xl font-bold">{k.value}</p>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="parcelas">
        <TabsList>
          <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
          <TabsTrigger value="analisis">Análisis de suelo</TabsTrigger>
          <TabsTrigger value="planes">Planes</TabsTrigger>
          <TabsTrigger value="ejecucion">Ejecución</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="riesgos">Riesgos</TabsTrigger>
        </TabsList>
        <TabsContent value="parcelas" className="mt-4 space-y-3">
          {parcelas.map((p, i) => (
            <Card key={i} className="cursor-pointer hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground">{p.productor} · Último análisis: {p.ultimoAnalisis}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Ejecución: {p.ejecucion}</span>
                    <Badge variant={planColor[p.plan] as any}>{p.plan}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="analisis" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Análisis de suelo por parcela y laboratorio</CardContent></Card></TabsContent>
        <TabsContent value="planes" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Planes nutricionales vigentes y borradores</CardContent></Card></TabsContent>
        <TabsContent value="ejecucion" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Eventos de ejecución y progreso</CardContent></Card></TabsContent>
        <TabsContent value="historial" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Historial de planes y versiones anteriores</CardContent></Card></TabsContent>
        <TabsContent value="riesgos" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Señales de riesgo cruzadas: clima, Guard, VITAL</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
