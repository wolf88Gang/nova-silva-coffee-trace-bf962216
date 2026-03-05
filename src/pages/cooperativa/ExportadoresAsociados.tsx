/**
 * ExportadoresAsociados — Vista cooperativa para gestionar solicitudes y relaciones con exportadores
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Building2, CheckCircle, XCircle, Clock, Users, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface Relacion {
  id: string; exportadorNombre: string; pais: string; fechaSolicitud: string;
  estado: 'pendiente' | 'activo' | 'inactivo'; origen: string;
}

const relacionesIniciales: Relacion[] = [
  { id: '1', exportadorNombre: 'Volcafe S.A.', pais: 'Suiza', fechaSolicitud: '2026-01-15', estado: 'activo', origen: 'solicitud_exportador' },
  { id: '2', exportadorNombre: 'CECA Trading', pais: 'Guatemala', fechaSolicitud: '2026-02-01', estado: 'activo', origen: 'admin' },
  { id: '3', exportadorNombre: 'Nordic Approach', pais: 'Noruega', fechaSolicitud: '2026-02-20', estado: 'pendiente', origen: 'solicitud_exportador' },
  { id: '4', exportadorNombre: 'Mercon Coffee Group', pais: 'Holanda', fechaSolicitud: '2026-02-25', estado: 'pendiente', origen: 'solicitud_exportador' },
  { id: '5', exportadorNombre: 'Specialty Imports LLC', pais: 'USA', fechaSolicitud: '2025-11-10', estado: 'inactivo', origen: 'solicitud_exportador' },
];

export default function ExportadoresAsociados() {
  const [relaciones, setRelaciones] = useState(relacionesIniciales);

  const pendientes = relaciones.filter(r => r.estado === 'pendiente');
  const activas = relaciones.filter(r => r.estado === 'activo');
  const inactivas = relaciones.filter(r => r.estado === 'inactivo');

  const handleAceptar = (id: string) => {
    setRelaciones(prev => prev.map(r => r.id === id ? { ...r, estado: 'activo' as const } : r));
    toast.success('Solicitud aceptada. Exportador vinculado.');
  };
  const handleRechazar = (id: string) => {
    setRelaciones(prev => prev.map(r => r.id === id ? { ...r, estado: 'inactivo' as const } : r));
    toast.info('Solicitud rechazada.');
  };
  const handleToggle = (id: string) => {
    setRelaciones(prev => prev.map(r => r.id === id ? { ...r, estado: r.estado === 'activo' ? 'inactivo' as const : 'activo' as const } : r));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Exportadores Asociados</h1>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{pendientes.length} solicitudes pendientes</span>
        <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-primary" />{activas.length} relaciones activas</span>
        <span className="flex items-center gap-1"><XCircle className="h-4 w-4" />{inactivas.length} inactivas</span>
      </div>

      <Tabs defaultValue="solicitudes">
        <TabsList>
          <TabsTrigger value="solicitudes"><Clock className="h-4 w-4 mr-1" /> Solicitudes ({pendientes.length})</TabsTrigger>
          <TabsTrigger value="relaciones"><Building2 className="h-4 w-4 mr-1" /> Relaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="solicitudes" className="mt-4 space-y-3">
          {pendientes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay solicitudes pendientes</p>
          ) : pendientes.map(r => (
            <Card key={r.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-medium text-foreground">{r.exportadorNombre}</p>
                    <p className="text-xs text-muted-foreground">{r.pais} · Solicitado el {r.fechaSolicitud}</p>
                    <Badge variant="outline" className="text-xs mt-1">{r.origen === 'solicitud_exportador' ? 'Solicitud del exportador' : 'Registrado por admin'}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAceptar(r.id)}><CheckCircle className="h-4 w-4 mr-1" /> Aceptar</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRechazar(r.id)}><XCircle className="h-4 w-4 mr-1" /> Rechazar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="relaciones" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">Exportador</th>
                    <th className="px-4 py-3 font-medium">País</th>
                    <th className="px-4 py-3 font-medium">Desde</th>
                    <th className="px-4 py-3 font-medium">Origen</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Activo</th>
                  </tr></thead>
                  <tbody>
                    {[...activas, ...inactivas].map(r => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{r.exportadorNombre}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.pais}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.fechaSolicitud}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{r.origen === 'solicitud_exportador' ? 'Exportador' : 'Admin'}</Badge></td>
                        <td className="px-4 py-3"><Badge variant={r.estado === 'activo' ? 'default' : 'secondary'}>{r.estado === 'activo' ? 'Activo' : 'Inactivo'}</Badge></td>
                        <td className="px-4 py-3"><Switch checked={r.estado === 'activo'} onCheckedChange={() => handleToggle(r.id)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
