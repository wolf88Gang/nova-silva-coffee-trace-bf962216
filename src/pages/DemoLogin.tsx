import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { setDemoConfig } from '@/hooks/useDemoConfig';
import { Loader2, ChevronLeft, ChevronRight, Building2, Sprout, Truck, ShieldCheck, Crown, Users, Map, Shield, Leaf, Package, DollarSign, Bug, Award, AlertTriangle, Briefcase, TrendingUp } from 'lucide-react';
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
  orgType: string;
  operatingModel: string;
  typeLabel: string;
  country: string;
  description: string;
  stats: string[];
  modules: string[];
  profiles: DemoProfile[];
  icon: React.ElementType;
  redirectPath: string;
}

// ── ARCHETYPE DATA ──

const DEMO_ORGS: DemoOrganization[] = [
  {
    id: 'coop_demo',
    name: 'Cooperativa Regional',
    orgType: 'cooperativa',
    operatingModel: 'agregacion_cooperativa',
    typeLabel: 'Cooperativa',
    country: 'Costa Rica',
    description: 'Agrupa productores socios, coordina trazabilidad, soporte técnico, cumplimiento EUDR y resiliencia climática.',
    stats: ['420 socios', '860 parcelas', '12 técnicos'],
    modules: ['Producción', 'Agronomía', 'VITAL', 'EUDR', 'Finanzas', 'Nova Cup'],
    icon: Building2,
    redirectPath: '/produccion',
    profiles: [
      {
        id: 'coop-gerencia',
        label: 'Gerencia cooperativa',
        description: 'Vista estratégica de producción, cumplimiento, finanzas y calidad.',
        email: 'demo.cooperativa@novasilva.com',
        role: 'cooperativa',
        accessAreas: ['Producción', 'Agronomía', 'Resiliencia', 'Cumplimiento', 'Calidad', 'Finanzas'],
      },
      {
        id: 'coop-tecnico',
        label: 'Técnico de campo',
        description: 'Registra visitas, diagnósticos, nutrición y captura evidencia en parcelas.',
        email: 'demo.tecnico@novasilva.com',
        role: 'tecnico',
        accessAreas: ['Producción', 'Agronomía', 'Resiliencia'],
      },
      {
        id: 'coop-cumplimiento',
        label: 'Oficial de cumplimiento',
        description: 'Gestión de parcelas, evidencia documental y dossiers EUDR.',
        email: 'demo.cooperativa@novasilva.com',
        role: 'cooperativa',
        accessAreas: ['Cumplimiento', 'EUDR', 'Data Room'],
      },
    ],
  },
  {
    id: 'estate_demo',
    name: 'Finca Empresarial',
    orgType: 'finca_empresarial',
    operatingModel: 'produccion_propia_y_compra_terceros',
    typeLabel: 'Finca empresarial',
    country: 'Costa Rica',
    description: 'Opera parcelas propias con manejo agronómico intensivo y también compra café a productores externos.',
    stats: ['74 ha propias', '82 proveedores', '6 cuadrillas'],
    modules: ['Producción', 'Abastecimiento', 'Jornales', 'Agronomía', 'VITAL', 'EUDR', 'Nova Cup', 'Finanzas'],
    icon: Sprout,
    redirectPath: '/produccion',
    profiles: [
      {
        id: 'estate-gerente',
        label: 'Gerente de operaciones',
        description: 'Vista integral: producción propia, abastecimiento externo, agronomía y finanzas.',
        email: 'demo.cooperativa@novasilva.com',
        role: 'cooperativa',
        accessAreas: ['Producción', 'Abastecimiento', 'Agronomía', 'Jornales', 'Finanzas'],
      },
      {
        id: 'estate-abastecimiento',
        label: 'Jefe de abastecimiento',
        description: 'Gestión de proveedores externos, recepción de café y riesgo de origen.',
        email: 'demo.cooperativa@novasilva.com',
        role: 'cooperativa',
        accessAreas: ['Abastecimiento', 'Calidad', 'Cumplimiento'],
      },
      {
        id: 'estate-agronomo',
        label: 'Agrónomo',
        description: 'Nutrición, Guard, Yield y diagnóstico en parcelas propias.',
        email: 'demo.tecnico@novasilva.com',
        role: 'tecnico',
        accessAreas: ['Producción', 'Agronomía', 'Resiliencia'],
      },
    ],
  },
  {
    id: 'exporter_demo',
    name: 'Exportador de Origen',
    orgType: 'exportador',
    operatingModel: 'originacion_masiva',
    typeLabel: 'Exportador',
    country: 'Centroamérica',
    description: 'Gestiona miles de proveedores con foco en cumplimiento EUDR, lotes, calidad y analítica de origen.',
    stats: ['4,200 proveedores', '12 regiones', '38 contratos'],
    modules: ['Orígenes', 'Cumplimiento', 'EUDR', 'Lotes', 'Analítica', 'Nova Cup', 'Finanzas'],
    icon: Truck,
    redirectPath: '/origenes',
    profiles: [
      {
        id: 'exp-gerente',
        label: 'Gerente de origen',
        description: 'Gestión de proveedores, compras, cumplimiento y oferta de café.',
        email: 'demo.exportador@novasilva.com',
        role: 'exportador',
        accessAreas: ['Orígenes', 'Cumplimiento', 'Calidad', 'Comercial', 'Finanzas'],
      },
      {
        id: 'exp-eudr',
        label: 'Analista EUDR',
        description: 'Revisión de polígonos, riesgos de deforestación y dossiers por proveedor.',
        email: 'demo.exportador@novasilva.com',
        role: 'exportador',
        accessAreas: ['Cumplimiento', 'EUDR', 'Data Room'],
      },
    ],
  },
  {
    id: 'farm_demo',
    name: 'Finca Privada',
    orgType: 'productor_privado',
    operatingModel: 'solo_produccion_propia',
    typeLabel: 'Productor privado',
    country: 'Costa Rica',
    description: 'Finca tecnificada con foco agronómico intensivo: nutrición, guard, yield y jornales.',
    stats: ['48 ha', '14 parcelas', '3 variedades'],
    modules: ['Producción', 'Jornales', 'Agronomía', 'VITAL', 'Finanzas', 'Nova Cup'],
    icon: Leaf,
    redirectPath: '/produccion',
    profiles: [
      {
        id: 'farm-propietario',
        label: 'Propietario',
        description: 'Gestión integral de la finca: agronomía, jornales, calidad y resultados.',
        email: 'demo.productor@novasilva.com',
        role: 'productor',
        accessAreas: ['Producción', 'Agronomía', 'Jornales', 'Resiliencia', 'Calidad', 'Finanzas'],
      },
    ],
  },
  {
    id: 'cert_demo',
    name: 'Certificadora',
    orgType: 'certificadora',
    operatingModel: 'auditoria',
    typeLabel: 'Certificadora',
    country: 'Regional',
    description: 'Entidad de auditoría y verificación. Acceso read-only a evidencia, dossiers y sesiones.',
    stats: ['24 organizaciones auditadas'],
    modules: ['Auditorías', 'Data Room', 'Dossiers'],
    icon: ShieldCheck,
    redirectPath: '/cumplimiento',
    profiles: [
      {
        id: 'cert-auditor',
        label: 'Auditor líder',
        description: 'Revisa evidencia, verifica cumplimiento y genera reportes de auditoría.',
        email: 'demo.certificadora@novasilva.com',
        role: 'certificadora',
        accessAreas: ['Auditorías', 'Data Room', 'Dossiers'],
      },
    ],
  },
];

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
      {/* Operating model tag */}
      <p className="text-white/25 text-[10px] mt-2 pl-11">{org.description.slice(0, 70)}…</p>
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

      <div className="flex flex-wrap gap-2">
        {org.stats.map(stat => (
          <span key={stat} className="text-xs px-3 py-1 rounded-full bg-white/8 text-white/60 border border-white/10">{stat}</span>
        ))}
      </div>

      <div>
        <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-2">Módulos activos</p>
        <div className="flex flex-wrap gap-1.5">
          {org.modules.map(mod => (
            <span key={mod} className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--accent-orange))]/10 text-[hsl(var(--accent-orange))]/80 border border-[hsl(var(--accent-orange))]/15">{mod}</span>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10" />

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
  org, profile, onEnter, onBack, isLoading,
}: {
  org: DemoOrganization; profile: DemoProfile; onEnter: () => void; onBack: () => void; isLoading: boolean;
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
              <span key={area} className="text-xs px-2.5 py-1 rounded-full bg-[hsl(var(--accent-orange))]/15 text-[hsl(var(--accent-orange))]">{area}</span>
            ))}
          </div>
        </div>
        <button
          onClick={onEnter}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" /><span>Ingresando…</span></>) : (<span>Entrar al entorno demo</span>)}
        </button>
      </div>
      <button onClick={onBack} className="flex items-center justify-center gap-1.5 text-white/40 hover:text-white text-xs mt-4 mx-auto transition-colors">
        <ChevronLeft className="h-3.5 w-3.5" /><span>Cambiar selección</span>
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

  const handleBack = () => { setShowConfirm(false); setSelectedProfile(null); };

  const handleEnter = async () => {
    if (!selectedProfile || !selectedOrg) return;
    setLoadingRole(selectedProfile.role);

    // Store archetype config for sidebar
    setDemoConfig({
      orgId: selectedOrg.id,
      orgName: selectedOrg.name,
      orgType: selectedOrg.orgType,
      operatingModel: selectedOrg.operatingModel,
      modules: selectedOrg.modules,
      profileLabel: selectedProfile.label,
    });

    try {
      const SUPABASE_URL = 'https://qbwmsarqewxjuwgkdfmg.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFid21zYXJxZXd4anV3Z2tkZm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDgyMjEsImV4cCI6MjA4MTMyNDIyMX0.fU8aFFLy07GaPZn_7namja1LLL2pCk4ohP-eJjEJUps';

      if (selectedProfile.role !== 'admin') {
        try {
          const res = await fetch(`${SUPABASE_URL}/functions/v1/ensure-demo-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ role: selectedProfile.role }),
          });
          const data = await res.json();
          if (!res.ok) console.warn('ensure-demo-user warning:', data);
        } catch (fnErr) { console.warn('ensure-demo-user fetch error:', fnErr); }
      }

      pendingRedirect.current = selectedOrg.redirectPath;

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

  // Confirmation screen
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
          <AccessSummary org={selectedOrg} profile={selectedProfile} onEnter={handleEnter} onBack={handleBack} isLoading={loadingRole !== null} />
        </main>
      </div>
    );
  }

  // Main split-panel layout
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

      <main className="relative z-10 flex-1 flex flex-col px-4 sm:px-6 pb-8">
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
            Seleccione un arquetipo operativo para explorar la plataforma desde la perspectiva de una organización real del sector café.
          </p>
        </div>

        <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0">
          {/* Left: Organization list */}
          <div className="w-full lg:w-[360px] lg:shrink-0 space-y-2 overflow-y-auto lg:max-h-[calc(100vh-220px)] pr-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25 px-1 mb-2">Arquetipos operativos</p>
            {DEMO_ORGS.map(org => (
              <OrganizationCard key={org.id} org={org} isSelected={selectedOrg?.id === org.id} onClick={() => handleSelectOrg(org)} />
            ))}
          </div>

          {/* Right: Organization detail + profiles */}
          <div className="flex-1 min-w-0">
            {selectedOrg ? (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 overflow-y-auto lg:max-h-[calc(100vh-220px)]">
                <OrganizationDetailPanel org={selectedOrg} selectedProfile={selectedProfile} onSelectProfile={handleSelectProfile} />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Building2 className="h-10 w-10 text-white/10 mx-auto mb-3" />
                  <p className="text-white/25 text-sm">Seleccione un arquetipo para ver sus detalles y perfiles de acceso</p>
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
