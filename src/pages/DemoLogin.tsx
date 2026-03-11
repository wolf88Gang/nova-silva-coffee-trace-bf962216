import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronLeft, ChevronRight, Building2, Sprout, Truck, ShieldCheck, Crown, Users, Map, Shield, Leaf, Package, DollarSign, Bug, Award, AlertTriangle, Settings, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';
import logoNovasilva from '@/assets/logo-novasilva.png';
import bgTerraces from '@/assets/bg-terraces.jpg';
import { cn } from '@/lib/utils';

// ── DATA MODEL ──

interface DemoProfile {
  id: string;
  label: string;
  description: string;
  /** The actual demo email credential */
  email: string;
  /** The role used for ensure-demo-user and redirect */
  role: UserRole;
  /** Modules/areas this profile accesses */
  accessAreas: string[];
}

interface DemoOrganization {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  country: string;
  stats: string;
  modules: string[];
  profiles: DemoProfile[];
  icon: React.ElementType;
}

interface OrgCategory {
  label: string;
  icon: React.ElementType;
  orgs: DemoOrganization[];
}

const DEMO_ORGS: DemoOrganization[] = [
  {
    id: 'coop-montes-verdes',
    name: 'Cooperativa Montes Verdes',
    type: 'cooperativa',
    typeLabel: 'Cooperativa',
    country: 'Costa Rica',
    stats: '420 socios · 860 parcelas',
    modules: ['Producción', 'Nutrición', 'Nova Guard', 'VITAL', 'EUDR', 'Finanzas', 'Nova Cup'],
    icon: Building2,
    profiles: [
      {
        id: 'coop-gerencia',
        label: 'Gerencia cooperativa',
        description: 'Visión completa de operaciones, finanzas y cumplimiento.',
        email: 'demo.cooperativa@novasilva.com',
        role: 'cooperativa',
        accessAreas: ['Producción', 'Agronomía', 'Resiliencia', 'Cumplimiento', 'Finanzas', 'Administración'],
      },
      {
        id: 'coop-tecnico',
        label: 'Técnico de campo',
        description: 'Registra visitas, ejecuta diagnósticos, revisa nutrición y captura evidencia.',
        email: 'demo.tecnico@novasilva.com',
        role: 'tecnico',
        accessAreas: ['Producción', 'Agronomía', 'Resiliencia', 'Agenda'],
      },
    ],
  },
  {
    id: 'finca-santa-elena',
    name: 'Finca Santa Elena',
    type: 'productor',
    typeLabel: 'Productor privado',
    country: 'Costa Rica',
    stats: '74 ha · 12 parcelas',
    modules: ['Producción', 'Nutrición', 'Nova Guard', 'VITAL'],
    icon: Sprout,
    profiles: [
      {
        id: 'prod-propietario',
        label: 'Propietario',
        description: 'Gestión completa de la finca, parcelas, entregas y finanzas personales.',
        email: 'demo.productor@novasilva.com',
        role: 'productor',
        accessAreas: ['Mi Finca', 'Agronomía', 'Resiliencia', 'Finanzas'],
      },
    ],
  },
  {
    id: 'exp-altura-verde',
    name: 'Exportadora Altura Verde',
    type: 'exportador',
    typeLabel: 'Casa de Exportación',
    country: 'Costa Rica',
    stats: '38 proveedores · 12 contratos activos',
    modules: ['Orígenes', 'Lotes', 'Contratos', 'EUDR', 'Finanzas'],
    icon: Truck,
    profiles: [
      {
        id: 'exp-gerencia',
        label: 'Gerente de origen',
        description: 'Gestiona proveedores, lotes comerciales, contratos y embarques.',
        email: 'demo.exportador@novasilva.com',
        role: 'exportador',
        accessAreas: ['Orígenes', 'Comercial', 'Cumplimiento', 'Finanzas'],
      },
    ],
  },
  {
    id: 'cert-auditlatam',
    name: 'AuditLatam',
    type: 'certificadora',
    typeLabel: 'Certificadora',
    country: 'Regional',
    stats: '24 organizaciones auditadas',
    modules: ['Auditorías', 'Data Room', 'Reportes'],
    icon: ShieldCheck,
    profiles: [
      {
        id: 'cert-auditor',
        label: 'Auditor líder',
        description: 'Revisa evidencia, verifica cumplimiento y genera reportes de auditoría.',
        email: 'demo.certificadora@novasilva.com',
        role: 'certificadora',
        accessAreas: ['Auditorías', 'Data Room', 'Reportes'],
      },
    ],
  },
  {
    id: 'admin-novasilva',
    name: 'Nova Silva Admin',
    type: 'admin',
    typeLabel: 'Plataforma',
    country: '',
    stats: 'Administración transversal',
    modules: ['Organizaciones', 'Usuarios', 'Catálogos', 'Billing'],
    icon: Crown,
    profiles: [
      {
        id: 'admin-platform',
        label: 'Platform Admin',
        description: 'Consola transversal de administración, billing y soporte.',
        email: 'info@novasilva.co',
        role: 'admin',
        accessAreas: ['Organizaciones', 'Usuarios', 'Catálogos'],
      },
    ],
  },
];

function groupOrgsByCategory(orgs: DemoOrganization[]): OrgCategory[] {
  const categories: OrgCategory[] = [
    { label: 'Cooperativas', icon: Building2, orgs: [] },
    { label: 'Fincas Privadas', icon: Sprout, orgs: [] },
    { label: 'Exportadores', icon: Truck, orgs: [] },
    { label: 'Certificadoras', icon: ShieldCheck, orgs: [] },
    { label: 'Plataforma', icon: Crown, orgs: [] },
  ];

  const typeMap: Record<string, number> = {
    cooperativa: 0,
    productor: 1,
    exportador: 2,
    certificadora: 3,
    admin: 4,
  };

  orgs.forEach(org => {
    const idx = typeMap[org.type] ?? 4;
    categories[idx].orgs.push(org);
  });

  return categories.filter(c => c.orgs.length > 0);
}

const ROLE_REDIRECTS: Record<string, string> = {
  cooperativa: '/cooperativa/dashboard',
  exportador: '/exportador/dashboard',
  certificadora: '/certificadora/dashboard',
  productor: '/productor/dashboard',
  tecnico: '/tecnico/dashboard',
  admin: '/admin',
};

// ── COMPONENT ──

type Step = 'org' | 'profile' | 'confirm';

const DemoLogin = () => {
  const [step, setStep] = useState<Step>('org');
  const [selectedOrg, setSelectedOrg] = useState<DemoOrganization | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<DemoProfile | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const pendingRedirect = useRef<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user && pendingRedirect.current) {
      const dest = pendingRedirect.current;
      pendingRedirect.current = null;
      setLoadingRole(null);
      navigate(dest);
    }
  }, [isAuthenticated, user, navigate]);

  const handleSelectOrg = (org: DemoOrganization) => {
    setSelectedOrg(org);
    setSelectedProfile(null);
    // If org has only one profile, auto-select it
    if (org.profiles.length === 1) {
      setSelectedProfile(org.profiles[0]);
      setStep('confirm');
    } else {
      setStep('profile');
    }
  };

  const handleSelectProfile = (profile: DemoProfile) => {
    setSelectedProfile(profile);
    setStep('confirm');
  };

  const handleBack = () => {
    if (step === 'confirm') {
      if (selectedOrg && selectedOrg.profiles.length > 1) {
        setStep('profile');
      } else {
        setStep('org');
        setSelectedOrg(null);
        setSelectedProfile(null);
      }
    } else if (step === 'profile') {
      setStep('org');
      setSelectedOrg(null);
      setSelectedProfile(null);
    }
  };

  const handleEnter = async () => {
    if (!selectedProfile || !selectedOrg) return;
    setLoadingRole(selectedProfile.role);

    try {
      const SUPABASE_URL = 'https://qbwmsarqewxjuwgkdfmg.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFid21zYXJxZXd4anV3Z2tkZm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDgyMjEsImV4cCI6MjA4MTMyNDIyMX0.fU8aFFLy07GaPZn_7namja1LLL2pCk4ohP-eJjEJUps';

      if (selectedProfile.role !== 'admin') {
        try {
          const res = await fetch(`${SUPABASE_URL}/functions/v1/ensure-demo-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ role: selectedProfile.role }),
          });
          const data = await res.json();
          if (!res.ok) console.warn('ensure-demo-user warning:', data);
        } catch (fnErr) {
          console.warn('ensure-demo-user fetch error:', fnErr);
        }
      }

      pendingRedirect.current = ROLE_REDIRECTS[selectedProfile.role] || '/';

      const { error } = await supabase.auth.signInWithPassword({
        email: selectedProfile.email,
        password: 'demo123456',
      });

      if (error) {
        pendingRedirect.current = null;
        toast({ title: 'Error de autenticación', description: error.message, variant: 'destructive' });
        setLoadingRole(null);
        return;
      }
    } catch (err) {
      console.error('Demo login error:', err);
      pendingRedirect.current = null;
      toast({ title: 'Error', description: 'Error de conexión. Intenta de nuevo.', variant: 'destructive' });
      setLoadingRole(null);
    }
  };

  const categories = groupOrgsByCategory(DEMO_ORGS);

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

        {/* Hero text */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center mb-2 max-w-3xl leading-tight">
          Nova Silva Demo
        </h1>
        <p className="text-white/50 text-center mb-8 max-w-xl text-sm">
          {step === 'org' && 'Explore la plataforma desde la perspectiva de una organización real. Seleccione una organización demo para comenzar.'}
          {step === 'profile' && `Seleccione un perfil de acceso dentro de ${selectedOrg?.name}.`}
          {step === 'confirm' && 'Revise su selección antes de ingresar al entorno demo.'}
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(['org', 'profile', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'h-2 rounded-full transition-all',
                step === s ? 'w-8 bg-[hsl(var(--accent-orange))]' : 'w-2 bg-white/20'
              )} />
            </div>
          ))}
        </div>

        {/* Back button */}
        {step !== 'org' && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Volver</span>
          </button>
        )}

        {/* STEP 1: Organization selection */}
        {step === 'org' && (
          <div className="w-full max-w-3xl space-y-6">
            {categories.map(cat => (
              <div key={cat.label}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <cat.icon className="h-4 w-4 text-white/40" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">{cat.label}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cat.orgs.map(org => {
                    const OrgIcon = org.icon;
                    return (
                      <button
                        key={org.id}
                        onClick={() => handleSelectOrg(org)}
                        className="group bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl p-5 text-left hover:bg-white/12 hover:border-[hsl(var(--accent-orange))]/40 transition-all duration-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-[hsl(var(--accent-orange))]/10 group-hover:bg-[hsl(var(--accent-orange))]/20 transition-colors shrink-0">
                            <OrgIcon className="h-5 w-5 text-[hsl(var(--accent-orange))]" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-white font-semibold text-sm mb-0.5">{org.name}</h3>
                            <p className="text-white/40 text-xs mb-2">{org.typeLabel}{org.country ? ` · ${org.country}` : ''}</p>
                            <p className="text-white/30 text-xs">{org.stats}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 shrink-0 mt-1 transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 2: Profile selection */}
        {step === 'profile' && selectedOrg && (
          <div className="w-full max-w-xl space-y-4">
            {/* Org context card */}
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 mb-2">
              <div className="flex items-center gap-3">
                <selectedOrg.icon className="h-5 w-5 text-[hsl(var(--accent-orange))]" />
                <div>
                  <p className="text-white font-medium text-sm">{selectedOrg.name}</p>
                  <p className="text-white/40 text-xs">{selectedOrg.typeLabel} · {selectedOrg.stats}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {selectedOrg.modules.map(mod => (
                  <span key={mod} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">{mod}</span>
                ))}
              </div>
            </div>

            {/* Profiles */}
            <div className="space-y-3">
              {selectedOrg.profiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile)}
                  className="group w-full bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl p-5 text-left hover:bg-white/12 hover:border-[hsl(var(--accent-orange))]/40 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold text-sm">{profile.label}</h3>
                    <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
                  </div>
                  <p className="text-white/40 text-xs mb-3">{profile.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.accessAreas.map(area => (
                      <span key={area} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">{area}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Confirmation */}
        {step === 'confirm' && selectedOrg && selectedProfile && (
          <div className="w-full max-w-md">
            <div className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-6 space-y-5">
              {/* Org */}
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Organización</p>
                <div className="flex items-center gap-2">
                  <selectedOrg.icon className="h-4 w-4 text-[hsl(var(--accent-orange))]" />
                  <span className="text-white font-medium text-sm">{selectedOrg.name}</span>
                </div>
                <p className="text-white/30 text-xs mt-0.5">{selectedOrg.typeLabel}{selectedOrg.country ? ` · ${selectedOrg.country}` : ''}</p>
              </div>

              {/* Profile */}
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Perfil de acceso</p>
                <p className="text-white font-medium text-sm">{selectedProfile.label}</p>
                <p className="text-white/30 text-xs mt-0.5">{selectedProfile.description}</p>
              </div>

              {/* Access areas */}
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Acceso principal</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProfile.accessAreas.map(area => (
                    <span key={area} className="text-xs px-2.5 py-1 rounded-full bg-[hsl(var(--accent-orange))]/15 text-[hsl(var(--accent-orange))]">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Enter button */}
              <button
                onClick={handleEnter}
                disabled={loadingRole !== null}
                className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingRole ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Ingresando…</span>
                  </>
                ) : (
                  <span>Entrar al entorno demo</span>
                )}
              </button>
            </div>

            <p className="text-white/20 text-xs text-center mt-4">
              Datos ficticios para demostración
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DemoLogin;
