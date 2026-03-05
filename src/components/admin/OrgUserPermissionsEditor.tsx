import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  ROL_INTERNO_LABELS,
  DEFAULT_PERMISSIONS_BY_ROLE,
  PERMISSION_LABELS,
  getPermissionGroupsForOrgType,
  PERMISSION_KEYS,
  type RolInterno,
  type PermissionKey,
} from '@/config/orgPermissions';
import { useUpdateOrganizacionUsuario, type OrganizacionUsuario } from '@/hooks/useOrganizacionUsuarios';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: OrganizacionUsuario | null;
  orgTipo: string | null | undefined;
}

export function OrgUserPermissionsEditor({ open, onOpenChange, usuario, orgTipo }: Props) {
  const [rolInterno, setRolInterno] = useState<RolInterno>('viewer');
  const [activo, setActivo] = useState(true);
  const [permisos, setPermisos] = useState<Record<PermissionKey, boolean>>(
    () => ({ ...DEFAULT_PERMISSIONS_BY_ROLE.viewer })
  );

  const updateMutation = useUpdateOrganizacionUsuario();
  const groups = getPermissionGroupsForOrgType(orgTipo);

  // Sync state when usuario changes
  useEffect(() => {
    if (!usuario) return;
    setRolInterno(usuario.rol_interno);
    setActivo(usuario.activo);
    const p: Record<PermissionKey, boolean> = {} as any;
    for (const k of PERMISSION_KEYS) {
      p[k] = usuario[k];
    }
    setPermisos(p);
  }, [usuario]);

  function handleRolChange(rol: RolInterno) {
    setRolInterno(rol);
    setPermisos({ ...DEFAULT_PERMISSIONS_BY_ROLE[rol] });
  }

  function togglePermiso(key: PermissionKey) {
    setPermisos((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    if (!usuario) return;
    await updateMutation.mutateAsync({
      id: usuario.id,
      organizacionId: usuario.organizacion_id,
      rolInterno,
      activo,
      permisos,
    });
    onOpenChange(false);
  }

  if (!usuario) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar permisos — {usuario.user_name || usuario.user_email || 'Usuario'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <Label>Cuenta activa</Label>
            <Switch checked={activo} onCheckedChange={setActivo} />
          </div>

          {/* Rol interno */}
          <div className="space-y-1.5">
            <Label>Tipo de acceso</Label>
            <Select value={rolInterno} onValueChange={(v) => handleRolChange(v as RolInterno)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ROL_INTERNO_LABELS) as RolInterno[]).map((r) => (
                  <SelectItem key={r} value={r}>{ROL_INTERNO_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Cambiar el tipo de acceso resetea los permisos a valores por defecto.</p>
          </div>

          {/* Permission checkboxes */}
          <div className="space-y-4 pt-2">
            <Label className="text-sm font-semibold text-foreground">Permisos por módulo</Label>
            {groups.map((g) => (
              <div key={g.label} className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{g.label}</p>
                {g.permissions.map((pk) => (
                  <label key={pk} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={permisos[pk]} onCheckedChange={() => togglePermiso(pk)} />
                    <span className="text-sm">{PERMISSION_LABELS[pk]}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
