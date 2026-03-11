import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { setDemoConfig } from '@/hooks/useDemoConfig';
import { useDemoOrganizations, useDemoProfiles, type DemoOrgRow, type DemoProfileRow } from '@/hooks/useViewData';
import { Loader2, ChevronLeft, ChevronRight, Building2, Sprout, Truck, ShieldCheck, Leaf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';
import logoNovasilva from '@/assets/logo-novasilva.png';
import bgForest from '@/assets/bg-forest-network.png';
import { cn } from '@/lib/utils';

// ── FALLBACK DATA (used when views don't exist) ──

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

const FALLBACK_ORGS: DemoOrganization[] = [
  {
    id: 'coop_demo', name: 'Cooperativa Regional', orgType: 'cooperativa',
    operatingModel: 'aggregator', typeLabel: 'Cooperativa', country: 'Costa Rica',
    description: 'Agrupa productores socios, coordina trazabilidad, soporte técnico, cumplimiento EUDR y resiliencia climática.',
    stats: ['420 socios', '860 parcelas', '12 técnicos'],
    modules: ['Producción', 'Agronomía', 'VITAL', 'EUDR', 'Finanzas', 'Nova Cup'],
    icon: Building2, redirectPath: '/produccion',
    profiles: [
      { id: 'coop-gerencia', label: 'Gerencia cooperativa', description: 'Vista estratégica de producción, cumplimiento, finanzas y calidad.', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', accessAreas: ['Producción', 'Agronomía', 'Resiliencia', 'Cumplimiento', 'Calidad', 'Finanzas'] },
      { id: 'coop-tecnico', label: 'Técnico de campo', description: 'Registra visitas, diagnósticos, nutrición y captura evidencia en parcelas.', email: 'demo.tecnico@novasilva.com', role: 'tecnico', accessAreas: ['Producción', 'Agronomía', 'Resiliencia'] },
      { id: 'coop-cumplimiento', label: 'Oficial de cumplimiento', description: 'Gestión de parcelas, evidencia documental y dossiers EUDR.', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', accessAreas: ['Cumplimiento', 'EUDR', 'Data Room'] },
    ],
  },
  {
    id: 'estate_demo', name: 'Finca Empresarial', orgType: 'finca_empresarial',
    operatingModel: 'produccion_propia_y_compra_terceros', typeLabel: 'Finca empresarial', country: 'Costa Rica',
    description: 'Opera parcelas propias con manejo agronómico intensivo y también compra café a productores externos.',
    stats: ['74 ha propias', '82 proveedores', '6 cuadrillas'],
    modules: ['Producción', 'Abastecimiento', 'Jornales', 'Agronomía', 'VITAL', 'EUDR', 'Nova Cup', 'Finanzas'],
    icon: Sprout, redirectPath: '/produccion',
    profiles: [
      { id: 'estate-gerente', label: 'Gerente de operaciones', description: 'Vista integral: producción propia, abastecimiento externo, agronomía y finanzas.', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', accessAreas: ['Producción', 'Abastecimiento', 'Agronomía', 'Jornales', 'Finanzas'] },
      { id: 'estate-abastecimiento', label: 'Jefe de abastecimiento', description: 'Gestión de proveedores externos, recepción de café y riesgo de origen.', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', accessAreas: ['Abastecimiento', 'Calidad', 'Cumplimiento'] },
      { id: 'estate-agronomo', label: 'Agrónomo', description: 'Nutrición, Guard, Yield y diagnóstico en parcelas propias.', email: 'demo.tecnico@novasilva.com', role: 'tecnico', accessAreas: ['Producción', 'Agronomía', 'Resiliencia'] },
    ],
  },
  {
    id: 'exporter_demo', name: 'Exportador de Origen', orgType: 'exportador',
    operatingModel: 'originacion_masiva', typeLabel: 'Exportador', country: 'Centroamérica',
    description: 'Gestiona miles de proveedores con foco en cumplimiento EUDR, lotes, calidad y analítica de origen.',
    stats: ['4,200 proveedores', '12 regiones', '38 contratos'],
    modules: ['Orígenes', 'Cumplimiento', 'EUDR', 'Lotes', 'Analítica', 'Nova Cup', 'Finanzas'],
    icon: Truck, redirectPath: '/origenes',
    profiles: [
      { id: 'exp-gerente', label: 'Gerente de origen', description: 'Gestión de proveedores, compras, cumplimiento y oferta de café.', email: 'demo.exportador@novasilva.com', role: 'exportador', accessAreas: ['Orígenes', 'Cumplimiento', 'Calidad', 'Comercial', 'Finanzas'] },
      { id: 'exp-eudr', label: 'Analista EUDR', description: 'Revisión de polígonos, riesgos de deforestación y dossiers por proveedor.', email: 'demo.exportador@novasilva.com', role: 'exportador', accessAreas: ['Cumplimiento', 'EUDR', 'Data Room'] },
    ],
  },
  {
    id: 'farm_demo', name: 'Finca Privada', orgType: 'productor_privado',
    operatingModel: 'solo_produccion_propia', typeLabel: 'Productor privado', country: 'Costa Rica',
    description: 'Finca tecnificada con foco agronómico intensivo: nutrición, guard, yield y jornales.',
    stats: ['48 ha', '14 parcelas', '3 variedades'],
    modules: ['Producción', 'Jornales', 'Agronomía', 'VITAL', 'Finanzas', 'Nova Cup'],
    icon: Leaf, redirectPath: '/produccion',
    profiles: [
      { id: 'farm-propietario', label: 'Propietario', description: 'Gestión integral de la finca: agronomía, jornales, calidad y resultados.', email: 'demo.productor@novasilva.com', role: 'productor', accessAreas: ['Producción', 'Agronomía', 'Jornales', 'Resiliencia', 'Calidad', 'Finanzas'] },
    ],
  },
  {
    id: 'cert_demo', name: 'Certificadora', orgType: 'certificadora',
    operatingModel: 'auditoria', typeLabel: 'Certificadora', country: 'Regional',
    description: 'Entidad de auditoría y verificación. Acceso read-only a evidencia, dossiers y sesiones.',
    stats: ['24 organizaciones auditadas'],
    modules: ['Auditorías', 'Data Room', 'Dossiers'],
    icon: ShieldCheck, redirectPath: '/cumplimiento',
    profiles: [
      { id: 'cert-auditor', label: 'Auditor líder', description: 'Revisa evidencia, verifica cumplimiento y genera reportes de auditoría.', email: 'demo.certificadora@novasilva.com', role: 'certificadora', accessAreas: ['Auditorías', 'Data Room', 'Dossiers'] },
    ],
  },
];

const ORG_TYPE_ICONS: Record<string, React.ElementType> = {
  cooperativa: Building2,
  finca_empresarial: Sprout,
  exportador: Truck,
  productor_privado: Leaf,
  certificadora: ShieldCheck,
};

const ORG_TYPE_LABELS: Record<string, string> = {
  cooperativa: 'Cooperativa',
  finca_empresarial: 'Finca empresarial',
  exportador: 'Exportador',
  productor_privado: 'Productor privado',
  certificadora: 'Certificadora',
};

// ── Convert Supabase rows to DemoOrganization ──

function rowToOrg(row: DemoOrgRow): DemoOrganization {
  const orgType = row.org_type || 'cooperativa';
  return {
    id: row.id,
    name: row.display_name,
    orgType,
    operatingModel: row.operating_model || '',
    typeLabel: ORG_TYPE_LABELS[orgType] || orgType,
    country: row.country || '',
    description: row.description || '',
    stats: row.stats ? Object.values(row.stats).map(String) : [],
    modules: Array.isArray(row.modules) ? row.modules : [],
    profiles: [], // will be populated from v_demo_profiles_ui
    icon: ORG_TYPE_ICONS[orgType] || Building2,
    redirectPath: orgType === 'exportador' ? '/origenes' : orgType === 'certificadora' ? '/cumplimiento' : '/produccion',
  };
}

function rowToProfile(row: DemoProfileRow): DemoProfile {
  // Map role to demo email
  const roleEmailMap: Record<string, string> = {
    cooperativa: 'demo.cooperativa@novasilva.com',
    tecnico: 'demo.tecnico@novasilva.com',
    exportador: 'demo.exportador@novasilva.com',
    productor: 'demo.productor@novasilva.com',
    certificadora: 'demo.certificadora@novasilva.com',
    admin: 'info@novasilva.co',
  };
  return {
    id: row.id,
    label: row.profile_label,
    description: row.description || '',
    email: roleEmailMap[row.role] || 'demo.cooperativa@novasilva.com',
    role: row.role as UserRole,
    accessAreas: Array.isArray(row.access_areas) ? row.access_areas : [],
  };
}

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
      <p className="text-white/25 text-[10px] mt-2 pl-11">{org.description.slice(0, 70)}…</p>
    </button>
  );
}

function OrganizationDetailPanel({
  org, selectedProfile, onSelectProfile,
}: {
  org: DemoOrganization; selectedProfile: DemoProfile | null; onSelectProfile: (p: DemoProfile) => void;
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

      {org.stats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {org.stats.map(stat => (
            <span key={stat} className="text-xs px-3 py-1 rounded-full bg-white/8 text-white/60 border border-white/10">{stat}</span>
          ))}
        </div>
      )}

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

  // Try Supabase views first
  const { data: dbOrgs } = useDemoOrganizations();
  const { data: dbProfiles } = useDemoProfiles(selectedOrg?.id || null);

  // Merge Supabase data with fallbacks
  const organizations: DemoOrganization[] = (() => {
    if (dbOrgs && dbOrgs.length > 0) {
      return dbOrgs.map(rowToOrg);
    }
    return FALLBACK_ORGS;
  })();

  // Populate profiles from Supabase or fallback
  const currentOrg: DemoOrganization | null = selectedOrg ? (() => {
    const org = { ...selectedOrg };
    if (dbProfiles && dbProfiles.length > 0) {
      org.profiles = dbProfiles.map(rowToProfile);
    } else {
      // Use fallback profiles from FALLBACK_ORGS
      const fallback = FALLBACK_ORGS.find(f => f.id === org.id || f.orgType === org.orgType);
      if (fallback) org.profiles = fallback.profiles;
    }
    return org;
  })() : null;

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
  if (showConfirm && currentOrg && selectedProfile) {
    return (
      <div className="min-h-screen relative flex flex-col">
        <div className="absolute inset-0 z-0">
          <img src={bgForest} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80" />
        </div>
        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          <AccessSummary org={currentOrg} profile={selectedProfile} onEnter={handleEnter} onBack={handleBack} isLoading={!!loadingRole} />
        </div>
      </div>
    );
  }

  // Main selector screen
  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="absolute inset-0 z-0">
        <img src={bgForest} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logoNovasilva} alt="Nova Silva" className="h-9 w-9 object-contain" />
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight">Nova Silva</h1>
              <p className="text-white/30 text-xs">Entorno de demostración</p>
            </div>
          </div>
          <Link to="/login" className="text-white/40 hover:text-white text-xs transition-colors">
            Acceso real →
          </Link>
        </header>

        {/* Content */}
        <div className="flex-1 flex">
          {/* LEFT: org list */}
          <div className="w-full lg:w-[380px] border-r border-white/8 flex flex-col">
            <div className="px-5 py-3 border-b border-white/8">
              <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold">Seleccionar organización</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {organizations.map(org => (
                <OrganizationCard
                  key={org.id}
                  org={org}
                  isSelected={selectedOrg?.id === org.id}
                  onClick={() => handleSelectOrg(org)}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: detail + profiles */}
          <div className="hidden lg:flex flex-1 items-start justify-center overflow-y-auto">
            <div className="w-full max-w-lg px-8 py-6">
              {currentOrg ? (
                <OrganizationDetailPanel
                  org={currentOrg}
                  selectedProfile={selectedProfile}
                  onSelectProfile={handleSelectProfile}
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-white/20 text-sm">← Selecciona una organización para ver detalles</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile: detail panel */}
        {currentOrg && (
          <div className="lg:hidden px-4 pb-6">
            <OrganizationDetailPanel
              org={currentOrg}
              selectedProfile={selectedProfile}
              onSelectProfile={handleSelectProfile}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoLogin;
