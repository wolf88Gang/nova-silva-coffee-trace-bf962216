import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Sprout, Wrench, Building2, Truck, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';
import logoNovasilva from '@/assets/logo-novasilva.png';
import bgTerraces from '@/assets/bg-terraces.jpg';


interface DemoRole {
  role: UserRole;
  email: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const DEMO_ROLES: DemoRole[] = [
  { role: 'productor', email: 'demo.productor@novasilva.com', label: 'Productor', description: 'Agricultor de café', icon: Sprout },
  { role: 'tecnico', email: 'demo.tecnico@novasilva.com', label: 'Técnico', description: 'Asistente técnico de campo', icon: Wrench },
  { role: 'cooperativa', email: 'demo.cooperativa@novasilva.com', label: 'Cooperativa', description: 'Gestión de cooperativa', icon: Building2 },
  { role: 'exportador', email: 'demo.exportador@novasilva.com', label: 'Exportador', description: 'Exportadora con EUDR', icon: Truck },
  { role: 'certificadora', email: 'demo.certificadora@novasilva.com', label: 'Certificadora', description: 'Auditoría y certificación', icon: ShieldCheck },
];

const ROLE_REDIRECTS: Record<string, string> = {
  cooperativa: '/cooperativa/dashboard',
  exportador: '/exportador/dashboard',
  certificadora: '/certificadora/dashboard',
  productor: '/productor/dashboard',
  tecnico: '/tecnico/dashboard',
};

const DemoLogin = () => {
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDemoLogin = async (demoRole: DemoRole) => {
    setLoadingRole(demoRole.role);
    try {
      // Step 1: Try to ensure demo user exists via edge function
      console.log('Calling ensure-demo-user with role:', demoRole.role);
      const { data, error: ensureError } = await supabase.functions.invoke('ensure-demo-user', {
        body: { role: demoRole.role },
      });

      console.log('Response data:', data);
      console.log('Response error:', ensureError);

      if (ensureError) {
        console.warn('ensure-demo-user warning (will try login anyway):', ensureError);
      }

      // Step 2: Sign in with password (works if user already exists)
      const { error } = await supabase.auth.signInWithPassword({
        email: demoRole.email,
        password: 'demo123456',
      });

      if (error) {
        toast({ title: 'Error de autenticación', description: `${error.message}. Verifica que la edge function ensure-demo-user esté desplegada correctamente.`, variant: 'destructive' });
        setLoadingRole(null);
        return;
      }

      // Step 3: Redirect
      navigate(ROLE_REDIRECTS[demoRole.role] || '/');
    } catch (err) {
      console.error('Demo login error:', err);
      toast({ title: 'Error', description: 'Error de conexión. Intenta de nuevo.', variant: 'destructive' });
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={bgTerraces} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src={logoNovasilva} alt="Nova Silva" className="h-10 w-10 object-contain" />
          <span className="text-white font-bold text-lg">Nova Silva</span>
        </div>
        <Link to="/login" className="text-white/60 hover:text-white text-sm transition-colors">
          Ir al login →
        </Link>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-12">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--accent-orange))] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(var(--accent-orange))]" />
          </span>
          <span className="text-white/80 text-xs font-medium">Entorno de Demostración</span>
        </div>

        {/* Hero */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-center mb-3 max-w-3xl leading-tight">
          Plataforma de Diligencia{' '}
          <span className="text-[hsl(var(--accent-orange))]">Debida Digital</span>
        </h1>
        <p className="text-white/50 text-center mb-10 max-w-xl text-sm sm:text-base">
          Selecciona un rol para explorar la plataforma de trazabilidad de café
        </p>

        {/* Role grid — 5 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full max-w-5xl">
          {DEMO_ROLES.map((dr) => {
            const Icon = dr.icon;
            const isLoading = loadingRole === dr.role;
            const isDisabled = loadingRole !== null;
            return (
              <button
                key={dr.role}
                onClick={() => handleDemoLogin(dr)}
                disabled={isDisabled}
                className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 text-left hover:bg-white/15 hover:border-[hsl(var(--accent-orange))]/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--accent-orange))]/15 group-hover:bg-[hsl(var(--accent-orange))]/25 transition-colors">
                    <Icon className="h-5 w-5 text-[hsl(var(--accent-orange))]" />
                  </div>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin text-white/60" />}
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{dr.label}</h3>
                <p className="text-white/40 text-xs">{dr.description}</p>
              </button>
            );
          })}
        </div>

        {/* Footer links */}
        <div className="mt-10 flex flex-col items-center gap-2">
          <p className="text-white/30 text-xs">
            Contraseña demo: <code className="text-white/50">demo123456</code>
          </p>
        </div>
      </main>
    </div>
  );
};

export default DemoLogin;
