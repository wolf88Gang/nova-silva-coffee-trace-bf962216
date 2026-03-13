import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ArrowRight, ArrowLeft, Users, Map, Truck, Package, BarChart3,
  ShieldCheck, Heart, DollarSign, CreditCard, HardHat, Boxes,
  MessageSquare, Scale, Leaf, FileCheck, Sparkles, Calendar,
} from 'lucide-react';
import { type OrgModule, getOrgDefaultModules } from '@/lib/org-modules';
import type { OnboardingOrgType } from './StepOrgType';
import { getPricingModel, getModulePrice, type PricingModel } from '@/lib/pricingEngine';

const MODULE_META: Record<string, {
  label: string; description: string; icon: React.ElementType; category: string;
}> = {
  productores: { label: 'Gestión de Actores', description: 'Administra socios, proveedores o productores asociados a tu organización', icon: Users, category: 'Operaciones' },
  parcelas: { label: 'Parcelas y Mapas', description: 'Geolocalización, áreas productivas, historial de manejo y mapas interactivos', icon: Map, category: 'Operaciones' },
  entregas: { label: 'Entregas de Campo', description: 'Recepción de café en centro de acopio con trazabilidad por productor', icon: Truck, category: 'Operaciones' },
  lotes_acopio: { label: 'Lotes de Acopio', description: 'Consolidación, procesamiento y preparación de lotes para venta', icon: Package, category: 'Operaciones' },
  lotes_comerciales: { label: 'Lotes Comerciales', description: 'Preparación de lotes para exportación con documentación completa', icon: BarChart3, category: 'Comercial' },
  contratos: { label: 'Contratos', description: 'Gestión de contratos con compradores, precios, volúmenes e Incoterms', icon: FileCheck, category: 'Comercial' },
  calidad: { label: 'Calidad / Nova Cup', description: 'Cataciones SCA, evaluaciones de taza, perfiles sensoriales y ranking', icon: Sparkles, category: 'Calidad' },
  vital: { label: 'Protocolo VITAL', description: 'Diagnóstico integral de sostenibilidad con acciones prioritarias y seguimiento', icon: Heart, category: 'Sostenibilidad' },
  eudr: { label: 'Cumplimiento EUDR', description: 'Paquetes de debida diligencia, trazabilidad y declaración de deforestación cero', icon: ShieldCheck, category: 'Cumplimiento' },
  finanzas: { label: 'Finanzas', description: 'Transacciones financieras, pagos a productores, reportes contables', icon: DollarSign, category: 'Finanzas' },
  creditos: { label: 'Créditos', description: 'Préstamos y adelantos a productores con scoring crediticio Nova', icon: CreditCard, category: 'Finanzas' },
  jornales: { label: 'Jornales', description: 'Gestión de mano de obra, campañas de cosecha y cuadrillas', icon: HardHat, category: 'Operaciones' },
  inventario: { label: 'Inventario', description: 'Control de equipos, insumos y suministros con alertas de reposición', icon: Boxes, category: 'Operaciones' },
  mensajes: { label: 'Mensajes', description: 'Comunicación interna entre usuarios, avisos y notificaciones', icon: MessageSquare, category: 'Comunicación' },
  inclusion: { label: 'Inclusión y Equidad', description: 'Indicadores de género, juventud, equidad y métricas de impacto social', icon: Scale, category: 'Sostenibilidad' },
  nutricion: { label: 'Nutrición Vegetal', description: 'Análisis de suelo, planes de fertilización, heatmaps de fertilidad y motores de cálculo', icon: Leaf, category: 'Agronomía' },
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

export function StepModules({ orgType, selectedModules, onModulesChange, onNext, onBack }: StepModulesProps) {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const pricingModel = getPricingModel(orgType);
  const defaults = getOrgDefaultModules(orgType).filter((m): m is OrgModule => m !== 'core');

  const toggle = (mod: OrgModule) => {
    if (selectedModules.includes(mod)) {
      onModulesChange(selectedModules.filter(m => m !== mod));
    } else {
      onModulesChange([...selectedModules, mod]);
    }
  };

  const isDefault = (mod: OrgModule) => defaults.includes(mod);

  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    modules: TOGGLEABLE.filter(m => MODULE_META[m]?.category === cat),
  })).filter(g => g.modules.length > 0);

  const monthlyTotal = selectedModules.reduce((sum, mod) => sum + getModulePrice(pricingModel, mod), 0);
  const annualTotal = monthlyTotal * 12;
  const annualDiscounted = Math.round(annualTotal * 0.85); // 15% discount
  const displayMonthly = billing === 'annual' ? Math.round(annualDiscounted / 12) : monthlyTotal;

  const formatPrice = (n: number) => n.toLocaleString('en-US');

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">
          Arma tu plataforma a la medida
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Cada módulo es un addon independiente. Hemos pre-seleccionado lo que tu tipo de organización
          normalmente necesita, pero tú decides qué activar.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center rounded-full border border-border bg-muted/50 p-1 gap-0.5">
          <button
            onClick={() => setBilling('monthly')}
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
            onClick={() => setBilling('annual')}
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

        {/* Price summary */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 py-2">
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary/10 border border-primary/20">
            <DollarSign className="h-5 w-5 text-primary" />
            <div className="text-left">
              <span className="text-xl font-bold text-primary">${formatPrice(displayMonthly)}</span>
              <span className="text-sm text-primary/70">/mes</span>
              {billing === 'annual' && (
                <span className="block text-xs text-muted-foreground line-through">
                  ${formatPrice(monthlyTotal)}/mes
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {billing === 'annual'
                  ? `$${formatPrice(annualDiscounted)}/año`
                  : `$${formatPrice(annualTotal)}/año`
                }
              </span>
            </div>
            <span className="text-xs">·</span>
            <span>{selectedModules.length} módulos</span>
          </div>
        </div>
      </div>

      {grouped.map(({ category, modules }) => (
        <div key={category} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {modules.map((mod) => {
              const info = MODULE_META[mod];
              if (!info) return null;
              const checked = selectedModules.includes(mod);
              const recommended = isDefault(mod);
              const Icon = info.icon;
              const modulePrice = getModulePrice(pricingModel, mod);
              const displayPrice = billing === 'annual'
                ? Math.round(modulePrice * 0.85)
                : modulePrice;

              return (
                <Card
                  key={mod}
                  className={cn(
                    'cursor-pointer transition-all duration-200 group relative overflow-hidden',
                    checked
                      ? 'border-primary/50 bg-primary/5 shadow-sm shadow-primary/10'
                      : 'hover:border-muted-foreground/30 hover:bg-muted/30'
                  )}
                  onClick={() => toggle(mod)}
                >
                  {recommended && (
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-bl-md">
                      RECOMENDADO
                    </div>
                  )}
                  <CardContent className="py-4 px-4 flex items-start gap-3">
                    <div className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                      checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/10'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{info.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{info.description}</p>
                      <p className="text-xs font-bold text-primary mt-1">
                        {modulePrice === 0 ? 'Incluido' : `$${displayPrice}/mes`}
                      </p>
                    </div>
                    <Switch
                      checked={checked}
                      onCheckedChange={() => toggle(mod)}
                      className="mt-1"
                      onClick={e => e.stopPropagation()}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
        </Button>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground hidden sm:block">
            Puedes cambiar esto después en <span className="font-medium text-foreground">Mi Perfil</span>
          </p>
          <Button onClick={onNext} disabled={selectedModules.length === 0} size="lg">
            Siguiente <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
