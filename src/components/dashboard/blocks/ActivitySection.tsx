import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { hasModule, hasAnyModule, type OrgModule } from '@/lib/org-modules';
import { DEMO_ENTREGAS, DEMO_LOTES_COMERCIALES, DEMO_VISITAS } from '@/lib/demo-data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { tooltipStyle, tooltipItemStyle, tooltipLabelStyle, chartCursorStyle } from '@/lib/chartStyles';

interface ActivitySectionProps {
  role: string | null;
  activeModules: OrgModule[];
}

const entregas6m = [
  { mes: 'Sep', kg: 12400 }, { mes: 'Oct', kg: 15800 }, { mes: 'Nov', kg: 18200 },
  { mes: 'Dic', kg: 9600 }, { mes: 'Ene', kg: 14300 }, { mes: 'Feb', kg: 18450 },
];

const pagoVariant = (p: string) => p === 'pagado' ? 'default' : p === 'pendiente' ? 'secondary' : 'outline';

function CoopActivity({ activeModules }: { activeModules: OrgModule[] }) {
  const navigate = useNavigate();
  const showEntregas = hasAnyModule(activeModules, ['entregas', 'lotes_acopio']);

  if (!showEntregas) return null;

  return (
    <div className="space-y-6">
      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Entregas Últimos 6 Meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={entregas6m}>
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                cursor={chartCursorStyle}
                formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Entregas']}
              />
              <Bar dataKey="kg" radius={[4, 4, 0, 0]}>
                {entregas6m.map((_, i) => <Cell key={i} fill="hsl(var(--primary))" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent entregas table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Últimas Entregas</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/cooperativa/acopio')}>Ver todo <ArrowRight className="h-3 w-3 ml-1" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="px-4 py-2 font-medium">Fecha</th>
                  <th className="px-4 py-2 font-medium">Productor</th>
                  <th className="px-4 py-2 font-medium">Kg</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium">Pago</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ENTREGAS.slice(0, 5).map((e) => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-2 text-muted-foreground">{e.fecha}</td>
                    <td className="px-4 py-2 font-medium text-foreground">{e.productorNombre}</td>
                    <td className="px-4 py-2">{e.pesoKg}</td>
                    <td className="px-4 py-2">{e.tipoCafe}</td>
                    <td className="px-4 py-2"><Badge variant={pagoVariant(e.estadoPago) as any}>{e.estadoPago}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExportadorActivity() {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Lotes Comerciales</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/exportador/lotes')}>Ver todo <ArrowRight className="h-3 w-3 ml-1" /></Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-left">
                <th className="px-4 py-2 font-medium">Código ICO</th>
                <th className="px-4 py-2 font-medium">Origen</th>
                <th className="px-4 py-2 font-medium">Sacos</th>
                <th className="px-4 py-2 font-medium">SCA</th>
                <th className="px-4 py-2 font-medium">EUDR</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_LOTES_COMERCIALES.map(l => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-2 font-medium text-foreground">{l.codigoICO}</td>
                  <td className="px-4 py-2 text-muted-foreground">{l.origen}</td>
                  <td className="px-4 py-2">{l.pesoSacos}</td>
                  <td className="px-4 py-2 font-bold">{l.puntajeSCA}</td>
                  <td className="px-4 py-2"><Badge variant={l.estadoEUDR === 'compliant' ? 'default' : 'secondary'}>{l.estadoEUDR}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function TecnicoActivity() {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Visitas Programadas Hoy</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/tecnico/agenda')}>Ver todo <ArrowRight className="h-3 w-3 ml-1" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {DEMO_VISITAS.filter(v => v.fecha === '2026-02-17').map(v => (
            <div key={v.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{v.productorNombre}</p>
                <p className="text-xs text-muted-foreground">{v.tipo} — {v.comunidad}</p>
              </div>
              <Badge variant={v.estado === 'programada' ? 'secondary' : 'default'}>{v.estado}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivitySection({ role, activeModules }: ActivitySectionProps) {
  switch (role) {
    case 'cooperativa': return <CoopActivity activeModules={activeModules} />;
    case 'exportador': return <ExportadorActivity />;
    case 'tecnico': return <TecnicoActivity />;
    default: return null;
  }
}
