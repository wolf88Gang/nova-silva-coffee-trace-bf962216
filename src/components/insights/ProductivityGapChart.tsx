import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingDown } from 'lucide-react';

export interface CycleData {
  ciclo: string;
  yieldExpected: number;
  yieldReal?: number;
  yieldAdjusted?: number;
  productivityGap?: number;
}

interface ProductivityGapChartProps {
  data: CycleData[];
  title?: string;
}

export function ProductivityGapChart({ data, title = 'Brecha de productividad' }: ProductivityGapChartProps) {
  const chartData = data.map((d) => ({
    ciclo: d.ciclo,
    esperado: d.yieldExpected,
    real: d.yieldReal ?? 0,
    ajustado: d.yieldAdjusted ?? d.yieldExpected,
    brecha: d.productivityGap ?? (d.yieldExpected - (d.yieldReal ?? 0)),
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">
            Sin datos de campañas. Registrá cosechas reales para ver la brecha.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Rendimiento esperado vs real por campaña. La brecha indica el potencial no alcanzado.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="ciclo" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                formatter={(value: number) => [value.toFixed(0), '']}
                labelFormatter={(label) => `Campaña ${label}`}
              />
              <Legend />
              <Bar dataKey="esperado" fill="hsl(var(--primary))" name="Esperado (kg/ha)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="real" fill="hsl(var(--muted-foreground))" name="Real (kg/ha)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="ajustado" fill="hsl(var(--chart-2))" name="Ajustado (kg/ha)" radius={[2, 2, 0, 0]} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
