import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingPersistence } from '@/hooks/useOnboardingPersistence';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Leaf, ArrowRight, ArrowLeft, Loader2, CheckCircle, Users, Ship,
  Factory, Sprout, Coffee, Shield, Package, MapPin, Truck,
  Building2, Sparkles, DollarSign, ShieldCheck, Heart,
  CreditCard, Briefcase, Boxes, MessageSquare, Scale,
  FileCheck, BarChart3, Bug, TrendingUp, ShoppingCart,
  Award, Eye, FolderOpen, Cloud,
} from 'lucide-react';
import type { OperatingModel } from '@/lib/operatingModel';

// ── Types ──

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 'done';
const TOTAL_STEPS = 6;

type OrgType = 'cooperativa' | 'finca_empresarial' | 'productor_privado' | 'exportador' | 'certificadora' | 'beneficio';

interface WizardState {
  orgType: OrgType | null;
  operations: string[];
  scaleProducers: string;
  scalePlots: string;
  scaleUsers: string;
  needsTraceability: boolean;
  needsLabor: boolean;
  needsInputCatalog: boolean;
  needsInventory: boolean;
  needsQuality: boolean;
  selectedModules: string[];
  orgName: string;
  country: string;
  plan: string;
}

const INITIAL: WizardState = {
  orgType: null,
  operations: [],
  scaleProducers: '',
  scalePlots: '',
  scaleUsers: '',
  needsTraceability: false,
  needsLabor: false,
  needsInputCatalog: false,
  needsInventory: false,
  needsQuality: false,
  selectedModules: [],
  orgName: '',
  country: '',
  plan: 'smart',
};

// ── Org Type Options ──

const ORG_TYPES: { value: OrgType; label: string; icon: typeof Users; desc: string }[] = [
  { value: 'productor_privado', label: 'Finca privada', icon: Sprout, desc: 'Productor independiente que gestiona sus propias parcelas y operación' },
  { value: 'finca_empresarial', label: 'Finca empresarial', icon: Factory, desc: 'Finca grande con operación propia y posible compra a terceros' },
  { value: 'cooperativa', label: 'Cooperativa', icon: Users, desc: 'Organización que agrupa productores, recibe entregas y comercializa' },
  { value: 'beneficio', label: 'Beneficio / Procesador', icon: Package, desc: 'Empresa que compra, procesa y prepara café para exportación' },
  { value: 'exportador', label: 'Exportador', icon: Ship, desc: 'Empresa que compra a organizaciones o productores y exporta café' },
  { value: 'certificadora', label: 'Certificadora', icon: ShieldCheck, desc: 'Organismo que audita y verifica cumplimiento de estándares' },
];

// ── Operation Options ──

const OPERATIONS = [
  { value: 'produce_own', label: 'Producimos café propio', desc: 'Cultivo y cosecha en fincas propias', icon: Sprout },
  { value: 'buys_coffee', label: 'Compramos café a terceros', desc: 'Adquirimos café de productores, cooperativas o intermediarios', icon: Truck },
  { value: 'processes', label: 'Procesamos café', desc: 'Beneficio húmedo/seco, despulpado, lavado, secado', icon: Factory },
  { value: 'exports', label: 'Exportamos café', desc: 'Vendemos a compradores internacionales', icon: Ship },
  { value: 'sells_inputs', label: 'Vendemos insumos a productores', desc: 'Catálogo de fertilizantes, herramientas o agroquímicos para socios', icon: ShoppingCart },
  { value: 'audits', label: 'Auditamos o verificamos', desc: 'Realizamos auditorías de cumplimiento o certificación', icon: Eye },
];

// ── Derive Operating Model ──

function deriveOperatingModel(state: WizardState): OperatingModel {
  const { orgType, operations } = state;
  if (orgType === 'certificadora') return 'auditor';
  if (orgType === 'exportador') return 'trader';
  if (orgType === 'cooperativa' || orgType === 'beneficio') return 'aggregator';
  if (orgType === 'finca_empresarial') {
    return operations.includes('buys_coffee') ? 'estate_hybrid' : 'estate';
  }
  return 'single_farm';
}

// ── Recommend Modules ──

interface ModuleDef {
  key: string;
  label: string;
  desc: string;
  price: number;
  icon: typeof Users;
  category: string;
}

const ALL_MODULES: ModuleDef[] = [
  { key: 'productores', label: 'Gestión de productores', desc: 'Administra socios productores afiliados', price: 15, icon: Users, category: 'Producción' },
  { key: 'parcelas', label: 'Parcelas y mapas', desc: 'Geolocalización, áreas productivas e historial', price: 12, icon: MapPin, category: 'Producción' },
  { key: 'entregas', label: 'Entregas de campo', desc: 'Recepción de café con trazabilidad', price: 10, icon: Truck, category: 'Producción' },
  { key: 'nutricion', label: 'Nutrición vegetal', desc: 'Análisis de suelo, planes y ejecución', price: 25, icon: Leaf, category: 'Agronomía' },
  { key: 'guard', label: 'Nova Guard', desc: 'Diagnóstico fitosanitario y alertas', price: 15, icon: Bug, category: 'Agronomía' },
  { key: 'yield', label: 'Nova Yield', desc: 'Estimación de cosecha por parcela', price: 15, icon: TrendingUp, category: 'Agronomía' },
  { key: 'jornales', label: 'Jornales', desc: 'Gestión laboral, cuadrillas y costos', price: 8, icon: Briefcase, category: 'Operación' },
  { key: 'inventario', label: 'Inventario', desc: 'Control de insumos, equipos y stock', price: 8, icon: Boxes, category: 'Operación' },
  { key: 'catalogo_insumos', label: 'Catálogo de insumos', desc: 'Venta/distribución de insumos a productores', price: 12, icon: ShoppingCart, category: 'Operación' },
  { key: 'abastecimiento_cafe', label: 'Abastecimiento de café', desc: 'Proveedores, recepción, compras y riesgo', price: 20, icon: Coffee, category: 'Cadena café' },
  { key: 'lotes_comerciales', label: 'Lotes comerciales', desc: 'Lotes exportables con documentación', price: 18, icon: BarChart3, category: 'Comercial' },
  { key: 'contratos', label: 'Contratos', desc: 'Gestión de contratos con compradores', price: 15, icon: FileCheck, category: 'Comercial' },
  { key: 'calidad', label: 'Calidad / Nova Cup', desc: 'Evaluaciones SCA, perfiles y ranking', price: 20, icon: Award, category: 'Calidad' },
  { key: 'vital', label: 'Protocolo VITAL', desc: 'Diagnóstico de resiliencia y sostenibilidad', price: 25, icon: Heart, category: 'Sostenibilidad' },
  { key: 'eudr', label: 'Cumplimiento EUDR', desc: 'Trazabilidad, dossiers y deforestación cero', price: 30, icon: ShieldCheck, category: 'Cumplimiento' },
  { key: 'data_room', label: 'Data Room', desc: 'Repositorio documental para auditorías', price: 10, icon: FolderOpen, category: 'Cumplimiento' },
  { key: 'finanzas', label: 'Finanzas', desc: 'Costos, pagos y reportes financieros', price: 12, icon: DollarSign, category: 'Finanzas' },
  { key: 'creditos', label: 'Créditos', desc: 'Préstamos y adelantos con scoring Nova', price: 18, icon: CreditCard, category: 'Finanzas' },
  { key: 'mensajes', label: 'Mensajes', desc: 'Comunicación interna y notificaciones', price: 5, icon: MessageSquare, category: 'Comunicación' },
  { key: 'clima', label: 'Clima y riesgo', desc: 'Monitoreo climático y alertas', price: 10, icon: Cloud, category: 'Sostenibilidad' },
];

function getRecommendedModules(state: WizardState): string[] {
  const model = deriveOperatingModel(state);
  const mods: string[] = [];

  // Always parcelas for production models
  if (['single_farm', 'estate', 'estate_hybrid', 'aggregator'].includes(model)) {
    mods.push('parcelas');
  }

  // Productores only for aggregators
  if (model === 'aggregator') mods.push('productores', 'entregas');

  // Agronomía for producers
  if (['single_farm', 'estate', 'estate_hybrid', 'aggregator'].includes(model)) {
    mods.push('nutricion', 'guard', 'yield');
  }

  // Labor for farms
  if (['single_farm', 'estate', 'estate_hybrid'].includes(model) || state.needsLabor) {
    mods.push('jornales');
  }

  // Inventory
  if (state.needsInventory || ['single_farm', 'estate', 'estate_hybrid', 'aggregator'].includes(model)) {
    mods.push('inventario');
  }

  // Input catalog for coops
  if (state.needsInputCatalog || state.operations.includes('sells_inputs')) {
    mods.push('catalogo_insumos');
  }

  // Coffee supply chain
  if (state.operations.includes('buys_coffee') || ['aggregator', 'trader', 'estate_hybrid'].includes(model)) {
    mods.push('abastecimiento_cafe');
  }

  // Commercial
  if (state.operations.includes('exports') || ['trader', 'estate_hybrid', 'aggregator'].includes(model)) {
    mods.push('lotes_comerciales', 'contratos');
  }

  // Quality
  if (state.needsQuality || model !== 'auditor') {
    mods.push('calidad');
  }

  // VITAL
  mods.push('vital', 'clima');

  // Traceability/EUDR
  if (state.needsTraceability || ['trader', 'aggregator', 'estate_hybrid', 'estate'].includes(model)) {
    mods.push('eudr', 'data_room');
  }

  // Finanzas
  if (model !== 'auditor') mods.push('finanzas');

  // Credits for coops
  if (model === 'aggregator') mods.push('creditos');

  // Messaging
  if (['aggregator'].includes(model)) mods.push('mensajes');

  return [...new Set(mods)];
}

// ── Pricing ──

const PLANS = [
  { value: 'lite', label: 'Lite', base: 29, desc: 'Hasta 50 parcelas', limit: '50 parcelas · 5 usuarios' },
  { value: 'smart', label: 'Smart', base: 79, desc: 'Hasta 500 parcelas', limit: '500 parcelas · 20 usuarios' },
  { value: 'plus', label: 'Plus', base: 199, desc: 'Sin límite', limit: 'Sin límite · Soporte prioritario' },
];

const COUNTRIES = [
  'Costa Rica', 'Guatemala', 'Colombia', 'Honduras', 'México',
  'Perú', 'Brasil', 'Nicaragua', 'El Salvador', 'Ecuador', 'Panamá', 'Otro',
];

// ── Main Component ──

export default function OnboardingOrganization() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const orgId = user?.organizationId ?? null;
  const { saveProfile, saveSetupState } = useOnboardingPersistence(orgId);

  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<WizardState>(INITIAL);
  const [saving, setSaving] = useState(false);

  const update = (partial: Partial<WizardState>) => setState(prev => ({ ...prev, ...partial }));
  const model = deriveOperatingModel(state);

  const goNext = useCallback(async (nextStep: Step, finalize = false) => {
    setSaving(true);
    const completedStepNum = finalize ? TOTAL_STEPS : (nextStep as number) - 1;

    const profileFields: Record<string, unknown> = {};
    if (finalize) {
      profileFields.org_type = state.orgType;
      profileFields.operating_model = model;
      profileFields.org_name = state.orgName;
      profileFields.country = state.country;
    }

    const [profileResult, stateResult] = await Promise.all([
      Object.keys(profileFields).length > 0 ? saveProfile(profileFields) : Promise.resolve({ ok: true }),
      saveSetupState({
        currentStep: finalize ? TOTAL_STEPS : (nextStep as number),
        completedSteps: Array.from({ length: completedStepNum }, (_, i) => i + 1),
        isCompleted: finalize,
        checklist: finalize ? {
          modules: state.selectedModules,
          plan: state.plan,
          operating_model: model,
          operations: state.operations,
        } : undefined,
      }),
    ]);

    setSaving(false);
    if (!profileResult.ok || !stateResult.ok) {
      toast.info('Guardado parcialmente. Se reintentará con conexión.');
    }
    setStep(finalize ? 'done' : nextStep);
  }, [state, model, saveProfile, saveSetupState]);

  const progressValue = step === 'done' ? 100 : ((step as number) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10"><Leaf className="h-5 w-5 text-primary" /></div>
        <span className="font-bold text-lg text-foreground">Nova Silva</span>
        {step !== 'done' && <span className="ml-auto text-sm text-muted-foreground">Paso {step as number} de {TOTAL_STEPS}</span>}
      </header>
      <div className="px-6 pt-4"><Progress value={progressValue} className="h-1.5" /></div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {step === 1 && <StepOrgType state={state} update={update} saving={saving} onNext={() => goNext(2)} />}
        {step === 2 && <StepOperations state={state} update={update} saving={saving} onNext={() => goNext(3)} onBack={() => setStep(1)} />}
        {step === 3 && <StepScope state={state} update={update} saving={saving} onNext={() => {
          const recommended = getRecommendedModules(state);
          update({ selectedModules: recommended });
          goNext(4);
        }} onBack={() => setStep(2)} />}
        {step === 4 && <StepModules state={state} update={update} saving={saving} onNext={() => goNext(5)} onBack={() => setStep(3)} model={model} />}
        {step === 5 && <StepPricing state={state} update={update} saving={saving} onNext={() => goNext(6)} onBack={() => setStep(4)} model={model} />}
        {step === 6 && <StepConfirm state={state} update={update} saving={saving} onFinalize={() => goNext('done', true)} onBack={() => setStep(5)} model={model} />}
        {step === 'done' && <StepDone onGo={() => navigate('/app')} model={model} />}
      </main>
    </div>
  );
}

// ── Shared ──

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center space-y-2 mb-6">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="text-muted-foreground max-w-lg mx-auto">{subtitle}</p>
    </div>
  );
}

function NavButtons({ onBack, onNext, nextLabel, disabled, saving }: {
  onBack?: () => void; onNext: () => void; nextLabel?: string; disabled?: boolean; saving?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-6">
      {onBack ? <Button variant="ghost" onClick={onBack} disabled={saving}><ArrowLeft className="h-4 w-4 mr-1" /> Atrás</Button> : <div />}
      <Button onClick={onNext} disabled={disabled || saving} size="lg">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...</> : <>{nextLabel || 'Siguiente'} <ArrowRight className="h-4 w-4 ml-1" /></>}
      </Button>
    </div>
  );
}

// ── Step 1: Org Type ──

function StepOrgType({ state, update, saving, onNext }: { state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void }) {
  return (
    <div className="space-y-6">
      <StepHeader title="¿Qué tipo de organización eres?" subtitle="Esto personaliza tu experiencia completa en Nova Silva." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ORG_TYPES.map(opt => (
          <Card key={opt.value}
            className={cn('cursor-pointer transition-all hover:shadow-md', state.orgType === opt.value ? 'ring-2 ring-primary border-primary shadow-md' : 'hover:border-primary/50')}
            onClick={() => update({ orgType: opt.value })}
          >
            <CardContent className="pt-5 pb-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', state.orgType === opt.value ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary')}>
                  <opt.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{opt.label}</h3>
                  {state.orgType === opt.value && <Badge variant="default" className="text-[10px] mt-0.5">Seleccionado</Badge>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{opt.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <NavButtons onNext={onNext} disabled={!state.orgType} saving={saving} />
    </div>
  );
}

// ── Step 2: How you operate ──

function StepOperations({ state, update, saving, onNext, onBack }: { state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void; onBack: () => void }) {
  const toggle = (v: string) => {
    const ops = state.operations.includes(v) ? state.operations.filter(x => x !== v) : [...state.operations, v];
    update({ operations: ops });
  };

  // Pre-select based on org type
  const relevant = OPERATIONS.filter(op => {
    if (state.orgType === 'certificadora') return op.value === 'audits';
    if (state.orgType === 'exportador') return ['buys_coffee', 'exports'].includes(op.value);
    if (state.orgType === 'productor_privado') return ['produce_own'].includes(op.value);
    return true;
  });

  return (
    <div className="space-y-6">
      <StepHeader title="¿Cómo operas hoy?" subtitle="Selecciona todas las actividades que realiza tu organización." />
      <div className="space-y-3">
        {relevant.map(op => (
          <Card key={op.value}
            className={cn('cursor-pointer transition-all', state.operations.includes(op.value) ? 'border-primary/50 bg-primary/5' : '')}
            onClick={() => toggle(op.value)}
          >
            <CardContent className="py-4 px-4 flex items-start gap-3">
              <Checkbox checked={state.operations.includes(op.value)} onCheckedChange={() => toggle(op.value)} className="mt-0.5" />
              <div className="flex items-start gap-3 flex-1">
                <op.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{op.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{op.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground mb-2">Modelo operativo detectado:</p>
          <Badge variant="outline" className="text-sm">{deriveOperatingModel(state).replace('_', ' ')}</Badge>
        </CardContent>
      </Card>

      <NavButtons onBack={onBack} onNext={onNext} disabled={state.operations.length === 0} saving={saving} />
    </div>
  );
}

// ── Step 3: Scope ──

function StepScope({ state, update, saving, onNext, onBack }: { state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void; onBack: () => void }) {
  const model = deriveOperatingModel(state);
  const showProducers = ['aggregator'].includes(model);
  const showLabor = ['single_farm', 'estate', 'estate_hybrid'].includes(model);

  return (
    <div className="space-y-6">
      <StepHeader title="¿Cuál es tu escala de operación?" subtitle="Esto nos ayuda a recomendar los módulos correctos y estimar recursos." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showProducers && (
          <div className="space-y-2">
            <Label>Productores o proveedores</Label>
            <Select value={state.scaleProducers} onValueChange={v => update({ scaleProducers: v })}>
              <SelectTrigger><SelectValue placeholder="¿Cuántos?" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1-50">1 - 50</SelectItem>
                <SelectItem value="51-200">51 - 200</SelectItem>
                <SelectItem value="201-1000">201 - 1,000</SelectItem>
                <SelectItem value="1001+">Más de 1,000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Parcelas o fincas</Label>
          <Select value={state.scalePlots} onValueChange={v => update({ scalePlots: v })}>
            <SelectTrigger><SelectValue placeholder="¿Cuántas?" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1 - 10</SelectItem>
              <SelectItem value="11-50">11 - 50</SelectItem>
              <SelectItem value="51-500">51 - 500</SelectItem>
              <SelectItem value="500+">Más de 500</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Usuarios del equipo</Label>
          <Select value={state.scaleUsers} onValueChange={v => update({ scaleUsers: v })}>
            <SelectTrigger><SelectValue placeholder="¿Cuántos?" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1-5">1 - 5</SelectItem>
              <SelectItem value="6-20">6 - 20</SelectItem>
              <SelectItem value="21-50">21 - 50</SelectItem>
              <SelectItem value="50+">Más de 50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <p className="text-sm font-medium text-foreground">¿Qué necesitas resolver?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'needsTraceability', label: 'Trazabilidad y EUDR', desc: 'Dossiers de deforestación cero', icon: ShieldCheck },
            ...(showLabor ? [{ key: 'needsLabor', label: 'Gestión de jornales', desc: 'Cuadrillas, costos laborales', icon: Briefcase }] : []),
            { key: 'needsInputCatalog', label: 'Catálogo de insumos', desc: 'Vender o distribuir insumos a productores', icon: ShoppingCart },
            { key: 'needsInventory', label: 'Inventario de insumos', desc: 'Control de stock y equipos', icon: Boxes },
            { key: 'needsQuality', label: 'Control de calidad', desc: 'Cataciones SCA y perfiles', icon: Award },
          ].map(item => (
            <Card key={item.key}
              className={cn('cursor-pointer transition-all', (state as any)[item.key] ? 'border-primary/50 bg-primary/5' : '')}
              onClick={() => update({ [item.key]: !(state as any)[item.key] } as any)}
            >
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <Checkbox checked={(state as any)[item.key]} onCheckedChange={() => update({ [item.key]: !(state as any)[item.key] } as any)} />
                <item.icon className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} saving={saving} />
    </div>
  );
}

// ── Step 4: Module Recommendation ──

function StepModules({ state, update, saving, onNext, onBack, model }: { state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void; onBack: () => void; model: OperatingModel }) {
  const recommended = useMemo(() => getRecommendedModules(state), [state.orgType, state.operations, state.needsTraceability, state.needsLabor, state.needsInputCatalog, state.needsInventory, state.needsQuality]);

  const toggle = (key: string) => {
    const mods = state.selectedModules.includes(key)
      ? state.selectedModules.filter(m => m !== key)
      : [...state.selectedModules, key];
    update({ selectedModules: mods });
  };

  const categories = [...new Set(ALL_MODULES.map(m => m.category))];
  const totalPrice = state.selectedModules.reduce((sum, key) => {
    const mod = ALL_MODULES.find(m => m.key === key);
    return sum + (mod?.price || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <StepHeader title="Módulos recomendados para ti" subtitle={`Basado en tu perfil (${model.replace('_', ' ')}), te sugerimos estos módulos. Puedes ajustar.`} />

      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Total add-ons: ${totalPrice}/mes</span>
          <span className="text-xs text-muted-foreground">· {state.selectedModules.length} módulos</span>
        </div>
      </div>

      {categories.map(cat => {
        const mods = ALL_MODULES.filter(m => m.category === cat);
        if (mods.length === 0) return null;
        return (
          <div key={cat} className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mods.map(mod => {
                const checked = state.selectedModules.includes(mod.key);
                const isRecommended = recommended.includes(mod.key);
                return (
                  <Card key={mod.key}
                    className={cn('cursor-pointer transition-all relative overflow-hidden',
                      checked ? 'border-primary/50 bg-primary/5 shadow-sm' : 'hover:border-muted-foreground/30'
                    )}
                    onClick={() => toggle(mod.key)}
                  >
                    {isRecommended && <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-bl-md">RECOMENDADO</div>}
                    <CardContent className="py-4 px-4 flex items-start gap-3">
                      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                        <mod.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-foreground">{mod.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{mod.desc}</p>
                        <p className="text-xs font-bold text-primary mt-1">${mod.price}/mes</p>
                      </div>
                      <Switch checked={checked} onCheckedChange={() => toggle(mod.key)} className="mt-1" onClick={e => e.stopPropagation()} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <NavButtons onBack={onBack} onNext={onNext} disabled={state.selectedModules.length === 0} saving={saving} />
    </div>
  );
}

// ── Step 5: Pricing ──

function StepPricing({ state, update, saving, onNext, onBack, model }: { state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void; onBack: () => void; model: OperatingModel }) {
  const addonsTotal = state.selectedModules.reduce((sum, key) => {
    const mod = ALL_MODULES.find(m => m.key === key);
    return sum + (mod?.price || 0);
  }, 0);
  const selectedPlan = PLANS.find(p => p.value === state.plan) || PLANS[1];
  const total = selectedPlan.base + addonsTotal;

  return (
    <div className="space-y-6">
      <StepHeader title="Tu plan y precio estimado" subtitle="Selecciona un plan base. Los módulos que elegiste se suman como add-ons." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => (
          <Card key={plan.value}
            className={cn('cursor-pointer transition-all', state.plan === plan.value ? 'ring-2 ring-primary border-primary shadow-md' : 'hover:border-primary/50')}
            onClick={() => update({ plan: plan.value })}
          >
            <CardContent className="pt-5 pb-4 text-center space-y-2">
              <p className="text-lg font-bold text-foreground">{plan.label}</p>
              <p className="text-3xl font-bold text-primary">${plan.base}<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
              <p className="text-xs text-muted-foreground">{plan.limit}</p>
              {state.plan === plan.value && <Badge variant="default" className="text-[10px]">Seleccionado</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-5 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan base ({selectedPlan.label})</span>
            <span className="font-mono font-semibold">${selectedPlan.base}/mes</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Add-ons ({state.selectedModules.length} módulos)</span>
            <span className="font-mono font-semibold">${addonsTotal}/mes</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Total estimado</span>
            <span className="text-2xl font-bold text-primary">${total}/mes</span>
          </div>
          <p className="text-xs text-muted-foreground">Precio estimado. El monto final depende del uso real y puede ajustarse.</p>
        </CardContent>
      </Card>

      <NavButtons onBack={onBack} onNext={onNext} saving={saving} nextLabel="Revisar y crear" />
    </div>
  );
}

// ── Step 6: Confirmation ──

function StepConfirm({ state, update, saving, onFinalize, onBack, model }: { state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onFinalize: () => void; onBack: () => void; model: OperatingModel }) {
  return (
    <div className="space-y-6">
      <StepHeader title="Confirma tu organización" subtitle="Revisa tu configuración y completa los datos para comenzar." />

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4 pb-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo: <Badge variant="outline">{ORG_TYPES.find(o => o.value === state.orgType)?.label || state.orgType}</Badge></p>
              <p className="text-sm text-muted-foreground">Modelo: <Badge variant="outline">{model.replace('_', ' ')}</Badge></p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Módulos ({state.selectedModules.length}):</p>
            <div className="flex flex-wrap gap-1">
              {state.selectedModules.map(key => {
                const mod = ALL_MODULES.find(m => m.key === key);
                return <Badge key={key} variant="secondary" className="text-[10px]">{mod?.label || key}</Badge>;
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">Nombre de la organización *</Label>
          <Input id="org-name" value={state.orgName} onChange={e => update({ orgName: e.target.value })} placeholder="Ej: Cooperativa Los Andes" required />
        </div>
        <div className="space-y-2">
          <Label>País *</Label>
          <Select value={state.country} onValueChange={v => update({ country: v })}>
            <SelectTrigger><SelectValue placeholder="Seleccionar país" /></SelectTrigger>
            <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={saving}><ArrowLeft className="h-4 w-4 mr-1" /> Atrás</Button>
        <Button onClick={onFinalize} disabled={saving || !state.orgName || !state.country} size="lg">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creando...</> : <><CheckCircle className="h-4 w-4 mr-1" /> Crear organización</>}
        </Button>
      </div>
    </div>
  );
}

// ── Done ──

function StepDone({ onGo, model }: { onGo: () => void; model: OperatingModel }) {
  return (
    <div className="text-center space-y-6 py-12">
      <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mx-auto">
        <Sparkles className="h-10 w-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Tu organización está lista</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Hemos configurado Nova Silva para tu modelo operativo ({model.replace('_', ' ')}). Tu sidebar, dashboards y módulos ya están adaptados.
        </p>
      </div>
      <Button onClick={onGo} size="lg" className="gap-2">
        <ArrowRight className="h-4 w-4" /> Ir a mi dashboard
      </Button>
    </div>
  );
}
