import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  ArrowRight, ArrowLeft, Users, Map as MapIcon, Truck, Package, BarChart3,
  ShieldCheck, Heart, DollarSign, CreditCard, HardHat, Boxes,
  MessageSquare, Scale, Leaf, FileCheck, Sparkles, Calendar,
  TreePine, TrendingUp, ChevronDown, Check,
} from 'lucide-react';
import { type OrgModule, getOrgDefaultModules } from '@/lib/org-modules';
import type { OnboardingOrgType } from './StepOrgType';
import {
  getPricingModel,
  FARMER_BASE, FARMER_SCALE, FARMER_PACKS, estimateFarmerPrice, getFarmerScaleTierIndex,
  AGGREGATOR_PLANS, AGGREGATOR_PACKS, estimateAggregatorPrice,
  getModulePrice,
  type PricingModel, type PlanTier, type PackDef,
} from '@/lib/pricingEngine';

// ── Module metadata for the aggregator per-module grid ──

const MODULE_META: Record<string, {
  label: string; description: string; icon: React.ElementType; category: string;
}> = {
  productores: { label: 'Gestión de Actores', description: 'Administra socios, proveedores o productores asociados', icon: Users, category: 'Operaciones' },
  parcelas: { label: 'Parcelas y Mapas', description: 'Geolocalización, áreas productivas y mapas interactivos', icon: MapIcon, category: 'Operaciones' },
  entregas: { label: 'Entregas de Campo', description: 'Recepción de café con trazabilidad por productor', icon: Truck, category: 'Operaciones' },
  lotes_acopio: { label: 'Lotes de Acopio', description: 'Consolidación y preparación de lotes para venta', icon: Package, category: 'Operaciones' },
  lotes_comerciales: { label: 'Lotes Comerciales', description: 'Lotes para exportación con documentación completa', icon: BarChart3, category: 'Comercial' },
  contratos: { label: 'Contratos', description: 'Contratos con compradores, precios e Incoterms', icon: FileCheck, category: 'Comercial' },
  calidad: { label: 'Calidad / Nova Cup', description: 'Cataciones SCA, perfiles sensoriales y ranking', icon: Sparkles, category: 'Calidad' },
  vital: { label: 'Protocolo VITAL', description: 'Diagnóstico integral de sostenibilidad', icon: Heart, category: 'Sostenibilidad' },
  eudr: { label: 'Cumplimiento EUDR', description: 'Debida diligencia y deforestación cero', icon: ShieldCheck, category: 'Cumplimiento' },
  finanzas: { label: 'Finanzas', description: 'Transacciones, pagos y reportes contables', icon: DollarSign, category: 'Finanzas' },
  creditos: { label: 'Créditos', description: 'Préstamos y adelantos con scoring crediticio', icon: CreditCard, category: 'Finanzas' },
  jornales: { label: 'Jornales', description: 'Mano de obra, campañas de cosecha y cuadrillas', icon: HardHat, category: 'Operaciones' },
  inventario: { label: 'Inventario', description: 'Equipos, insumos y alertas de reposición', icon: Boxes, category: 'Operaciones' },
  mensajes: { label: 'Mensajes', description: 'Comunicación interna y notificaciones', icon: MessageSquare, category: 'Comunicación' },
  inclusion: { label: 'Inclusión y Equidad', description: 'Indicadores de género, juventud y equidad', icon: Scale, category: 'Sostenibilidad' },
  nutricion: { label: 'Nutrición Vegetal', description: 'Análisis de suelo, planes de fertilización y heatmaps', icon: Leaf, category: 'Agronomía' },
};

const TOGGLEABLE: OrgModule[] = [
  'productores', 'parcelas', 'entregas', 'lotes_acopio', 'lotes_comerciales',
  'contratos', 'calidad', 'vital', 'eudr', 'finanzas', 'creditos',
  'jornales', 'inventario', 'mensajes', 'inclusion', 'nutricion',
];

const CATEGORIES = ['Operaciones', 'Comercial', 'Calidad', 'Agronomía', 'Sostenibilidad', 'Cumplimiento', 'Finanzas', 'Comunicación'];

interface StepModulesProps {
  orgType: OnboardingOrgType;
  selectedModules: OrgModule[];
  onModulesChange: (modules: OrgModule[]) => void;
  onNext: () => void;
  onBack: () => void;
}

type BillingCycle = 'monthly' | 'annual';

const PACK_ICONS: Record<string, React.ElementType> = {
  agronomia: Leaf,
  cumplimiento: ShieldCheck,
  calidad: Sparkles,
  operacion: HardHat,
  catalogo: Boxes,
  abastecimiento: Truck,
};

// ── Price display helper ──
const fmt = (n: number) => n.toLocaleString('en-US');

// ═══════════════════════════════════════════════
// FARMER PRICING VIEW
// ═══════════════════════════════════════════════

function FarmerPricingView({ selectedModules, onModulesChange, onNext, onBack, orgType }: StepModulesProps) {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [plotScale, setPlotScale] = useState(0); // index into FARMER_SCALE
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);

  const plotCount = FARMER_SCALE[plotScale].minPlots;
  const estimate = estimateFarmerPrice(plotCount, selectedPacks);
  const displayMonthly = billing === 'annual' ? Math.round(estimate.annual / 12) : estimate.monthly;

  const togglePack = (key: string) => {
    setSelectedPacks(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">
          Tu plan de finca
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Un solo precio base que crece con tu operación. Agrega packs opcionales según lo que necesites.
        </p>
        <BillingToggle billing={billing} onChange={setBilling} />
      </div>

      {/* Base subscription card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-6 px-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                <TreePine className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">Suscripción base</h3>
                <p className="text-sm text-muted-foreground">Producción · Parcelas · Registros · Trazabilidad · 2 usuarios</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">${FARMER_BASE}</span>
              <span className="text-sm text-primary/70">/mes</span>
            </div>
          </div>

          {/* Scale slider */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Escala de parcelas</span>
              <Badge variant="outline" className="text-xs">
                {FARMER_SCALE[plotScale].label}
                {FARMER_SCALE[plotScale].surcharge > 0 && ` · +$${FARMER_SCALE[plotScale].surcharge}/mes`}
                {FARMER_SCALE[plotScale].surcharge === 0 && ' · incluido'}
              </Badge>
            </div>
            <Slider
              value={[plotScale]}
              onValueChange={([v]) => setPlotScale(v)}
              min={0}
              max={FARMER_SCALE.length - 1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              {FARMER_SCALE.map((s, i) => (
                <span key={i} className={cn(i === plotScale && 'text-primary font-semibold')}>{s.label}</span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packs */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Packs opcionales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FARMER_PACKS.map((pack) => {
            const active = selectedPacks.includes(pack.key);
            const Icon = PACK_ICONS[pack.key] || Package;
            return (
              <Card
                key={pack.key}
                className={cn(
                  'cursor-pointer transition-all duration-200 group relative overflow-hidden',
                  active
                    ? 'border-primary/50 bg-primary/5 shadow-sm shadow-primary/10'
                    : 'hover:border-muted-foreground/30 hover:bg-muted/30'
                )}
                onClick={() => togglePack(pack.key)}
              >
                <CardContent className="py-4 px-4 flex items-start gap-3">
                  <div className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground">{pack.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{pack.desc}</p>
                    <ul className="mt-1.5 space-y-0.5">
                      {pack.includes.map((feat, i) => (
                        <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Check className="h-3 w-3 text-primary shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs font-bold text-primary mt-1.5">${pack.price}/mes</p>
                  </div>
                  <Switch
                    checked={active}
                    onCheckedChange={() => togglePack(pack.key)}
                    className="mt-1"
                    onClick={e => e.stopPropagation()}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Price summary */}
      <PriceSummary
        billing={billing}
        monthly={estimate.monthly}
        displayMonthly={displayMonthly}
        annual={estimate.annual}
        annualSavings={estimate.annualSavings}
        breakdown={[
          { label: 'Base finca', value: estimate.base },
          ...(estimate.scaleSurcharge > 0 ? [{ label: `Escala (${FARMER_SCALE[plotScale].label})`, value: estimate.scaleSurcharge }] : []),
          ...(estimate.packs > 0 ? [{ label: `Packs (${selectedPacks.length})`, value: estimate.packs }] : []),
        ]}
      />

      {/* Navigation */}
      <StepNav onBack={onBack} onNext={onNext} disabled={false} />
    </div>
  );
}

// ═══════════════════════════════════════════════
// AGGREGATOR PRICING VIEW
// ═══════════════════════════════════════════════

function AggregatorPricingView({ selectedModules, onModulesChange, onNext, onBack, orgType }: StepModulesProps) {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('Smart');
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const defaults = getOrgDefaultModules(orgType).filter((m): m is OrgModule => m !== 'core');

  const estimate = estimateAggregatorPrice(selectedPlan, selectedPacks);
  const displayMonthly = billing === 'annual' ? Math.round(estimate.annual / 12) : estimate.monthly;

  const togglePack = (key: string) => {
    setSelectedPacks(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">
          Arma tu plataforma a la medida
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Selecciona el plan base y agrega los packs que necesite tu organización.
        </p>
        <BillingToggle billing={billing} onChange={setBilling} />
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AGGREGATOR_PLANS.map((plan) => {
          const active = selectedPlan === plan.tier;
          return (
            <Card
              key={plan.tier}
              className={cn(
                'cursor-pointer transition-all duration-200 relative overflow-hidden',
                active
                  ? 'border-primary shadow-md shadow-primary/10 bg-primary/5'
                  : 'hover:border-muted-foreground/30'
              )}
              onClick={() => setSelectedPlan(plan.tier)}
            >
              {plan.badge && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-bl-lg">
                  {plan.badge}
                </div>
              )}
              <CardContent className="py-5 px-5 space-y-2">
                <h3 className="text-lg font-bold text-foreground">{plan.label}</h3>
                <p className="text-xs text-muted-foreground">{plan.desc}</p>
                <div className="pt-1">
                  <span className="text-3xl font-bold text-primary">
                    ${fmt(billing === 'annual' ? Math.round(plan.base * 0.85) : plan.base)}
                  </span>
                  <span className="text-sm text-primary/70">/mes</span>
                  {billing === 'annual' && (
                    <span className="block text-xs text-muted-foreground line-through mt-0.5">
                      ${fmt(plan.base)}/mes
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{plan.limit}</p>
                {active && (
                  <Badge className="mt-1 bg-primary text-primary-foreground text-[10px]">Seleccionado</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Packs */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Packs de módulos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AGGREGATOR_PACKS.map((pack) => {
            const active = selectedPacks.includes(pack.key);
            const Icon = PACK_ICONS[pack.key] || Package;
            return (
              <Card
                key={pack.key}
                className={cn(
                  'cursor-pointer transition-all duration-200 group',
                  active
                    ? 'border-primary/50 bg-primary/5 shadow-sm shadow-primary/10'
                    : 'hover:border-muted-foreground/30 hover:bg-muted/30'
                )}
                onClick={() => togglePack(pack.key)}
              >
                <CardContent className="py-4 px-4 flex items-start gap-3">
                  <div className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground">{pack.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{pack.desc}</p>
                    <p className="text-xs font-bold text-primary mt-1">
                      ${fmt(billing === 'annual' ? Math.round(pack.price * 0.85) : pack.price)}/mes
                    </p>
                  </div>
                  <Switch
                    checked={active}
                    onCheckedChange={() => togglePack(pack.key)}
                    className="mt-1"
                    onClick={e => e.stopPropagation()}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Price summary */}
      <PriceSummary
        billing={billing}
        monthly={estimate.monthly}
        displayMonthly={displayMonthly}
        annual={estimate.annual}
        annualSavings={estimate.annualSavings}
        breakdown={[
          { label: `Plan ${selectedPlan}`, value: estimate.base },
          ...(estimate.packs > 0 ? [{ label: `Packs (${selectedPacks.length})`, value: estimate.packs }] : []),
        ]}
      />

      {/* Navigation */}
      <StepNav onBack={onBack} onNext={onNext} disabled={false} />
    </div>
  );
}

// ═══════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════

function BillingToggle({ billing, onChange }: { billing: BillingCycle; onChange: (b: BillingCycle) => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-muted/50 p-1 gap-0.5">
      <button
        onClick={() => onChange('monthly')}
        className={cn(
          'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
          billing === 'monthly'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Mensual
      </button>
      <button
        onClick={() => onChange('annual')}
        className={cn(
          'px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
          billing === 'annual'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Anual
        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-accent text-accent-foreground">
          -15%
        </Badge>
      </button>
    </div>
  );
}

function PriceSummary({
  billing, monthly, displayMonthly, annual, annualSavings, breakdown,
}: {
  billing: BillingCycle;
  monthly: number;
  displayMonthly: number;
  annual: number;
  annualSavings: number;
  breakdown: { label: string; value: number }[];
}) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="py-5 px-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Resumen de precio</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">${fmt(displayMonthly)}</span>
            <span className="text-sm text-primary/70">/mes</span>
            {billing === 'annual' && (
              <span className="block text-xs text-muted-foreground line-through">
                ${fmt(monthly)}/mes
              </span>
            )}
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-1.5 pt-1 border-t border-border">
          {breakdown.map((item, i) => (
            <div key={i} className="flex justify-between text-xs text-muted-foreground">
              <span>{item.label}</span>
              <span className="font-medium text-foreground">${fmt(item.value)}</span>
            </div>
          ))}
        </div>

        {/* Annual totals */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {billing === 'annual'
                ? `$${fmt(annual)}/año`
                : `$${fmt(monthly * 12)}/año`}
            </span>
          </div>
          {billing === 'annual' && annualSavings > 0 && (
            <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/5">
              Ahorras ${fmt(annualSavings)}/año
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StepNav({ onBack, onNext, disabled }: { onBack: () => void; onNext: () => void; disabled: boolean }) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
      </Button>
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground hidden sm:block">
          Puedes cambiar esto después en <span className="font-medium text-foreground">Mi Perfil</span>
        </p>
        <Button onClick={onNext} disabled={disabled} size="lg">
          Siguiente <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN EXPORT — routes to correct view by model
// ═══════════════════════════════════════════════

export function StepModules(props: StepModulesProps) {
  const model = getPricingModel(props.orgType);

  if (model === 'farmer') {
    return <FarmerPricingView {...props} />;
  }

  return <AggregatorPricingView {...props} />;
}
