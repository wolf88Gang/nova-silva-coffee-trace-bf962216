import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Users, Leaf, Package, Ship, ArrowRight } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type OnboardingOrgType = 'cooperativa' | 'beneficio_privado' | 'productor_empresarial' | 'exportador';

interface OrgTypeOption {
  value: OnboardingOrgType;
  label: string;
  icon: LucideIcon;
  description: string;
  features: string[];
}

const ORG_TYPES: OrgTypeOption[] = [
  {
    value: 'cooperativa',
    label: 'Cooperativa',
    icon: Users,
    description: 'Organización que gestiona múltiples socios productores y procesa café.',
    features: ['Gestiona múltiples socios', 'Recibe entregas de campo', 'Ofrece créditos a productores', 'Ejecuta Protocolo VITAL organizacional'],
  },
  {
    value: 'beneficio_privado',
    label: 'Beneficio Privado / Aggregator',
    icon: Package,
    description: 'Empresa privada que compra, procesa y comercializa café de proveedores.',
    features: ['Compra y procesa café', 'Gestiona proveedores', 'Controla calidad y beneficio', 'Similar a cooperativa pero privado'],
  },
  {
    value: 'productor_empresarial',
    label: 'Productor Empresarial',
    icon: Leaf,
    description: 'Finca o empresa que gestiona sus propias operaciones agrícolas.',
    features: ['Gestiona tus propias fincas', 'Exportas o vendes directo', 'Necesitas EUDR y score VITAL', 'No dependes de cooperativa'],
  },
  {
    value: 'exportador',
    label: 'Exportador / Trader',
    icon: Ship,
    description: 'Empresa exportadora que compra a cooperativas o productores directos.',
    features: ['Compra a cooperativas o productores', 'Genera contratos comerciales', 'Crea lotes comerciales de exportación', 'Necesita Dossier EUDR'],
  },
];

interface StepOrgTypeProps {
  selected: OnboardingOrgType | null;
  onSelect: (type: OnboardingOrgType) => void;
  onNext: () => void;
}

export function StepOrgType({ selected, onSelect, onNext }: StepOrgTypeProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">¿Qué tipo de organización eres?</h2>
        <p className="text-muted-foreground">Selecciona el tipo que mejor describa tu operación. Esto configurará los módulos y la experiencia de Nova Silva.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ORG_TYPES.map((opt) => (
          <Card
            key={opt.value}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              selected === opt.value
                ? 'ring-2 ring-primary border-primary shadow-md'
                : 'hover:border-primary/50'
            )}
            onClick={() => onSelect(opt.value)}
          >
            <CardContent className="pt-5 pb-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center',
                  selected === opt.value ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                )}>
                  <opt.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{opt.label}</h3>
                  {selected === opt.value && <Badge variant="default" className="text-[10px] mt-0.5">Seleccionado</Badge>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{opt.description}</p>
              <ul className="space-y-1">
                {opt.features.map((f, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!selected} size="lg">
          Siguiente <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
