import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ship, Building2, Package, FileText, Plus } from 'lucide-react';

const exportadores = [
  { id: '1', nombre: 'Exportadora Sol de América', pais: 'Guatemala', volumenHistorico: 1200, estado: 'activo', compliance: 'compliant' },
  { id: '2', nombre: 'Green Coffee Traders', pais: 'Costa Rica', volumenHistorico: 800, estado: 'activo', compliance: 'compliant' },
  { id: '3', nombre: 'Central American Beans Co.', pais: 'Honduras', volumenHistorico: 450, estado: 'pendiente', compliance: 'pending' },
];

export default function ExportadoresHub() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Exportadores</h1>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Solicitar conexión</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Vinculados</p><p className="text-xl font-bold">{exportadores.filter(e => e.estado === 'activo').length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Pendientes</p><p className="text-xl font-bold">{exportadores.filter(e => e.estado === 'pendiente').length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Vol. total (sacos)</p><p className="text-xl font-bold">{exportadores.reduce((s, e) => s + e.volumenHistorico, 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Compliance EUDR</p><p className="text-xl font-bold">{Math.round((exportadores.filter(e => e.compliance === 'compliant').length / exportadores.length) * 100)}%</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Exportadores vinculados</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground text-left">
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">País</th>
                <th className="px-4 py-3 font-medium">Vol. histórico (sacos)</th>
                <th className="px-4 py-3 font-medium">EUDR</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr></thead>
              <tbody>
                {exportadores.map(e => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{e.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.pais}</td>
                    <td className="px-4 py-3">{e.volumenHistorico.toLocaleString()}</td>
                    <td className="px-4 py-3"><Badge variant={e.compliance === 'compliant' ? 'default' : 'secondary'}>{e.compliance}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={e.estado === 'activo' ? 'default' : 'outline'}>{e.estado}</Badge></td>
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
