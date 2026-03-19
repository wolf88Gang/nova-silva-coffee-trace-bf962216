/**
 * Pantalla de resumen comercial + wizard corto de creación de cuenta.
 * Reutiliza demoConfig del wizard.
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDemoSetup } from '@/contexts/DemoSetupContext';
import { useDemoContext } from '@/contexts/DemoContext';
import { supabase } from '@/integrations/supabase/client';
import {
  WIZARD_ORG_OPTIONS,
  WIZARD_OP_MODEL_OPTIONS,
  WIZARD_MODULE_OPTIONS,
  type DemoSetupConfig,
} from '@/config/demoSetupConfig';
import { estimatePrice, type PriceEstimate } from '@/config/demoPricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import logoNovasilva from '@/assets/logo-novasilva.png';
import bgTerraces from '@/assets/bg-terraces.jpg';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function DemoCreateAccount() {
  const { config, hasConfig, clearConfig } = useDemoSetup();
  const { clearDemoSession } = useDemoContext();
  const [price, setPrice] = useState<PriceEstimate | null>(null);
  const [step, setStep] = useState<'summary' | 'form'>('summary');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    orgName: '',
    userName: '',
    email: '',
    password: '',
    country: '',
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (config) setPrice(estimatePrice(config, 'monthly'));
  }, [config]);

  if (!hasConfig || !config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="text-muted-foreground mb-4">No hay configuración de demo. Configurá primero.</p>
        <Link to="/demo/setup">
          <Button>Ir al wizard</Button>
        </Link>
      </div>
    );
  }

  const orgLabel = WIZARD_ORG_OPTIONS.find((o) => o.value === config.orgType)?.label ?? config.orgType;
  const opLabel = WIZARD_OP_MODEL_OPTIONS.find((o) => o.value === config.operatingModel)?.label ?? config.operatingModel;
  const moduleLabels = (config.modulesEnabled ?? [])
    .map((k) => WIZARD_MODULE_OPTIONS.find((o) => o.value === k)?.label ?? k);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('convert-demo-to-org', {
        body: {
          email: form.email,
          password: form.password,
          name: form.userName,
          orgName: form.orgName,
          country: form.country || null,
          demoConfig: config,
        },
      });
      if (error) throw new Error(typeof error === 'string' ? error : (error as Error)?.message ?? 'Error');
      if (data?.error) throw new Error(data.error);
      clearConfig();
      clearDemoSession();
      toast({ title: 'Cuenta creada', description: 'Iniciando sesión…' });
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (signInErr) {
        navigate('/login');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Demo convert:', err);
      toast({
        title: 'Error al crear cuenta',
        description: (err as Error)?.message ?? 'Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
        <Link to="/dashboard" className="text-white/60 hover:text-white text-sm flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Volver al demo
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-xl">
          {step === 'summary' ? (
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle>Tu configuración Nova Silva</CardTitle>
                <CardDescription className="text-white/60">
                  Resumen basado en el demo que configuraste
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-white/50 text-sm">Tipo de organización</p>
                  <p className="font-medium">{orgLabel}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Modelo operativo</p>
                  <p className="font-medium">{opLabel}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Módulos incluidos</p>
                  <ul className="list-disc list-inside mt-1">
                    {moduleLabels.length > 0
                      ? moduleLabels.map((l) => <li key={l}>{l}</li>)
                      : ['Producción', 'Resiliencia']}
                  </ul>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Plan recomendado</p>
                  <p className="font-medium">{price?.basePlan ?? '—'}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Precio estimado</p>
                  <p className="text-xl font-bold text-[hsl(var(--accent-orange))]">
                    ${price?.total?.toLocaleString() ?? '—'} / mes
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full mt-4 bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white"
                  onClick={() => setStep('form')}
                >
                  Crear cuenta y comenzar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle>Crear cuenta</CardTitle>
                <CardDescription className="text-white/60">
                  Solo completá estos datos. Tu configuración ya está lista.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label className="text-white/80">Nombre de la organización</Label>
                    <Input
                      value={form.orgName}
                      onChange={(e) => setForm((f) => ({ ...f, orgName: e.target.value }))}
                      placeholder="Mi Cooperativa"
                      className="mt-1 bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-white/80">Tu nombre</Label>
                    <Input
                      value={form.userName}
                      onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
                      placeholder="Juan Pérez"
                      className="mt-1 bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-white/80">Correo electrónico</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="correo@ejemplo.com"
                      className="mt-1 bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-white/80">Contraseña</Label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      className="mt-1 bg-white/10 border-white/20 text-white"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <Label className="text-white/80">País</Label>
                    <Input
                      value={form.country}
                      onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                      placeholder="Costa Rica"
                      className="mt-1 bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-white/80 hover:text-white hover:bg-white/10"
                      onClick={() => setStep('summary')}
                    >
                      Atrás
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-[hsl(var(--accent-orange))] hover:bg-[hsl(var(--accent-orange))]/90 text-white"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Crear cuenta
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
