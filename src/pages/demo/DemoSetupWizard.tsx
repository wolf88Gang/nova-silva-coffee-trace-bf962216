/**
 * DemoSetupWizard — 6-step premium wizard for prospects.
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
  Users, Eye, FileCheck, DollarSign, CheckCircle,
} from 'lucide-react';
import logoNovasilva from '@/assets/logo-novasilva.png';
import bgForest from '@/assets/bg-forest-network.png';

// ── Types ──

type Step = 0 | 1 | 2 | 3 | 4 | 5;
const TOTAL_STEPS = 6;

type OrgType = 'productor_privado' | 'finca_empresarial' | 'cooperativa' | 'beneficio' | 'exportador' | 'certificadora' | 'otro';

interface SetupState {
  orgType: OrgType | null;
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
  orgType: null,
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

const ORG_TYPES: { value: OrgType; label: string; icon: typeof Users; desc: string }[] = [
  { value: 'productor_privado', label: 'Finca privada', icon: Leaf, desc: 'Productor independiente con parcelas propias' },
  { value: 'finca_empresarial', label: 'Finca empresarial', icon: Factory, desc: 'Operación grande con manejo intensivo' },
  { value: 'cooperativa', label: 'Cooperativa', icon: Building2, desc: 'Agrupa productores y coordina operación' },
  { value: 'beneficio', label: 'Beneficio / Procesador', icon: Package, desc: 'Compra, procesa y prepara café' },
  { value: 'exportador', label: 'Exportador', icon: Ship, desc: 'Compra y exporta café a mercados internacionales' },
  { value: 'certificadora', label: 'Certificadora', icon: ShieldCheck, desc: 'Audita y verifica cumplimiento de estándares' },
  { value: 'otro', label: 'Otro', icon: Sprout, desc: 'Otro tipo de organización agrícola' },
];

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

// ── Derive operating model ──

function deriveModel(state: SetupState): string {
  if (state.orgType === 'certificadora') return 'auditor';
  if (state.orgType === 'exportador') return 'trader';
  if (state.orgType === 'cooperativa' || state.orgType === 'beneficio') return 'aggregator';
  if (state.orgType === 'finca_empresarial') {
    return state.operations.includes('produce_and_buy') || state.operations.includes('trade') ? 'estate_hybrid' : 'estate';
  }
  return 'single_farm';
}

// ── Map to closest archetype ──

function mapToArchetype(state: SetupState): { orgId: string; email: string; role: string; redirectPath: string; orgName: string; modules: string[] } {
  const model = deriveModel(state);
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
  const modules = state.interests.flatMap(i => moduleMap[i] || []);
  // Always add VITAL and Finanzas
  if (!modules.includes('VITAL')) modules.push('VITAL');
  if (!modules.includes('Finanzas')) modules.push('Finanzas');

  switch (model) {
    case 'auditor':
      return { orgId: 'cert_demo', email: 'demo.certificadora@novasilva.com', role: 'certificadora', redirectPath: '/cumplimiento', orgName: 'Certificadora', modules: ['Auditorías', 'Data Room', 'Dossiers', ...modules] };
    case 'trader':
      return { orgId: 'exporter_demo', email: 'demo.exportador@novasilva.com', role: 'exportador', redirectPath: '/origenes', orgName: 'Exportador de Origen', modules: ['Orígenes', ...modules] };
    case 'aggregator':
      return { orgId: 'coop_demo', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', redirectPath: '/produccion', orgName: 'Cooperativa Regional', modules: ['Producción', 'Agronomía', ...modules] };
    case 'estate_hybrid':
      return { orgId: 'estate_demo', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', redirectPath: '/produccion', orgName: 'Finca Empresarial', modules: ['Producción', 'Abastecimiento', ...modules] };
    case 'estate':
      return { orgId: 'estate_demo', email: 'demo.cooperativa@novasilva.com', role: 'cooperativa', redirectPath: '/produccion', orgName: 'Finca Empresarial', modules: ['Producción', 'Agronomía', 'Jornales', ...modules] };
    default: // single_farm
      return { orgId: 'farm_demo', email: 'demo.productor@novasilva.com', role: 'productor', redirectPath: '/produccion', orgName: 'Finca Privada', modules: ['Producción', 'Agronomía', 'Jornales', ...modules] };
  }
}

// ── Narrative ──

function getNarrative(state: SetupState): string {
  const model = deriveModel(state);
  const narratives: Record<string, string> = {
    single_farm: 'Explorarás una finca tecnificada con manejo agronómico intensivo, jornales y resultados de calidad.',
    estate: 'Verás una finca empresarial con operación propia, agronomía avanzada y gestión de costos.',
    estate_hybrid: 'Explorarás una finca que combina producción propia con abastecimiento externo, ideal para operaciones mixtas.',
    aggregator: 'Accederás a una cooperativa con cientos de productores, trazabilidad completa y módulos de cumplimiento.',
    trader: 'Verás la perspectiva de un exportador: proveedores, riesgo de origen, lotes y cumplimiento EUDR.',
    auditor: 'Explorarás el data room de una certificadora: auditorías, evidencia y dossiers de cumplimiento.',
  };
  return narratives[model] || narratives.single_farm;
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

  const update = (partial: Partial<SetupState>) => setState(prev => ({ ...prev, ...partial }));
  const model = deriveModel(state);
  const archetype = useMemo(() => mapToArchetype(state), [state]);
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
    const arch = archetype;

    // Deduplicate modules
    const uniqueModules = [...new Set(arch.modules)];

    setDemoConfig({
      orgId: arch.orgId,
      orgName: arch.orgName,
      orgType: state.orgType || 'cooperativa',
      operatingModel: model,
      modules: uniqueModules,
      profileLabel: 'Demo personalizado',
    });

    // Store extended setup in sessionStorage for potential use
    sessionStorage.setItem('novasilva_demo_setup', JSON.stringify({
      ...state,
      operatingModel: model,
      modulesEnabled: uniqueModules,
      scaleProfile: { plots: state.scalePlots, producers: state.scaleProducers, users: state.scaleUsers },
    }));

    try {
      const result = await ensureDemoUser(arch.role);
      if (!result.ok) {
        const errInfo = interpretDemoError(result);
        console.error('ensure-demo-user failed:', result.error, result.status);
        setEnterError({ title: errInfo.title, description: errInfo.description });
        toast({
          title: errInfo.title,
          description: errInfo.description,
          variant: 'destructive',
        });
        setEntering(false);
        return;
      }

      if (isNoOrgResult(result)) {
        toast({
          title: 'Demo sin organización',
          description: 'Algunas funciones pueden estar limitadas.',
        });
      }

      pendingRedirect.current = arch.redirectPath;
      const { error } = await supabase.auth.signInWithPassword({ email: arch.email, password: 'demo123456' });

      if (error) {
        pendingRedirect.current = null;
        setEnterError({ title: 'Error de autenticación', description: error.message });
        setEntering(false);
        console.error('Demo auth error:', error.message);
      }
    } catch (err: any) {
      pendingRedirect.current = null;
      setEnterError({
        title: 'Sin conexión',
        description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      });
      setEntering(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={bgForest} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/75 to-black/85" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <img src={logoNovasilva} alt="Nova Silva" className="h-8 w-8 object-contain" />
            <span className="text-white font-bold text-lg tracking-tight">Nova Silva</span>
          </div>
          <div className="flex items-center gap-4">
            {step > 0 && (
              <span className="text-white/30 text-xs">Paso {step} de {TOTAL_STEPS - 1}</span>
            )}
            <Link to="/demo" className="text-white/30 hover:text-white text-xs transition-colors">
              Demo directo →
            </Link>
          </div>
        </header>

        {step > 0 && (
          <div className="px-6 pt-3">
            <Progress value={progressValue} className="h-1 bg-white/10 [&>div]:bg-[hsl(var(--accent-orange))]" />
          </div>
        )}

        {/* Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl">
            {step === 0 && <StepWelcome onStart={() => setStep(1)} />}
            {step === 1 && <StepOrgType state={state} update={update} onNext={() => setStep(2)} />}
            {step === 2 && <StepOperations state={state} update={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
            {step === 3 && <StepInterests state={state} update={update} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
            {step === 4 && <StepScale state={state} update={update} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
            {step === 5 && <StepSummary state={state} model={model} archetype={archetype} narrative={getNarrative(state)} onEnter={handleEnterDemo} onBack={() => setStep(4)} entering={entering} enterError={enterError} />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Shared Components ──

function WizardCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8', className)}>
      {children}
    </div>
  );
}

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-white/40 text-sm mt-1.5">{subtitle}</p>}
    </div>
  );
}

function NavBar({ onBack, onNext, nextLabel, disabled }: { onBack?: () => void; onNext: () => void; nextLabel?: string; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between mt-6">
      {onBack ? (
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
          <ArrowLeft className="h-4 w-4" /> Atrás
        </button>
      ) : <div />}
      <button
        onClick={onNext}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all',
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
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
        Configura un demo adaptado a tu operación
      </h1>
      <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-md mx-auto">
        En menos de 2 minutos te mostraremos una versión de Nova Silva alineada con la forma en que opera tu organización.
      </p>
      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white font-semibold py-3 px-8 rounded-xl transition-colors text-sm"
      >
        <Play className="h-4 w-4" /> Comenzar
      </button>
      <p className="text-white/15 text-xs mt-6">Sin registro · Sin compromiso · 100% interactivo</p>
    </WizardCard>
  );
}

// ── Step 1: Org Type ──

function StepOrgType({ state, update, onNext }: { state: SetupState; update: (p: Partial<SetupState>) => void; onNext: () => void }) {
  return (
    <WizardCard>
      <StepTitle title="¿Qué tipo de organización eres?" subtitle="Selecciona la opción que mejor describe tu operación." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ORG_TYPES.map(opt => (
          <button
            key={opt.value}
            onClick={() => update({ orgType: opt.value })}
            className={cn(
              'group flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
              state.orgType === opt.value
                ? 'border-[hsl(var(--accent-orange))]/50 bg-[hsl(var(--accent-orange))]/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            )}
          >
            <div className={cn(
              'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
              state.orgType === opt.value ? 'bg-[hsl(var(--accent-orange))]/20 text-[hsl(var(--accent-orange))]' : 'bg-white/8 text-white/40'
            )}>
              <opt.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{opt.label}</p>
              <p className="text-xs text-white/30 mt-0.5">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
      <NavBar onNext={onNext} disabled={!state.orgType} />
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

function StepScale({ state, update, onNext, onBack }: { state: SetupState; update: (p: Partial<SetupState>) => void; onNext: () => void; onBack: () => void }) {
  const model = deriveModel(state);
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

// ── Step 5: Summary ──

function StepSummary({ state, model, archetype, narrative, onEnter, onBack, entering }: {
  state: SetupState; model: string; archetype: ReturnType<typeof mapToArchetype>; narrative: string;
  onEnter: () => void; onBack: () => void; entering: boolean;
}) {
  const orgLabel = ORG_TYPES.find(o => o.value === state.orgType)?.label || state.orgType;
  const uniqueModules = [...new Set(archetype.modules)];

  const pricingModel = getPricingModel(state.orgType || 'cooperativa');
  const isFarmer = pricingModel === 'farmer';

  // Pricing recommendation
  const setupConfig: DemoSetupConfig = {
    orgType: state.orgType || 'cooperativa',
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

  // Farmer pricing
  const plotCount = parseInt(state.scalePlots?.match(/(\d+)/)?.[1] || '5');
  const farmerEst = estimateFarmerPrice(plotCount, recPacks.filter(k => FARMER_PACKS.some(p => p.key === k)));
  const farmerPacks = recPacks.filter(k => FARMER_PACKS.some(p => p.key === k));

  // Aggregator pricing
  const recPlan = recommendPlan(setupConfig);
  const aggEst = estimateAggregatorPrice(recPlan, recPacks);

  const PACK_ICONS_MAP: Record<string, typeof Bug> = {
    agronomia: Bug, cumplimiento: Shield, calidad: Award,
    operacion: Briefcase, abastecimiento: Truck, catalogo: ShoppingCart,
  };

  const activePacks = isFarmer ? FARMER_PACKS : AGGREGATOR_PACKS;
  const displayPacks = isFarmer ? farmerPacks : recPacks;

  return (
    <WizardCard className="max-w-3xl">
      <StepTitle title="Tu demo personalizado está listo" subtitle="Resumen de tu configuración y plan recomendado." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Configuration */}
        <div className="space-y-5">
          {/* Org + Model */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10">
              <Building2 className="h-3.5 w-3.5 text-[hsl(var(--accent-orange))]" />
              <span className="text-xs text-white font-medium">{orgLabel}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10">
              <span className="text-xs text-white font-medium">{getModelLabel(model)}</span>
            </div>
          </div>

          {/* Modules */}
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

          {/* Scale badges */}
          {(state.scalePlots || state.scaleProducers || state.scaleUsers) && (
            <div className="flex flex-wrap gap-2">
              {state.scalePlots && <Badge variant="outline" className="border-white/15 text-white/50 text-[10px]">📍 {state.scalePlots} parcelas</Badge>}
              {state.scaleProducers && <Badge variant="outline" className="border-white/15 text-white/50 text-[10px]">👥 {state.scaleProducers} productores</Badge>}
              {state.scaleUsers && <Badge variant="outline" className="border-white/15 text-white/50 text-[10px]">🧑‍💻 {state.scaleUsers} usuarios</Badge>}
            </div>
          )}

          {/* Narrative */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/50 leading-relaxed">{narrative}</p>
          </div>
        </div>

        {/* Right: Plan recommendation */}
        <div className="space-y-4">
          {isFarmer ? (
            /* ── FARMER PRICING ── */
            <>
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
            </>
          ) : (
            /* ── AGGREGATOR PLAN CARDS ── */
            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-2.5">Plan recomendado</p>
              <div className="space-y-2">
                {AGGREGATOR_PLANS.map(p => (
                  <div key={p.tier} className={cn(
                    'flex items-center justify-between p-3 rounded-xl border transition-all',
                    p.tier === recPlan
                      ? 'border-[hsl(var(--accent-orange))]/50 bg-[hsl(var(--accent-orange))]/10'
                      : 'border-white/8 bg-white/3'
                  )}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{p.label}</span>
                        {p.badge && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--accent-orange))]/20 text-[hsl(var(--accent-orange))] font-bold">{p.badge}</span>}
                        {p.tier === recPlan && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--accent-orange))] text-white font-bold">RECOMENDADO</span>}
                      </div>
                      <p className="text-[10px] text-white/30 mt-0.5">{p.limit}</p>
                    </div>
                    <span className="text-base font-bold text-white">${p.base}<span className="text-[10px] text-white/30 font-normal">/mes</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Packs */}
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

          {/* Total */}
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
                  <span className="text-white/40">Plan {recPlan}</span>
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
              </>
            )}
            <p className="text-[9px] text-white/15">Precio estimado en USD. El monto final depende del uso real. 14 días de prueba gratuita.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6">
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
          ) : (
            <><Play className="h-4 w-4" /> Entrar al demo</>
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
