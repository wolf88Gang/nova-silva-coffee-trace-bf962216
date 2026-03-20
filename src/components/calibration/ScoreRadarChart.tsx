/**
 * ScoreRadarChart — Radar/spider chart for commercial score dimensions.
 * Used in Calibration Review and Session Detail for visual score synthesis.
 */
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface ScoreRadarChartProps {
  scores: {
    pain: number | null;
    maturity: number | null;
    urgency: number | null;
    fit: number | null;
    budget_readiness: number | null;
    objection: number | null;
  };
  height?: number;
  maxValue?: number;
}

const DIMENSION_LABELS: Record<string, string> = {
  pain: 'Dolor',
  maturity: 'Madurez',
  urgency: 'Urgencia',
  fit: 'Fit',
  budget_readiness: 'Presupuesto',
  objection: 'Objeción',
};

export default function ScoreRadarChart({ scores, height = 280, maxValue = 100 }: ScoreRadarChartProps) {
  const hasData = Object.values(scores).some(v => v != null && v > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        Datos insuficientes para visualizar
      </div>
    );
  }

  const data = Object.entries(scores).map(([key, value]) => ({
    dim: DIMENSION_LABELS[key] || key,
    value: value ?? 0,
    fullMark: maxValue,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis dataKey="dim" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, maxValue]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
        <Radar
          name="Score"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
