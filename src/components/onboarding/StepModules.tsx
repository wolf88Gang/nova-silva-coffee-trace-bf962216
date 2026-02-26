import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { type OrgModule, getOrgDefaultModules } from '@/lib/org-modules';
import type { OnboardingOrgType } from './StepOrgType';

const MODULE_INFO: Record<string, { label: string; description: string }> = {
  productores: { label: 'Gestión de Actores', description: 'Administra socios, proveedores o productores asociados' },
  parcelas: { label: 'Parcelas y Mapas', description: 'Geolocalización, áreas y manejo de parcelas' },
  entregas: { label: 'Entregas de Campo', description: 'Recepción de café en centro de acopio' },
  lotes_acopio: { label: 'Lotes de Acopio', description: 'Consolidación y procesamiento de lotes' },
  lotes_comerciales: { label: 'Lotes Comerciales', description: 'Preparación de lotes para exportación' },
  contratos: { label: 'Contratos', description: 'Gestión de contratos con compradores' },
  calidad: { label: 'Calidad / Nova Cup', description: 'Cataciones, puntajes SCA, evaluaciones de taza' },
  vital: { label: 'Protocolo VITAL', description: 'Diagnóstico integral de sostenibilidad' },
  eudr: { label: 'Cumplimiento EUDR', description: 'Paquetes de debida diligencia y trazabilidad' },
  finanzas: { label: 'Finanzas', description: 'Transacciones financieras y reportes' },
  creditos: { label: 'Créditos', description: 'Préstamos y adelantos a productores' },
  jornales: { label: 'Jornales', description: 'Gestión de mano de obra y campañas' },
  inventario: { label: 'Inventario', description: 'Equipos, insumos y suministros' },
  mensajes: { label: 'Mensajes', description: 'Comunicación interna entre usuarios' },
  inclusion: { label: 'Inclusión y Equidad', description: 'Indicadores de género, juventud y equidad' },
};

// Modules that can be toggled (exclude 'core' which is always on)
const TOGGLEABLE: OrgModule[] = [
  'productores', 'parcelas', 'entregas', 'lotes_acopio', 'lotes_comerciales',
  'contratos', 'calidad', 'vital', 'eudr', 'finanzas', 'creditos',
  'jornales', 'inventario', 'mensajes', 'inclusion',
];

interface StepModulesProps {
  orgType: OnboardingOrgType;
  selectedModules: OrgModule[];
  onModulesChange: (modules: OrgModule[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepModules({ orgType, selectedModules, onModulesChange, onNext, onBack }: StepModulesProps) {
  const defaults = getOrgDefaultModules(orgType).filter((m): m is OrgModule => m !== 'core');

  const toggle = (mod: OrgModule) => {
    if (selectedModules.includes(mod)) {
      onModulesChange(selectedModules.filter(m => m !== mod));
    } else {
      onModulesChange([...selectedModules, mod]);
    }
  };

  const isDefault = (mod: OrgModule) => defaults.includes(mod);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Configura tus módulos</h2>
        <p className="text-muted-foreground">
          Hemos pre-seleccionado los módulos recomendados para tu tipo de organización.
          Puedes activar o desactivar según tu operación.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TOGGLEABLE.map((mod) => {
          const info = MODULE_INFO[mod];
          if (!info) return null;
          const checked = selectedModules.includes(mod);
          const recommended = isDefault(mod);

          return (
            <Card
              key={mod}
              className={cn(
                'cursor-pointer transition-all',
                checked ? 'border-primary/50 bg-primary/5' : 'hover:border-border'
              )}
              onClick={() => toggle(mod)}
            >
              <CardContent className="py-3 px-4 flex items-start gap-3">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(mod)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{info.label}</span>
                    {recommended && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
        </Button>
        <Button onClick={onNext} disabled={selectedModules.length === 0} size="lg">
          Siguiente <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
