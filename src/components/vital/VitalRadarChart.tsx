/**
 * VitalRadarChart — Gráfico radar independiente para los 3 componentes VITAL.
 */
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface VitalRadarChartProps {
  exposicion: number;           // 0-100
  sensibilidad: number;         // 0-100
  capacidadAdaptativa: number;  // 0-100
  height?: number;
}

export default function VitalRadarChart({
  exposicion,
  sensibilidad,
  capacidadAdaptativa,
  height = 250,
}: VitalRadarChartProps) {
  const data = [
    { dim: 'Exposición', value: exposicion, fullMark: 100 },
    { dim: 'Sensibilidad', value: sensibilidad, fullMark: 100 },
    { dim: 'Cap. Adaptativa', value: capacidadAdaptativa, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis dataKey="dim" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
        <Radar
          name="IGRN"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
