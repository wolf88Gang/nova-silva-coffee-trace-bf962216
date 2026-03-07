import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { usePlotSnapshotsHistory } from '@/hooks/usePlotSnapshotsHistory';
import { DEMO_SNAPSHOTS_HISTORY } from '@/lib/demoInsightsData';

interface Props {
  parcelaId: string | null;
  useDemo?: boolean;
}

export default function ProductivityGapChart({ parcelaId, useDemo }: Props) {
  const { data, isLoading } = usePlotSnapshotsHistory(parcelaId);

  const realData = (data ?? []).map((row: Record<string, unknown>) => ({
    ciclo: row.ciclo as string,
    expected: row.yield_expected as number,
    adjusted: row.yield_adjusted as number,
    real: (row as Record<string, unknown>).yield_real as number ?? null,
  }));

  const chartData = realData.length > 0 ? realData : useDemo ? DEMO_SNAPSHOTS_HISTORY.map(d => ({
    ciclo: d.ciclo,
    expected: d.yield_expected,
    adjusted: d.yield_adjusted,
    real: d.yield_real,
  })) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> Brecha de Productividad
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay datos históricos de snapshots para esta parcela.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="ciclo" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="expected" name="Esperado" fill="hsl(var(--primary))" />
              <Bar dataKey="adjusted" name="Ajustado" fill="hsl(var(--chart-2))" />
              <Bar dataKey="real" name="Real" fill="hsl(var(--muted-foreground))" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
