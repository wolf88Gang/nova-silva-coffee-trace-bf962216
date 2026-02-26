/**
 * DEV ONLY: Tenant context inspector.
 * Shows organizationId, productorId, role, orgTipo, activeModules and runs test queries.
 * Only renders in development mode.
 */
import { useState } from 'react';
import { useOrgContext } from '@/hooks/useOrgContext';
import { supabase } from '@/integrations/supabase/client';
import { isDemoContext } from '@/lib/demoSeed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bug, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface QueryResult {
  table: string;
  count: number | null;
  error: string | null;
}

export function DevTenantInspector() {
  const { organizationId, productorId, role, orgTipo, orgName, activeModules, isReady } = useOrgContext();
  const [expanded, setExpanded] = useState(false);
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [testing, setTesting] = useState(false);

  if (import.meta.env.PROD) return null;

  const runTestQueries = async () => {
    if (!organizationId) return;
    setTesting(true);
    const results: QueryResult[] = [];

    try {
      const { count, error } = await supabase
        .from('productores')
        .select('*', { count: 'exact', head: true })
        .eq('cooperativa_id', organizationId);
      results.push({ table: 'productores', count: count ?? 0, error: error?.message ?? null });
    } catch (e: any) {
      results.push({ table: 'productores', count: null, error: e.message });
    }

    try {
      const { count, error } = await supabase
        .from('entregas')
        .select('*', { count: 'exact', head: true })
        .eq('cooperativa_id', organizationId);
      results.push({ table: 'entregas', count: count ?? 0, error: error?.message ?? null });
    } catch (e: any) {
      results.push({ table: 'entregas', count: null, error: e.message });
    }

    setQueryResults(results);
    setTesting(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm">
      <Card className="bg-card/95 backdrop-blur border-2 border-warning/50 shadow-lg">
        <CardHeader className="pb-2 pt-3 px-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <CardTitle className="text-xs flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Bug className="h-3.5 w-3.5 text-warning" />
              Tenant Inspector
            </span>
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </CardTitle>
        </CardHeader>
        {expanded && (
          <CardContent className="px-4 pb-3 pt-0 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-1.5">
              <span className="text-muted-foreground">Ready:</span>
              <Badge variant={isReady ? 'default' : 'destructive'} className="text-[10px] h-5 justify-center">
                {isReady ? 'Yes' : 'No'}
              </Badge>

              <span className="text-muted-foreground">Role:</span>
              <code className="text-foreground bg-muted px-1 rounded truncate">{role ?? '—'}</code>

              <span className="text-muted-foreground">OrgTipo:</span>
              <code className="text-foreground bg-muted px-1 rounded truncate">{orgTipo ?? '—'}</code>

              <span className="text-muted-foreground">OrgName:</span>
              <code className="text-foreground bg-muted px-1 rounded truncate">{orgName ?? '—'}</code>

              <span className="text-muted-foreground">OrgId:</span>
              <code className="text-foreground bg-muted px-1 rounded truncate text-[9px]">{organizationId ?? '—'}</code>

              <span className="text-muted-foreground">ProductorId:</span>
              <code className="text-foreground bg-muted px-1 rounded truncate text-[9px]">{productorId ?? '—'}</code>
            </div>

            {/* Active modules */}
            <div className="pt-1">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Módulos activos:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {activeModules.map(m => (
                  <Badge key={m} variant="outline" className="text-[9px] h-4 px-1.5">{m}</Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-1.5 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs h-7"
                onClick={runTestQueries}
                disabled={testing || !organizationId}
              >
                {testing ? 'Testing…' : 'Run Test Queries'}
              </Button>

              {isDemoContext(orgName, organizationId) && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs h-7 gap-1"
                  onClick={() => {
                    if (confirm('¿Resetear datos demo? (Solo borra datos en memoria, no afecta BD)')) {
                      window.location.reload();
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" /> Reset
                </Button>
              )}
            </div>

            {queryResults.length > 0 && (
              <div className="space-y-1 mt-1">
                {queryResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground truncate">{r.table}</span>
                    {r.error
                      ? <Badge variant="destructive" className="text-[9px] h-4">err</Badge>
                      : <Badge variant="outline" className="text-[9px] h-4">{r.count} rows</Badge>
                    }
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
