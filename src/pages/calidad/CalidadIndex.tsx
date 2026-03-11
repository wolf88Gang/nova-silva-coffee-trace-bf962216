import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, TrendingUp, Star, Coffee } from 'lucide-react';

const evaluaciones = [
  { lote: 'Lote CMV-2026-014', productor: 'María Solano', score: 86.5, notas: 'Cítrico, chocolate, cuerpo medio', fecha: '2026-03-08' },
  { lote: 'Lote CMV-2026-012', productor: 'Carlos Méndez', score: 84.0, notas: 'Floral, nuez, acidez brillante', fecha: '2026-03-05' },
  { lote: 'Lote CMV-2026-009', productor: 'Ana Jiménez', score: 88.2, notas: 'Frutos rojos, panela, sedoso', fecha: '2026-02-28' },
  { lote: 'Lote SE-2026-003', productor: 'Finca Santa Elena', score: 90.1, notas: 'Jasmine, bergamota, complejo', fecha: '2026-02-25' },
];

function scoreColor(score: number) {
  if (score >= 88) return 'text-primary';
  if (score >= 85) return 'text-accent';
  return 'text-muted-foreground';
}

export default function CalidadIndex() {
  return (
    <div className="space-y-6">
      <PageHeader title="Calidad · Nova Cup" description="Evaluaciones de taza, tendencias de calidad y oferta destacada" />

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Evaluaciones (campaña)', value: '148', icon: Award },
          { label: 'Score promedio', value: '85.4', icon: Star },
          { label: 'Lotes >86 pts', value: '34', icon: Coffee },
          { label: 'Tendencia', value: '+1.2 pts', icon: TrendingUp },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <k.icon className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{k.value}</p>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="evaluaciones">
        <TabsList>
          <TabsTrigger value="evaluaciones">Evaluaciones de taza</TabsTrigger>
          <TabsTrigger value="lotes">Resultados por lote</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
          <TabsTrigger value="oferta">Oferta destacada</TabsTrigger>
        </TabsList>
        <TabsContent value="evaluaciones" className="mt-4 space-y-3">
          {evaluaciones.map((e, i) => (
            <Card key={i} className="cursor-pointer hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{e.lote}</p>
                    <p className="text-xs text-muted-foreground">{e.productor} · {e.fecha}</p>
                    <p className="text-xs text-muted-foreground mt-1 italic">{e.notas}</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${scoreColor(e.score)}`}>{e.score}</p>
                    <p className="text-xs text-muted-foreground">SCA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="lotes" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Resultados agrupados por lote comercial</CardContent></Card></TabsContent>
        <TabsContent value="tendencias" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Evolución de scores por período, región y variedad</CardContent></Card></TabsContent>
        <TabsContent value="oferta" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Lotes con score destacado disponibles para oferta</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
