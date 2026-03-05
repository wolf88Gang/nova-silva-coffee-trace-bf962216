import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ROL_INTERNO_LABELS,
  DEFAULT_PERMISSIONS_BY_ROLE,
  PERMISSION_LABELS,
  getPermissionGroupsForOrgType,
  type RolInterno,
  type PermissionKey,
  type PermissionDefaults,
} from '@/config/orgPermissions';
import { useAddOrganizacionUsuario } from '@/hooks/useOrganizacionUsuarios';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizacionId: string;
  orgTipo: string | null | undefined;
}

export function AddOrgUserDialog({ open, onOpenChange, organizacionId, orgTipo }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rolVisible, setRolVisible] = useState('');
  const [rolInterno, setRolInterno] = useState<RolInterno>('viewer');
  const [permisos, setPermisos] = useState<PermissionDefaults>({ ...DEFAULT_PERMISSIONS_BY_ROLE.viewer });

  const addMutation = useAddOrganizacionUsuario();
  const groups = getPermissionGroupsForOrgType(orgTipo);

  function handleRolChange(rol: RolInterno) {
    setRolInterno(rol);
    setPermisos({ ...DEFAULT_PERMISSIONS_BY_ROLE[rol] });
  }

  function togglePermiso(key: PermissionKey) {
    setPermisos((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) return;
    await addMutation.mutateAsync({
      organizacionId,
      email: email.trim(),
      name: name.trim(),
      rolInterno,
      rolVisible: rolVisible.trim() || undefined,
      permisos,
    });
    // Reset
    setName('');
    setEmail('');
    setRolVisible('');
    setRolInterno('viewer');
    setPermisos({ ...DEFAULT_PERMISSIONS_BY_ROLE.viewer });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invitar nuevo miembro</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="add-name">Nombre completo *</Label>
            <Input id="add-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Sandra Mejía" />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="add-email">Correo electrónico *</Label>
            <Input id="add-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sandra@organizacion.com" />
          </div>

          {/* Rol visible */}
          <div className="space-y-1.5">
            <Label htmlFor="add-rol-visible">Nombre del rol (visible)</Label>
            <Input id="add-rol-visible" value={rolVisible} onChange={(e) => setRolVisible(e.target.value)} placeholder="Ej: Jefa de certificaciones" />
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
          <Button onClick={handleSubmit} disabled={addMutation.isPending || !name.trim() || !email.trim()}>
            {addMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Invitar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
