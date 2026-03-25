/**
 * DemoSetupWizard — 6-step premium wizard for prospects.
 * Step 1 uses DemoArchetypes with lead/admin mode toggle.
 * Captures org profile → maps to closest demo archetype → shows plan recommendation → enters personalized demo.
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { setDemoConfig } from '@/hooks/useDemoConfig';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ensureDemoUser } from '@/lib/ensureDemoUser';
import { interpretDemoError, isNoOrgResult } from '@/lib/demoErrors';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  type DemoArchetype, type DemoMode,
  getArchetypesForMode, mapArchetypeToDemoOrg,
} from '@/config/demoArchetypes';
import {
  recommendPlan, recommendPacks, estimatePrice,
  PLANS, PACKS, getOrgTypeLabel, getModelLabel,
  getPricingModel, FARMER_BASE, FARMER_SCALE, FARMER_PACKS,
  estimateFarmerPrice, getFarmerScaleTierIndex,
  AGGREGATOR_PLANS, AGGREGATOR_PACKS, estimateAggregatorPrice,
  type PlanTier, type DemoSetupConfig,
} from '@/lib/pricingEngine';
import {
  Leaf, ArrowRight, ArrowLeft, Loader2,
  Building2, Sprout, Truck, ShieldCheck, Factory, Ship, Coffee,
  MapPin, Bug, TrendingUp, Heart, Shield, Award, Briefcase,
  Boxes, ShoppingCart, Package, ChevronRight, Play,
  Users, Eye, FileCheck, DollarSign, CheckCircle, Settings2,
} from 'lucide-react';
import logoNovasilva from '@/assets/logo-novasilva.png';
import bgForest from '@/assets/bg-forest-network.png';

// ── Types ──

type Step = 0 | 1 | 2 | 3 | 4 | 5;
const TOTAL_STEPS = 6;

interface SetupState {
  archetype: DemoArchetype | null;
  operations: string[];
  interests: string[];
  scalePlots: string;
  scaleProducers: string;
  scaleUsers: string;
  hasLabor: boolean;
  hasInventory: boolean;
  hasExports: boolean;
}

const INITIAL: SetupState = {
  archetype: null,
  operations: [],
  interests: [],
  scalePlots: '',
  scaleProducers: '',
  scaleUsers: '',
  hasLabor: false,
  hasInventory: false,
  hasExports: false,
};

// ── Config data ──

const OPERATIONS = [
  { value: 'produce_own', label: 'Solo producimos café propio', icon: Sprout },
  { value: 'produce_and_buy', label: 'Producimos y también compramos café a terceros', icon: Truck },
  { value: 'aggregate', label: 'Agrupamos productores', icon: Users },
  { value: 'trade', label: 'Compramos y comercializamos café', icon: Coffee },
  { value: 'audit', label: 'Auditamos o verificamos cumplimiento', icon: Eye },
  { value: 'sell_inputs', label: 'Vendemos insumos a productores', icon: ShoppingCart },
];

const INTERESTS = [
  { value: 'production', label: 'Producción y trazabilidad', icon: MapPin, desc: 'Parcelas, entregas, documentación' },
  { value: 'agronomy', label: 'Agronomía y recomendaciones', icon: Bug, desc: 'Nutrición, Guard, Yield' },
  { value: 'compliance', label: 'EUDR y cumplimiento', icon: Shield, desc: 'Trazabilidad, dossiers, deforestación cero' },
  { value: 'quality', label: 'Calidad / Nova Cup', icon: Award, desc: 'Cataciones SCA, perfiles de taza' },
  { value: 'labor', label: 'Jornales y costos', icon: Briefcase, desc: 'Cuadrillas, registros de trabajo' },
  { value: 'inventory', label: 'Inventario e insumos', icon: Boxes, desc: 'Stock, equipos, movimientos' },
  { value: 'catalog', label: 'Catálogo de insumos para productores', icon: ShoppingCart, desc: 'Distribución de insumos a socios' },
  { value: 'supply', label: 'Compras y abastecimiento', icon: Truck, desc: 'Proveedores de café, recepción, lotes' },
];

// ── Derive operating model from archetype ──

function deriveModel(state: SetupState): string {
  if (state.archetype) return state.archetype.operatingModel;
  return 'single_farm';
}

// ── Narrative ──

function getNarrative(state: SetupState): string {
  if (!state.archetype) return '';
  const narratives: Record<string, string> = {
    single_farm: 'Explorarás una finca tecnificada con manejo agronómico intensivo, jornales y resultados de calidad.',
    estate: 'Verás una finca empresarial con operación propia, agronomía avanzada y gestión de costos.',
    estate_hybrid: 'Explorarás una finca que combina producción propia con abastecimiento externo, ideal para operaciones mixtas.',
    aggregator: 'Accederás a una cooperativa con cientos de productores, trazabilidad completa y módulos de cumplimiento.',
    trader: 'Verás la perspectiva de un exportador: proveedores, riesgo de origen, lotes y cumplimiento EUDR.',
    auditor: 'Explorarás el data room de una certificadora: auditorías, evidencia y dossiers de cumplimiento.',
    platform: 'Accederás a la consola administrativa interna de Nova Silva.',
  };
  return narratives[state.archetype.operatingModel] || narratives.single_farm;
}

// ── Build archetype mapping for enter ──

function buildArchetypeMapping(state: SetupState) {
  if (!state.archetype) {
    return { orgId: 'coop_demo', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', redirectPath: '/produccion', orgName: 'Cooperativa', modules: ['Producción'], operatingModel: 'aggregator', orgType: 'cooperativa' };
  }
  const base = mapArchetypeToDemoOrg(state.archetype);
  // Merge interest-based modules
  const moduleMap: Record<string, string[]> = {
    production: ['Producción'],
    agronomy: ['Agronomía', 'Nova Guard', 'Nova Yield'],
    compliance: ['EUDR', 'Cumplimiento'],
    quality: ['Nova Cup', 'Calidad'],
    labor: ['Jornales'],
    inventory: ['Inventario'],
    catalog: ['Catálogo de insumos'],
    supply: ['Abastecimiento', 'Lotes'],
  };
  const extra = state.interests.flatMap(i => moduleMap[i] || []);
  const allModules = [...new Set([...base.modules, ...extra, 'VITAL', 'Finanzas'])];
  return { ...base, modules: allModules };
}

// ── Main Component ──

export default function DemoSetupWizard() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(0);
  const [state, setState] = useState<SetupState>(INITIAL);
  const [entering, setEntering] = useState(false);
  const [enterError, setEnterError] = useState<{ title: string; description: string } | null>(null);
  const pendingRedirect = useRef<string | null>(null);
  const [demoMode, setDemoMode] = useState<DemoMode>('lead');

  const update = (partial: Partial<SetupState>) => setState(prev => ({ ...prev, ...partial }));
  const model = deriveModel(state);
  const archMapping = useMemo(() => buildArchetypeMapping(state), [state]);
  const progressValue = ((step + 1) / TOTAL_STEPS) * 100;

  useEffect(() => {
    if (isAuthenticated && user && pendingRedirect.current) {
      const dest = pendingRedirect.current;
      pendingRedirect.current = null;
      setEntering(false);
      navigate(dest);
    }
  }, [isAuthenticated, user, navigate]);

  const handleEnterDemo = async () => {
    if (entering) return;
    setEntering(true);
    setEnterError(null);
    const arch = archMapping;
    const uniqueModules = [...new Set(arch.modules)];

    setDemoConfig({
      orgId: arch.orgId,
      orgName: arch.orgName,
      orgType: arch.orgType,
      operatingModel: arch.operatingModel,
      modules: uniqueModules,
      profileLabel: 'Demo personalizado',
    });

    sessionStorage.setItem('novasilva_demo_setup', JSON.stringify({
      archetypeKey: state.archetype?.key,
      operations: state.operations,
      interests: state.interests,
      scalePlots: state.scalePlots,
      scaleProducers: state.scaleProducers,
      scaleUsers: state.scaleUsers,
      hasLabor: state.hasLabor,
      hasInventory: state.hasInventory,
      hasExports: state.hasExports,
      operatingModel: model,
      modulesEnabled: uniqueModules,
    }));

    try {
      pendingRedirect.current = arch.redirectPath;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: arch.email,
        password: 'demo123456',
      });

      if (signInError) {
        pendingRedirect.current = null;
        setEnterError({ title: 'Error de autenticación', description: signInError.message });
        setEntering(false);
        return;
      }

      // ensure-demo-user with real authenticated session
      const result = await ensureDemoUser(arch.role, arch.orgId);
      if (!result.ok) {
        const errInfo = interpretDemoError(result);
        console.error('ensure-demo-user failed:', result.error, result.status);
        toast({ title: errInfo.title, description: errInfo.description, variant: 'destructive' });
      }

      if (isNoOrgResult(result)) {
        toast({ title: 'Demo sin organización', description: 'Algunas funciones pueden estar limitadas.' });
      }
    } catch (err: any) {
      pendingRedirect.current = null;
      setEnterError({ title: 'Sin conexión', description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.' });
      setEntering(false);
    }
  };

  // Admin archetype can skip to summary directly
  const isAdminArchetype = state.archetype?.key === 'admin_novasilva';
  const handleStep1Next = () => {
    if (isAdminArchetype) {
      setStep(5); // skip to summary
    } else {
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="absolute inset-0 z-0">
        <img src={bgForest} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/75 to-black/85" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img src={logoNovasilva} alt="Nova Silva" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" />
            <span className="text-white font-bold text-base sm:text-lg tracking-tight">Nova Silva</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {step > 0 && (
              <span className="text-white/30 text-[10px] sm:text-xs">Paso {step} de {TOTAL_STEPS - 1}</span>
            )}
            <Link to="/demo" className="text-white/30 hover:text-white text-[10px] sm:text-xs transition-colors">
              Demo directo →
            </Link>
          </div>
        </header>

        {step > 0 && (
          <div className="px-4 sm:px-6 pt-3">
            <Progress value={progressValue} className="h-1 bg-white/10 [&>div]:bg-[hsl(var(--accent-orange))]" />
          </div>
        )}

        <main className="flex-1 flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-2xl">
            {step === 0 && <StepWelcome onStart={() => setStep(1)} />}
            {step === 1 && (
              <StepArchetype
                state={state}
                update={update}
                demoMode={demoMode}
                setDemoMode={setDemoMode}
                onNext={handleStep1Next}
              />
            )}
            {step === 2 && <StepOperations state={state} update={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
            {step === 3 && <StepInterests state={state} update={update} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
            {step === 4 && <StepScale state={state} update={update} onNext={() => setStep(5)} onBack={() => setStep(3)} model={model} />}
            {step === 5 && (
              <StepSummary
                state={state}
                model={model}
                archMapping={archMapping}
                narrative={getNarrative(state)}
                onEnter={handleEnterDemo}
                onBack={() => isAdminArchetype ? setStep(1) : setStep(4)}
                entering={entering}
                enterError={enterError}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Shared Components ──

function WizardCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8', className)}>
      {children}
    </div>
  );
}

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 sm:mb-6">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-white/40 text-[10px] sm:text-sm mt-1 sm:mt-1.5">{subtitle}</p>}
    </div>
  );
}

function NavBar({ onBack, onNext, nextLabel, disabled }: { onBack?: () => void; onNext: () => void; nextLabel?: string; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between mt-4 sm:mt-6">
      {onBack ? (
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs transition-colors">
          <ArrowLeft className="h-4 w-4" /> Atrás
        </button>
      ) : <div />}
      <button
        onClick={onNext}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all',
          disabled
            ? 'bg-white/10 text-white/30 cursor-not-allowed'
            : 'bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white'
        )}
      >
        {nextLabel || 'Siguiente'} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Step 0: Welcome ──

function StepWelcome({ onStart }: { onStart: () => void }) {
  return (
    <WizardCard className="text-center max-w-lg mx-auto">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3">
        Configura un demo adaptado a tu operación
      </h1>
      <p className="text-white/40 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8 max-w-md mx-auto">
        En menos de 2 minutos te mostraremos una versión de Nova Silva alineada con la forma en que opera tu organización.
      </p>
      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl transition-colors text-xs sm:text-sm"
      >
        <Play className="h-4 w-4" /> Comenzar
      </button>
      <p className="text-white/15 text-[10px] sm:text-xs mt-4 sm:mt-6">Sin registro · Sin compromiso · 100% interactivo</p>
    </WizardCard>
  );
}

// ── Step 1: Archetype Selection (NEW — with lead/admin mode) ──

function StepArchetype({ state, update, demoMode, setDemoMode, onNext }: {
  state: SetupState;
  update: (p: Partial<SetupState>) => void;
  demoMode: DemoMode;
  setDemoMode: (m: DemoMode) => void;
  onNext: () => void;
}) {
  const archetypes = getArchetypesForMode(demoMode);

  return (
    <WizardCard className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">¿Qué tipo de operación quieres explorar?</h2>
          <p className="text-white/40 text-sm mt-1.5">Selecciona el perfil que mejor describe a tu cliente o tu organización.</p>
        </div>
        {/* Mode toggle */}
        <button
          onClick={() => setDemoMode(demoMode === 'lead' ? 'admin' : 'lead')}
          className={cn(
            'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border',
            demoMode === 'admin'
              ? 'bg-[hsl(var(--accent-orange))]/15 border-[hsl(var(--accent-orange))]/30 text-[hsl(var(--accent-orange))]'
              : 'bg-white/5 border-white/10 text-white/30 hover:text-white/50'
          )}
        >
          <Settings2 className="h-3 w-3" />
          {demoMode === 'admin' ? 'Modo admin' : 'Modo lead'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {archetypes.map(arch => {
          const isSelected = state.archetype?.key === arch.key;
          const Icon = arch.icon;
          return (
            <button
              key={arch.key}
              onClick={() => update({ archetype: arch })}
              className={cn(
                'group flex flex-col p-4 rounded-xl border text-left transition-all relative',
                isSelected
                  ? 'border-[hsl(var(--accent-orange))]/50 bg-[hsl(var(--accent-orange))]/10 ring-1 ring-[hsl(var(--accent-orange))]/20'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 rounded-full bg-[hsl(var(--accent-orange))] flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2.5 mb-2">
                <div className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                  isSelected ? 'bg-[hsl(var(--accent-orange))]/20 text-[hsl(var(--accent-orange))]' : 'bg-white/8 text-white/40'
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-white leading-tight">{arch.label}</p>
              </div>
              <p className="text-[11px] text-white/35 leading-relaxed">{arch.subtitle}</p>
              {arch.country && (
                <span className="text-[9px] text-white/20 mt-2">{arch.country}</span>
              )}
              {/* Admin-only badge */}
              {!arch.modes.includes('lead') && (
                <span className="absolute top-3 left-3 text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-white/30 font-semibold uppercase">Admin</span>
              )}
            </button>
          );
        })}
      </div>

      {demoMode === 'admin' && (
        <p className="text-[10px] text-white/20 mt-3 text-center">
          Modo admin: {archetypes.length} arquetipos disponibles · Incluye demos internos y especializados
        </p>
      )}

      <NavBar onNext={onNext} disabled={!state.archetype} />
    </WizardCard>
  );
}

// ── Step 2: Operations ──

function StepOperations({ state, update, onNext, onBack }: { state: SetupState; update: (p: Partial<SetupState>) => void; onNext: () => void; onBack: () => void }) {
  const toggle = (v: string) => {
    const ops = state.operations.includes(v) ? state.operations.filter(x => x !== v) : [...state.operations, v];
    update({ operations: ops });
  };

  return (
    <WizardCard>
      <StepTitle title="¿Cómo opera tu organización hoy?" subtitle="Selecciona todas las actividades que apliquen." />
      <div className="space-y-2.5">
        {OPERATIONS.map(op => (
          <button
            key={op.value}
            onClick={() => toggle(op.value)}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all',
              state.operations.includes(op.value)
                ? 'border-[hsl(var(--accent-orange))]/50 bg-[hsl(var(--accent-orange))]/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            )}
          >
            <Checkbox
              checked={state.operations.includes(op.value)}
              onCheckedChange={() => toggle(op.value)}
              className="border-white/30 data-[state=checked]:bg-[hsl(var(--accent-orange))] data-[state=checked]:border-[hsl(var(--accent-orange))]"
            />
            <op.icon className={cn('h-4 w-4 shrink-0', state.operations.includes(op.value) ? 'text-[hsl(var(--accent-orange))]' : 'text-white/40')} />
            <span className="text-sm text-white">{op.label}</span>
          </button>
        ))}
      </div>
      <NavBar onBack={onBack} onNext={onNext} disabled={state.operations.length === 0} />
    </WizardCard>
  );
}

// ── Step 3: Interests ──

function StepInterests({ state, update, onNext, onBack }: { state: SetupState; update: (p: Partial<SetupState>) => void; onNext: () => void; onBack: () => void }) {
  const toggle = (v: string) => {
    const arr = state.interests.includes(v) ? state.interests.filter(x => x !== v) : [...state.interests, v];
    update({ interests: arr });
  };

  return (
    <WizardCard>
      <StepTitle title="¿Qué quieres ver en el demo?" subtitle="Selecciona los bloques que más te interesan." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {INTERESTS.map(item => (
          <button
            key={item.value}
            onClick={() => toggle(item.value)}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
              state.interests.includes(item.value)
                ? 'border-[hsl(var(--accent-orange))]/50 bg-[hsl(var(--accent-orange))]/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            )}
          >
            <div className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
              state.interests.includes(item.value) ? 'bg-[hsl(var(--accent-orange))]/20 text-[hsl(var(--accent-orange))]' : 'bg-white/8 text-white/40'
            )}>
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
      <NavBar onBack={onBack} onNext={onNext} disabled={state.interests.length === 0} />
    </WizardCard>
  );
}

// ── Step 4: Scale ──

function StepScale({ state, update, onNext, onBack, model }: { state: SetupState; update: (p: Partial<SetupState>) => void; onNext: () => void; onBack: () => void; model: string }) {
  const showProducers = ['aggregator', 'trader', 'estate_hybrid'].includes(model);

  return (
    <WizardCard>
      <StepTitle title="Escala operativa" subtitle="No te preocupes por la exactitud, solo una referencia." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-1.5">
          <label className="text-xs text-white/40 font-medium">Parcelas o fincas</label>
          <Select value={state.scalePlots} onValueChange={v => update({ scalePlots: v })}>
            <SelectTrigger className="bg-white/8 border-white/15 text-white text-sm [&>svg]:text-white/40">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1 - 10</SelectItem>
              <SelectItem value="11-50">11 - 50</SelectItem>
              <SelectItem value="51-200">51 - 200</SelectItem>
              <SelectItem value="200+">Más de 200</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showProducers && (
          <div className="space-y-1.5">
            <label className="text-xs text-white/40 font-medium">Productores o proveedores</label>
            <Select value={state.scaleProducers} onValueChange={v => update({ scaleProducers: v })}>
              <SelectTrigger className="bg-white/8 border-white/15 text-white text-sm [&>svg]:text-white/40">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-50">1 - 50</SelectItem>
                <SelectItem value="51-200">51 - 200</SelectItem>
                <SelectItem value="201-1000">201 - 1,000</SelectItem>
                <SelectItem value="1000+">Más de 1,000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs text-white/40 font-medium">Usuarios internos</label>
          <Select value={state.scaleUsers} onValueChange={v => update({ scaleUsers: v })}>
            <SelectTrigger className="bg-white/8 border-white/15 text-white text-sm [&>svg]:text-white/40">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-5">1 - 5</SelectItem>
              <SelectItem value="6-20">6 - 20</SelectItem>
              <SelectItem value="20+">Más de 20</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 space-y-3">
        <p className="text-xs text-white/30 font-medium uppercase tracking-wider">Capacidades adicionales</p>
        {[
          { key: 'hasLabor' as const, label: 'Manejan cuadrillas o jornales', icon: Briefcase },
          { key: 'hasInventory' as const, label: 'Manejan inventario de insumos', icon: Boxes },
          { key: 'hasExports' as const, label: 'Trabajan con lotes / exportaciones', icon: Ship },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => update({ [item.key]: !state[item.key] } as any)}
            className={cn(
              'w-full flex items-center justify-between gap-3 p-3 rounded-xl border transition-all',
              state[item.key] ? 'border-[hsl(var(--accent-orange))]/30 bg-[hsl(var(--accent-orange))]/5' : 'border-white/10'
            )}
          >
            <div className="flex items-center gap-2.5">
              <item.icon className={cn('h-4 w-4', state[item.key] ? 'text-[hsl(var(--accent-orange))]' : 'text-white/30')} />
              <span className="text-sm text-white">{item.label}</span>
            </div>
            <Switch
              checked={state[item.key]}
              onCheckedChange={() => update({ [item.key]: !state[item.key] } as any)}
              className="data-[state=checked]:bg-[hsl(var(--accent-orange))]"
              onClick={e => e.stopPropagation()}
            />
          </button>
        ))}
      </div>

      <NavBar onBack={onBack} onNext={onNext} />
    </WizardCard>
  );
}

// ── Step 5: Summary with interactive plan selection ──

const PLAN_FEATURES: Record<string, { focus: string; highlights: string[] }> = {
  Smart: {
    focus: 'Operación real para cooperativas y beneficios medianos',
    highlights: ['Hasta 500 parcelas', 'Hasta 20 usuarios', 'Módulos core incluidos', 'Soporte estándar'],
  },
  Plus: {
    focus: 'Operaciones grandes con múltiples módulos y volumen',
    highlights: ['Hasta 2,000 parcelas', 'Hasta 50 usuarios', 'Módulos avanzados', 'Reportes personalizados'],
  },
  Enterprise: {
    focus: 'Exportadores y cadenas complejas sin límites',
    highlights: ['Sin límite de parcelas', 'Sin límite de usuarios', 'API dedicada', 'Soporte prioritario 24/7'],
  },
};

function StepSummary({ state, model, archMapping, narrative, onEnter, onBack, entering, enterError }: {
  state: SetupState; model: string;
  archMapping: ReturnType<typeof buildArchetypeMapping>;
  narrative: string;
  onEnter: () => void; onBack: () => void; entering: boolean;
  enterError: { title: string; description: string } | null;
}) {
  const orgLabel = state.archetype?.label || 'Organización';
  const uniqueModules = [...new Set(archMapping.modules)];

  const pricingModel = getPricingModel(archMapping.orgType);
  const isFarmer = pricingModel === 'farmer';

  const setupConfig: DemoSetupConfig = {
    orgType: archMapping.orgType,
    operatingModel: model,
    interests: state.interests,
    scalePlots: state.scalePlots,
    scaleProducers: state.scaleProducers,
    scaleUsers: state.scaleUsers,
    hasLabor: state.hasLabor,
    hasInventory: state.hasInventory,
    hasExports: state.hasExports,
  };
  const recPacks = recommendPacks(setupConfig);
  const recommendedPlan = recommendPlan(setupConfig);

  const [selectedPlan, setSelectedPlan] = useState<PlanTier>(recommendedPlan);

  const plotCount = parseInt(state.scalePlots?.match(/(\d+)/)?.[1] || '5');
  const farmerPacks = recPacks.filter(k => FARMER_PACKS.some(p => p.key === k));
  const farmerEst = estimateFarmerPrice(plotCount, farmerPacks);
  const aggEst = estimateAggregatorPrice(selectedPlan, recPacks);

  const PACK_ICONS_MAP: Record<string, typeof Bug> = {
    agronomia: Bug, cumplimiento: Shield, calidad: Award,
    operacion: Briefcase, abastecimiento: Truck, catalogo: ShoppingCart,
  };

  const activePacks = isFarmer ? FARMER_PACKS : AGGREGATOR_PACKS;
  const displayPacks = isFarmer ? farmerPacks : recPacks;

  useEffect(() => {
    sessionStorage.setItem('novasilva_selected_plan', selectedPlan);
  }, [selectedPlan]);

  return (
    <WizardCard className="max-w-3xl">
      <StepTitle title="Tu demo personalizado está listo" subtitle="Selecciona tu plan y entra al entorno interactivo." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Configuration summary */}
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10">
              {state.archetype && <state.archetype.icon className="h-3.5 w-3.5 text-[hsl(var(--accent-orange))]" />}
              <span className="text-xs text-white font-medium">{orgLabel}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10">
              <span className="text-xs text-white font-medium">{getModelLabel(model)}</span>
            </div>
          </div>

          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-2">Módulos activados</p>
            <div className="flex flex-wrap gap-1.5">
              {uniqueModules.map(mod => (
                <span key={mod} className="text-[10px] px-2.5 py-1 rounded-full bg-[hsl(var(--accent-orange))]/10 text-[hsl(var(--accent-orange))]/90 border border-[hsl(var(--accent-orange))]/15">
                  {mod}
                </span>
              ))}
            </div>
          </div>

          {(state.scalePlots || state.scaleProducers || state.scaleUsers) && (
            <div className="flex flex-wrap gap-2">
              {state.scalePlots && <Badge variant="outline" className="border-white/15 text-white/50 text-[10px]">📍 {state.scalePlots} parcelas</Badge>}
              {state.scaleProducers && <Badge variant="outline" className="border-white/15 text-white/50 text-[10px]">👥 {state.scaleProducers} productores</Badge>}
              {state.scaleUsers && <Badge variant="outline" className="border-white/15 text-white/50 text-[10px]">🧑‍💻 {state.scaleUsers} usuarios</Badge>}
            </div>
          )}

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/50 leading-relaxed">{narrative}</p>
          </div>

          {displayPacks.length > 0 && (
            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-2">Packs incluidos</p>
              <div className="space-y-1.5">
                {displayPacks.map(pk => {
                  const pack = activePacks.find(p => p.key === pk);
                  const Icon = PACK_ICONS_MAP[pk] || Package;
                  return pack ? (
                    <div key={pk} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/8">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-[hsl(var(--accent-orange))]" />
                        <span className="text-xs text-white">{pack.label}</span>
                      </div>
                      <span className="text-[10px] text-white/40">${pack.price}/mes</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Plan selection + pricing */}
        <div className="space-y-4">
          {isFarmer ? (
            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-2.5">Tu plan de finca</p>
              <div className="p-3 rounded-xl border border-[hsl(var(--accent-orange))]/50 bg-[hsl(var(--accent-orange))]/10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-white">Suscripción base</span>
                    <p className="text-[10px] text-white/30 mt-0.5">Producción · Parcelas · Registros · 2 usuarios</p>
                  </div>
                  <span className="text-base font-bold text-white">${FARMER_BASE}<span className="text-[10px] text-white/30 font-normal">/mes</span></span>
                </div>
                {farmerEst.scaleSurcharge > 0 && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/8">
                    <span className="text-[10px] text-white/40">Escala ({FARMER_SCALE[getFarmerScaleTierIndex(plotCount)].label})</span>
                    <span className="text-xs text-white font-mono">+${farmerEst.scaleSurcharge}/mes</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold">Selecciona tu plan</p>
                {selectedPlan !== recommendedPlan && (
                  <span className="text-[9px] text-white/25">
                    Recomendado: {recommendedPlan} · Seleccionado: {selectedPlan}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {AGGREGATOR_PLANS.map(p => {
                  const isSelected = p.tier === selectedPlan;
                  const isRecommended = p.tier === recommendedPlan;
                  const features = PLAN_FEATURES[p.tier];
                  return (
                    <button
                      key={p.tier}
                      onClick={() => setSelectedPlan(p.tier)}
                      className={cn(
                        'w-full text-left p-3 rounded-xl border transition-all cursor-pointer',
                        isSelected
                          ? 'border-[hsl(var(--accent-orange))]/60 bg-[hsl(var(--accent-orange))]/10 ring-1 ring-[hsl(var(--accent-orange))]/30'
                          : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                            isSelected
                              ? 'border-[hsl(var(--accent-orange))] bg-[hsl(var(--accent-orange))]'
                              : 'border-white/25'
                          )}>
                            {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                          </div>
                          <span className="text-sm font-semibold text-white">{p.label}</span>
                          {p.badge && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--accent-orange))]/20 text-[hsl(var(--accent-orange))] font-bold">{p.badge}</span>}
                          {isRecommended && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">RECOMENDADO</span>
                          )}
                        </div>
                        <span className="text-base font-bold text-white">${p.base}<span className="text-[10px] text-white/30 font-normal">/mes</span></span>
                      </div>
                      <p className="text-[10px] text-white/30 mt-1 ml-6">{p.limit}</p>
                      {isSelected && features && (
                        <div className="mt-2 ml-6 space-y-1">
                          <p className="text-[10px] text-white/50 font-medium">{features.focus}</p>
                          <div className="flex flex-wrap gap-1">
                            {features.highlights.map(h => (
                              <span key={h} className="text-[9px] px-2 py-0.5 rounded-full bg-white/8 text-white/40">{h}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pricing total */}
          <div className="border-t border-white/10 pt-3 space-y-1.5">
            {isFarmer ? (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Base finca</span>
                  <span className="text-white font-mono">${farmerEst.base}</span>
                </div>
                {farmerEst.scaleSurcharge > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Escala parcelas</span>
                    <span className="text-white font-mono">+${farmerEst.scaleSurcharge}</span>
                  </div>
                )}
                {farmerEst.packs > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Packs ({farmerPacks.length})</span>
                    <span className="text-white font-mono">${farmerEst.packs}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-2 flex justify-between items-end">
                  <span className="text-white text-xs font-semibold">Estimado mensual</span>
                  <span className="text-xl font-bold text-[hsl(var(--accent-orange))]">${farmerEst.monthly}<span className="text-[10px] text-white/30 font-normal">/mes</span></span>
                </div>
                <div className="flex justify-between text-[10px] text-white/25">
                  <span>Estimado anual (15% desc.)</span>
                  <span>${farmerEst.annual}/año</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Plan {selectedPlan}</span>
                  <span className="text-white font-mono">${aggEst.base}</span>
                </div>
                {aggEst.packs > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Packs ({displayPacks.length})</span>
                    <span className="text-white font-mono">${aggEst.packs}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-2 flex justify-between items-end">
                  <span className="text-white text-xs font-semibold">Estimado mensual</span>
                  <span className="text-xl font-bold text-[hsl(var(--accent-orange))]">${aggEst.monthly}<span className="text-[10px] text-white/30 font-normal">/mes</span></span>
                </div>
                <div className="flex justify-between text-[10px] text-white/25">
                  <span>Estimado anual (15% desc.)</span>
                  <span>${Math.round(aggEst.monthly * 12 * 0.85)}/año</span>
                </div>
              </>
            )}
            <p className="text-[9px] text-white/15">Precio estimado en USD. El monto final depende del uso real. 14 días de prueba gratuita.</p>
          </div>
        </div>
      </div>

      {enterError && (
        <div className="mt-4 p-4 rounded-xl border border-destructive/40 bg-destructive/10 space-y-2">
          <p className="text-sm font-semibold text-destructive">{enterError.title}</p>
          <p className="text-xs text-white/60">{enterError.description}</p>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={onEnter}
          disabled={entering}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold transition-all text-sm',
            entering
              ? 'bg-[hsl(var(--accent-orange))]/50 text-white/70 cursor-not-allowed'
              : 'bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white shadow-lg shadow-[hsl(var(--accent-orange))]/20'
          )}
        >
          {entering ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Preparando tu demo…</>
          ) : enterError ? (
            <><Play className="h-4 w-4" /> Reintentar</>
          ) : (
            <><Play className="h-4 w-4" /> Entrar al demo con plan {isFarmer ? 'Finca' : selectedPlan}</>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/30 hover:text-white text-xs transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Ajustar
        </button>
        <p className="text-white/15 text-xs">Datos ficticios de demostración</p>
      </div>
    </WizardCard>
  );
}
