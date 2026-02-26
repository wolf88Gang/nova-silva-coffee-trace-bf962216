import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getOrgDefaultModules, type OrgModule } from '@/lib/org-modules';
import { StepOrgType, type OnboardingOrgType } from '@/components/onboarding/StepOrgType';
import { StepModules } from '@/components/onboarding/StepModules';
import { StepConfirmation } from '@/components/onboarding/StepConfirmation';
import { Leaf } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type Step = 1 | 2 | 3;

const ROLE_MAP: Record<OnboardingOrgType, string> = {
  cooperativa: 'cooperativa',
  exportador: 'exportador',
  productor_empresarial: 'productor',
  beneficio_privado: 'cooperativa',
};

export default function OnboardingOrganization() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [orgType, setOrgType] = useState<OnboardingOrgType | null>(null);
  const [selectedModules, setSelectedModules] = useState<OrgModule[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOrgTypeSelect = (type: OnboardingOrgType) => {
    setOrgType(type);
    // Pre-select default modules for the chosen type
    const defaults = getOrgDefaultModules(type).filter(m => m !== 'core');
    setSelectedModules(defaults);
  };

  const handleSubmit = useCallback(async (data: { name: string; country: string; size: string; plan: string }) => {
    if (!orgType || !user || !session) return;
    setIsSubmitting(true);

    try {
      // 1. Insert into organizaciones table
      const { data: orgData, error: orgError } = await supabase
        .from('organizaciones')
        .insert({
          nombre: data.name,
          tipo_organizacion: orgType,
          pais: data.country,
          plan_actual: data.plan,
          estado_cliente: 'active',
        })
        .select('id')
        .single();

      if (orgError) throw orgError;

      const orgId = orgData.id;

      // 2. Update user's profile with organization_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: orgId, organization_name: data.name })
        .eq('user_id', user.id);

      if (profileError) {
        console.warn('Could not update profile:', profileError.message);
      }

      // 3. Assign role if not already set
      const role = ROLE_MAP[orgType];
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: user.id, role }, { onConflict: 'user_id' });

      if (roleError) {
        console.warn('Could not set role:', roleError.message);
      }

      toast({ title: 'Organización creada', description: `${data.name} ha sido configurada exitosamente.` });

      // Redirect to dashboard — force page reload to re-fetch auth context
      window.location.href = '/app';
    } catch (err: any) {
      console.error('Onboarding error:', err);
      toast({
        title: 'Error al crear organización',
        description: err.message || 'No se pudo completar el registro. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [orgType, user, session, toast]);

  const progressValue = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Leaf className="h-5 w-5 text-primary" />
        </div>
        <span className="font-bold text-lg text-foreground">Nova Silva</span>
        <span className="text-sm text-muted-foreground ml-auto">
          Paso {step} de 3
        </span>
      </header>

      {/* Progress */}
      <div className="px-6 pt-4">
        <Progress value={progressValue} className="h-1.5" />
      </div>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {step === 1 && (
          <StepOrgType
            selected={orgType}
            onSelect={handleOrgTypeSelect}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && orgType && (
          <StepModules
            orgType={orgType}
            selectedModules={selectedModules}
            onModulesChange={setSelectedModules}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && orgType && (
          <StepConfirmation
            orgType={orgType}
            selectedModules={selectedModules}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </main>
    </div>
  );
}
