/**
 * CrearCuenta — Commercial summary + short account creation form.
 * Reuses demoConfig and pricingEngine for pre-filled data.
 */
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getDemoConfig } from '@/hooks/useDemoConfig';
import {
  getSetupConfig, recommendPlan, recommendPacks, estimatePrice,
  PLANS, PACKS, getOrgTypeLabel, getModelLabel,
  type PlanTier,
} from '@/lib/pricingEngine';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Leaf, ArrowRight, ArrowLeft, Loader2, CheckCircle, Sparkles,
  Building2, DollarSign, Package, Shield, Award, Briefcase,
  Boxes, ShoppingCart, Truck, Bug, Coffee,
} from 'lucide-react';
import logoNovasilva from '@/assets/logo-novasilva.png';
import bgForest from '@/assets/bg-forest-network.png';

type Phase = 'summary' | 'account' | 'done';

const COUNTRIES = [
  'Costa Rica', 'Guatemala', 'Colombia', 'Honduras', 'México',
  'Perú', 'Brasil', 'Nicaragua', 'El Salvador', 'Ecuador', 'Panamá', 'Otro',
];

const PACK_ICONS: Record<string, typeof Bug> = {
  agronomia: Bug,
  cumplimiento: Shield,
  calidad: Award,
  operacion: Briefcase,
  abastecimiento: Truck,
  catalogo: ShoppingCart,
};

export default function CrearCuenta() {
  const navigate = useNavigate();
  const demoConfig = getDemoConfig();
  const setupConfig = getSetupConfig();
  const [phase, setPhase] = useState<Phase>('summary');
  const [saving, setSaving] = useState(false);

  // Form state
  const [orgName, setOrgName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');

  // Pricing
  const plan = useMemo(() => {
    if (!setupConfig) return 'Smart' as PlanTier;
    return recommendPlan(setupConfig);
  }, [setupConfig]);

  const packs = useMemo(() => {
    if (!setupConfig) return [];
    return recommendPacks(setupConfig);
  }, [setupConfig]);

  const pricing = useMemo(() => estimatePrice(plan, packs), [plan, packs]);

  const orgType = demoConfig?.orgType || setupConfig?.orgType || 'cooperativa';
  const operatingModel = demoConfig?.operatingModel || setupConfig?.operatingModel || 'aggregator';
  const modules = demoConfig?.modules || [];

  const handleCreate = async () => {
    setSaving(true);
    // Simulate account creation (visual only, no real backend)
    await new Promise(r => setTimeout(r, 2000));
    setSaving(false);
    setPhase('done');
  };

  const progressValue = phase === 'summary' ? 50 : phase === 'account' ? 85 : 100;

  return (
    <div className="min-h-screen relative flex flex-col">
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
          <Link to="/demo" className="text-white/30 hover:text-white text-xs transition-colors">
            Volver al demo →
          </Link>
        </header>

        <div className="px-6 pt-3">
          <Progress value={progressValue} className="h-1 bg-white/10 [&>div]:bg-[hsl(var(--accent-orange))]" />
        </div>

        {/* Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-3xl">
            {phase === 'summary' && (
              <SummaryPhase
                orgType={orgType}
                operatingModel={operatingModel}
                modules={modules}
                plan={plan}
                packs={packs}
                pricing={pricing}
                onContinue={() => setPhase('account')}
                onBack={() => navigate(-1)}
              />
            )}
            {phase === 'account' && (
              <AccountPhase
                orgName={orgName} setOrgName={setOrgName}
                userName={userName} setUserName={setUserName}
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                country={country} setCountry={setCountry}
                plan={plan} pricing={pricing}
                saving={saving}
                onCreate={handleCreate}
                onBack={() => setPhase('summary')}
              />
            )}
            {phase === 'done' && (
              <DonePhase orgName={orgName} onGo={() => navigate('/app')} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Summary Phase ──

function SummaryPhase({ orgType, operatingModel, modules, plan, packs, pricing, onContinue, onBack }: {
  orgType: string; operatingModel: string; modules: string[];
  plan: PlanTier; packs: string[]; pricing: { base: number; addons: number; total: number };
  onContinue: () => void; onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Tu configuración Nova Silva</h1>
        <p className="text-white/40 text-sm">Basada en tu exploración del demo. Revisa y crea tu cuenta.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Config */}
        <div className="bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-1.5">Tipo de organización</p>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[hsl(var(--accent-orange))]" />
              <span className="text-white font-medium text-sm">{getOrgTypeLabel(orgType)}</span>
            </div>
          </div>

          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-1.5">Modelo operativo</p>
            <span className="text-white/70 text-sm">{getModelLabel(operatingModel)}</span>
          </div>

          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-2">Módulos incluidos</p>
            <div className="flex flex-wrap gap-1.5">
              {modules.map(mod => (
                <span key={mod} className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--accent-orange))]/10 text-[hsl(var(--accent-orange))]/80 border border-[hsl(var(--accent-orange))]/15">
                  {mod}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-2">Packs funcionales</p>
            <div className="space-y-1.5">
              {packs.map(packKey => {
                const pack = PACKS.find(p => p.key === packKey);
                const Icon = PACK_ICONS[packKey] || Package;
                return pack ? (
                  <div key={packKey} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/8">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-[hsl(var(--accent-orange))]" />
                      <span className="text-xs text-white">{pack.label}</span>
                    </div>
                    <span className="text-xs text-white/40">${pack.price}/mes</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>

        {/* Right: Pricing */}
        <div className="bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-3">Plan recomendado</p>
            <div className="space-y-2">
              {PLANS.map(p => (
                <div key={p.tier} className={cn(
                  'flex items-center justify-between p-3 rounded-xl border transition-all',
                  p.tier === plan
                    ? 'border-[hsl(var(--accent-orange))]/50 bg-[hsl(var(--accent-orange))]/10'
                    : 'border-white/8 bg-white/3'
                )}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{p.label}</span>
                      {p.badge && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--accent-orange))]/20 text-[hsl(var(--accent-orange))] font-bold">{p.badge}</span>}
                      {p.tier === plan && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--accent-orange))] text-white font-bold">RECOMENDADO</span>}
                    </div>
                    <p className="text-[10px] text-white/30 mt-0.5">{p.limit}</p>
                  </div>
                  <span className="text-lg font-bold text-white">${p.base}<span className="text-xs text-white/30 font-normal">/mes</span></span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Plan base ({plan})</span>
              <span className="text-white font-mono">${pricing.base}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Packs ({packs.length})</span>
              <span className="text-white font-mono">${pricing.addons}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between">
              <span className="text-white font-semibold">Total estimado</span>
              <span className="text-2xl font-bold text-[hsl(var(--accent-orange))]">${pricing.total}<span className="text-xs text-white/30 font-normal">/mes</span></span>
            </div>
            <p className="text-[10px] text-white/20">Precio estimado en USD. El monto final depende del uso real.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/30 hover:text-white text-sm transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver al demo
        </button>
        <button
          onClick={onContinue}
          className="flex items-center gap-2 bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white font-semibold py-3 px-8 rounded-xl transition-colors text-sm"
        >
          Crear cuenta con esta configuración <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Account Phase ──

function AccountPhase({ orgName, setOrgName, userName, setUserName, email, setEmail, password, setPassword, country, setCountry, plan, pricing, saving, onCreate, onBack }: {
  orgName: string; setOrgName: (v: string) => void;
  userName: string; setUserName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  country: string; setCountry: (v: string) => void;
  plan: PlanTier; pricing: { total: number };
  saving: boolean; onCreate: () => void; onBack: () => void;
}) {
  const valid = orgName.trim() && userName.trim() && email.includes('@') && password.length >= 6 && country;

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-1">Crea tu cuenta</h2>
          <p className="text-white/40 text-sm">Tu configuración ya está lista. Solo faltan tus datos.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Nombre de la organización</Label>
            <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Ej: Cooperativa Los Andes"
              className="bg-white/8 border-white/15 text-white placeholder:text-white/20" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Tu nombre</Label>
            <Input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Nombre completo"
              className="bg-white/8 border-white/15 text-white placeholder:text-white/20" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Correo electrónico</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com"
              className="bg-white/8 border-white/15 text-white placeholder:text-white/20" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Contraseña</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
              className="bg-white/8 border-white/15 text-white placeholder:text-white/20" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">País</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="bg-white/8 border-white/15 text-white text-sm [&>svg]:text-white/40">
                <SelectValue placeholder="Seleccionar país" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/8">
          <span className="text-xs text-white/50">Plan {plan} + packs</span>
          <span className="text-sm font-bold text-[hsl(var(--accent-orange))]">${pricing.total}/mes</span>
        </div>

        <button
          onClick={onCreate}
          disabled={!valid || saving}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
            !valid || saving
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : 'bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white shadow-lg shadow-[hsl(var(--accent-orange))]/20'
          )}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Creando cuenta…</>
          ) : (
            <><CheckCircle className="h-4 w-4" /> Crear cuenta y comenzar</>
          )}
        </button>

        <p className="text-[10px] text-white/15 text-center">14 días de prueba gratuita. Sin tarjeta de crédito.</p>
      </div>

      <button onClick={onBack} className="flex items-center justify-center gap-1.5 text-white/30 hover:text-white text-xs mt-4 mx-auto transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Volver al resumen
      </button>
    </div>
  );
}

// ── Done Phase ──

function DonePhase({ orgName, onGo }: { orgName: string; onGo: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[hsl(var(--accent-orange))]/15 mx-auto">
          <Sparkles className="h-8 w-8 text-[hsl(var(--accent-orange))]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Bienvenido a Nova Silva</h2>
          <p className="text-white/40 text-sm">
            {orgName ? `${orgName} está lista.` : 'Tu organización está lista.'} Hemos configurado tu plataforma con los módulos y datos adaptados a tu operación.
          </p>
        </div>
        <button
          onClick={onGo}
          className="inline-flex items-center gap-2 bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white font-semibold py-3 px-8 rounded-xl transition-colors text-sm"
        >
          Ir a mi dashboard <ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-white/15 text-xs">14 días de prueba · Cancela cuando quieras</p>
      </div>
    </div>
  );
}
