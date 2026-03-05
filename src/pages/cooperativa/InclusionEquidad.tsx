import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HeartHandshake, Users, TrendingUp, FileText, BarChart3, Eye } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts';
import { tooltipStyle, tooltipItemStyle, tooltipLabelStyle, chartCursorStyle } from '@/lib/chartStyles';

// ── KPI indicators ──
const indicadores = [
  { label: 'Participación femenina', valor: 38, meta: 50, unidad: '%' },
  { label: 'Jóvenes productores (<30)', valor: 12, meta: 20, unidad: '%' },
  { label: 'Productores con discapacidad', valor: 2, meta: null, unidad: 'personas' },
  { label: 'Comunidades indígenas', valor: 1, meta: null, unidad: 'comunidad' },
];

// ── Acciones ──
const acciones = [
  { id: '1', titulo: 'Taller de liderazgo para mujeres productoras', fecha: '2026-03-05', estado: 'programada', participantes: 25, responsable: 'Sandra López' },
  { id: '2', titulo: 'Programa de mentoría para jóvenes caficultores', fecha: '2026-02-20', estado: 'en_curso', participantes: 12, responsable: 'Miguel Flores' },
  { id: '3', titulo: 'Capacitación en derechos laborales', fecha: '2026-01-15', estado: 'completada', participantes: 45, responsable: 'Ana Betancourt' },
  { id: '4', titulo: 'Censo de diversidad en fincas', fecha: '2026-01-10', estado: 'completada', participantes: 67, responsable: 'Roberto Paz' },
  { id: '5', titulo: 'Feria de emprendimiento femenino', fecha: '2026-03-15', estado: 'programada', participantes: 30, responsable: 'María Ortiz' },
];

// ── Charts data ──
const participacionGenero = [
  { grupo: 'Mujeres', valor: 38, color: 'hsl(var(--accent))' },
  { grupo: 'Hombres', valor: 62, color: 'hsl(var(--primary))' },
];

const edadDistribucion = [
  { rango: '<25', cantidad: 8 },
  { rango: '25-35', cantidad: 15 },
  { rango: '36-45', cantidad: 22 },
  { rango: '46-55', cantidad: 14 },
  { rango: '56-65', cantidad: 6 },
  { rango: '>65', cantidad: 2 },
];

const tendenciaInclusion = [
  { periodo: '2024-T1', mujeres: 28, jovenes: 8 },
  { periodo: '2024-T2', mujeres: 30, jovenes: 9 },
  { periodo: '2024-T3', mujeres: 32, jovenes: 10 },
  { periodo: '2024-T4', mujeres: 34, jovenes: 10 },
  { periodo: '2025-T1', mujeres: 35, jovenes: 11 },
  { periodo: '2025-T2', mujeres: 36, jovenes: 11 },
  { periodo: '2025-T3', mujeres: 37, jovenes: 12 },
  { periodo: '2025-T4', mujeres: 38, jovenes: 12 },
];

const rolesLiderazgo = [
  { rol: 'Junta directiva', mujeres: 2, total: 7 },
  { rol: 'Comité de vigilancia', mujeres: 3, total: 5 },
  { rol: 'Promotores de campo', mujeres: 4, total: 10 },
  { rol: 'Catadores certificados', mujeres: 1, total: 4 },
];

// ── Reportes ──
const reportes = [
  { id: 'r1', titulo: 'Informe Anual de Equidad de Genero 2025', fecha: '2025-12-15', tipo: 'Anual', estado: 'publicado' },
  { id: 'r2', titulo: 'Reporte Trimestral Inclusion T4-2025', fecha: '2025-12-30', tipo: 'Trimestral', estado: 'publicado' },
  { id: 'r3', titulo: 'Diagnostico de Brechas Salariales', fecha: '2025-11-10', tipo: 'Especial', estado: 'publicado' },
  { id: 'r4', titulo: 'Plan de Accion Inclusion 2026', fecha: '2026-01-20', tipo: 'Plan', estado: 'borrador' },
  { id: 'r5', titulo: 'Informe de Impacto - Programa Jovenes', fecha: '2026-02-28', tipo: 'Especial', estado: 'publicado' },
];

export default function InclusionEquidad() {
  const [selectedReport, setSelectedReport] = useState<typeof reportes[0] | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Inclusión y Equidad</h1>
      <p className="text-sm text-muted-foreground">Indicadores, acciones y reportes de inclusión social en la organización</p>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indicadores.map((ind) => (
          <Card key={ind.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">{ind.label}</p>
              <p className="text-2xl font-bold text-foreground">
                {ind.valor}{ind.unidad === '%' ? '%' : ''}{' '}
                <span className="text-sm font-normal text-muted-foreground">{ind.unidad !== '%' ? ind.unidad : ''}</span>
              </p>
              {ind.meta && (
                <div className="mt-2">
                  <Progress value={(ind.valor / ind.meta) * 100} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">Meta: {ind.meta}{ind.unidad === '%' ? '%' : ''}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="dashboard"><BarChart3 className="h-4 w-4 mr-1" /> Dashboard</TabsTrigger>
          <TabsTrigger value="acciones"><HeartHandshake className="h-4 w-4 mr-1" /> Acciones</TabsTrigger>
          <TabsTrigger value="reportes"><FileText className="h-4 w-4 mr-1" /> Reportes</TabsTrigger>
        </TabsList>

        {/* ── Dashboard Tab ── */}
        <TabsContent value="dashboard" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gender distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Distribución por genero
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={participacionGenero} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="valor"
                      label={({ grupo, valor }) => `${grupo}: ${valor}%`} labelLine={false}>
                      {participacionGenero.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} formatter={(v: number) => [`${v}%`]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Age distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Distribución por edad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={edadDistribucion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="rango" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={chartCursorStyle} formatter={(v: number) => [`${v} productores`]} />
                    <Bar dataKey="cantidad" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Inclusion trends */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Tendencia de inclusión (% sobre total)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={tendenciaInclusion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 50]} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
                    <Area type="monotone" dataKey="mujeres" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.15)" strokeWidth={2} name="Mujeres %" />
                    <Area type="monotone" dataKey="jovenes" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} name="Jóvenes %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Leadership roles */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Participación femenina en liderazgo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rolesLiderazgo.map((r) => (
                <div key={r.rol} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{r.rol}</span>
                    <span className="text-muted-foreground">{r.mujeres}/{r.total} mujeres</span>
                  </div>
                  <Progress value={(r.mujeres / r.total) * 100} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Acciones Tab ── */}
        <TabsContent value="acciones" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-primary" /> Acciones de inclusión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {acciones.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{a.titulo}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                      <span>{a.fecha}</span>
                      <span>·</span>
                      <span>{a.participantes} participantes</span>
                      <span>·</span>
                      <span>Resp: {a.responsable}</span>
                    </div>
                  </div>
                  <Badge variant={a.estado === 'completada' ? 'default' : a.estado === 'en_curso' ? 'secondary' : 'outline'}>
                    {a.estado === 'completada' ? 'Completada' : a.estado === 'en_curso' ? 'En curso' : 'Programada'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Reportes Tab ── */}
        <TabsContent value="reportes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Reportes de Inclusión
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="px-4 py-3 font-medium">Titulo</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportes.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{r.titulo}</td>
                        <td className="px-4 py-3"><Badge variant="outline">{r.tipo}</Badge></td>
                        <td className="px-4 py-3 text-muted-foreground">{r.fecha}</td>
                        <td className="px-4 py-3">
                          <Badge className={r.estado === 'publicado' ? 'bg-emerald-600 text-white border-0' : 'bg-muted text-muted-foreground border-0'}>
                            {r.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedReport(r)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report detail dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedReport?.titulo}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  <span className="font-medium text-foreground">{selectedReport.tipo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha:</span>{' '}
                  <span className="font-medium text-foreground">{selectedReport.fecha}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>{' '}
                  <Badge className={selectedReport.estado === 'publicado' ? 'bg-emerald-600 text-white border-0' : 'bg-muted text-muted-foreground border-0'}>
                    {selectedReport.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-medium text-foreground mb-2">Resumen del analisis Nova Silva</p>
                <p className="text-sm text-muted-foreground">
                  {selectedReport.tipo === 'Anual'
                    ? 'La participación femenina ha crecido un 10% interanual, alcanzando el 38% del total de productores asociados. Se recomienda fortalecer los programas de acceso a credito diferenciado y ampliar las capacitaciones en liderazgo para alcanzar la meta del 50% para 2027.'
                    : selectedReport.tipo === 'Especial'
                    ? 'El diagnostico revela una brecha salarial promedio del 12% en las actividades de corte y poscosecha. Las acciones correctivas implementadas en T3-2025 han reducido esta brecha en 3 puntos porcentuales respecto al periodo anterior.'
                    : 'El plan de acción 2026 contempla 8 iniciativas clave: 3 talleres de liderazgo, 2 programas de mentoría, 1 feria de emprendimiento, 1 censo de diversidad actualizado y 1 programa de becas para jóvenes caficultores.'}
                </p>
              </div>
              <Button variant="outline" className="w-full">Descargar PDF</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
