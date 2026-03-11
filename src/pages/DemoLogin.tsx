import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronLeft, ChevronRight, Building2, Sprout, Truck, ShieldCheck, Crown, Users, Map, Shield, Leaf, Package, DollarSign, Bug, Award, AlertTriangle, Settings, Eye, Coffee, FileText, Briefcase, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';
import logoNovasilva from '@/assets/logo-novasilva.png';
import bgForest from '@/assets/bg-forest-network.png';
import { cn } from '@/lib/utils';

// ── DATA MODEL ──

interface DemoProfile {
  id: string;
  label: string;
  description: string;
  email: string;
  role: UserRole;
  accessAreas: string[];
}

interface DemoOrganization {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  country: string;
  description: string;
  stats: string[];
  modules: string[];
  profiles: DemoProfile[];
  icon: React.ElementType;
}

interface OrgCategory {
  label: string;
  icon: React.ElementType;
  orgs: DemoOrganization[];
}

// ── DEMO DATA ──

const DEMO_ORGS: DemoOrganization[] = [
  {
    id: 'coop_montes_verdes',
    name: 'Cooperativa Montes Verdes',
    type: 'cooperativa',
    typeLabel: 'Cooperativa',
    country: 'Costa Rica',
    description: 'Cooperativa cafetalera de altura con enfoque en trazabilidad y sostenibilidad.',
    stats: ['420 productores', '860 parcelas'],
    modules: ['Producción', 'Nutrición', 'Nova Guard', 'Nova Yield', 'VITAL', 'EUDR', 'Finanzas'],
    icon: Building2,
    profiles: [
      {
        id: 'coop-gerencia',
        label: 'Gerencia cooperativa',
        description: 'Vista estratégica de producción, cumplimiento y finanzas.',
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
    id: 'finca_santa_elena',
    name: 'Finca Santa Elena',
    type: 'productor',
    typeLabel: 'Productor privado',
    country: 'Costa Rica',
    description: 'Finca privada de café de especialidad con 12 parcelas en producción.',
    stats: ['74 ha', '12 parcelas'],
    modules: ['Producción', 'Nutrición', 'Nova Guard', 'Nova Yield', 'VITAL'],
    icon: Sprout,
    profiles: [
      {
        id: 'prod-propietario',
        label: 'Propietario',
        description: 'Gestión integral de la finca y resultados productivos.',
        email: 'demo.productor@novasilva.com',
        role: 'productor',
        accessAreas: ['Mi Finca', 'Agronomía', 'Resiliencia', 'Finanzas'],
      },
    ],
  },
  {
    id: 'exportadora_altura',
    name: 'Exportadora Altura Verde',
    type: 'exportador',
    typeLabel: 'Casa de Exportación',
    country: 'Costa Rica',
    description: 'Exportadora de café verde con red de proveedores en Centroamérica.',
    stats: ['38 proveedores', '12 contratos activos'],
    modules: ['Orígenes', 'Lotes', 'Contratos', 'Cumplimiento', 'Analítica', 'Finanzas'],
    icon: Truck,
    profiles: [
      {
        id: 'exp-gerencia',
        label: 'Gerente de origen',
        description: 'Gestión de proveedores, compras y oferta de café.',
        email: 'demo.exportador@novasilva.com',
        role: 'exportador',
        accessAreas: ['Orígenes', 'Comercial', 'Cumplimiento', 'Finanzas'],
      },
    ],
  },
  {
    id: 'auditlatam',
    name: 'AuditLatam',
    type: 'certificadora',
    typeLabel: 'Certificadora',
    country: 'Regional',
    description: 'Entidad de auditoría y verificación para certificaciones agrícolas.',
    stats: ['24 organizaciones auditadas'],
    modules: ['Auditorías', 'Data Room', 'Dossiers'],
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
    id: 'nova_admin',
    name: 'Nova Silva Platform',
    type: 'admin',
    typeLabel: 'Plataforma',
    country: '',
    description: 'Consola de administración transversal de la plataforma.',
    stats: ['Administración transversal'],
    modules: ['Organizaciones', 'Billing', 'Logs', 'Soporte'],
    icon: Crown,
    profiles: [
      {
        id: 'admin-platform',
        label: 'Platform Admin',
        description: 'Consola transversal de administración, billing y soporte.',
        email: 'info@novasilva.co',
        role: 'admin',
        accessAreas: ['Organizaciones', 'Usuarios', 'Catálogos', 'Billing'],
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
  const typeMap: Record<string, number> = { cooperativa: 0, productor: 1, exportador: 2, certificadora: 3, admin: 4 };
  orgs.forEach(org => { categories[typeMap[org.type] ?? 4].orgs.push(org); });
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

// ── SUB-COMPONENTS ──

function OrganizationCard({ org, isSelected, onClick }: { org: DemoOrganization; isSelected: boolean; onClick: () => void }) {
  const OrgIcon = org.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full bg-white/6 backdrop-blur-xl border rounded-xl p-4 text-left transition-all duration-200',
        isSelected
          ? 'border-[hsl(var(--accent-orange))]/60 bg-white/12'
          : 'border-white/10 hover:bg-white/10 hover:border-white/20'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-lg shrink-0 transition-colors',
          isSelected ? 'bg-[hsl(var(--accent-orange))]/20' : 'bg-white/8 group-hover:bg-white/12'
        )}>
          <OrgIcon className={cn('h-4 w-4', isSelected ? 'text-[hsl(var(--accent-orange))]' : 'text-white/60')} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-white font-medium text-sm truncate">{org.name}</h3>
          <p className="text-white/40 text-xs">{org.typeLabel}{org.country ? ` · ${org.country}` : ''}</p>
        </div>
        <ChevronRight className={cn('h-4 w-4 shrink-0 transition-colors', isSelected ? 'text-[hsl(var(--accent-orange))]' : 'text-white/15')} />
      </div>
    </button>
  );
}

function OrganizationDetailPanel({
  org,
  selectedProfile,
  onSelectProfile,
}: {
  org: DemoOrganization;
  selectedProfile: DemoProfile | null;
  onSelectProfile: (p: DemoProfile) => void;
}) {
  const OrgIcon = org.icon;
  return (
    <div className="space-y-5">
      {/* Org header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--accent-orange))]/15">
            <OrgIcon className="h-5 w-5 text-[hsl(var(--accent-orange))]" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">{org.name}</h2>
            <p className="text-white/40 text-xs">{org.typeLabel}{org.country ? ` · ${org.country}` : ''}</p>
          </div>
        </div>
        <p className="text-white/50 text-sm leading-relaxed">{org.description}</p>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        {org.stats.map(stat => (
          <span key={stat} className="text-xs px-3 py-1 rounded-full bg-white/8 text-white/60 border border-white/10">
            {stat}
          </span>
        ))}
      </div>

      {/* Modules */}
      <div>
        <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-2">Módulos activos</p>
        <div className="flex flex-wrap gap-1.5">
          {org.modules.map(mod => (
            <span key={mod} className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--accent-orange))]/10 text-[hsl(var(--accent-orange))]/80 border border-[hsl(var(--accent-orange))]/15">
              {mod}
            </span>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Profiles */}
      <div>
        <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-3">Perfiles disponibles</p>
        <div className="space-y-2.5">
          {org.profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => onSelectProfile(profile)}
              className={cn(
                'group w-full border rounded-xl p-4 text-left transition-all duration-200',
                selectedProfile?.id === profile.id
                  ? 'bg-[hsl(var(--accent-orange))]/10 border-[hsl(var(--accent-orange))]/40'
                  : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-white font-medium text-sm">{profile.label}</h4>
                <ChevronRight className={cn('h-3.5 w-3.5 transition-colors', selectedProfile?.id === profile.id ? 'text-[hsl(var(--accent-orange))]' : 'text-white/15 group-hover:text-white/30')} />
              </div>
              <p className="text-white/40 text-xs mb-2.5">{profile.description}</p>
              <div className="flex flex-wrap gap-1">
                {profile.accessAreas.map(area => (
                  <span key={area} className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-white/40">{area}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccessSummary({
  org,
  profile,
  onEnter,
  onBack,
  isLoading,
}: {
  org: DemoOrganization;
  profile: DemoProfile;
  onEnter: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const OrgIcon = org.icon;
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl p-6 space-y-5">
        <div>
          <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-1.5">Organización</p>
          <div className="flex items-center gap-2">
            <OrgIcon className="h-4 w-4 text-[hsl(var(--accent-orange))]" />
            <span className="text-white font-medium text-sm">{org.name}</span>
          </div>
          <p className="text-white/30 text-xs mt-0.5">{org.typeLabel}{org.country ? ` · ${org.country}` : ''}</p>
        </div>

        <div>
          <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-1.5">Perfil de acceso</p>
          <p className="text-white font-medium text-sm">{profile.label}</p>
          <p className="text-white/30 text-xs mt-0.5">{profile.description}</p>
        </div>

        <div>
          <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-2">Acceso principal</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.accessAreas.map(area => (
              <span key={area} className="text-xs px-2.5 py-1 rounded-full bg-[hsl(var(--accent-orange))]/15 text-[hsl(var(--accent-orange))]">
                {area}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={onEnter}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Ingresando…</span>
            </>
          ) : (
            <span>Entrar al entorno demo</span>
          )}
        </button>
      </div>

      <button onClick={onBack} className="flex items-center justify-center gap-1.5 text-white/40 hover:text-white text-xs mt-4 mx-auto transition-colors">
        <ChevronLeft className="h-3.5 w-3.5" />
        <span>Cambiar selección</span>
      </button>

      <p className="text-white/15 text-xs text-center mt-3">Datos ficticios para demostración</p>
    </div>
  );
}

// ── MAIN COMPONENT ──

const DemoLogin = () => {
  const [selectedOrg, setSelectedOrg] = useState<DemoOrganization | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<DemoProfile | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
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
    setShowConfirm(false);
  };

  const handleSelectProfile = (profile: DemoProfile) => {
    setSelectedProfile(profile);
    setShowConfirm(true);
  };

  const handleBack = () => {
    setShowConfirm(false);
    setSelectedProfile(null);
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
      }
    } catch (err) {
      console.error('Demo login error:', err);
      pendingRedirect.current = null;
      toast({ title: 'Error', description: 'Error de conexión. Intenta de nuevo.', variant: 'destructive' });
      setLoadingRole(null);
    }
  };

  const categories = groupOrgsByCategory(DEMO_ORGS);

  // Confirmation screen (mobile full-screen, desktop overlay)
  if (showConfirm && selectedOrg && selectedProfile) {
    return (
      <div className="min-h-screen relative flex flex-col">
        <div className="absolute inset-0 z-0">
          <img src={bgForest} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
        </div>
        <header className="relative z-10 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logoNovasilva} alt="Nova Silva" className="h-10 w-10 object-contain" />
            <span className="text-white font-bold text-lg">Nova Silva</span>
          </div>
          <Link to="/login" className="text-white/60 hover:text-white text-sm transition-colors">Ir al login →</Link>
        </header>
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--accent-orange))] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(var(--accent-orange))]" />
            </span>
            <span className="text-white/80 text-xs font-medium">Entorno de Demostración</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">Acceso seleccionado</h1>
          <p className="text-white/50 text-center mb-8 text-sm">Revise su selección antes de ingresar</p>
          <AccessSummary
            org={selectedOrg}
            profile={selectedProfile}
            onEnter={handleEnter}
            onBack={handleBack}
            isLoading={loadingRole !== null}
          />
        </main>
      </div>
    );
  }

  // Main split-panel layout
  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={bgForest} alt="" className="w-full h-full object-cover" />
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
      <main className="relative z-10 flex-1 flex flex-col px-4 sm:px-6 pb-8">
        {/* Title section */}
        <div className="text-center mb-6 pt-2">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--accent-orange))] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(var(--accent-orange))]" />
            </span>
            <span className="text-white/80 text-xs font-medium">Entorno de Demostración</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Nova Silva Demo</h1>
          <p className="text-white/40 text-sm max-w-lg mx-auto">
            Explore la plataforma desde la perspectiva de una organización real.
            Primero seleccione una organización y luego el perfil con el que desea ingresar.
          </p>
        </div>

        {/* Split panel: org list (left) + detail (right) */}
        <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0">
          {/* Left: Organization list */}
          <div className="w-full lg:w-[340px] lg:shrink-0 space-y-4 overflow-y-auto lg:max-h-[calc(100vh-220px)] pr-1">
            {categories.map(cat => (
              <div key={cat.label}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <cat.icon className="h-3.5 w-3.5 text-white/30" />
                  <h2 className="text-[10px] font-semibold uppercase tracking-wider text-white/30">{cat.label}</h2>
                </div>
                <div className="space-y-1.5">
                  {cat.orgs.map(org => (
                    <OrganizationCard
                      key={org.id}
                      org={org}
                      isSelected={selectedOrg?.id === org.id}
                      onClick={() => handleSelectOrg(org)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Organization detail + profiles */}
          <div className="flex-1 min-w-0">
            {selectedOrg ? (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 overflow-y-auto lg:max-h-[calc(100vh-220px)]">
                <OrganizationDetailPanel
                  org={selectedOrg}
                  selectedProfile={selectedProfile}
                  onSelectProfile={handleSelectProfile}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Building2 className="h-10 w-10 text-white/10 mx-auto mb-3" />
                  <p className="text-white/25 text-sm">Seleccione una organización para ver sus detalles y perfiles de acceso</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DemoLogin;
