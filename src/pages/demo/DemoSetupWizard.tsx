/**
 * Wizard de configuración de demo.
 * /demo/setup
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDemoSetup } from '@/contexts/DemoSetupContext';
import { useDemoContext } from '@/contexts/DemoContext';
import { supabase } from '@/integrations/supabase/client';
import { resolveConfigToOrg, resolveConfigToProfile } from '@/config/demoSetupResolver';
import {
  WIZARD_ORG_OPTIONS,
  WIZARD_OP_MODEL_OPTIONS,
  WIZARD_MODULE_OPTIONS,
  type DemoSetupConfig,
  type WizardOrgType,
  type WizardOperatingModel,
  type WizardModuleKey,
} from '@/config/demoSetupConfig';
import { EMAIL_TO_LEGACY_ROLE } from '@/config/demoRedirects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import logoNovasilva from '@/assets/logo-novasilva.png';
import bgTerraces from '@/assets/bg-terraces.jpg';
import { ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';

const STEPS = 6;
const defaultScale = {
  plotCount: 0,
  producerOrSupplierCount: 0,
  userCount: 0,
  hasLabor: false,
  hasInventory: false,
  hasExports: false,
};

export default function DemoSetupWizard() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<Partial<DemoSetupConfig>>({
    orgType: undefined,
    operatingModel: undefined,
    modulesEnabled: [],
    scaleProfile: defaultScale,
  });
  const [loading, setLoading] = useState(false);
  const { setConfig: persistConfig } = useDemoSetup();
  const { setDemoSession } = useDemoContext();
  const navigate = useNavigate();

  const toggleModule = (key: WizardModuleKey) => {
    const arr = config.modulesEnabled ?? [];
    const next = arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key];
    setConfig((c) => ({ ...c, modulesEnabled: next }));
  };

  const handleComplete = async () => {
    const full: DemoSetupConfig = {
      orgType: (config.orgType ?? 'productor_privado') as WizardOrgType,
      operatingModel: (config.operatingModel ?? 'solo_produccion') as WizardOperatingModel,
      modulesEnabled: config.modulesEnabled ?? [],
      scaleProfile: { ...defaultScale, ...config.scaleProfile },
    };
    persistConfig(full);

    const org = resolveConfigToOrg(full);
    const profile = resolveConfigToProfile(org);
    setDemoSession(org, profile);

    setLoading(true);
    try {
      const legacyRole = EMAIL_TO_LEGACY_ROLE[profile.email] ?? 'cooperativa';
      const { data, error: ensureError } = await supabase.functions.invoke('ensure-demo-user', {
        body: { role: legacyRole },
      });

      if (ensureError) {
        const msg = (data as { details?: string })?.details ?? ensureError.message ?? 'Error al preparar usuario demo';
        throw new Error(msg);
      }

      if (data && typeof data === 'object' && (data as { ok?: boolean }).ok === false) {
        const err = data as { error?: string; details?: string };
        throw new Error(err.details ?? err.error ?? 'No se pudo preparar el usuario demo.');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: profile.password,
      });
      if (error) throw error;
      navigate('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al conectar';
      setDemoSession(org, profile);
      navigate('/demo-v2', { state: { fromWizard: true, error: msg } });
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 1) return true;
    if (step === 2) return !!config.orgType;
    if (step === 3) return !!config.operatingModel;
    if (step === 4) return true;
    if (step === 5) return true;
    return true;
  };

  const scale = config.scaleProfile ?? defaultScale;
  const orgLabel = WIZARD_ORG_OPTIONS.find((o) => o.value === config.orgType)?.label ?? '—';
  const opLabel = WIZARD_OP_MODEL_OPTIONS.find((o) => o.value === config.operatingModel)?.label ?? '—';

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="absolute inset-0 z-0">
        <img src={bgTerraces} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src={logoNovasilva} alt="Nova Silva" className="h-10 w-10 object-contain" />
          <span className="text-white font-bold text-lg">Nova Silva</span>
        </div>
        <Link to="/demo" className="text-white/60 hover:text-white text-sm">
          Omitir y ver demo
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-xl">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i + 1 <= step ? 'w-8 bg-[hsl(var(--accent-orange))]' : 'w-2 bg-white/20'
                )}
              />
            ))}
          </div>

          {/* Step 1: Bienvenida */}
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 border border-white/20">
                <Sparkles className="h-4 w-4 text-[hsl(var(--accent-orange))]" />
                <span className="text-white/80 text-sm">Demo personalizado</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Configurá un demo adaptado a tu operación
              </h1>
              <p className="text-white/60 text-sm max-w-md mx-auto">
                En menos de 2 minutos te mostraremos una versión de Nova Silva alineada con la forma en que opera tu organización.
              </p>
              <Button
                size="lg"
                className="bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white mt-4"
                onClick={() => setStep(2)}
              >
                Comenzar
              </Button>
            </div>
          )}

          {/* Step 2: Tipo de organización */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Tipo de organización</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WIZARD_ORG_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, orgType: opt.value }))}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all',
                      config.orgType === opt.value
                        ? 'bg-[hsl(var(--accent-orange))]/20 border-[hsl(var(--accent-orange))] text-white'
                        : 'bg-white/10 border-white/20 hover:bg-white/15 text-white'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Modelo operativo */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">¿Cómo opera tu organización hoy?</h2>
              <div className="grid grid-cols-1 gap-3">
                {WIZARD_OP_MODEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, operatingModel: opt.value }))}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all',
                      config.operatingModel === opt.value
                        ? 'bg-[hsl(var(--accent-orange))]/20 border-[hsl(var(--accent-orange))] text-white'
                        : 'bg-white/10 border-white/20 hover:bg-white/15 text-white'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Módulos */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">¿Qué querés ver en el demo?</h2>
              <p className="text-white/60 text-sm">Seleccioná los bloques que te interesan</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WIZARD_MODULE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleModule(opt.value)}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all flex items-center gap-3',
                      (config.modulesEnabled ?? []).includes(opt.value)
                        ? 'bg-[hsl(var(--accent-orange))]/20 border-[hsl(var(--accent-orange))] text-white'
                        : 'bg-white/10 border-white/20 hover:bg-white/15 text-white'
                    )}
                  >
                    {(config.modulesEnabled ?? []).includes(opt.value) && (
                      <Check className="h-5 w-5 text-[hsl(var(--accent-orange))]" />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Escala */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Escala operativa</h2>
              <p className="text-white/60 text-sm">Aproximado para personalizar el demo</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/80">Parcelas o fincas</Label>
                  <Input
                    type="number"
                    min={0}
                    value={scale.plotCount || ''}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        scaleProfile: { ...scale, plotCount: parseInt(e.target.value) || 0 },
                      }))
                    }
                    className="mt-1 bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white/80">Productores o proveedores</Label>
                  <Input
                    type="number"
                    min={0}
                    value={scale.producerOrSupplierCount || ''}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        scaleProfile: {
                          ...scale,
                          producerOrSupplierCount: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    className="mt-1 bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white/80">Usuarios internos</Label>
                  <Input
                    type="number"
                    min={0}
                    value={scale.userCount || ''}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        scaleProfile: { ...scale, userCount: parseInt(e.target.value) || 0 },
                      }))
                    }
                    className="mt-1 bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'hasLabor', label: 'Manejan cuadrillas' },
                  { key: 'hasInventory', label: 'Manejan inventario' },
                  { key: 'hasExports', label: 'Trabajan con lotes/exportaciones' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        scaleProfile: {
                          ...scale,
                          [key]: !scale[key as keyof typeof scale],
                        },
                      }))
                    }
                    className={cn(
                      'px-4 py-2 rounded-lg border text-sm transition-all',
                      scale[key as keyof typeof scale]
                        ? 'bg-[hsl(var(--accent-orange))]/20 border-[hsl(var(--accent-orange))] text-white'
                        : 'bg-white/10 border-white/20 text-white'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Resumen */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Resumen recomendado</h2>
              <div className="rounded-xl bg-white/10 border border-white/20 p-5 space-y-3 text-sm">
                <p><span className="text-white/50">Tipo:</span> <span className="text-white">{orgLabel}</span></p>
                <p><span className="text-white/50">Modelo:</span> <span className="text-white">{opLabel}</span></p>
                <p><span className="text-white/50">Módulos:</span>{' '}
                  <span className="text-white">
                    {(config.modulesEnabled ?? []).length > 0
                      ? (config.modulesEnabled ?? [])
                          .map((k) => WIZARD_MODULE_OPTIONS.find((o) => o.value === k)?.label ?? k)
                          .join(', ')
                      : 'Producción, Resiliencia'}
                  </span>
                </p>
                <p className="text-white/60 pt-2">
                  Demo personalizado según tu operación. Entrá para explorar.
                </p>
              </div>
              <Button
                size="lg"
                className="w-full bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white"
                onClick={handleComplete}
                disabled={loading}
              >
                {loading ? 'Entrando…' : 'Entrar al demo'}
              </Button>
            </div>
          )}

          {/* Nav */}
          {step > 1 && step < 6 && (
            <div className="flex justify-between mt-8">
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setStep((s) => s - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Atrás
              </Button>
              <Button
                className="bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
