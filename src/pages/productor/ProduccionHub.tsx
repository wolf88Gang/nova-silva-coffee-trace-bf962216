import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Package, Scissors, Sprout, Plus, FileText, Clock, Users, DollarSign, CheckCircle, AlertCircle, Leaf, Target, Camera, Calendar as CalIcon } from 'lucide-react';

// ── Parcelas data ──
const parcelas = [
  { nombre: 'Finca La Esperanza', area: 2.5, variedad: 'Caturra', estadoLegal: 'propio', ubicacion: 'punto', estadoEUDR: 'Revisión pendiente', gps: true, docs: true },
  { nombre: 'Lote El Mirador', area: 1.2, variedad: 'Catuaí', estadoLegal: 'arrendado', ubicacion: 'punto', estadoEUDR: 'Revisión pendiente', gps: true, docs: false },
];

const docsParcela = [
  { parcela: 'Finca La Esperanza', docs: [] as string[] },
  { parcela: 'Lote El Mirador', docs: [] as string[] },
];

// ── Inventario data ──
const insumos = [
  { nombre: 'Fertilizante 18-6-12', categoria: 'Fertilizante', stock: 8, minimo: 5, unidad: 'sacos', precio: 12500 },
  { nombre: 'Cal dolomita', categoria: 'Enmienda', stock: 3, minimo: 4, unidad: 'sacos', precio: 8000 },
  { nombre: 'Beauveria bassiana', categoria: 'Biocontrol', stock: 2, minimo: 2, unidad: 'kg', precio: 15000 },
  { nombre: 'Fungicida cúprico', categoria: 'Fungicida', stock: 5, minimo: 3, unidad: 'litros', precio: 9500 },
];

const equipos = [
  { nombre: 'Bomba de mochila', tipo: 'Aspersión', marca: 'Solo', estado: 'operativo' },
  { nombre: 'Despulpadora manual', tipo: 'Beneficio', marca: 'JM Estrada', estado: 'operativo' },
  { nombre: 'Secadora solar', tipo: 'Secado', marca: 'Artesanal', estado: 'requiere mantto' },
];

// ── Jornales data ──
const jornalesData = [
  { nombre: 'María López', actividad: 'Recolección café', parcela: 'Finca El Mirador', monto: 18000, fecha: '25 feb', horas: '8h', estado: 'pagado' as const },
  { nombre: 'Carlos Rodríguez', actividad: 'Recolección café', parcela: 'Finca El Mirador', monto: 18000, fecha: '25 feb', horas: '8h', estado: 'pagado' as const },
  { nombre: 'Ana Martínez', actividad: 'Poda selectiva', parcela: 'Lote Norte', monto: 13500, fecha: '24 feb', horas: '6h', estado: 'pagado' as const },
  { nombre: 'José Hernández', actividad: 'Aplicación fertilizante', parcela: 'Finca El Mirador', monto: 18000, fecha: '23 feb', horas: '8h', estado: 'pendiente' as const },
  { nombre: 'María López', actividad: 'Recolección café', parcela: 'Lote Norte', monto: 15750, fecha: '22 feb', horas: '7h', estado: 'pagado' as const },
];

const jornalesKPIs = [
  { label: 'Trabajadores', value: '4', sub: 'activos esta semana', icon: Users },
  { label: 'Horas Totales', value: '112h', sub: '15 jornales', icon: Clock },
  { label: 'Pagado', value: '₡180,000', sub: 'esta semana', icon: CheckCircle, accent: true },
  { label: 'Pendiente', value: '₡27,000', sub: 'por pagar', icon: DollarSign, warning: true },
];

const distribucion = [
  { actividad: 'Recolección café', porcentaje: 65, icon: Sprout },
  { actividad: 'Poda selectiva', porcentaje: 20, icon: Scissors },
  { actividad: 'Fertilización', porcentaje: 15, icon: Leaf },
];

const actIcons: Record<string, typeof Sprout> = { 'Recolección café': Sprout, 'Poda selectiva': Scissors, 'Aplicación fertilizante': Leaf };

const stockBadge = (stock: number, minimo: number) => {
  if (stock < minimo * 0.5) return <Badge variant="destructive">Crítico</Badge>;
  if (stock <= minimo) return <Badge variant="secondary" className="text-amber-600 dark:text-amber-400">Bajo</Badge>;
  return <Badge variant="default">OK</Badge>;
};

export default function ProduccionHub() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Producción</h1>
        <p className="text-sm text-muted-foreground">Gestiona tus parcelas, inventario, jornales y estimaciones de cosecha</p>
      </div>

      <Tabs defaultValue="parcelas">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="parcelas" className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Mis parcelas</TabsTrigger>
          <TabsTrigger value="inventario" className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> Inventario</TabsTrigger>
          <TabsTrigger value="jornales" className="flex items-center gap-1.5"><Scissors className="h-3.5 w-3.5" /> Jornales</TabsTrigger>
          <TabsTrigger value="yield" className="flex items-center gap-1.5"><Sprout className="h-3.5 w-3.5" /> Nova Yield</TabsTrigger>
        </TabsList>

        {/* ── PARCELAS ── */}
        <TabsContent value="parcelas" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Listado de parcelas</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Nombre</th><th className="pb-2 pr-4">Área</th><th className="pb-2 pr-4">Variedad</th>
                      <th className="pb-2 pr-4">Estado Legal</th><th className="pb-2 pr-4">Ubicación</th><th className="pb-2 pr-4">Estado EUDR</th>
                      <th className="pb-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcelas.map((p) => (
                      <tr key={p.nombre} className="border-b border-border/50">
                        <td className="py-3 pr-4 font-medium text-foreground">{p.nombre}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.area} ha</td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.variedad}</td>
                        <td className="py-3 pr-4"><Badge variant="outline">{p.estadoLegal}</Badge></td>
                        <td className="py-3 pr-4 text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.ubicacion}</td>
                        <td className="py-3 pr-4"><Badge variant="destructive">{p.estadoEUDR}</Badge></td>
                        <td className="py-3"><Button variant="ghost" size="sm"><FileText className="h-3.5 w-3.5 mr-1" /> Editar</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Documentación por parcela</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docsParcela.map((d) => (
                  <div key={d.parcela} className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-foreground">{d.parcela}</p>
                      <Button variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Agregar</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Sin documentos registrados</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── INVENTARIO ── */}
        <TabsContent value="inventario" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Insumos</CardTitle>
                <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Agregar insumo</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="pb-2 pr-4">Insumo</th><th className="pb-2 pr-4">Categoría</th><th className="pb-2 pr-4">Stock</th><th className="pb-2 pr-4">Mínimo</th><th className="pb-2 pr-4">Unidad</th><th className="pb-2">Estado</th></tr></thead>
                  <tbody>
                    {insumos.map((ins) => (
                      <tr key={ins.nombre} className="border-b border-border/50">
                        <td className="py-3 pr-4 font-medium text-foreground">{ins.nombre}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{ins.categoria}</td>
                        <td className="py-3 pr-4 text-foreground">{ins.stock}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{ins.minimo}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{ins.unidad}</td>
                        <td className="py-3">{stockBadge(ins.stock, ins.minimo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Equipos</CardTitle>
                <Button variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Agregar equipo</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {equipos.map((eq) => (
                <div key={eq.nombre} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{eq.nombre}</p>
                    <p className="text-xs text-muted-foreground">{eq.tipo} — {eq.marca}</p>
                  </div>
                  <Badge variant={eq.estado === 'operativo' ? 'default' : 'secondary'}>{eq.estado}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── JORNALES ── */}
        <TabsContent value="jornales" className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Gestión de Jornales</h2>
              <p className="text-sm text-muted-foreground">Control de trabajo y pagos a jornaleros</p>
            </div>
            <Button><Plus className="h-4 w-4 mr-1" /> Registrar Jornal</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {jornalesKPIs.map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className={`h-4 w-4 ${kpi.warning ? 'text-accent' : kpi.accent ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${kpi.warning ? 'text-accent' : kpi.accent ? 'text-primary' : 'text-foreground'}`}>{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Jornales Recientes</CardTitle>
                  <div className="flex gap-1">
                    {['Todos', 'Pagados', 'Pendientes', 'En Progreso'].map((f) => (
                      <Badge key={f} variant={f === 'Todos' ? 'default' : 'outline'} className="cursor-pointer text-xs">{f}</Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {jornalesData.map((j, i) => {
                  const Icon = actIcons[j.actividad] || Sprout;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{j.nombre}</p>
                          <p className="text-xs text-muted-foreground">{j.actividad} • {j.parcela}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">₡{j.monto.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{j.fecha} • {j.horas}</p>
                        </div>
                        <Badge variant={j.estado === 'pagado' ? 'default' : 'secondary'}>
                          {j.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Distribución de Actividades</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">Esta semana</p>
                  {distribucion.map((d) => (
                    <div key={d.actividad} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><d.icon className="h-3.5 w-3.5" /> {d.actividad}</span>
                        <span className="text-foreground font-medium">{d.porcentaje}%</span>
                      </div>
                      <Progress value={d.porcentaje} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardHeader><CardTitle className="text-base text-foreground">Interpretación Nova Silva</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">El costo de mano de obra representa <span className="font-bold text-foreground">32%</span> de tus gastos operativos esta temporada.</p>
                  <div className="mt-3 p-2 rounded-md bg-primary/10 border border-primary/20">
                    <p className="text-xs font-semibold text-primary">Eficiencia Laboral</p>
                    <p className="text-xs text-muted-foreground mt-1">Tu rendimiento promedio de 45 kg/jornal está por encima del promedio regional (38 kg/jornal).</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── NOVA YIELD ── */}
        <TabsContent value="yield" className="space-y-6 mt-4">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sprout className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Nova Yield</h2>
                  <p className="text-sm text-muted-foreground">Estimación de Cosecha con Conteo Asistido</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Nova Yield utiliza el <span className="font-bold text-foreground">Método de Componentes</span> para estimar tu producción con precisión científica. Muestrearás 30 árboles siguiendo un patrón de zigzag.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-border space-y-2">
                  <Target className="h-6 w-6 text-primary" />
                  <p className="font-semibold text-foreground">Precisión &lt;10%</p>
                  <p className="text-xs text-muted-foreground">Error reducido vs métodos tradicionales</p>
                </div>
                <div className="p-4 rounded-lg border border-border space-y-2">
                  <Camera className="h-6 w-6 text-primary" />
                  <p className="font-semibold text-foreground">Conteo Asistido</p>
                  <p className="text-xs text-muted-foreground">Visión artificial para contar cerezas</p>
                </div>
                <div className="p-4 rounded-lg border border-border space-y-2">
                  <CalIcon className="h-6 w-6 text-primary" />
                  <p className="font-semibold text-foreground">Curva de Maduración</p>
                  <p className="text-xs text-muted-foreground">Predice el timing óptimo de cosecha</p>
                </div>
              </div>

              <Button className="w-full" size="lg">
                Comenzar Estimación →
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
