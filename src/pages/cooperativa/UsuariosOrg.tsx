import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Plus, Loader2, UserX } from 'lucide-react';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useOrganizacionUsuarios, useDeleteOrganizacionUsuario, type OrganizacionUsuario } from '@/hooks/useOrganizacionUsuarios';
import { ROL_INTERNO_LABELS, type RolInterno } from '@/config/orgPermissions';
import { AddOrgUserDialog } from '@/components/admin/AddOrgUserDialog';
import { OrgUserPermissionsEditor } from '@/components/admin/OrgUserPermissionsEditor';
import { RoleGuard } from '@/components/auth/RoleGuard';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function UsuariosOrg() {
  const { organizationId, orgTipo } = useOrgContext();
  const { data: usuarios, isLoading, isError } = useOrganizacionUsuarios(organizationId);
  const deleteMutation = useDeleteOrganizacionUsuario();

  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<OrganizacionUsuario | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Usuarios y permisos</h1>
        <RoleGuard allow={['cooperativa', 'exportador', 'admin']}>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Invitar miembro
          </Button>
        </RoleGuard>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <p>No se pudo cargar la lista de usuarios.</p>
              <p className="text-xs mt-1">La tabla <code>organizacion_usuarios</code> podría no existir aún. Ejecuta la migración correspondiente.</p>
            </div>
          ) : !usuarios?.length ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No hay miembros registrados aún. Invita al primer miembro del equipo.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.user_name || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{u.user_email || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {u.rol_visible || ROL_INTERNO_LABELS[u.rol_interno as RolInterno] || u.rol_interno}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.activo ? 'default' : 'secondary'}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditUser(u)} title="Editar permisos">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Eliminar miembro">
                            <UserX className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará a {u.user_name || 'este usuario'} de la organización. La cuenta de acceso no se eliminará.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate({ id: u.id, organizacionId: u.organizacion_id })}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {organizationId && (
        <AddOrgUserDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          organizacionId={organizationId}
          orgTipo={orgTipo}
        />
      )}
      <OrgUserPermissionsEditor
        open={!!editUser}
        onOpenChange={(v) => { if (!v) setEditUser(null); }}
        usuario={editUser}
        orgTipo={orgTipo}
      />
    </div>
  );
}
