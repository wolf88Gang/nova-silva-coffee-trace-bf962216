import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { setDemoConfig } from '@/hooks/useDemoConfig';
import { useDemoOrganizations, useDemoProfiles, type DemoOrgRow, type DemoProfileRow } from '@/hooks/useViewData';
import { Loader2, ChevronLeft, ChevronRight, Building2, Sprout, Truck, ShieldCheck, Leaf, ArrowRight, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';
import logoNovasilva from '@/assets/logo-novasilva.png';
import bgHillside from '@/assets/bg-hillside-farm.jpg';
import { cn } from '@/lib/utils';
import { ensureDemoUser } from '@/lib/ensureDemoUser';
import { interpretDemoError, isNoOrgResult } from '@/lib/demoErrors';

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
    description: 'Gestiona productores, trazabilidad, cumplimiento EUDR y soporte tecnico de campo.',
    stats: ['420 socios', '860 parcelas', '12 tecnicos'],
    modules: ['Produccion', 'Agronomia', 'VITAL', 'EUDR', 'Finanzas', 'Nova Cup'],
    icon: Building2, redirectPath: '/produccion',
    profiles: [
      { id: 'coop-gerencia', label: 'Gerencia cooperativa', description: 'Vista estrategica: produccion, cumplimiento, finanzas y calidad.', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', accessAreas: ['Produccion', 'Agronomia', 'Resiliencia', 'Cumplimiento', 'Calidad', 'Finanzas'] },
      { id: 'coop-tecnico', label: 'Tecnico de campo', description: 'Registra visitas, diagnosticos y captura evidencia en parcelas.', email: 'demo.tecnico@novasilva.com', role: 'tecnico', accessAreas: ['Produccion', 'Agronomia', 'Resiliencia'] },
      { id: 'coop-cumplimiento', label: 'Oficial de cumplimiento', description: 'Gestion de evidencia documental y dossiers EUDR.', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', accessAreas: ['Cumplimiento', 'EUDR', 'Data Room'] },
    ],
  },
  {
    id: 'estate_demo', name: 'Finca Empresarial', orgType: 'finca_empresarial',
    operatingModel: 'estate_hybrid', typeLabel: 'Finca empresarial', country: 'Costa Rica',
    description: 'Opera parcelas propias con agronomia intensiva y compra cafe a proveedores externos.',
    stats: ['74 ha propias', '82 proveedores', '6 cuadrillas'],
    modules: ['Produccion', 'Abastecimiento', 'Jornales', 'Agronomia', 'VITAL', 'EUDR', 'Nova Cup', 'Finanzas'],
    icon: Sprout, redirectPath: '/produccion',
    profiles: [
      { id: 'estate-gerente', label: 'Gerente de operaciones', description: 'Produccion propia, abastecimiento externo, agronomia y finanzas.', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', accessAreas: ['Produccion', 'Abastecimiento', 'Agronomia', 'Jornales', 'Finanzas'] },
      { id: 'estate-abastecimiento', label: 'Jefe de abastecimiento', description: 'Proveedores externos, recepcion de cafe y riesgo de origen.', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', accessAreas: ['Abastecimiento', 'Calidad', 'Cumplimiento'] },
      { id: 'estate-agronomo', label: 'Agronomo', description: 'Nutricion, Guard, Yield y diagnostico en parcelas propias.', email: 'demo.tecnico@novasilva.com', role: 'tecnico', accessAreas: ['Produccion', 'Agronomia', 'Resiliencia'] },
    ],
  },
  {
    id: 'exporter_demo', name: 'Exportador de Origen', orgType: 'exportador',
    operatingModel: 'trader', typeLabel: 'Exportador', country: 'Centroamerica',
    description: 'Controla riesgos, cumplimiento EUDR, lotes comerciales y supply chain de cafe.',
    stats: ['4,200 proveedores', '12 regiones', '38 contratos'],
    modules: ['Origenes', 'Cumplimiento', 'EUDR', 'Lotes', 'Analitica', 'Nova Cup', 'Finanzas'],
    icon: Truck, redirectPath: '/origenes',
    profiles: [
      { id: 'exp-gerente', label: 'Gerente de origen', description: 'Proveedores, compras, cumplimiento y oferta de cafe.', email: 'demo.exportador@novasilva.com', role: 'exportador', accessAreas: ['Origenes', 'Cumplimiento', 'Calidad', 'Comercial', 'Finanzas'] },
      { id: 'exp-eudr', label: 'Analista EUDR', description: 'Poligonos, riesgos de deforestacion y dossiers por proveedor.', email: 'demo.exportador@novasilva.com', role: 'exportador', accessAreas: ['Cumplimiento', 'EUDR', 'Data Room'] },
    ],
  },
  {
    id: 'farm_demo', name: 'Finca Privada', orgType: 'productor_privado',
    operatingModel: 'single_farm', typeLabel: 'Productor privado', country: 'Costa Rica',
    description: 'Finca tecnificada con agronomia intensiva, jornales y control de calidad.',
    stats: ['48 ha', '14 parcelas', '3 variedades'],
    modules: ['Produccion', 'Jornales', 'Agronomia', 'VITAL', 'Finanzas', 'Nova Cup'],
    icon: Leaf, redirectPath: '/produccion',
    profiles: [
      { id: 'farm-propietario', label: 'Propietario', description: 'Gestion integral: agronomia, jornales, calidad y resultados.', email: 'demo.productor@novasilva.com', role: 'productor', accessAreas: ['Produccion', 'Agronomia', 'Jornales', 'Resiliencia', 'Calidad', 'Finanzas'] },
    ],
  },
  {
    id: 'cert_demo', name: 'Certificadora', orgType: 'certificadora',
    operatingModel: 'auditor', typeLabel: 'Certificadora', country: 'Regional',
    description: 'Acceso read-only para auditoria, verificacion de evidencia y dossiers.',
    stats: ['24 organizaciones auditadas'],
    modules: ['Auditorias', 'Data Room', 'Dossiers'],
    icon: ShieldCheck, redirectPath: '/cumplimiento',
    profiles: [
      { id: 'cert-auditor', label: 'Auditor lider', description: 'Revisa evidencia, verifica cumplimiento y genera reportes.', email: 'demo.certificadora@novasilva.com', role: 'certificadora', accessAreas: ['Auditorias', 'Data Room', 'Dossiers'] },
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
    profiles: [],
    icon: ORG_TYPE_ICONS[orgType] || Building2,
    redirectPath: orgType === 'exportador' ? '/origenes' : orgType === 'certificadora' ? '/cumplimiento' : '/produccion',
  };
}

function rowToProfile(row: DemoProfileRow): DemoProfile {
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

// ── Step indicator ──
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
            i < current
              ? 'bg-[hsl(var(--accent-orange))] text-white'
              : i === current
                ? 'bg-[hsl(var(--accent-orange))]/20 text-[hsl(var(--accent-orange))] border-2 border-[hsl(var(--accent-orange))]'
                : 'bg-white/10 text-white/30 border border-white/15'
          )}>
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={cn('w-8 h-0.5 rounded', i < current ? 'bg-[hsl(var(--accent-orange))]' : 'bg-white/10')} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Org card ──
function OrganizationCard({ org, isSelected, onClick }: { org: DemoOrganization; isSelected: boolean; onClick: () => void }) {
  const OrgIcon = org.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full rounded-xl p-4 text-left transition-all duration-200 relative overflow-hidden',
        isSelected
          ? 'bg-[hsl(var(--accent-orange))]/15 border-2 border-[hsl(var(--accent-orange))]/70 shadow-lg shadow-[hsl(var(--accent-orange))]/10'
          : 'bg-white/[0.07] border-2 border-transparent hover:border-white/25 hover:bg-white/[0.12] active:scale-[0.98]'
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="w-5 h-5 rounded-full bg-[hsl(var(--accent-orange))] flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2.5 rounded-lg shrink-0 transition-colors',
          isSelected ? 'bg-[hsl(var(--accent-orange))]/25' : 'bg-white/10 group-hover:bg-white/15'
        )}>
          <OrgIcon className={cn('h-5 w-5', isSelected ? 'text-[hsl(var(--accent-orange))]' : 'text-white/70 group-hover:text-white/90')} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={cn('font-semibold text-sm', isSelected ? 'text-[hsl(var(--accent-orange))]' : 'text-white')}>{org.name}</h3>
          <p className="text-white/40 text-xs">{org.typeLabel}{org.country ? ` · ${org.country}` : ''}</p>
        </div>
      </div>
      <p className="text-white/35 text-xs mt-2 line-clamp-2 leading-relaxed">{org.description}</p>
      {org.stats.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {org.stats.map(stat => (
            <span key={stat} className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/50">{stat}</span>
          ))}
        </div>
      )}
    </button>
  );
}

// ── Profile card ──
function ProfileCard({ profile, isSelected, onClick }: { profile: DemoProfile; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full rounded-xl p-4 text-left transition-all duration-200 relative overflow-hidden',
        isSelected
          ? 'bg-[hsl(var(--accent-orange))]/15 border-2 border-[hsl(var(--accent-orange))]/70 shadow-lg shadow-[hsl(var(--accent-orange))]/10'
          : 'bg-white/[0.07] border-2 border-transparent hover:border-white/25 hover:bg-white/[0.12] active:scale-[0.98]'
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="w-5 h-5 rounded-full bg-[hsl(var(--accent-orange))] flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
      <h4 className={cn('font-semibold text-sm mb-1', isSelected ? 'text-[hsl(var(--accent-orange))]' : 'text-white')}>{profile.label}</h4>
      <p className="text-white/40 text-xs mb-3 leading-relaxed pr-6">{profile.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {profile.accessAreas.map(area => (
          <span key={area} className={cn(
            'text-[10px] px-2 py-0.5 rounded-full',
            isSelected
              ? 'bg-[hsl(var(--accent-orange))]/15 text-[hsl(var(--accent-orange))]/80'
              : 'bg-white/8 text-white/40'
          )}>{area}</span>
        ))}
      </div>
    </button>
  );
}

// ── MAIN COMPONENT ──

const DemoLogin = () => {
  // step: 0 = landing, 1 = select org, 2 = select profile, 3 = confirm
  const [step, setStep] = useState(0);
  const [selectedOrg, setSelectedOrg] = useState<DemoOrganization | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<DemoProfile | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const pendingRedirect = useRef<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  // Secret admin access: tap logo 5 times
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleLogoTap = useCallback(async () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      setLoadingRole('admin');
      setDemoConfig({
        orgId: 'platform_admin',
        orgName: 'Nova Silva Platform',
        orgType: 'admin',
        operatingModel: 'platform',
        modules: ['admin'],
        profileLabel: 'Admin Nova Silva',
      });
      pendingRedirect.current = '/admin';
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: 'info@novasilva.co',
          password: 'demo123456',
        });
        if (error) {
          pendingRedirect.current = null;
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
          setLoadingRole(null);
        }
      } catch {
        pendingRedirect.current = null;
        setLoadingRole(null);
      }
    }
  }, [toast]);

  const { data: dbOrgs } = useDemoOrganizations();
  const { data: dbProfiles } = useDemoProfiles(selectedOrg?.id || null);

  const organizations: DemoOrganization[] = (() => {
    if (dbOrgs && dbOrgs.length > 0) return dbOrgs.map(rowToOrg);
    return FALLBACK_ORGS;
  })();

  const currentOrg: DemoOrganization | null = selectedOrg ? (() => {
    const org = { ...selectedOrg };
    if (dbProfiles && dbProfiles.length > 0) {
      org.profiles = dbProfiles.map(rowToProfile);
    } else {
      const fallback = FALLBACK_ORGS.find(f => f.id === org.id || f.orgType === org.orgType);
      if (fallback) org.profiles = fallback.profiles;
    }
    return org;
  })() : null;

  // Auto-advance if org has only 1 profile
  useEffect(() => {
    if (step === 2 && currentOrg && currentOrg.profiles.length === 1) {
      setSelectedProfile(currentOrg.profiles[0]);
      setStep(3);
    }
  }, [step, currentOrg]);

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
  };

  const handleSelectProfile = (profile: DemoProfile) => {
    setSelectedProfile(profile);
  };

  const handleNext = () => {
    if (step === 1 && selectedOrg) {
      setStep(2);
    } else if (step === 2 && selectedProfile) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 3) { setStep(2); setSelectedProfile(null); }
    else if (step === 2) { setStep(1); setSelectedProfile(null); }
    else if (step === 1) { setStep(0); setSelectedOrg(null); }
  };

  const handleEnter = async () => {
    if (!selectedProfile || !selectedOrg || loadingRole) return;
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
      if (selectedProfile.role !== 'admin') {
        const result = await ensureDemoUser(selectedProfile.role);
        if (!result.ok) {
          const errInfo = interpretDemoError(result);
          console.error('ensure-demo-user failed:', result.error, result.status);
          toast({
            title: errInfo.title,
            description: errInfo.description,
            variant: 'destructive',
          });
          setLoadingRole(null);
          return;
        }

        // Check for no-org warning
        if (isNoOrgResult(result)) {
          toast({
            title: 'Demo sin organización',
            description: 'Estás en modo demo sin organización. Algunas funciones pueden estar limitadas.',
          });
        }
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
    } catch (err: any) {
      console.error('Demo login error:', err);
      pendingRedirect.current = null;
      toast({
        title: 'Sin conexión',
        description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        variant: 'destructive',
      });
      setLoadingRole(null);
    }
  };

  const stepLabels = ['', 'Organización', 'Perfil', 'Confirmar'];

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={bgHillside} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-5 md:px-8 py-4">
          <div className="flex items-center gap-3">
            <img src={logoNovasilva} alt="Nova Silva" className="h-9 w-9 object-contain cursor-pointer select-none" onClick={handleLogoTap} />
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
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-2xl">

            {/* Step 0: Landing */}
            {step === 0 && (
              <div className="text-center space-y-10 animate-fade-in">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/10 text-white/50 text-xs mb-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--accent-orange))] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--accent-orange))]" />
                    </span>
                    Entorno interactivo
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    Explora Nova Silva<br />
                    <span className="text-[hsl(var(--accent-orange))]">en modo demo</span>
                  </h2>
                  <p className="text-white/45 text-sm leading-relaxed max-w-lg mx-auto">
                    Simula la experiencia como cooperativa, exportador, finca empresarial o certificadora. Sin registro, sin compromiso.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2.5 bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white font-semibold py-3.5 px-10 rounded-xl transition-all text-sm shadow-lg shadow-[hsl(var(--accent-orange))]/20 active:scale-[0.97]"
                  >
                    Iniciar demo
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <Link
                    to="/demo/setup"
                    className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm py-3 px-6 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all active:scale-[0.97]"
                  >
                    Configurar demo personalizado
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="flex items-center justify-center gap-6 pt-2">
                  {[
                    { icon: Building2, label: 'Cooperativas' },
                    { icon: Truck, label: 'Exportadores' },
                    { icon: Sprout, label: 'Fincas' },
                    { icon: ShieldCheck, label: 'Certificadoras' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5 text-white/25 text-xs">
                      <item.icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                <DemoConversionCTA variant="landing" />
              </div>
            )}

            {/* Step 1: Select Organization */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <button onClick={handleBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs mb-2 transition-colors">
                      <ChevronLeft className="h-3.5 w-3.5" /> Volver
                    </button>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Elige tu tipo de organizacion</h2>
                    <p className="text-white/40 text-xs mt-1">Selecciona la operacion que quieres explorar</p>
                  </div>
                  <StepIndicator current={0} total={3} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {organizations.map(org => (
                    <OrganizationCard
                      key={org.id}
                      org={org}
                      isSelected={selectedOrg?.id === org.id}
                      onClick={() => handleSelectOrg(org)}
                    />
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNext}
                    disabled={!selectedOrg}
                    className={cn(
                      'flex items-center gap-2 font-semibold py-3 px-8 rounded-xl transition-all text-sm',
                      selectedOrg
                        ? 'bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white shadow-lg shadow-[hsl(var(--accent-orange))]/20 active:scale-[0.97]'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    )}
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Select Profile */}
            {step === 2 && currentOrg && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <button onClick={handleBack} className="flex items-center gap-1 text-white/40 hover:text-white text-xs mb-2 transition-colors">
                      <ChevronLeft className="h-3.5 w-3.5" /> {currentOrg.name}
                    </button>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Elige tu perfil</h2>
                    <p className="text-white/40 text-xs mt-1">¿Cómo quieres explorar {currentOrg.name}?</p>
                  </div>
                  <StepIndicator current={1} total={3} />
                </div>

                {/* Org summary chip */}
                <div className="flex items-center gap-3 bg-white/[0.06] rounded-lg px-4 py-3 border border-white/10">
                  <currentOrg.icon className="h-4 w-4 text-[hsl(var(--accent-orange))] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-white text-sm font-medium">{currentOrg.name}</span>
                    <span className="text-white/30 text-xs ml-2">{currentOrg.typeLabel}</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {currentOrg.profiles.map(profile => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      isSelected={selectedProfile?.id === profile.id}
                      onClick={() => handleSelectProfile(profile)}
                    />
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNext}
                    disabled={!selectedProfile}
                    className={cn(
                      'flex items-center gap-2 font-semibold py-3 px-8 rounded-xl transition-all text-sm',
                      selectedProfile
                        ? 'bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white shadow-lg shadow-[hsl(var(--accent-orange))]/20 active:scale-[0.97]'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    )}
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && currentOrg && selectedProfile && (
              <div className="max-w-md mx-auto animate-fade-in">
                <div className="flex justify-center mb-5">
                  <StepIndicator current={2} total={3} />
                </div>

                <div className="bg-white/[0.08] backdrop-blur-xl border border-white/15 rounded-2xl p-6 space-y-5">
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-1.5">Organización</p>
                    <div className="flex items-center gap-2">
                      <currentOrg.icon className="h-4 w-4 text-[hsl(var(--accent-orange))]" />
                      <span className="text-white font-medium text-sm">{currentOrg.name}</span>
                    </div>
                    <p className="text-white/30 text-xs mt-0.5">{currentOrg.typeLabel}{currentOrg.country ? ` · ${currentOrg.country}` : ''}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-1.5">Perfil de acceso</p>
                    <p className="text-white font-medium text-sm">{selectedProfile.label}</p>
                    <p className="text-white/30 text-xs mt-0.5">{selectedProfile.description}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-2">Acceso principal</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProfile.accessAreas.map(area => (
                        <span key={area} className="text-xs px-2.5 py-1 rounded-full bg-[hsl(var(--accent-orange))]/15 text-[hsl(var(--accent-orange))]">{area}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleEnter}
                    disabled={!!loadingRole}
                    className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white font-semibold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[hsl(var(--accent-orange))]/20 active:scale-[0.97]"
                  >
                    {loadingRole ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Preparando entorno…</span>
                      </>
                    ) : (
                      <span>Entrar al entorno demo</span>
                    )}
                  </button>
                </div>
                <button onClick={handleBack} className="flex items-center justify-center gap-1.5 text-white/40 hover:text-white text-xs mt-4 mx-auto transition-colors">
                  <ChevronLeft className="h-3.5 w-3.5" /><span>Cambiar selección</span>
                </button>
                <p className="text-white/15 text-xs text-center mt-3">Datos ficticios para demostración</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoLogin;
