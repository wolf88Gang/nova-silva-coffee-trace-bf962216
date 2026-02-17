import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, Building2, Truck, ShieldCheck, Sprout, Wrench, Settings } from 'lucide-react';
import { UserRole } from '@/types';
import { ORGANIZATION_TYPE_LABELS } from '@/lib/roles';

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  cooperativa: Building2,
  exportador: Truck,
  certificadora: ShieldCheck,
  productor: Sprout,
  tecnico: Wrench,
  admin: Settings,
};

const ROLE_REDIRECTS: Record<UserRole, string> = {
  cooperativa: '/cooperativa/dashboard',
  exportador: '/exportador/dashboard',
  certificadora: '/certificadora/dashboard',
  productor: '/productor/dashboard',
  tecnico: '/tecnico/dashboard',
  admin: '/admin',
};

const DemoLogin = () => {
  const { loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleDemo = (role: UserRole) => {
    loginAsDemo(role);
    navigate(ROLE_REDIRECTS[role]);
  };

  const roles = Object.keys(DEMO_USERS) as UserRole[];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Nova Silva — Demo</h1>
          <p className="text-muted-foreground mt-2">Selecciona un rol para explorar la plataforma</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => {
            const demo = DEMO_USERS[role];
            if (!demo) return null;
            const Icon = ROLE_ICONS[role];
            return (
              <Card key={role} className="cursor-pointer hover:shadow-lg transition-shadow border-border hover:border-accent/50" onClick={() => handleDemo(role)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{ORGANIZATION_TYPE_LABELS[role]}</CardTitle>
                      <CardDescription className="text-xs">{demo.name}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">{demo.organizationName}</p>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Ingresar como {ORGANIZATION_TYPE_LABELS[role]}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="text-center mt-6">
          <Button variant="link" onClick={() => navigate('/login')}>
            Ir al login real →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DemoLogin;
