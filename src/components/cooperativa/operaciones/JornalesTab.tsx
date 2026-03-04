import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Wallet, ClipboardList } from 'lucide-react';

const kpis = [
  { label: 'Cuadrillas Activas', value: '4', icon: Users },
  { label: 'Trabajadores Hoy', value: '32', icon: Clock },
  { label: 'Costo Acumulado Mes', value: '₡2,125,000', icon: Wallet },
  { label: 'Jornales Registrados', value: '186', icon: ClipboardList },
];

const cuadrillas = [
  { cuadrilla: 'Cuadrilla Norte', capataz: 'Miguel Ángel Flores', zona: 'Vereda El Progreso', trabajadores: 10, estado: 'Activa', ultimaActividad: 'Corte selectivo — 2026-02-24' },
  { cuadrilla: 'Cuadrilla Sur', capataz: 'Roberto Paz Montoya', zona: 'Vereda La Unión', trabajadores: 8, estado: 'Activa', ultimaActividad: 'Fertilización — 2026-02-24' },
  { cuadrilla: 'Cuadrilla Central', capataz: 'Sandra López Rivera', zona: 'Vereda San José', trabajadores: 9, estado: 'Asignada', ultimaActividad: 'Control fitosanitario — 2026-02-23' },
  { cuadrilla: 'Cuadrilla Apoyo', capataz: 'Fernando Ruiz Castro', zona: 'Zona variable', trabajadores: 5, estado: 'En descanso', ultimaActividad: 'Podas — 2026-02-20' },
];

const estadoBadge = (e: string) => {
  if (e === 'Activa') return <Badge className="bg-emerald-500 text-white border-0">Activa</Badge>;
  if (e === 'Asignada') return <Badge className="bg-blue-500 text-white border-0">Asignada</Badge>;
  return <Badge variant="secondary">En descanso</Badge>;
};

export default function JornalesTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Gestión de cuadrillas y mano de obra</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <k.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{k.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cuadrillas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">Cuadrilla</th>
                  <th className="px-4 py-3 font-medium">Capataz</th>
                  <th className="px-4 py-3 font-medium">Zona</th>
                  <th className="px-4 py-3 font-medium">Trabajadores</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Última actividad</th>
                </tr>
              </thead>
              <tbody>
                {cuadrillas.map((c, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{c.cuadrilla}</td>
                    <td className="px-4 py-3">{c.capataz}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.zona}</td>
                    <td className="px-4 py-3">{c.trabajadores}</td>
                    <td className="px-4 py-3">{estadoBadge(c.estado)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.ultimaActividad}</td>
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
