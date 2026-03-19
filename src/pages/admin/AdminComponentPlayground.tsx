/**
 * Admin Component Playground - probar componentes con demo/empty/error data.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DemoFallbackBadge } from '@/components/domain/DemoFallbackBadge';
import { EudrSignalBadge } from '@/components/domain/EudrSignalBadge';
import { resolveArchetypeDataset } from '@/demo/demoOverviewRegistry';

const COMPONENTS = [
  { id: 'DemoFallbackBadge', label: 'DemoFallbackBadge', module: 'Común' },
  { id: 'EudrSignalBadge', label: 'EudrSignalBadge', module: 'Cumplimiento' },
  { id: 'CardOverview', label: 'Card Overview (demo)', module: 'Producción' },
];

type DataMode = 'demo' | 'empty' | 'error';

export default function AdminComponentPlayground() {
  const [selected, setSelected] = useState<string | null>(null);
  const [dataMode, setDataMode] = useState<DataMode>('demo');

  const archetypeData = resolveArchetypeDataset({ orgType: 'cooperativa' } as any);

  return (
    <div className="space-y-6">
      <MainHeader
        title="Component Playground"
        subtitle="Probar componentes con distintos estados de datos"
      />

      <div className="flex gap-2">
        <Link to="/admin/modules" className="text-sm text-primary hover:underline">
          ← Module Explorer
        </Link>
        <Link to="/admin" className="text-sm text-primary hover:underline">
          Panel admin
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Componentes disponibles</h3>
          <p className="text-sm text-muted-foreground">
            Seleccioná un componente y el modo de datos para probar
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {COMPONENTS.map((c) => (
              <Button
                key={c.id}
                variant={selected === c.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelected(c.id)}
              >
                {c.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground">Modo datos:</span>
            {(['demo', 'empty', 'error'] as DataMode[]).map((m) => (
              <Button
                key={m}
                variant={dataMode === m ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDataMode(m)}
              >
                {m === 'demo' ? 'Demo' : m === 'empty' ? 'Vacío' : 'Error'}
              </Button>
            ))}
          </div>

          {selected && (
            <div className="mt-6 p-4 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium mb-2">Preview: {COMPONENTS.find((c) => c.id === selected)?.label}</p>
              {selected === 'DemoFallbackBadge' && (
                <DemoFallbackBadge show={dataMode === 'demo'} />
              )}
              {selected === 'EudrSignalBadge' && (
                <div className="flex gap-2">
                  <EudrSignalBadge status="compliant" />
                  <EudrSignalBadge status="pending" />
                  <EudrSignalBadge status="non_compliant" />
                </div>
              )}
              {selected === 'CardOverview' && (
                <div className="grid grid-cols-2 gap-2">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-2xl font-semibold">
                        {dataMode === 'demo' ? (archetypeData.produccion as { productores?: number }).productores ?? 12 : '—'}
                      </p>
                      <p className="text-sm text-muted-foreground">Productores</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-2xl font-semibold">
                        {dataMode === 'demo' ? (archetypeData.produccion as { parcelas?: number }).parcelas ?? 45 : '—'}
                      </p>
                      <p className="text-sm text-muted-foreground">Parcelas</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Listado de componentes por módulo</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Componente</th>
                  <th className="text-left p-2">Módulo</th>
                </tr>
              </thead>
              <tbody>
                {COMPONENTS.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="p-2 font-mono">{c.label}</td>
                    <td className="p-2">{c.module}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
