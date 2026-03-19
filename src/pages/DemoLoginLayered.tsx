import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoContext } from '@/contexts/DemoContext';
import { supabase } from '@/integrations/supabase/client';
import { getOrgById, type DemoOrganization, type DemoProfile } from '@/config/demoArchitecture';
import { EMAIL_TO_LEGACY_ROLE } from '@/config/demoRedirects';
import { useDemoOrganizations } from '@/hooks/useDemoOrganizations';
import { useDemoProfiles } from '@/hooks/useDemoProfiles';
import { OrganizationSelector } from '@/components/demo/OrganizationSelector';
import { ProfileSelector } from '@/components/demo/ProfileSelector';
import { AccessSummary } from '@/components/demo/AccessSummary';
import { useToast } from '@/hooks/use-toast';
import logoNovasilva from '@/assets/logo-novasilva.png';
import bgTerraces from '@/assets/bg-terraces.jpg';
import { ChevronLeft } from 'lucide-react';

type Step = 'org' | 'profile' | 'confirm';

export default function DemoLoginLayered() {
  const [step, setStep] = useState<Step>('org');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<DemoProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pendingRedirect = useRef<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const err = (location.state as { error?: string })?.error;
    if (err) {
      toast({ title: 'Error', description: err, variant: 'destructive' });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, toast]);
  const { isAuthenticated, user } = useAuth();
  const { setDemoSession } = useDemoContext();
  const { data: orgsResult } = useDemoOrganizations();
  const { data: profilesResult } = useDemoProfiles(selectedOrgId, orgs);

  const orgs = orgsResult?.data ?? [];
  const profiles = profilesResult?.data ?? [];
  const org = selectedOrgId
    ? (orgs.find((o) => o.id === selectedOrgId) ?? getOrgById(selectedOrgId))
    : null;

  useEffect(() => {
    if (isAuthenticated && user && pendingRedirect.current) {
      const dest = pendingRedirect.current;
      pendingRedirect.current = null;
      setIsLoading(false);
      navigate(dest);
    }
  }, [isAuthenticated, user, navigate]);

  const handleOrgSelect = (orgId: string) => {
    setSelectedOrgId(orgId);
    setSelectedProfile(null);
    setStep('profile');
  };

  const handleProfileSelect = (profile: DemoProfile) => {
    setSelectedProfile(profile);
    setStep('confirm');
  };

  const handleBack = () => {
    if (step === 'profile') {
      setSelectedOrgId(null);
      setSelectedProfile(null);
      setStep('org');
    } else if (step === 'confirm') {
      setSelectedProfile(null);
      setStep('profile');
    }
  };

  const handleConfirm = async () => {
    if (!org || !selectedProfile) return;
    setDemoSession(org, selectedProfile);
    setIsLoading(true);
    try {
      const legacyRole = EMAIL_TO_LEGACY_ROLE[selectedProfile.email] ?? 'cooperativa';
      const { data, error: ensureError } = await supabase.functions.invoke('ensure-demo-user', {
        body: { role: legacyRole },
      });

      if (ensureError) {
        const msg = (data as { details?: string })?.details ?? ensureError.message ?? 'Error al preparar usuario demo';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      if (data && typeof data === 'object' && (data as { ok?: boolean }).ok === false) {
        const err = data as { error?: string; details?: string };
        toast({ title: 'Error', description: err.details ?? err.error ?? 'No se pudo preparar el usuario demo.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      const msg = (data as { message?: string })?.message;
      if (msg) toast({ title: 'Aviso', description: msg, variant: 'default' });

      pendingRedirect.current = '/dashboard';

      const { error } = await supabase.auth.signInWithPassword({
        email: selectedProfile.email,
        password: selectedProfile.password,
      });

      if (error) {
        pendingRedirect.current = null;
        toast({ title: 'Error de autenticación', description: error.message, variant: 'destructive' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de conexión. Intenta de nuevo.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      pendingRedirect.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles: Record<Step, string> = {
    org: 'Organización',
    profile: 'Perfil',
    confirm: 'Confirmar acceso',
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="absolute inset-0 z-0">
        <img src={bgTerraces} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src={logoNovasilva} alt="Nova Silva" className="h-10 w-10 object-contain" />
          <span className="text-white font-bold text-lg">Nova Silva</span>
        </div>
        <Link to="/login" className="text-white/60 hover:text-white text-sm transition-colors">
          Ir al login
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--accent-orange))] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(var(--accent-orange))]" />
          </span>
          <span className="text-white/80 text-xs font-medium">Entorno de Demostración</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
          Acceso por capas
        </h1>
        <p className="text-white/50 text-center mb-6 text-sm">
          {stepTitles[step]}
        </p>

        {step !== 'org' && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 text-white/60 hover:text-white text-sm mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </button>
        )}

        <div className="w-full max-w-2xl">
          {step === 'org' && (
            <OrganizationSelector
              organizations={orgs}
              selectedOrgId={selectedOrgId}
              onSelect={handleOrgSelect}
            />
          )}
          {step === 'profile' && selectedOrgId && (
            <ProfileSelector
              orgId={selectedOrgId}
              profiles={profiles}
              selectedProfileId={selectedProfile?.id ?? null}
              onSelect={handleProfileSelect}
            />
          )}
          {step === 'confirm' && org && selectedProfile && (
            <AccessSummary
              org={org}
              profile={selectedProfile}
              onConfirm={handleConfirm}
              isLoading={isLoading}
            />
          )}
        </div>

        <p className="mt-8 text-white/30 text-xs">
          Contraseña demo: <code className="text-white/50">demo123456</code>
        </p>
      </main>
    </div>
  );
}
