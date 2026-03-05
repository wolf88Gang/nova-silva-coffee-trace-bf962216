import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Building2, Users, Bell, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';

const teamMembers = [
  { id: '1', nombre: 'Carlos Mendoza', email: 'carlos@solamerica.co', rol: 'Administrador', estado: 'activo' },
  { id: '2', nombre: 'Laura Vega', email: 'laura@solamerica.co', rol: 'Operaciones', estado: 'activo' },
  { id: '3', nombre: 'Roberto Paz', email: 'roberto@solamerica.co', rol: 'Calidad', estado: 'activo' },
  { id: '4', nombre: 'Sofía Herrera', email: 'sofia@solamerica.co', rol: 'Comercial', estado: 'inactivo' },
];

export default function ExportadorConfiguracion() {
  const [notifications, setNotifications] = useState({ embarques: true, contratos: true, eudr: true, calidad: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Administración
        </h1>
        <p className="text-sm text-muted-foreground">Configuración de la organización exportadora</p>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList>
          <TabsTrigger value="empresa"><Building2 className="h-3.5 w-3.5 mr-1" /> Empresa</TabsTrigger>
          <TabsTrigger value="equipo"><Users className="h-3.5 w-3.5 mr-1" /> Equipo</TabsTrigger>
          <TabsTrigger value="notificaciones"><Bell className="h-3.5 w-3.5 mr-1" /> Notificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Datos de la Empresa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Razón social</Label><Input defaultValue="Exportadora Sol de América S.A." /></div>
                <div className="space-y-2"><Label>NIT / RUC</Label><Input defaultValue="1234567-8" /></div>
                <div className="space-y-2"><Label>País</Label><Input defaultValue="Colombia" /></div>
                <div className="space-y-2"><Label>Ciudad</Label><Input defaultValue="Bogotá" /></div>
                <div className="space-y-2"><Label>Teléfono</Label><Input defaultValue="+57 1 234 5678" /></div>
                <div className="space-y-2"><Label>Sitio web</Label><Input defaultValue="www.solamerica.co" /></div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Licencia de exportación</Label><Input defaultValue="EXP-CO-2025-0847" /></div>
                <div className="space-y-2"><Label>Registro ICO</Label><Input defaultValue="ICO-0812" /></div>
              </div>
              <Button onClick={() => toast.success('Datos actualizados')}><Save className="h-4 w-4 mr-1" /> Guardar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipo" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Equipo ({teamMembers.length})</CardTitle>
                <Button size="sm" onClick={() => toast.info('Invitación enviada (demo)')}><Users className="h-4 w-4 mr-1" /> Invitar</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr></thead>
                <tbody>
                  {teamMembers.map(m => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium text-foreground">{m.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{m.rol}</Badge></td>
                      <td className="px-4 py-3">
                        <Badge variant={m.estado === 'activo' ? 'default' : 'secondary'}>
                          {m.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificaciones" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Preferencias de Notificación</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'embarques' as const, label: 'Embarques', desc: 'Actualizaciones de estado de contenedores y ETAs' },
                { key: 'contratos' as const, label: 'Contratos', desc: 'Vencimientos, ejecución y nuevas negociaciones' },
                { key: 'eudr' as const, label: 'EUDR Compliance', desc: 'Alertas de cumplimiento y due diligence' },
                { key: 'calidad' as const, label: 'Calidad', desc: 'Resultados de catación y alertas de variación' },
              ].map(n => (
                <div key={n.key} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{n.label}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <Switch checked={notifications[n.key]} onCheckedChange={v => setNotifications(s => ({ ...s, [n.key]: v }))} />
                </div>
              ))}
              <Button onClick={() => toast.success('Preferencias guardadas')}><Save className="h-4 w-4 mr-1" /> Guardar</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
