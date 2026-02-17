import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Leaf, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';
import { ORGANIZATION_TYPE_LABELS } from '@/lib/roles';

const REGISTRABLE_ROLES: UserRole[] = ['cooperativa', 'exportador', 'productor'];

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('cooperativa');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await signUp(email, password, name, role, organizationName);
    setLoading(false);
    if (result.success) {
      toast({ title: 'Cuenta creada', description: 'Revisa tu correo electrónico para confirmar tu cuenta.' });
      navigate('/login');
    } else {
      toast({ title: 'Error al registrarse', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>Regístrate en Nova Silva</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de organización</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REGISTRABLE_ROLES.map(r => (
                    <SelectItem key={r} value={r}>{ORGANIZATION_TYPE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="org">Nombre de la organización</Label>
              <Input id="org" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Mi Cooperativa" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crear cuenta
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>¿Ya tienes cuenta? <Link to="/login" className="text-primary hover:underline">Inicia sesión</Link></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
