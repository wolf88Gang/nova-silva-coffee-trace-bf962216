import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingPersistence } from '@/hooks/useOnboardingPersistence';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Leaf, ArrowRight, ArrowLeft, Loader2, CheckCircle, Users, Ship,
  Factory, Sprout, Coffee, TreePine, Sun, Calendar, Shield, Package,
  MapPin, Truck, ClipboardCheck, UserPlus, Sparkles
} from 'lucide-react';

// ── Types ──
type OrgType = 'cooperativa' | 'exportador' | 'beneficio_privado' | 'productor_grande';
type Step = 1 | 2 | 3 | 4 | 5 | 'done';
const TOTAL_STEPS = 5;

interface WizardState {
  org_type: OrgType | null;
  activities: string[];
  crops: string[];
  season_start_month: string;
  season_end_month: string;
  roles_text: string;
  checklist: Record<string, boolean>;
}

const INITIAL: WizardState = {
  org_type: null,
  activities: [],
  crops: [],
  season_start_month: '',
  season_end_month: '',
  roles_text: '',
  checklist: {},
};

// ── Constants ──
const ORG_TYPES: { value: OrgType; label: string; icon: typeof Users; desc: string }[] = [
  { value: 'cooperativa', label: 'Cooperativa', icon: Users, desc: 'Gestiona socios productores y procesa cafe colectivamente' },
  { value: 'exportador', label: 'Exportador / Trader', icon: Ship, desc: 'Compra, consolida y exporta cafe a mercados internacionales' },
  { value: 'beneficio_privado', label: 'Beneficio Privado', icon: Factory, desc: 'Empresa privada que compra y procesa cafe de proveedores' },
  { value: 'productor_grande', label: 'Productor Empresarial', icon: Sprout, desc: 'Finca o empresa que gestiona sus propias operaciones de origen y comercializacion' },
];

const ACTIVITIES = [
  { value: 'produce', label: 'Produce', desc: 'Cultiva y cosecha en fincas propias o asociadas' },
  { value: 'compra', label: 'Compra a terceros', desc: 'Adquiere cafe de productores, cooperativas u otros proveedores' },
  { value: 'procesa', label: 'Procesa', desc: 'Beneficio humedo/seco, despulpado, lavado, secado' },
  { value: 'exporta', label: 'Exporta', desc: 'Vende a compradores internacionales directamente' },
];

const CROPS = [
  { value: 'cafe', label: 'Cafe', icon: Coffee },
  { value: 'cacao', label: 'Cacao', icon: TreePine },
  { value: 'miel', label: 'Miel', icon: Sun },
  { value: 'cardamomo', label: 'Cardamomo', icon: Sprout },
  { value: 'otro', label: 'Otro', icon: Leaf },
];

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const CHECKLIST_ITEMS = [
  { key: 'crear_finca', label: 'Crear mi primera finca', icon: MapPin, desc: 'Registra ubicacion y datos generales de tu finca principal' },
  { key: 'registrar_parcela', label: 'Registrar una parcela', icon: TreePine, desc: 'Define un lote de cultivo con area, variedad y coordenadas' },
  { key: 'agregar_actor', label: 'Agregar un productor o proveedor', icon: UserPlus, desc: 'Crea el primer actor dentro de tu organizacion' },
  { key: 'crear_lote', label: 'Crear un lote de cafe', icon: Package, desc: 'Registra un lote de acopio o comercial' },
  { key: 'registrar_entrega', label: 'Registrar primera entrega', icon: Truck, desc: 'Documenta una entrega de cafe con peso y calidad' },
  { key: 'subir_evidencia', label: 'Subir una evidencia', icon: ClipboardCheck, desc: 'Fotografia, documento o certificado de cumplimiento' },
  { key: 'configurar_usuarios', label: 'Configurar usuarios del equipo', icon: Users, desc: 'Invita tecnicos, compradores o administradores' },
  { key: 'revisar_dashboard', label: 'Revisar mi dashboard', icon: Shield, desc: 'Explora el panel principal y familiarizate con la navegacion' },
];

/** Derive suggested modules from wizard state */
function deriveSuggestedModules(state: WizardState): string[] {
  const modules: string[] = ['core_actors', 'core_plots', 'core_deliveries'];
  if (state.activities.includes('exporta')) modules.push('eudr', 'contratos', 'lotes_comerciales');
  if (state.activities.includes('compra')) modules.push('entregas', 'lotes_acopio');
  if (state.activities.includes('procesa')) modules.push('calidad', 'inventario');
  if (state.org_type === 'cooperativa') modules.push('creditos', 'mensajes');
  return [...new Set(modules)];
}

/** Build the array of completed step numbers up to (and including) current */
function buildCompletedSteps(currentStep: number): number[] {
  return Array.from({ length: currentStep }, (_, i) => i + 1);
}

export default function OnboardingOrganization() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const orgId = user?.organizationId ?? null;
  const { saveProfile, saveSetupState } = useOnboardingPersistence(orgId);

  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<WizardState>(INITIAL);
  const [saving, setSaving] = useState(false);

  const update = (partial: Partial<WizardState>) => setState(prev => ({ ...prev, ...partial }));

  const persistStep = useCallback(async (
    nextStep: Step,
    profileFields: Record<string, unknown>,
    finalize = false
  ) => {
    setSaving(true);

    const completedStepNum = finalize ? TOTAL_STEPS : (nextStep as number) - 1;
    const modules = finalize ? deriveSuggestedModules(state) : undefined;
    const checklistData = finalize
      ? { items: state.checklist, modules, roles_text: state.roles_text }
      : undefined;

    // Save profile + setup state in parallel
    const [profileResult, stateResult] = await Promise.all([
      Object.keys(profileFields).length > 0
        ? saveProfile(profileFields)
        : Promise.resolve({ ok: true }),
      saveSetupState({
        currentStep: finalize ? TOTAL_STEPS : (nextStep as number),
        completedSteps: buildCompletedSteps(completedStepNum),
        isCompleted: finalize,
        checklist: checklistData,
      }),
    ]);

    setSaving(false);

    if (!profileResult.ok || !stateResult.ok) {
      toast.info('Guardado parcialmente. Se reintentara con conexion.');
    }

    setStep(finalize ? 'done' : nextStep);
  }, [state, saveProfile, saveSetupState]);

  const progressValue = step === 'done' ? 100 : ((step as number) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Leaf className="h-5 w-5 text-primary" />
        </div>
        <span className="font-bold text-lg text-foreground">Nova Silva</span>
        {step !== 'done' && (
          <span className="ml-auto text-sm text-muted-foreground">Paso {step as number} de {TOTAL_STEPS}</span>
        )}
      </header>

      <div className="px-6 pt-4">
        <Progress value={progressValue} className="h-1.5" />
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {step === 1 && <Step1 state={state} update={update} saving={saving}
          onNext={() => persistStep(2, { org_type: state.org_type })} />}
        {step === 2 && <Step2 state={state} update={update} saving={saving}
          onNext={() => persistStep(3, { activities: state.activities })}
          onBack={() => setStep(1)} />}
        {step === 3 && <Step3 state={state} update={update} saving={saving}
          onNext={() => persistStep(4, {
            crops: state.crops,
            season_start_month: state.season_start_month ? parseInt(state.season_start_month) : null,
            season_end_month: state.season_end_month ? parseInt(state.season_end_month) : null,
          })}
          onBack={() => setStep(2)} />}
        {step === 4 && <Step4 state={state} update={update} saving={saving}
          onNext={() => persistStep(5, { roles_text: state.roles_text })}
          onBack={() => setStep(3)} />}
        {step === 5 && <Step5 state={state} update={update} saving={saving}
          onFinalize={() => persistStep('done', {}, true)}
          onBack={() => setStep(4)} />}
        {step === 'done' && <StepDone modules={deriveSuggestedModules(state)} onGo={() => navigate('/app')} />}
      </main>
    </div>
  );
}

// ── Shared ──

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center space-y-2 mb-6">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function NavButtons({ onBack, onNext, nextLabel, disabled, saving }: {
  onBack?: () => void; onNext: () => void; nextLabel?: string; disabled?: boolean; saving?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-4">
      {onBack ? (
        <Button variant="ghost" onClick={onBack} disabled={saving}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Atras
        </Button>
      ) : <div />}
      <Button onClick={onNext} disabled={disabled || saving} size="lg">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...</> : (
          <>{nextLabel || 'Siguiente'} <ArrowRight className="h-4 w-4 ml-1" /></>
        )}
      </Button>
    </div>
  );
}

// ── Step 1: Tipo de cliente ──
function Step1({ state, update, saving, onNext }: {
  state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader title="Que tipo de organizacion eres?" subtitle="Esto personaliza tu experiencia en Nova Silva." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ORG_TYPES.map(opt => (
          <Card key={opt.value}
            className={cn('cursor-pointer transition-all hover:shadow-md',
              state.org_type === opt.value ? 'ring-2 ring-primary border-primary shadow-md' : 'hover:border-primary/50'
            )}
            onClick={() => update({ org_type: opt.value })}
          >
            <CardContent className="pt-5 pb-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center',
                  state.org_type === opt.value ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                )}>
                  <opt.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{opt.label}</h3>
                  {state.org_type === opt.value && <Badge variant="default" className="text-[10px] mt-0.5">Seleccionado</Badge>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{opt.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <NavButtons onNext={onNext} disabled={!state.org_type} saving={saving} />
    </div>
  );
}

// ── Step 2: Actividades ──
function Step2({ state, update, saving, onNext, onBack }: {
  state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void; onBack: () => void;
}) {
  const toggle = (v: string) => {
    const activities = state.activities.includes(v)
      ? state.activities.filter(x => x !== v)
      : [...state.activities, v];
    update({ activities });
  };

  return (
    <div className="space-y-6">
      <StepHeader title="Que actividades realizas?" subtitle="Selecciona todas las que apliquen a tu operacion." />
      <div className="space-y-3">
        {ACTIVITIES.map(a => (
          <Card key={a.value} className={cn('cursor-pointer transition-all',
            state.activities.includes(a.value) ? 'border-primary/50 bg-primary/5' : ''
          )} onClick={() => toggle(a.value)}>
            <CardContent className="py-4 px-4 flex items-start gap-3">
              <Checkbox checked={state.activities.includes(a.value)} onCheckedChange={() => toggle(a.value)} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{a.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <NavButtons onBack={onBack} onNext={onNext} disabled={state.activities.length === 0} saving={saving} />
    </div>
  );
}

// ── Step 3: Cultivos y temporada ──
function Step3({ state, update, saving, onNext, onBack }: {
  state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void; onBack: () => void;
}) {
  const toggleCrop = (c: string) => {
    const crops = state.crops.includes(c) ? state.crops.filter(x => x !== c) : [...state.crops, c];
    update({ crops });
  };

  return (
    <div className="space-y-6">
      <StepHeader title="Cultivos y temporada" subtitle="Que produces y cuando es tu cosecha principal?" />
      <div>
        <Label className="text-sm font-medium mb-3 block">Cultivos principales</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CROPS.map(c => (
            <Card key={c.value} className={cn('cursor-pointer transition-all',
              state.crops.includes(c.value) ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30' : 'hover:border-primary/30'
            )} onClick={() => toggleCrop(c.value)}>
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <div className={cn('h-8 w-8 rounded-md flex items-center justify-center',
                  state.crops.includes(c.value) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  <c.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-foreground">{c.label}</span>
                {state.crops.includes(c.value) && <CheckCircle className="h-4 w-4 text-primary ml-auto" />}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Inicio de cosecha
          </Label>
          <Select value={state.season_start_month} onValueChange={v => update({ season_start_month: v })}>
            <SelectTrigger><SelectValue placeholder="Mes de inicio" /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Fin de cosecha
          </Label>
          <Select value={state.season_end_month} onValueChange={v => update({ season_end_month: v })}>
            <SelectTrigger><SelectValue placeholder="Mes de cierre" /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <NavButtons onBack={onBack} onNext={onNext} disabled={state.crops.length === 0} saving={saving} />
    </div>
  );
}

// ── Step 4: Roles y estructura ──
function Step4({ state, update, saving, onNext, onBack }: {
  state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void; onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader title="Roles y estructura de equipo" subtitle="Describe brevemente tu equipo. Podras configurar usuarios despues." />
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-2">
            <Label>Describe tu equipo y roles internos</Label>
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Ej: 2 administradores, 5 tecnicos de campo, 3 compradores de acopio, 1 catador, 1 gerente de logistica..."
              value={state.roles_text}
              onChange={e => update({ roles_text: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Esta informacion nos ayuda a sugerir la estructura de permisos y accesos para tu equipo.
            </p>
          </div>
        </CardContent>
      </Card>
      <NavButtons onBack={onBack} onNext={onNext} saving={saving} />
    </div>
  );
}

// ── Step 5: Checklist 7 dias ──
function Step5({ state, update, saving, onFinalize, onBack }: {
  state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onFinalize: () => void; onBack: () => void;
}) {
  const toggleItem = (key: string) => {
    update({ checklist: { ...state.checklist, [key]: !state.checklist[key] } });
  };

  const completed = CHECKLIST_ITEMS.filter(i => state.checklist[i.key]).length;

  return (
    <div className="space-y-6">
      <StepHeader title="Tu plan para los primeros 7 dias" subtitle="Marca las tareas que planeas completar. Podras verlas despues en tu dashboard." />
      <Badge variant="outline" className="text-xs">{completed} de {CHECKLIST_ITEMS.length} planificados</Badge>
      <div className="space-y-3">
        {CHECKLIST_ITEMS.map(item => (
          <Card key={item.key} className={cn('cursor-pointer transition-all',
            state.checklist[item.key] ? 'border-primary/50 bg-primary/5' : ''
          )} onClick={() => toggleItem(item.key)}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <Checkbox checked={!!state.checklist[item.key]} onCheckedChange={() => toggleItem(item.key)} />
              <div className={cn('h-8 w-8 rounded-md flex items-center justify-center shrink-0',
                state.checklist[item.key] ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              {state.checklist[item.key] && <CheckCircle className="h-4 w-4 text-primary ml-auto shrink-0" />}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={saving}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Atras
        </Button>
        <Button onClick={onFinalize} disabled={saving} size="lg">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Finalizando...</> : (
            <><CheckCircle className="h-4 w-4 mr-1" /> Finalizar configuracion</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Done ──
function StepDone({ modules, onGo }: { modules: string[]; onGo: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">Configuracion completada!</h2>
      <p className="text-muted-foreground">Tu organizacion esta lista. Hemos activado los modulos recomendados.</p>

      {modules.length > 0 && (
        <Card className="text-left border-primary/30 bg-primary/5">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Modulos sugeridos</p>
            <div className="flex flex-wrap gap-2">
              {modules.map(m => (
                <Badge key={m} variant="secondary" className="text-xs">{m.replace(/_/g, ' ')}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={onGo} size="lg" className="mt-4">
        Ir a mi dashboard <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
