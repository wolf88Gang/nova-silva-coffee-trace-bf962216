import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, Package, Leaf, PieChartIcon } from 'lucide-react';
import { type OrgModule, hasModule } from '@/lib/org-modules';
import { tooltipStyle } from '@/lib/chartStyles';

// ── Cooperativa charts data ──
const entregasMensuales = [
  { mes: 'Sep', kg: 12400 }, { mes: 'Oct', kg: 15800 }, { mes: 'Nov', kg: 18200 },
  { mes: 'Dic', kg: 9600 }, { mes: 'Ene', kg: 14300 }, { mes: 'Feb', kg: 18450 },
];

const calidadDist = [
  { name: 'Specialty (>84)', value: 35, color: 'hsl(var(--primary))' },
  { name: 'Premium (80-84)', value: 40, color: 'hsl(var(--accent))' },
  { name: 'Comercial (<80)', value: 25, color: 'hsl(var(--muted-foreground))' },
];

const vitalTendencia = [
  { mes: 'Sep', score: 58 }, { mes: 'Oct', score: 60 }, { mes: 'Nov', score: 63 },
  { mes: 'Dic', score: 62 }, { mes: 'Ene', score: 65 }, { mes: 'Feb', score: 68 },
];

// ── Exportador charts data ──
const volumenOrigen = [
  { origen: 'Huehuetenango', sacos: 450 },
  { origen: 'Antigua', sacos: 320 },
  { origen: 'Tarrazú', sacos: 680 },
  { origen: 'West Valley', sacos: 200 },
];

const preciosTendencia = [
  { mes: 'Sep', usd: 3.80 }, { mes: 'Oct', usd: 3.95 }, { mes: 'Nov', usd: 4.10 },
  { mes: 'Dic', usd: 4.05 }, { mes: 'Ene', usd: 4.20 }, { mes: 'Feb', usd: 4.35 },
];

const destinoDist = [
  { name: 'Alemania', value: 40, color: 'hsl(var(--primary))' },
  { name: 'Suecia', value: 25, color: 'hsl(var(--accent))' },
  { name: 'EE.UU.', value: 20, color: 'hsl(210, 60%, 50%)' },
  { name: 'Otros', value: 15, color: 'hsl(var(--muted-foreground))' },
];

// ── Técnico charts data ──
const evaluacionesPorMes = [
  { mes: 'Oct', completadas: 8 }, { mes: 'Nov', completadas: 12 }, { mes: 'Dic', completadas: 6 },
  { mes: 'Ene', completadas: 10 }, { mes: 'Feb', completadas: 14 },
];


function CoopCharts({ activeModules }: { activeModules: OrgModule[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Acopio mensual (kg)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={entregasMensuales}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toLocaleString()} kg`]} />
              <Bar dataKey="kg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {hasModule(activeModules, 'vital') && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4 text-primary" /> Tendencia VITAL promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={vitalTendencia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[40, 80]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}/100`]} />
                <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" /> Distribución de calidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={calidadDist} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                {calidadDist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function ExportadorCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Volumen por origen (sacos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={volumenOrigen} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="category" dataKey="origen" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} width={100} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} sacos`]} />
              <Bar dataKey="sacos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Tendencia de precios (USD/lb)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={preciosTendencia}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={[3.5, 4.5]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`USD $${v.toFixed(2)}/lb`]} />
              <Area type="monotone" dataKey="usd" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" /> Distribución por destino
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={destinoDist} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                {destinoDist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function TecnicoCharts() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Leaf className="h-4 w-4 text-primary" /> Evaluaciones VITAL completadas por mes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={evaluacionesPorMes}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="completadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ChartsSectionProps {
  role: string | null;
  activeModules: OrgModule[];
}

export function ChartsSection({ role, activeModules }: ChartsSectionProps) {
  switch (role) {
    case 'cooperativa': return <CoopCharts activeModules={activeModules} />;
    case 'exportador': return <ExportadorCharts />;
    case 'tecnico': return <TecnicoCharts />;
    default: return null;
  }
}
