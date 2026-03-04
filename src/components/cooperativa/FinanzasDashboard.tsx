import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Wallet, Users } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { tooltipStyle } from '@/lib/chartStyles';

const flujo = [
  { mes: 'Sep', ingresos: 38000000, egresos: 28000000 },
  { mes: 'Oct', ingresos: 42000000, egresos: 30000000 },
  { mes: 'Nov', ingresos: 48000000, egresos: 33000000 },
  { mes: 'Dic', ingresos: 30000000, egresos: 25000000 },
  { mes: 'Ene', ingresos: 40000000, egresos: 29000000 },
  { mes: 'Feb', ingresos: 45200000, egresos: 31800000 },
];

const distribucion = [
  { name: 'Compras café', value: 60, color: 'hsl(var(--primary))' },
  { name: 'Operaciones', value: 20, color: 'hsl(var(--accent))' },
  { name: 'Personal', value: 15, color: 'hsl(210, 60%, 50%)' },
  { name: 'Otros', value: 5, color: 'hsl(var(--muted-foreground))' },
];

const transacciones = [
  { fecha: '2026-02-24', desc: 'Compra café pergamino - Lote 048', cat: 'Compras café', tipo: 'Egreso', monto: 4800000, ref: 'EG-2026-0198' },
  { fecha: '2026-02-24', desc: 'Venta lote exportación - Cliente Volcafe', cat: 'Ventas', tipo: 'Ingreso', monto: 12500000, ref: 'IN-2026-0087' },
  { fecha: '2026-02-23', desc: 'Nómina cuadrillas Febrero (parcial)', cat: 'Personal', tipo: 'Egreso', monto: 2800000, ref: 'EG-2026-0197' },
  { fecha: '2026-02-23', desc: 'Compra fertilizante 18-5-15', cat: 'Insumos', tipo: 'Egreso', monto: 1200000, ref: 'EG-2026-0196' },
  { fecha: '2026-02-22', desc: 'Pago FNC — Contribución cafetera', cat: 'Impuestos', tipo: 'Egreso', monto: 950000, ref: 'EG-2026-0195' },
  { fecha: '2026-02-22', desc: 'Venta café tostado — Tienda local', cat: 'Ventas', tipo: 'Ingreso', monto: 3200000, ref: 'IN-2026-0086' },
  { fecha: '2026-02-21', desc: 'Compra sacos de yute', cat: 'Empaque', tipo: 'Egreso', monto: 680000, ref: 'EG-2026-0194' },
  { fecha: '2026-02-21', desc: 'Desembolso crédito — Ana Betancourt', cat: 'Créditos', tipo: 'Egreso', monto: 1500000, ref: 'CR-2026-0034' },
];

const kpis = [
  { label: 'Ingresos del Periodo', value: '₡45,200,000', icon: TrendingUp, color: 'text-emerald-600' },
  { label: 'Egresos del Periodo', value: '₡31,800,000', icon: TrendingDown, color: 'text-destructive' },
  { label: 'Balance', value: '₡13,400,000', icon: Wallet, color: 'text-primary' },
  { label: 'Créditos Activos', value: '12 productores', icon: Users, color: '' },
];

const fmt = (v: number) => `₡${(v / 1000000).toFixed(1)}M`;

export default function FinanzasDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Finanzas</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <k.icon className={`h-4 w-4 ${k.color || 'text-primary'}`} />
                <span className="text-xs text-muted-foreground">{k.label}</span>
              </div>
              <p className={`text-xl font-bold ${k.color || 'text-foreground'}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Flujo de Caja Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={flujo}>
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={fmt} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`$${v.toLocaleString()} CRC`]}
                />
                <Line type="monotone" dataKey="ingresos" stroke="hsl(142, 60%, 40%)" strokeWidth={2} name="Ingresos" dot={false} />
                <Line type="monotone" dataKey="egresos" stroke="hsl(0, 65%, 50%)" strokeWidth={2} name="Egresos" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribución de Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={distribucion} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {distribucion.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Últimas Transacciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Descripción</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Monto</th>
                  <th className="px-4 py-3 font-medium">Referencia</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.map((t, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{t.fecha}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{t.desc}</td>
                    <td className="px-4 py-3">{t.cat}</td>
                    <td className="px-4 py-3">
                      <Badge className={t.tipo === 'Ingreso' ? 'bg-emerald-500 text-white border-0' : 'bg-destructive text-destructive-foreground border-0'}>
                        {t.tipo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">₡{t.monto.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{t.ref}</td>
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
