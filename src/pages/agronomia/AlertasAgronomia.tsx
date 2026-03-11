import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sprout, Bug, TrendingUp, AlertTriangle } from 'lucide-react';

const alertas = [
  { tipo: 'Nutrición', icon: Sprout, text: 'Plan nutricional vencido en 14 parcelas', severidad: 'Media', fecha: '2026-03-10' },
  { tipo: 'Guard', icon: Bug, text: 'Brote de roya activo en Lote El Cedro', severidad: 'Alta', fecha: '2026-03-08' },
  { tipo: 'Guard', icon: Bug, text: 'Ojo de gallo detectado en Parcela Norte', severidad: 'Media', fecha: '2026-03-05' },
  { tipo: 'Yield', icon: TrendingUp, text: '8 estimaciones pendientes de validación', severidad: 'Baja', fecha: '2026-03-09' },
  { tipo: 'Nutrición', icon: Sprout, text: 'Deficiencia de potasio detectada en zona oeste', severidad: 'Alta', fecha: '2026-03-07' },
];

const sevColor: Record<string, string> = { Alta: 'destructive', Media: 'secondary', Baja: 'outline' };

export default function AlertasAgronomia() {
  return (
    <div className="space-y-6">
      <PageHeader title="Recomendaciones y alertas" description="Vista transversal de alertas agronómicas y recomendaciones accionables" />

      <Tabs defaultValue="todas">
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="nutricion">Nutrición</TabsTrigger>
          <TabsTrigger value="guard">Nova Guard</TabsTrigger>
          <TabsTrigger value="yield">Nova Yield</TabsTrigger>
        </TabsList>
        <TabsContent value="todas" className="mt-4 space-y-2">
          {alertas.map((a, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <a.icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{a.text}</p>
                      <p className="text-xs text-muted-foreground">{a.tipo} · {a.fecha}</p>
                    </div>
                  </div>
                  <Badge variant={sevColor[a.severidad] as any}>{a.severidad}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="nutricion" className="mt-4 space-y-2">
          {alertas.filter(a => a.tipo === 'Nutrición').map((a, i) => (
            <Card key={i}><CardContent className="pt-4"><div className="flex items-center gap-3"><a.icon className="h-4 w-4 text-muted-foreground" /><p className="text-sm">{a.text}</p></div></CardContent></Card>
          ))}
        </TabsContent>
        <TabsContent value="guard" className="mt-4 space-y-2">
          {alertas.filter(a => a.tipo === 'Guard').map((a, i) => (
            <Card key={i}><CardContent className="pt-4"><div className="flex items-center gap-3"><a.icon className="h-4 w-4 text-muted-foreground" /><p className="text-sm">{a.text}</p></div></CardContent></Card>
          ))}
        </TabsContent>
        <TabsContent value="yield" className="mt-4 space-y-2">
          {alertas.filter(a => a.tipo === 'Yield').map((a, i) => (
            <Card key={i}><CardContent className="pt-4"><div className="flex items-center gap-3"><a.icon className="h-4 w-4 text-muted-foreground" /><p className="text-sm">{a.text}</p></div></CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
