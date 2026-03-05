import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  User, Mail, Building2, Shield, Calendar, MapPin, Phone,
  Lock, Save, CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function MiPerfil() {
  const { user } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editing, setEditing] = useState(false);
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
