import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  User, Mail, Building2, Shield, Calendar, MapPin, Phone,
  Lock, Save, CheckCircle, Package, DollarSign,
  Users, Map, Truck, Package as PackageIcon, BarChart3, ShieldCheck, Heart,
  CreditCard, HardHat, Boxes, MessageSquare, Scale, Leaf, FileCheck, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgContext } from '@/hooks/useOrgContext';
import { type OrgModule, getOrgDefaultModules } from '@/lib/org-modules';

const MODULE_META: Record<string, { label: string; icon: React.ElementType; price: string }> = {
  productores: { label: 'Gestión de Actores', icon: Users, price: '$15/mes' },
  parcelas: { label: 'Parcelas y Mapas', icon: Map, price: '$12/mes' },
  entregas: { label: 'Entregas de Campo', icon: Truck, price: '$10/mes' },
  lotes_acopio: { label: 'Lotes de Acopio', icon: PackageIcon, price: '$10/mes' },
  lotes_comerciales: { label: 'Lotes Comerciales', icon: BarChart3, price: '$18/mes' },
  contratos: { label: 'Contratos', icon: FileCheck, price: '$15/mes' },
  calidad: { label: 'Calidad / Nova Cup', icon: Sparkles, price: '$20/mes' },
  vital: { label: 'Protocolo VITAL', icon: Heart, price: '$25/mes' },
  eudr: { label: 'Cumplimiento EUDR', icon: ShieldCheck, price: '$30/mes' },
  finanzas: { label: 'Finanzas', icon: DollarSign, price: '$12/mes' },
  creditos: { label: 'Créditos', icon: CreditCard, price: '$18/mes' },
  jornales: { label: 'Jornales', icon: HardHat, price: '$8/mes' },
  inventario: { label: 'Inventario', icon: Boxes, price: '$8/mes' },
  mensajes: { label: 'Mensajes', icon: MessageSquare, price: '$5/mes' },
  inclusion: { label: 'Inclusión y Equidad', icon: Scale, price: '$10/mes' },
  nutricion: { label: 'Nutrición Vegetal', icon: Leaf, price: '$25/mes' },
};

const TOGGLEABLE: OrgModule[] = [
  'productores', 'parcelas', 'entregas', 'lotes_acopio', 'lotes_comerciales',
  'contratos', 'calidad', 'vital', 'eudr', 'finanzas', 'creditos',
  'jornales', 'inventario', 'mensajes', 'inclusion', 'nutricion',
];

export default function MiPerfil() {
  const { user } = useAuth();
  const { activeModules, orgTipo } = useOrgContext();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editing, setEditing] = useState(false);
  const [localModules, setLocalModules] = useState<OrgModule[]>(
    activeModules.filter((m): m is OrgModule => m !== 'core')
  );
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: '',
    location: '',
  });

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const rolLabel: Record<string, string> = {
    cooperativa: 'Administrador de Cooperativa',
    productor: 'Productor',
    tecnico: 'Técnico de Campo',
    exportador: 'Exportador',
    certificadora: 'Certificadora',
    admin: 'Administrador de Plataforma',
  };

  const handleSave = () => {
    toast.success('Perfil actualizado correctamente');
    setEditing(false);
  };

  const handleChangePassword = () => {
    toast.success('Instrucciones enviadas a tu correo electrónico');
    setShowChangePassword(false);
  };

  const toggleModule = (mod: OrgModule) => {
    setLocalModules(prev =>
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    );
    toast.success(`Módulo ${MODULE_META[mod]?.label || mod} ${localModules.includes(mod) ? 'desactivado' : 'activado'}`);
  };

  const defaults = getOrgDefaultModules(orgTipo).filter((m): m is OrgModule => m !== 'core');
  const totalPrice = localModules.reduce((sum, mod) => {
    const meta = MODULE_META[mod];
    if (!meta) return sum;
    const num = parseInt(meta.price.replace(/[^0-9]/g, ''));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Profile header */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20 text-2xl">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{user?.name || 'Usuario'}</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="default">{rolLabel[user?.role || ''] || user?.role}</Badge>
                {user?.organizationName && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {user.organizationName}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={() => setEditing(!editing)}>
              {editing ? 'Cancelar' : 'Editar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Nombre completo</Label>
              {editing ? (
                <Input value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} />
              ) : (
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> Correo electrónico
              </Label>
              <p className="text-sm font-medium text-foreground">{user?.email}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" /> Teléfono
              </Label>
              {editing ? (
                <Input value={form.phone} onChange={e => setForm(s => ({ ...s, phone: e.target.value }))} placeholder="+502 0000 0000" />
              ) : (
                <p className="text-sm text-muted-foreground">No registrado</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Ubicación
              </Label>
              {editing ? (
                <Input value={form.location} onChange={e => setForm(s => ({ ...s, location: e.target.value }))} placeholder="Ej: San Marcos, Guatemala" />
              ) : (
                <p className="text-sm text-muted-foreground">No registrada</p>
              )}
            </div>
            {editing && (
              <Button className="w-full" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" /> Guardar Cambios
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Account info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Cuenta y Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Rol en la plataforma</Label>
              <p className="text-sm font-medium text-foreground">{rolLabel[user?.role || ''] || user?.role}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Organización</Label>
              <p className="text-sm font-medium text-foreground">{user?.organizationName || 'No asignada'}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Miembro desde
              </Label>
              <p className="text-sm text-muted-foreground">2025</p>
            </div>
            <Separator />
            <Button variant="outline" className="w-full" onClick={() => setShowChangePassword(true)}>
              <Lock className="h-4 w-4 mr-1" /> Cambiar Contraseña
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ═══ MÓDULOS ADDON ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Módulos Activos
            </CardTitle>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-bold text-primary">${totalPrice}/mes</span>
              <span className="text-xs text-muted-foreground">· {localModules.length} módulos</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {TOGGLEABLE.map(mod => {
            const meta = MODULE_META[mod];
            if (!meta) return null;
            const active = localModules.includes(mod);
            const recommended = defaults.includes(mod);
            const Icon = meta.icon;
            return (
              <div
                key={mod}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  active ? 'border-primary/30 bg-primary/5' : 'border-border'
                }`}
              >
                <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{meta.label}</span>
                    {recommended && <Badge variant="outline" className="text-[9px] py-0 px-1">Recomendado</Badge>}
                  </div>
                  <span className="text-xs text-primary font-semibold">{meta.price}</span>
                </div>
                <Switch checked={active} onCheckedChange={() => toggleModule(mod)} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Session info */}
      <Card className="border-muted">
        <CardContent className="py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-primary" /> Sesión activa · Última actividad: hoy
          </span>
          <span>ID: {user?.id?.slice(0, 8) || 'demo'}…</span>
        </CardContent>
      </Card>

      {/* Change password dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> Cambiar Contraseña
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Se enviará un enlace de restablecimiento a tu correo electrónico registrado.
            </p>
            <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <Mail className="h-4 w-4 inline mr-1" /> {user?.email}
            </div>
            <Button className="w-full" onClick={handleChangePassword}>
              Enviar Enlace de Restablecimiento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
