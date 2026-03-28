import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { setDemoConfig } from '@/hooks/useDemoConfig';
import { Loader2, ChevronLeft, ChevronRight, ArrowRight, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types';
import logoNovasilva from '@/assets/logo-novasilva.png';
import bgHillside from '@/assets/bg-hillside-farm.jpg';
import { cn } from '@/lib/utils';
import { ensureDemoUser, isUuidOrganizationId } from '@/lib/ensureDemoUser';
import { interpretDemoError, isNoOrgResult } from '@/lib/demoErrors';
import { DemoConversionCTA } from '@/components/demo/DemoConversionCTA';
import {
  type DemoArchetype,
  getArchetypesForMode,
  mapArchetypeToDemoOrg,
} from '@/config/demoArchetypes';

// ── Profile definitions per archetype key ──

interface DemoProfile {
  id: string;
  label: string;
  description: string;
  email: string;
  role: UserRole;
  accessAreas: string[];
}

const ARCHETYPE_PROFILES: Record<string, DemoProfile[]> = {
  cooperativa: [
    { id: 'coop-gerencia', label: 'Gerencia cooperativa', description: 'Vista estratégica: producción, cumplimiento, finanzas y calidad.', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', accessAreas: ['Producción', 'Agronomía', 'Resiliencia', 'Cumplimiento', 'Calidad', 'Finanzas'] },
    { id: 'coop-tecnico', label: 'Técnico de campo', description: 'Registra visitas, diagnósticos y captura evidencia en parcelas.', email: 'demo.tecnico@novasilva.com', role: 'tecnico', accessAreas: ['Producción', 'Agronomía', 'Resiliencia'] },
    { id: 'coop-cumplimiento', label: 'Oficial de cumplimiento', description: 'Gestión de evidencia documental y dossiers EUDR.', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', accessAreas: ['Cumplimiento', 'EUDR', 'Data Room'] },
  ],
  asociacion_privada: [
    { id: 'asoc-gerencia', label: 'Director ejecutivo', description: 'Vista de gestión: productores, trazabilidad, cumplimiento y calidad.', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', accessAreas: ['Producción', 'Agronomía', 'Cumplimiento', 'Finanzas'] },
    { id: 'asoc-tecnico', label: 'Técnico de campo', description: 'Visitas a productores, diagnósticos y recomendaciones.', email: 'demo.tecnico@novasilva.com', role: 'tecnico', accessAreas: ['Producción', 'Agronomía', 'Resiliencia'] },
  ],
  exportador: [
    { id: 'exp-gerente', label: 'Gerente de origen', description: 'Proveedores, compras, cumplimiento y oferta de café.', email: 'demo.exportador@novasilva.com', role: 'exportador', accessAreas: ['Orígenes', 'Cumplimiento', 'Calidad', 'Comercial', 'Finanzas'] },
    { id: 'exp-eudr', label: 'Analista EUDR', description: 'Polígonos, riesgos de deforestación y dossiers por proveedor.', email: 'demo.exportador@novasilva.com', role: 'exportador', accessAreas: ['Cumplimiento', 'EUDR', 'Data Room'] },
  ],
  exportador_red: [
    { id: 'expred-gerente', label: 'Gerente de operaciones', description: 'Proveedores en campo, trazabilidad y cumplimiento EUDR.', email: 'demo.exportador@novasilva.com', role: 'exportador', accessAreas: ['Orígenes', 'Producción', 'Cumplimiento', 'EUDR', 'Finanzas'] },
  ],
  beneficio: [
    { id: 'ben-gerente', label: 'Gerente de planta', description: 'Recepción, procesamiento, calidad y despacho.', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', accessAreas: ['Producción', 'Abastecimiento', 'Calidad', 'Cumplimiento', 'Finanzas'] },
  ],
  finca_privada: [
    { id: 'farm-propietario', label: 'Propietario', description: 'Gestión integral: agronomía, jornales, calidad y resultados.', email: 'demo.productor@novasilva.com', role: 'productor', accessAreas: ['Producción', 'Agronomía', 'Jornales', 'Resiliencia', 'Calidad', 'Finanzas'] },
  ],
  finca_empresarial: [
    { id: 'estate-gerente', label: 'Gerente de operaciones', description: 'Producción propia, abastecimiento externo, agronomía y finanzas.', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', accessAreas: ['Producción', 'Abastecimiento', 'Agronomía', 'Jornales', 'Finanzas'] },
    { id: 'estate-abastecimiento', label: 'Jefe de abastecimiento', description: 'Proveedores externos, recepción de café y riesgo de origen.', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', accessAreas: ['Abastecimiento', 'Calidad', 'Cumplimiento'] },
    { id: 'estate-agronomo', label: 'Agrónomo', description: 'Nutrición, Guard, Yield y diagnóstico en parcelas propias.', email: 'demo.tecnico@novasilva.com', role: 'tecnico', accessAreas: ['Producción', 'Agronomía', 'Resiliencia'] },
  ],
  certificadora: [
    { id: 'cert-auditor', label: 'Auditor líder', description: 'Revisa evidencia, verifica cumplimiento y genera reportes.', email: 'demo.certificadora@novasilva.com', role: 'certificadora', accessAreas: ['Auditorías', 'Data Room', 'Dossiers'] },
  ],
  beneficio_exportador: [
    { id: 'benexp-gerente', label: 'Gerente general', description: 'Procesamiento propio, compras y exportación directa.', email: 'demo.exportador@novasilva.com', role: 'exportador', accessAreas: ['Producción', 'Orígenes', 'EUDR', 'Calidad', 'Finanzas'] },
  ],
  trader: [
    { id: 'trader-comprador', label: 'Comprador', description: 'Compra y revende café, gestión de lotes y proveedores.', email: 'demo.exportador@novasilva.com', role: 'exportador', accessAreas: ['Orígenes', 'Lotes', 'Cumplimiento', 'Finanzas'] },
  ],
  demo_institucional: [
    { id: 'inst-programa', label: 'Coordinador de programa', description: 'Indicadores de impacto, cumplimiento y analítica.', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', accessAreas: ['Producción', 'VITAL', 'Cumplimiento', 'Analítica'] },
  ],
  admin_novasilva: [
    { id: 'admin-ns', label: 'Admin Nova Silva', description: 'Consola administrativa interna.', email: 'info@novasilva.co', role: 'admin', accessAreas: ['Admin', 'Sales Intelligence', 'Calibración'] },
  ],
};

function getProfilesForArchetype(archKey: string): DemoProfile[] {
  return ARCHETYPE_PROFILES[archKey] || [];
}

// ── Step indicator ──
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-1.5 sm:gap-2">
          <div className={cn(
            'w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all',
            i < current
              ? 'bg-[hsl(var(--accent-orange))] text-white'
              : i === current
                ? 'bg-[hsl(var(--accent-orange))]/20 text-[hsl(var(--accent-orange))] border-2 border-[hsl(var(--accent-orange))]'
                : 'bg-white/10 text-white/30 border border-white/15'
          )}>
            {i < current ? <Check className="h-3 w-3" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={cn('w-5 sm:w-8 h-0.5 rounded', i < current ? 'bg-[hsl(var(--accent-orange))]' : 'bg-white/10')} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Archetype card (replaces OrganizationCard) ──
function ArchetypeCard({ arch, isSelected, onClick }: { arch: DemoArchetype; isSelected: boolean; onClick: () => void }) {
  const Icon = arch.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full rounded-xl p-3 sm:p-4 text-left transition-all duration-200 relative overflow-hidden',
        isSelected
          ? 'bg-[hsl(var(--accent-orange))]/15 border-2 border-[hsl(var(--accent-orange))]/70 shadow-lg shadow-[hsl(var(--accent-orange))]/10'
          : 'bg-white/[0.07] border-2 border-transparent hover:border-white/25 hover:bg-white/[0.12] active:scale-[0.98]'
      )}
    >
      {isSelected && (
        <div className="absolute top-2.5 right-2.5">
          <div className="w-5 h-5 rounded-full bg-[hsl(var(--accent-orange))] flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className={cn(
          'p-2 sm:p-2.5 rounded-lg shrink-0 transition-colors',
          isSelected ? 'bg-[hsl(var(--accent-orange))]/25' : 'bg-white/10 group-hover:bg-white/15'
        )}>
          <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', isSelected ? 'text-[hsl(var(--accent-orange))]' : 'text-white/70 group-hover:text-white/90')} />
        </div>
        <div className="min-w-0 flex-1 pr-5">
          <h3 className={cn('font-semibold text-xs sm:text-sm leading-tight', isSelected ? 'text-[hsl(var(--accent-orange))]' : 'text-white')}>{arch.label}</h3>
          {arch.country && <p className="text-white/30 text-[10px] sm:text-xs mt-0.5">{arch.country}</p>}
        </div>
      </div>
      <p className="text-white/35 text-[10px] sm:text-xs mt-2 line-clamp-2 leading-relaxed">{arch.subtitle}</p>
    </button>
  );
}

// ── Profile card ──
function ProfileCard({ profile, isSelected, onClick }: { profile: DemoProfile; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full rounded-xl p-3 sm:p-4 text-left transition-all duration-200 relative overflow-hidden',
        isSelected
          ? 'bg-[hsl(var(--accent-orange))]/15 border-2 border-[hsl(var(--accent-orange))]/70 shadow-lg shadow-[hsl(var(--accent-orange))]/10'
          : 'bg-white/[0.07] border-2 border-transparent hover:border-white/25 hover:bg-white/[0.12] active:scale-[0.98]'
      )}
    >
      {isSelected && (
        <div className="absolute top-2.5 right-2.5">
          <div className="w-5 h-5 rounded-full bg-[hsl(var(--accent-orange))] flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
      <h4 className={cn('font-semibold text-xs sm:text-sm mb-1', isSelected ? 'text-[hsl(var(--accent-orange))]' : 'text-white')}>{profile.label}</h4>
      <p className="text-white/40 text-[10px] sm:text-xs mb-2.5 leading-relaxed pr-5">{profile.description}</p>
      <div className="flex flex-wrap gap-1">
        {profile.accessAreas.map(area => (
          <span key={area} className={cn(
            'text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full',
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
  const [step, setStep] = useState(0);
  const [selectedArch, setSelectedArch] = useState<DemoArchetype | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<DemoProfile | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<'lead' | 'admin'>('lead');
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
      // Switch to admin mode instead of direct login
      setDemoMode('admin');
      toast({ title: 'Modo admin activado', description: 'Ahora ves todos los arquetipos disponibles.' });
    }
  }, [toast]);

  const archetypes = getArchetypesForMode(demoMode);

  const profiles: DemoProfile[] = selectedArch ? getProfilesForArchetype(selectedArch.key) : [];

  // Auto-advance if archetype has only 1 profile
  useEffect(() => {
    if (step === 2 && profiles.length === 1) {
      setSelectedProfile(profiles[0]);
      setStep(3);
    }
  }, [step, profiles]);

  useEffect(() => {
    if (isAuthenticated && user && pendingRedirect.current) {
      const dest = pendingRedirect.current;
      pendingRedirect.current = null;
      setLoadingRole(null);
      navigate(dest);
    }
  }, [isAuthenticated, user, navigate]);

  const handleSelectArch = (arch: DemoArchetype) => {
    setSelectedArch(arch);
    setSelectedProfile(null);
  };

  const handleNext = () => {
    if (step === 1 && selectedArch) setStep(2);
    else if (step === 2 && selectedProfile) setStep(3);
  };

  const handleBack = () => {
    if (step === 3) { setStep(2); setSelectedProfile(null); }
    else if (step === 2) { setStep(1); setSelectedProfile(null); }
    else if (step === 1) { setStep(0); setSelectedArch(null); }
  };

  const handleEnter = async () => {
    if (!selectedProfile || !selectedArch || loadingRole) return;
    setLoadingRole(selectedProfile.role);

    const mapping = mapArchetypeToDemoOrg(selectedArch);

    setDemoConfig({
      orgId: mapping.orgId,
      orgName: mapping.orgName,
      orgType: mapping.orgType,
      operatingModel: mapping.operatingModel,
      modules: mapping.modules,
      profileLabel: selectedProfile.label,
    });

    try {
      pendingRedirect.current = mapping.redirectPath;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: selectedProfile.email,
        password: 'demo123456',
      });

      if (signInError) {
        pendingRedirect.current = null;
        toast({ title: 'Error de autenticación', description: signInError.message, variant: 'destructive' });
        setLoadingRole(null);
        return;
      }

      if (selectedProfile.role !== 'admin') {
        const result = await ensureDemoUser(
          selectedProfile.role,
          isUuidOrganizationId(mapping.orgId) ? mapping.orgId : undefined,
        );
        if (!result.ok) {
          const errInfo = interpretDemoError(result);
          console.error('ensure-demo-user failed:', result.error, result.status);
          toast({ title: errInfo.title, description: errInfo.description, variant: 'destructive' });
        }
        if (isNoOrgResult(result)) {
          toast({ title: 'Demo sin organización', description: 'Algunas funciones pueden estar limitadas.' });
        }
      }
    } catch (err: any) {
      console.error('Demo login error:', err);
      pendingRedirect.current = null;
      toast({ title: 'Sin conexión', description: 'No se pudo conectar con el servidor.', variant: 'destructive' });
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="absolute inset-0 z-0">
        <img src={bgHillside} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img src={logoNovasilva} alt="Nova Silva" className="h-8 w-8 sm:h-9 sm:w-9 object-contain cursor-pointer select-none" onClick={handleLogoTap} />
            <div>
              <h1 className="text-white font-bold text-base sm:text-lg tracking-tight">Nova Silva</h1>
              <p className="text-white/30 text-[10px] sm:text-xs">Entorno de demostración</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {demoMode === 'admin' && (
              <span className="text-[hsl(var(--accent-orange))] text-[10px] font-semibold uppercase tracking-wider bg-[hsl(var(--accent-orange))]/10 px-2 py-0.5 rounded">Admin</span>
            )}
            <Link to="/login" className="text-white/40 hover:text-white text-[10px] sm:text-xs transition-colors">
              Acceso real →
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex items-start sm:items-center justify-center p-3 sm:p-8 overflow-y-auto">
          <div className="w-full max-w-3xl">

            {/* Step 0: Landing */}
            {step === 0 && (
              <div className="text-center space-y-6 sm:space-y-10 animate-fade-in px-2">
                <div className="space-y-3 sm:space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/10 text-white/50 text-[10px] sm:text-xs mb-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--accent-orange))] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--accent-orange))]" />
                    </span>
                    Entorno interactivo
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                    Explora Nova Silva<br />
                    <span className="text-[hsl(var(--accent-orange))]">en modo demo</span>
                  </h2>
                  <p className="text-white/45 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
                    Simula la experiencia como cooperativa, exportador, finca empresarial o certificadora. Sin registro, sin compromiso.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white font-semibold py-3 sm:py-3.5 px-8 sm:px-10 rounded-xl transition-all text-sm shadow-lg shadow-[hsl(var(--accent-orange))]/20 active:scale-[0.97]"
                  >
                    Iniciar demo
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <Link
                    to="/demo/setup"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white/40 hover:text-white text-xs sm:text-sm py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all active:scale-[0.97]"
                  >
                    Configurar demo personalizado
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="hidden sm:flex items-center justify-center gap-6 pt-2">
                  {[
                    { label: 'Cooperativas' },
                    { label: 'Exportadores' },
                    { label: 'Fincas' },
                    { label: 'Certificadoras' },
                  ].map(item => (
                    <div key={item.label} className="text-white/25 text-xs">{item.label}</div>
                  ))}
                </div>

                <DemoConversionCTA variant="landing" />
              </div>
            )}

            {/* Step 1: Select Archetype */}
            {step === 1 && (
              <div className="space-y-4 sm:space-y-5 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <button onClick={handleBack} className="flex items-center gap-1 text-white/40 hover:text-white text-[10px] sm:text-xs mb-1.5 sm:mb-2 transition-colors">
                      <ChevronLeft className="h-3.5 w-3.5" /> Volver
                    </button>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Elige tu tipo de operación</h2>
                    <p className="text-white/40 text-[10px] sm:text-xs mt-0.5 sm:mt-1">Selecciona la operación que quieres explorar</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Mode toggle (tapping logo 5x activates admin) */}
                    {demoMode === 'admin' && (
                      <button
                        onClick={() => setDemoMode('lead')}
                        className="text-[10px] text-white/30 hover:text-white/50 transition-colors"
                      >
                        Modo lead
                      </button>
                    )}
                    <StepIndicator current={0} total={3} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {archetypes.map(arch => (
                    <ArchetypeCard
                      key={arch.key}
                      arch={arch}
                      isSelected={selectedArch?.key === arch.key}
                      onClick={() => handleSelectArch(arch)}
                    />
                  ))}
                </div>

                <div className="flex justify-end pt-1 sm:pt-2">
                  <button
                    onClick={handleNext}
                    disabled={!selectedArch}
                    className={cn(
                      'flex items-center gap-2 font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl transition-all text-xs sm:text-sm',
                      selectedArch
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
            {step === 2 && selectedArch && (
              <div className="space-y-4 sm:space-y-5 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <button onClick={handleBack} className="flex items-center gap-1 text-white/40 hover:text-white text-[10px] sm:text-xs mb-1.5 sm:mb-2 transition-colors">
                      <ChevronLeft className="h-3.5 w-3.5" /> {selectedArch.label}
                    </button>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Elige tu perfil</h2>
                    <p className="text-white/40 text-[10px] sm:text-xs mt-0.5 sm:mt-1">¿Cómo quieres explorar {selectedArch.label}?</p>
                  </div>
                  <StepIndicator current={1} total={3} />
                </div>

                {/* Archetype summary chip */}
                <div className="flex items-center gap-2.5 sm:gap-3 bg-white/[0.06] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border border-white/10">
                  <selectedArch.icon className="h-4 w-4 text-[hsl(var(--accent-orange))] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-white text-xs sm:text-sm font-medium">{selectedArch.label}</span>
                    {selectedArch.country && <span className="text-white/30 text-[10px] sm:text-xs ml-2">{selectedArch.country}</span>}
                  </div>
                </div>

                <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
                  {profiles.map(profile => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      isSelected={selectedProfile?.id === profile.id}
                      onClick={() => setSelectedProfile(profile)}
                    />
                  ))}
                </div>

                <div className="flex justify-end pt-1 sm:pt-2">
                  <button
                    onClick={handleNext}
                    disabled={!selectedProfile}
                    className={cn(
                      'flex items-center gap-2 font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl transition-all text-xs sm:text-sm',
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
            {step === 3 && selectedArch && selectedProfile && (
              <div className="max-w-md mx-auto animate-fade-in">
                <div className="flex justify-center mb-4 sm:mb-5">
                  <StepIndicator current={2} total={3} />
                </div>

                <div className="bg-white/[0.08] backdrop-blur-xl border border-white/15 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-1.5">Organización</p>
                    <div className="flex items-center gap-2">
                      <selectedArch.icon className="h-4 w-4 text-[hsl(var(--accent-orange))]" />
                      <span className="text-white font-medium text-xs sm:text-sm">{selectedArch.label}</span>
                    </div>
                    {selectedArch.country && <p className="text-white/30 text-[10px] sm:text-xs mt-0.5">{selectedArch.country}</p>}
                  </div>
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-1.5">Perfil de acceso</p>
                    <p className="text-white font-medium text-xs sm:text-sm">{selectedProfile.label}</p>
                    <p className="text-white/30 text-[10px] sm:text-xs mt-0.5">{selectedProfile.description}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-2">Acceso principal</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProfile.accessAreas.map(area => (
                        <span key={area} className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[hsl(var(--accent-orange))]/15 text-[hsl(var(--accent-orange))]">{area}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleEnter}
                    disabled={!!loadingRole}
                    className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white font-semibold py-3 sm:py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[hsl(var(--accent-orange))]/20 active:scale-[0.97] text-sm"
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
                <button onClick={handleBack} className="flex items-center justify-center gap-1.5 text-white/40 hover:text-white text-[10px] sm:text-xs mt-3 sm:mt-4 mx-auto transition-colors">
                  <ChevronLeft className="h-3.5 w-3.5" /><span>Cambiar selección</span>
                </button>
                <p className="text-white/15 text-[10px] sm:text-xs text-center mt-2 sm:mt-3">Datos ficticios para demostración</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoLogin;
