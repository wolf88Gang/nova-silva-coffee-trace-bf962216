import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, Plus, Settings } from 'lucide-react';

const usuarios = [
  { id: '1', nombre: 'María García', email: 'maria@cooperativa.com', rol: 'admin', estado: 'activo' },
  { id: '2', nombre: 'Roberto Flores', email: 'roberto@cooperativa.com', rol: 'warehouse', estado: 'activo' },
  { id: '3', nombre: 'Sandra Paz', email: 'sandra@cooperativa.com', rol: 'compliance', estado: 'activo' },
  { id: '4', nombre: 'Carlos Mejía', email: 'carlos@cooperativa.com', rol: 'field_tech', estado: 'activo' },
  { id: '5', nombre: 'Ana Torres', email: 'ana@cooperativa.com', rol: 'viewer', estado: 'inactivo' },
];

const rolLabel: Record<string, string> = { admin: 'Administrador', field_tech: 'Técnico', warehouse: 'Acopio', compliance: 'Cumplimiento', viewer: 'Consulta' };

export default function UsuariosOrg() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Usuarios y permisos</h1>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Invitar usuario</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground text-left">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr></thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{u.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{rolLabel[u.rol] || u.rol}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={u.estado === 'activo' ? 'default' : 'secondary'}>{u.estado}</Badge></td>
                    <td className="px-4 py-3"><Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button></td>
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
