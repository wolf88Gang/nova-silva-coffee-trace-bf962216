import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Building2, CheckCircle } from 'lucide-react';
import { getOrgTypeLabel } from '@/lib/org-terminology';
import type { OrgModule } from '@/lib/org-modules';
import type { OnboardingOrgType } from './StepOrgType';

interface StepConfirmationProps {
  orgType: OnboardingOrgType;
  selectedModules: OrgModule[];
  onBack: () => void;
  onSubmit: (data: { name: string; country: string; size: string; plan: string }) => Promise<void>;
  isSubmitting: boolean;
}

const COUNTRIES = [
  'Guatemala', 'Colombia', 'Honduras', 'Costa Rica', 'México',
  'Perú', 'Brasil', 'Nicaragua', 'El Salvador', 'Ecuador', 'Otro',
];

const PLANS = [
  { value: 'lite', label: 'Lite', desc: 'Para operaciones pequeñas' },
  { value: 'smart', label: 'Smart', desc: 'Para organizaciones en crecimiento' },
  { value: 'plus', label: 'Plus', desc: 'Para operaciones grandes y exportación' },
];

const MODULE_LABELS: Partial<Record<OrgModule, string>> = {
  productores: 'Actores', parcelas: 'Parcelas', entregas: 'Entregas',
  lotes_acopio: 'Lotes Acopio', lotes_comerciales: 'Lotes Comerciales',
  contratos: 'Contratos', calidad: 'Calidad', vital: 'VITAL',
  eudr: 'EUDR', finanzas: 'Finanzas', creditos: 'Créditos',
  jornales: 'Jornales', inventario: 'Inventario', mensajes: 'Mensajes',
  inclusion: 'Inclusión',
};

export function StepConfirmation({ orgType, selectedModules, onBack, onSubmit, isSubmitting }: StepConfirmationProps) {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [size, setSize] = useState('');
  const [plan, setPlan] = useState('smart');

  const typeLabel = getOrgTypeLabel(orgType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, country, size, plan });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Confirma tu organización</h2>
        <p className="text-muted-foreground">Revisa la configuración y completa los datos para crear tu organización.</p>
      </div>

      {/* Summary */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Tipo de organización</p>
              <Badge variant="outline">{typeLabel}</Badge>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Módulos seleccionados ({selectedModules.length}):</p>
            <div className="flex flex-wrap gap-1">
              {selectedModules.map(m => (
                <Badge key={m} variant="secondary" className="text-[10px]">
                  {MODULE_LABELS[m] || m}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">Nombre de la organización *</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Organización Los Andes"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>País *</Label>
            <Select value={country} onValueChange={setCountry} required>
              <SelectTrigger><SelectValue placeholder="Seleccionar país" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Tamaño aproximado</Label>
            <Input
              id="size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="Ej: 250 productores, 500 ha"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Plan sugerido</Label>
          <div className="grid grid-cols-3 gap-3">
            {PLANS.map(p => (
              <Card
                key={p.value}
                className={`cursor-pointer transition-all ${plan === p.value ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
                onClick={() => setPlan(p.value)}
              >
                <CardContent className="py-3 px-3 text-center">
                  <p className="font-semibold text-sm text-foreground">{p.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting || !name || !country}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creando…</>
            ) : (
              <><CheckCircle className="h-4 w-4 mr-1" /> Crear organización</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
