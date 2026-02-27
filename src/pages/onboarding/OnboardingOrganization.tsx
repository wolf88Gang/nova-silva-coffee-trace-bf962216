import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingRpc } from '@/hooks/useOnboardingRpc';
import { useToast } from '@/hooks/use-toast';
import { getQueue } from '@/lib/onboardingQueue';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Leaf, ArrowRight, ArrowLeft, Loader2, CheckCircle, Users, Ship, Package,
  Factory, Globe, Shield, Sprout, Bug, Target, Gauge, WifiOff, Sparkles,
  Coffee, TreePine, Sun, Calendar, UserPlus, ClipboardCheck, MapPin, Truck
} from 'lucide-react';

// ── Types ──
type OrgType = 'cooperativa' | 'exportador' | 'beneficio_privado' | 'productor_independiente';
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'done';

const TOTAL_STEPS = 8;

interface WizardState {
  // Step 1
  org_type: OrgType | null;
  // Step 2
  has_farm: boolean;
  has_mill: boolean;
  buys_from_others: boolean;
  exports_direct: boolean;
  // Step 3
  target_markets: string[];
  needs_eudr: boolean;
  // Step 4
  needs_labor: boolean;
  needs_yield: boolean;
  needs_guard: boolean;
  needs_vital: boolean;
  // Step 5
  scale_producers: string;
  scale_parcels: string;
  scale_lots_month: string;
  // Step 6 — Cultivos y temporada
  crops: string[];
  harvest_months_start: string;
  harvest_months_end: string;
  // Step 7 — Roles y estructura
  roles_tecnico: number;
  roles_comprador: number;
  roles_admin: number;
  roles_other: string;
  // Step 8 — Checklist
  checklist_finca: boolean;
  checklist_parcela: boolean;
  checklist_productor: boolean;
  checklist_lote: boolean;
  checklist_cosecha: boolean;
  checklist_evidencia: boolean;
}

const INITIAL: WizardState = {
  org_type: null,
  has_farm: false, has_mill: false, buys_from_others: false, exports_direct: false,
  target_markets: [], needs_eudr: false,
  needs_labor: false, needs_yield: false, needs_guard: false, needs_vital: false,
  scale_producers: '', scale_parcels: '', scale_lots_month: '',
  crops: [], harvest_months_start: '', harvest_months_end: '',
  roles_tecnico: 0, roles_comprador: 0, roles_admin: 1, roles_other: '',
  checklist_finca: false, checklist_parcela: false, checklist_productor: false,
  checklist_lote: false, checklist_cosecha: false, checklist_evidencia: false,
};

// ── Constants ──
const ORG_TYPES: { value: OrgType; label: string; icon: typeof Users; desc: string }[] = [
  { value: 'cooperativa', label: 'Cooperativa', icon: Users, desc: 'Gestiona socios productores y procesa café colectivamente' },
  { value: 'exportador', label: 'Exportador / Trader', icon: Ship, desc: 'Compra, consolida y exporta café a mercados internacionales' },
  { value: 'beneficio_privado', label: 'Beneficio Privado', icon: Factory, desc: 'Empresa privada que compra y procesa café de proveedores' },
  { value: 'productor_independiente', label: 'Productor Independiente', icon: Sprout, desc: 'Finca o empresa que gestiona sus propias operaciones' },
];

const MARKETS = [
  'Estados Unidos', 'Europa (UE)', 'Japón', 'Corea del Sur', 'Australia',
  'Canadá', 'Reino Unido', 'Medio Oriente', 'Mercado local/regional',
];

const MODULES_INFO = [
  { key: 'needs_labor' as const, label: 'Jornales & Mano de Obra', icon: Users, desc: 'Registra campañas, turnos y pagos de trabajadores de campo' },
  { key: 'needs_yield' as const, label: 'Nova Yield — Estimación de Cosecha', icon: Target, desc: 'Estima producción por parcela con modelos agronómicos' },
  { key: 'needs_guard' as const, label: 'Nova Guard — Sanidad Vegetal', icon: Bug, desc: 'Monitorea plagas, enfermedades y alertas fitosanitarias' },
  { key: 'needs_vital' as const, label: 'Protocolo VITAL', icon: Gauge, desc: 'Diagnóstico integral de sostenibilidad (ambiental, social, económica)' },
];

const CROPS = [
  { value: 'cafe', label: 'Café', icon: Coffee },
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
  { key: 'checklist_finca' as const, label: 'Crear mi primera finca', icon: MapPin, desc: 'Registra la ubicación y datos generales de tu finca principal' },
  { key: 'checklist_parcela' as const, label: 'Registrar una parcela', icon: TreePine, desc: 'Define un lote de cultivo con área, variedad y coordenadas' },
  { key: 'checklist_productor' as const, label: 'Agregar un productor o proveedor', icon: UserPlus, desc: 'Crea el primer actor dentro de tu organización' },
  { key: 'checklist_lote' as const, label: 'Crear un lote de café', icon: Package, desc: 'Registra un lote de acopio o comercial' },
  { key: 'checklist_cosecha' as const, label: 'Registrar primera entrega', icon: Truck, desc: 'Documenta una entrega de café con peso y calidad' },
  { key: 'checklist_evidencia' as const, label: 'Subir una evidencia', icon: ClipboardCheck, desc: 'Fotografía, documento o certificado de cumplimiento' },
];

export default function OnboardingOrganization() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const orgId = user?.organizationId ?? null;
  const { upsertProfile, getRecommendation, retryQueue } = useOnboardingRpc(orgId);

  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<WizardState>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [recommendation, setRecommendation] = useState<Record<string, unknown> | null>(null);
  const hasOfflineQueue = getQueue().length > 0;

  useEffect(() => {
    retryQueue();
    const handler = () => retryQueue();
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }, [retryQueue]);

  const update = (partial: Partial<WizardState>) => setState(prev => ({ ...prev, ...partial }));

  const saveAndAdvance = async (nextStep: Step, payload: Record<string, unknown>, finalize = false) => {
    setSaving(true);
    const { ok } = await upsertProfile(payload, finalize);
    setSaving(false);

    if (!ok) {
      toast({ title: 'Guardado en cola offline', description: 'Se sincronizará cuando haya conexión.', variant: 'default' });
    }

    if (finalize) {
      setSaving(true);
      const rec = await getRecommendation();
      setSaving(false);
      if (rec.ok && rec.data) {
        setRecommendation(rec.data);
      } else {
        setRecommendation({ message: 'Tu organización ha sido configurada exitosamente. Los módulos recomendados se activarán automáticamente.' });
      }
      setStep('done');
    } else {
      setStep(nextStep);
    }
  };

  const progressValue = step === 'done' ? 100 : ((step as number) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Leaf className="h-5 w-5 text-primary" />
        </div>
        <span className="font-bold text-lg text-foreground">Nova Silva</span>
        <div className="ml-auto flex items-center gap-3">
          {hasOfflineQueue && (
            <Badge variant="outline" className="text-xs gap-1">
              <WifiOff className="h-3 w-3" /> Pendientes en cola
            </Badge>
          )}
          {step !== 'done' && (
            <span className="text-sm text-muted-foreground">Paso {step as number} de {TOTAL_STEPS}</span>
          )}
        </div>
      </header>

      <div className="px-6 pt-4">
        <Progress value={progressValue} className="h-1.5" />
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {step === 1 && <Step1OrgType state={state} update={update} saving={saving} onNext={() =>
          saveAndAdvance(2, { org_type: state.org_type })
        } />}
        {step === 2 && <Step2Operativo state={state} update={update} saving={saving}
          onNext={() => saveAndAdvance(3, {
            has_farm: state.has_farm, has_mill: state.has_mill,
            buys_from_others: state.buys_from_others, exports_direct: state.exports_direct,
          })}
          onBack={() => setStep(1)}
        />}
        {step === 3 && <Step3Mercado state={state} update={update} saving={saving}
          onNext={() => saveAndAdvance(4, {
            target_markets: state.target_markets, needs_eudr: state.needs_eudr,
          })}
          onBack={() => setStep(2)}
        />}
        {step === 4 && <Step4Modulos state={state} update={update} saving={saving}
          onNext={() => saveAndAdvance(5, {
            needs_labor: state.needs_labor, needs_yield: state.needs_yield,
            needs_guard: state.needs_guard, needs_vital: state.needs_vital,
          })}
          onBack={() => setStep(3)}
        />}
        {step === 5 && <Step5Escala state={state} update={update} saving={saving}
          onNext={() => saveAndAdvance(6, {
            scale_producers: state.scale_producers,
            scale_parcels: state.scale_parcels,
            scale_lots_month: state.scale_lots_month,
          })}
          onBack={() => setStep(4)}
        />}
        {step === 6 && <Step6Cultivos state={state} update={update} saving={saving}
          onNext={() => saveAndAdvance(7, {
            crops: state.crops,
            harvest_months_start: state.harvest_months_start,
            harvest_months_end: state.harvest_months_end,
          })}
          onBack={() => setStep(5)}
        />}
        {step === 7 && <Step7Roles state={state} update={update} saving={saving}
          onNext={() => saveAndAdvance(8, {
            roles_tecnico: state.roles_tecnico,
            roles_comprador: state.roles_comprador,
            roles_admin: state.roles_admin,
            roles_other: state.roles_other,
          })}
          onBack={() => setStep(6)}
        />}
        {step === 8 && <Step8Checklist state={state} update={update} saving={saving}
          onFinalize={() => saveAndAdvance('done', {
            checklist_finca: state.checklist_finca,
            checklist_parcela: state.checklist_parcela,
            checklist_productor: state.checklist_productor,
            checklist_lote: state.checklist_lote,
            checklist_cosecha: state.checklist_cosecha,
            checklist_evidencia: state.checklist_evidencia,
          }, true)}
          onBack={() => setStep(7)}
        />}
        {step === 'done' && <StepDone recommendation={recommendation} onGo={() => {
          window.location.href = '/app';
        }} />}
      </main>
    </div>
  );
}

// ── Shared Components ──

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center space-y-2 mb-6">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function NavButtons({ onBack, onNext, nextLabel, disabled, saving, nextIcon }: {
  onBack?: () => void; onNext: () => void; nextLabel?: string; disabled?: boolean; saving?: boolean;
  nextIcon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between pt-4">
      {onBack ? (
        <Button variant="ghost" onClick={onBack} disabled={saving}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
        </Button>
      ) : <div />}
      <Button onClick={onNext} disabled={disabled || saving} size="lg">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando…</> : (
          <>{nextLabel || 'Siguiente'} {nextIcon || <ArrowRight className="h-4 w-4 ml-1" />}</>
        )}
      </Button>
    </div>
  );
}

// ── Step 1: Tipo de organización ──
function Step1OrgType({ state, update, saving, onNext }: {
  state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader title="¿Qué tipo de organización eres?" subtitle="Esto personaliza tu experiencia en Nova Silva." />
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

// ── Step 2: Modelo operativo ──
function Step2Operativo({ state, update, saving, onNext, onBack }: {
  state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void; onBack: () => void;
}) {
  const toggles: { key: keyof WizardState; label: string; desc: string }[] = [
    { key: 'has_farm', label: '¿Tienes fincas propias?', desc: 'Operas parcelas bajo tu administración directa' },
    { key: 'has_mill', label: '¿Tienes beneficio húmedo o seco?', desc: 'Procesas café (despulpado, lavado, secado)' },
    { key: 'buys_from_others', label: '¿Compras café a terceros?', desc: 'Adquieres café de productores, cooperativas u otros proveedores' },
    { key: 'exports_direct', label: '¿Exportas directamente?', desc: 'Realizas exportaciones a compradores internacionales' },
  ];

  return (
    <div className="space-y-6">
      <StepHeader title="Tu modelo operativo" subtitle="Cuéntanos cómo opera tu organización para adaptar los flujos." />
      <div className="space-y-3">
        {toggles.map(t => (
          <Card key={t.key} className={cn('cursor-pointer transition-all',
            state[t.key] ? 'border-primary/50 bg-primary/5' : ''
          )} onClick={() => update({ [t.key]: !state[t.key] })}>
            <CardContent className="py-4 px-4 flex items-start gap-3">
              <Checkbox checked={state[t.key] as boolean} onCheckedChange={() => update({ [t.key]: !state[t.key] })} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <NavButtons onBack={onBack} onNext={onNext} saving={saving} />
    </div>
  );
}

// ── Step 3: Mercado y compliance ──
function Step3Mercado({ state, update, saving, onNext, onBack }: {
  state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void; onBack: () => void;
}) {
  const toggleMarket = (m: string) => {
    const markets = state.target_markets.includes(m)
      ? state.target_markets.filter(x => x !== m)
      : [...state.target_markets, m];
    update({ target_markets: markets });
  };

  return (
    <div className="space-y-6">
      <StepHeader title="Mercado y cumplimiento" subtitle="¿A dónde vendes tu café y qué regulaciones necesitas cumplir?" />
      <div>
        <Label className="text-sm font-medium mb-3 block">Mercados objetivo (selecciona todos los que apliquen)</Label>
        <div className="flex flex-wrap gap-2">
          {MARKETS.map(m => (
            <Badge key={m} variant={state.target_markets.includes(m) ? 'default' : 'outline'}
              className="cursor-pointer text-xs py-1.5 px-3 transition-all"
              onClick={() => toggleMarket(m)}
            >
              {state.target_markets.includes(m) && <CheckCircle className="h-3 w-3 mr-1" />}
              {m}
            </Badge>
          ))}
        </div>
      </div>
      <Card className={cn('cursor-pointer transition-all',
        state.needs_eudr ? 'border-primary/50 bg-primary/5' : ''
      )} onClick={() => update({ needs_eudr: !state.needs_eudr })}>
        <CardContent className="py-4 px-4 flex items-start gap-3">
          <Checkbox checked={state.needs_eudr} onCheckedChange={() => update({ needs_eudr: !state.needs_eudr })} className="mt-0.5" />
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Necesito cumplimiento EUDR</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Regulación de la UE contra deforestación. Requiere trazabilidad, geolocalización de parcelas y paquetes de debida diligencia.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <NavButtons onBack={onBack} onNext={onNext} saving={saving} />
    </div>
  );
}

// ── Step 4: Módulos deseados ──
function Step4Modulos({ state, update, saving, onNext, onBack }: {
  state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void; onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader title="Módulos especializados" subtitle="Activa los módulos que necesitas. Podrás cambiarlos después." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {MODULES_INFO.map(mod => (
          <Card key={mod.key} className={cn('cursor-pointer transition-all',
            state[mod.key] ? 'border-primary/50 bg-primary/5' : ''
          )} onClick={() => update({ [mod.key]: !state[mod.key] })}>
            <CardContent className="py-4 px-4 flex items-start gap-3">
              <Checkbox checked={state[mod.key]} onCheckedChange={() => update({ [mod.key]: !state[mod.key] })} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <mod.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">{mod.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{mod.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <NavButtons onBack={onBack} onNext={onNext} saving={saving} />
    </div>
  );
}

// ── Step 5: Escala ──
function Step5Escala({ state, update, saving, onNext, onBack }: {
  state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void; onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader title="Escala de tu operación" subtitle="Esto nos ayuda a optimizar tu experiencia y recomendaciones." />
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>¿Cuántos productores o proveedores gestionas?</Label>
          <Select value={state.scale_producers} onValueChange={v => update({ scale_producers: v })}>
            <SelectTrigger><SelectValue placeholder="Seleccionar rango" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1-50">1 – 50</SelectItem>
              <SelectItem value="51-200">51 – 200</SelectItem>
              <SelectItem value="201-500">201 – 500</SelectItem>
              <SelectItem value="501-1000">501 – 1,000</SelectItem>
              <SelectItem value="1000+">Más de 1,000</SelectItem>
              <SelectItem value="na">No aplica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>¿Cuántas parcelas o fincas administras?</Label>
          <Select value={state.scale_parcels} onValueChange={v => update({ scale_parcels: v })}>
            <SelectTrigger><SelectValue placeholder="Seleccionar rango" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1-20">1 – 20</SelectItem>
              <SelectItem value="21-100">21 – 100</SelectItem>
              <SelectItem value="101-500">101 – 500</SelectItem>
              <SelectItem value="500+">Más de 500</SelectItem>
              <SelectItem value="na">No aplica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>¿Cuántos lotes de café procesas por mes?</Label>
          <Select value={state.scale_lots_month} onValueChange={v => update({ scale_lots_month: v })}>
            <SelectTrigger><SelectValue placeholder="Seleccionar rango" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1 – 10</SelectItem>
              <SelectItem value="11-50">11 – 50</SelectItem>
              <SelectItem value="51-200">51 – 200</SelectItem>
              <SelectItem value="200+">Más de 200</SelectItem>
              <SelectItem value="na">No aplica</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <NavButtons onBack={onBack} onNext={onNext} saving={saving} />
    </div>
  );
}

// ── Step 6: Cultivos y temporada ──
function Step6Cultivos({ state, update, saving, onNext, onBack }: {
  state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void; onBack: () => void;
}) {
  const toggleCrop = (c: string) => {
    const crops = state.crops.includes(c) ? state.crops.filter(x => x !== c) : [...state.crops, c];
    update({ crops });
  };

  return (
    <div className="space-y-6">
      <StepHeader title="Cultivos y temporada" subtitle="¿Qué produces y cuándo es tu cosecha principal?" />

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
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            Inicio de cosecha
          </Label>
          <Select value={state.harvest_months_start} onValueChange={v => update({ harvest_months_start: v })}>
            <SelectTrigger><SelectValue placeholder="Mes de inicio" /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            Fin de cosecha
          </Label>
          <Select value={state.harvest_months_end} onValueChange={v => update({ harvest_months_end: v })}>
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

// ── Step 7: Roles y estructura ──
function Step7Roles({ state, update, saving, onNext, onBack }: {
  state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onNext: () => void; onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader title="Roles y estructura de equipo" subtitle="¿Cuántos usuarios internos necesitas? Podrás ajustarlo después." />

      <div className="space-y-4">
        {[
          { key: 'roles_admin' as const, label: 'Administradores', desc: 'Acceso completo a la organización', icon: Shield },
          { key: 'roles_tecnico' as const, label: 'Técnicos de campo', desc: 'Visitas, diagnósticos y seguimiento de fincas', icon: Users },
          { key: 'roles_comprador' as const, label: 'Compradores / Acopiadores', desc: 'Registro de entregas, pesaje y calidad', icon: Package },
        ].map(r => (
          <Card key={r.key}>
            <CardContent className="py-4 px-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <r.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <Input
                type="number"
                min={0}
                max={999}
                value={state[r.key]}
                onChange={e => update({ [r.key]: parseInt(e.target.value) || 0 })}
                className="w-20 text-center"
              />
            </CardContent>
          </Card>
        ))}

        <div className="space-y-2">
          <Label>Otros roles o notas sobre estructura</Label>
          <Input
            placeholder="Ej: 2 catadores, 1 gerente de logística…"
            value={state.roles_other}
            onChange={e => update({ roles_other: e.target.value })}
          />
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} saving={saving} />
    </div>
  );
}

// ── Step 8: Checklist primeros 7 días ──
function Step8Checklist({ state, update, saving, onFinalize, onBack }: {
  state: WizardState; update: (p: Partial<WizardState>) => void; saving: boolean; onFinalize: () => void; onBack: () => void;
}) {
  const completed = CHECKLIST_ITEMS.filter(i => state[i.key]).length;

  return (
    <div className="space-y-6">
      <StepHeader
        title="Tu checklist de inicio"
        subtitle="Marca lo que planeas hacer en tus primeros 7 días. No te preocupes, podrás completarlo después."
      />

      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-xs">
          {completed} de {CHECKLIST_ITEMS.length} planificados
        </Badge>
      </div>

      <div className="space-y-3">
        {CHECKLIST_ITEMS.map(item => (
          <Card key={item.key} className={cn('cursor-pointer transition-all',
            state[item.key] ? 'border-primary/50 bg-primary/5' : ''
          )} onClick={() => update({ [item.key]: !state[item.key] })}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <Checkbox checked={state[item.key]} onCheckedChange={() => update({ [item.key]: !state[item.key] })} />
              <div className={cn('h-8 w-8 rounded-md flex items-center justify-center shrink-0',
                state[item.key] ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className={cn('text-sm font-medium', state[item.key] ? 'text-foreground' : 'text-foreground/80')}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              {state[item.key] && <CheckCircle className="h-4 w-4 text-primary ml-auto shrink-0" />}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={saving}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
        </Button>
        <Button onClick={onFinalize} disabled={saving} size="lg">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Finalizando…</> : (
            <><CheckCircle className="h-4 w-4 mr-1" /> Finalizar configuración</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Done: Recommendation Screen ──
function StepDone({ recommendation, onGo }: { recommendation: Record<string, unknown> | null; onGo: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">Tu configuración sugerida</h2>
        <p className="text-muted-foreground mt-2">Basado en tu perfil, hemos preparado recomendaciones personalizadas.</p>
      </div>

      {recommendation && (
        <Card className="text-left border-primary/30 bg-primary/5">
          <CardContent className="pt-5 pb-4 space-y-3">
            {typeof recommendation === 'object' && Object.entries(recommendation).map(([key, value]) => (
              <div key={key}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{key.replace(/_/g, ' ')}</p>
                <p className="text-sm text-foreground mt-0.5">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button onClick={onGo} size="lg" className="mt-4">
        Ir a mi dashboard <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
