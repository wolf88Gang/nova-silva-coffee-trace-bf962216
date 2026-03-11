import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Package, FileText, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { getDemoProveedores } from '@/lib/demoSeedData';

const sections = [
  { title: 'Proveedores', description: 'Registro y estado de productores y fincas externas', icon: Users, path: '/abastecimiento/proveedores', stat: '' },
  { title: 'Recepción de café', description: 'Ingresos, pesaje, calidad de recibo y trazabilidad', icon: Package, path: '/abastecimiento/recepcion', stat: '' },
  { title: 'Compras y lotes', description: 'Compras consolidadas, precios y lotes de origen', icon: FileText, path: '/abastecimiento/compras', stat: '' },
  { title: 'Evidencias proveedor', description: 'Documentación, certificados y datos de origen', icon: FileText, path: '/abastecimiento/evidencias', stat: '' },
  { title: 'Riesgo de origen', description: 'Score de riesgo por proveedor, zona y cumplimiento', icon: AlertTriangle, path: '/abastecimiento/riesgo', stat: '' },
  { title: 'EUDR de abastecimiento', description: 'Estado de cumplimiento EUDR por proveedor y lote', icon: ShieldCheck, path: '/abastecimiento/eudr', stat: '' },
];

const eudrColor: Record<string, string> = { Conforme: 'default', Pendiente: 'secondary', Riesgo: 'destructive' };

export default function AbastecimientoIndex() {
  const navigate = useNavigate();
  const proveedores = getDemoProveedores();

  const conforme = proveedores.filter(p => p.eudr === 'Conforme').length;
  const pendiente = proveedores.filter(p => p.eudr === 'Pendiente').length;
  const riesgo = proveedores.filter(p => p.eudr === 'Riesgo').length;

  const enrichedSections = sections.map(s => {
    if (s.title === 'Proveedores') return { ...s, stat: `${proveedores.length} activos` };
    if (s.title === 'EUDR de abastecimiento') return { ...s, stat: `${Math.round(conforme / proveedores.length * 100)}% conforme` };
    if (s.title === 'Riesgo de origen') return { ...s, stat: `${riesgo} alertas` };
    if (s.title === 'Recepción de café') return { ...s, stat: `${proveedores.reduce((a, p) => a + p.entregas, 0)} recepciones` };
    return { ...s, stat: '—' };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Abastecimiento" description="Red de proveedores externos, compras y riesgo de origen" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enrichedSections.map(s => (
          <Card key={s.path} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(s.path)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-accent/10 text-accent"><s.icon className="h-5 w-5" /></div>
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

      {/* Proveedores table */}
      <Tabs defaultValue="proveedores">
        <TabsList>
          <TabsTrigger value="proveedores">Proveedores ({proveedores.length})</TabsTrigger>
          <TabsTrigger value="eudr">Estado EUDR</TabsTrigger>
        </TabsList>
        <TabsContent value="proveedores" className="mt-4">
          <Card>
            <CardContent className="pt-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Proveedor</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Región</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Tipo</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Entregas</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Volumen</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Calidad</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">EUDR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.slice(0, 20).map((p, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-3 font-medium">{p.nombre}</td>
                        <td className="py-2 px-3 text-muted-foreground">{p.region}</td>
                        <td className="py-2 px-3 text-muted-foreground">{p.tipo}</td>
                        <td className="py-2 px-3 text-center">{p.entregas}</td>
                        <td className="py-2 px-3 text-center">{p.volumen}</td>
                        <td className="py-2 px-3 text-center">{p.calidad}</td>
                        <td className="py-2 px-3"><Badge variant={(eudrColor[p.eudr] as any) || 'secondary'} className="text-xs">{p.eudr}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="eudr" className="mt-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10"><span className="h-2 w-2 rounded-full bg-primary" /><span className="text-sm font-medium">{conforme} Conforme</span></div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10"><span className="h-2 w-2 rounded-full bg-warning" /><span className="text-sm font-medium">{pendiente} Pendiente</span></div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10"><span className="h-2 w-2 rounded-full bg-destructive" /><span className="text-sm font-medium">{riesgo} Riesgo</span></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Signals */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Señales de la red</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20"><span className="h-2 w-2 rounded-full bg-warning" /><span className="text-sm">{pendiente} proveedores con documentación pendiente</span></div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"><span className="h-2 w-2 rounded-full bg-destructive" /><span className="text-sm">{riesgo} alertas de riesgo de deforestación</span></div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20"><span className="h-2 w-2 rounded-full bg-primary" /><span className="text-sm">{proveedores.length} proveedores en la red</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}