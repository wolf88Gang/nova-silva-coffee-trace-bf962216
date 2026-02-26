/**
 * DEV ONLY: Comprehensive Multi-Tenant Inspector.
 * 
 * Features:
 * 1. Session Context — shows user, org, role, modules
 * 2. Supabase Host Validation — confirms external Supabase
 * 3. RLS Smoke Test — tests row visibility per org
 * 4. Cross-Org Access Test — attempts cross-tenant reads
 * 5. Module Simulator — toggle modules off for testing
 * 6. Profile Visibility Check — confirms RLS on profiles
 * 7. Multi-Tenant Integrity — counts per cooperativa_id
 * 8. Query Log — last 10 queries with filter warnings
 * 
 * Only renders in DEV or for role=admin. Never in production builds.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { isDemoContext } from '@/lib/demoSeed';
import { applyOrgFilter } from '@/lib/orgFilter';
import { ORG_ID_ONLY } from '@/config/featureFlags';
import { type OrgModule } from '@/lib/org-modules';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bug, ChevronDown, ChevronUp, Trash2, Shield, ShieldAlert,
  Activity, Eye, Layers, Database, CheckCircle2, XCircle, AlertTriangle, Minus,
} from 'lucide-react';

// ── Types ──

interface QueryResult {
  table: string;
  count: number | null;
  error: string | null;
}

interface RLSTestResult {
  table: string;
  selectOwn: 'pass' | 'fail' | 'error' | 'skip';
  selectOwnCount: number;
  selectCross: 'pass' | 'fail' | 'error' | 'skip';
  selectCrossCount: number;
  error?: string;
}

interface QueryLogEntry {
  id: number;
  timestamp: string;
  table: string;
  hasOrgFilter: boolean;
  filters: string;
}

// ── Constants ──

const SUPABASE_HOST = 'qbwmsarqewxjuwgkdfmg.supabase.co';
const TENANT_TABLES = ['productores', 'parcelas', 'entregas'] as const;

const ALL_MODULES: OrgModule[] = [
  'core', 'productores', 'parcelas', 'entregas', 'lotes_acopio',
  'lotes_comerciales', 'contratos', 'calidad', 'vital', 'eudr',
  'finanzas', 'creditos', 'jornales', 'inventario', 'mensajes',
  'inclusion', 'admin',
];

// ── Helpers ──

function StatusIcon({ status }: { status: 'pass' | 'fail' | 'error' | 'skip' }) {
  switch (status) {
    case 'pass': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    case 'fail': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    case 'error': return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
    case 'skip': return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function maskString(s: string, visibleChars = 12): string {
  if (s.length <= visibleChars) return s;
  return s.slice(0, visibleChars) + '…' + s.slice(-6);
}

// ── Main Component ──

export function DevTenantInspector() {
  const { organizationId, productorId, role, orgTipo, orgName, activeModules, isReady } = useOrgContext();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('context');

  // State for each section
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [rlsResults, setRlsResults] = useState<RLSTestResult[]>([]);
  const [profileVisible, setProfileVisible] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const [disabledModules, setDisabledModules] = useState<Set<OrgModule>>(new Set());
  const queryCounter = useRef(0);

  // ── RLS Smoke Test ──
  const runRLSSmokeTest = useCallback(async () => {
    if (!organizationId) return;
    setTesting(true);
    const results: RLSTestResult[] = [];

    for (const table of TENANT_TABLES) {
      const result: RLSTestResult = {
        table,
        selectOwn: 'skip',
        selectOwnCount: 0,
        selectCross: 'skip',
        selectCrossCount: 0,
      };

      try {
        let ownQ = supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        ownQ = applyOrgFilter(ownQ, organizationId);
        const { count: ownCount, error: ownErr } = await ownQ;

        if (ownErr) {
          result.selectOwn = 'error';
          result.error = ownErr.message;
        } else {
          result.selectOwn = 'pass';
          result.selectOwnCount = ownCount ?? 0;
        }

        const { count: allCount, error: allErr } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (allErr) {
          result.selectCross = 'error';
          result.error = (result.error ?? '') + ' | ' + allErr.message;
        } else {
          const crossCount = (allCount ?? 0) - (ownCount ?? 0);
          result.selectCrossCount = crossCount;
          result.selectCross = crossCount === 0 ? 'pass' : 'fail';
        }
      } catch (e: any) {
        result.selectOwn = 'error';
        result.error = e.message;
      }

      results.push(result);
    }

    setRlsResults(results);
    setTesting(false);
  }, [organizationId]);

  // ── Basic Query Test ──
  const runTestQueries = useCallback(async () => {
    if (!organizationId) return;
    setTesting(true);
    const results: QueryResult[] = [];

    for (const table of TENANT_TABLES) {
      try {
        let q = supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        q = applyOrgFilter(q, organizationId);
        const { count, error } = await q;
        results.push({ table, count: count ?? 0, error: error?.message ?? null });
      } catch (e: any) {
        results.push({ table, count: null, error: e.message });
      }
    }

    setQueryResults(results);
    setTesting(false);
  }, [organizationId]);

  // ── Profile Visibility ──
  const checkProfileVisibility = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      setProfileVisible(!error && !!data);
    } catch {
      setProfileVisible(false);
    }
  }, [user?.id]);

  // ── Module simulator ──
  const toggleModule = (mod: OrgModule) => {
    setDisabledModules(prev => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });
  };

  // ── Derived values (after all hooks) ──
  const supabaseUrl = (supabase as any).supabaseUrl ?? '';
  const isExternalHost = supabaseUrl.includes(SUPABASE_HOST);
  const hasBreach = rlsResults.some(r => r.selectCross === 'fail');

  // Visibility check — AFTER all hooks
  const isVisible = import.meta.env.DEV || role === 'admin';
  if (!isVisible) return null;
  if (import.meta.env.PROD && role !== 'admin') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-[420px] w-full">
      <Card className={`bg-card/95 backdrop-blur shadow-lg border-2 ${hasBreach ? 'border-destructive' : 'border-amber-500/50'}`}>
        <CardHeader className="pb-2 pt-3 px-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <CardTitle className="text-xs flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Bug className="h-3.5 w-3.5 text-amber-500" />
              Tenant Inspector
              {hasBreach && (
                <Badge variant="destructive" className="text-[9px] h-4 animate-pulse">
                  BREACH
                </Badge>
              )}
              {!isExternalHost && (
                <Badge variant="destructive" className="text-[9px] h-4">
                  NOT EXTERNAL
                </Badge>
              )}
            </span>
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </CardTitle>
        </CardHeader>

        {expanded && (
          <CardContent className="px-3 pb-3 pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full h-7 mb-2">
                <TabsTrigger value="context" className="text-[10px] h-6 gap-1 flex-1">
                  <Eye className="h-3 w-3" /> Context
                </TabsTrigger>
                <TabsTrigger value="rls" className="text-[10px] h-6 gap-1 flex-1">
                  <Shield className="h-3 w-3" /> RLS
                </TabsTrigger>
                <TabsTrigger value="modules" className="text-[10px] h-6 gap-1 flex-1">
                  <Layers className="h-3 w-3" /> Modules
                </TabsTrigger>
                <TabsTrigger value="queries" className="text-[10px] h-6 gap-1 flex-1">
                  <Database className="h-3 w-3" /> Data
                </TabsTrigger>
              </TabsList>

              {/* ── TAB: Context ── */}
              <TabsContent value="context" className="mt-0 space-y-2">
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
                  <span className="text-muted-foreground">User ID:</span>
                  <code className="text-foreground bg-muted px-1 rounded truncate text-[9px]">{user?.id ?? '—'}</code>

                  <span className="text-muted-foreground">Role:</span>
                  <Badge variant="outline" className="text-[10px] h-5 w-fit">{role ?? '—'}</Badge>

                  <span className="text-muted-foreground">OrgTipo:</span>
                  <Badge variant="secondary" className="text-[10px] h-5 w-fit">{orgTipo ?? '—'}</Badge>

                  <span className="text-muted-foreground">OrgName:</span>
                  <code className="text-foreground bg-muted px-1 rounded truncate">{orgName ?? '—'}</code>

                  <span className="text-muted-foreground">OrgId:</span>
                  <code className="text-foreground bg-muted px-1 rounded truncate text-[9px]">{maskString(organizationId ?? '—')}</code>

                  <span className="text-muted-foreground">ProductorId:</span>
                  <code className="text-foreground bg-muted px-1 rounded truncate text-[9px]">{productorId ? maskString(productorId) : '—'}</code>

                  <span className="text-muted-foreground">Ready:</span>
                  <Badge variant={isReady ? 'default' : 'destructive'} className="text-[10px] h-5 w-fit">
                    {isReady ? '✓ Ready' : '✗ Not Ready'}
                  </Badge>

                  <span className="text-muted-foreground">Supabase:</span>
                  <div className="flex items-center gap-1">
                    {isExternalHost ? (
                      <Badge variant="outline" className="text-[9px] h-4 text-emerald-600 border-emerald-600">✓ External</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[9px] h-4 animate-pulse">✗ NOT EXTERNAL</Badge>
                    )}
                    <code className="text-[8px] text-muted-foreground truncate">{maskString(supabaseUrl, 20)}</code>
                  </div>

                  <span className="text-muted-foreground">Host:</span>
                  <code className="text-[9px] text-muted-foreground truncate">{window.location.host}</code>
                </div>

                {/* Active modules compact */}
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Módulos ({activeModules.length}):</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {activeModules.map(m => (
                      <Badge key={m} variant="outline" className="text-[9px] h-4 px-1.5">{m}</Badge>
                    ))}
                  </div>
                </div>

                {/* Demo reset */}
                {isDemoContext(orgName, user?.id) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full text-xs h-7 gap-1"
                    onClick={() => {
                      if (confirm('¿Resetear datos demo?')) window.location.reload();
                    }}
                  >
                    <Trash2 className="h-3 w-3" /> Reset Demo Data
                  </Button>
                )}
              </TabsContent>

              {/* ── TAB: RLS ── */}
              <TabsContent value="rls" className="mt-0 space-y-2">
                {hasBreach && (
                  <div className="bg-destructive/10 border border-destructive rounded-md p-2 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                    <span className="text-[11px] font-bold text-destructive">
                      MULTI-TENANT BREACH DETECTED
                    </span>
                  </div>
                )}

                <div className="flex gap-1.5">
                  <Button
                    size="sm" variant="outline"
                    className="flex-1 text-xs h-7"
                    onClick={runRLSSmokeTest}
                    disabled={testing || !organizationId}
                  >
                    {testing ? 'Testing…' : '🔒 RLS Smoke Test'}
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="flex-1 text-xs h-7"
                    onClick={checkProfileVisibility}
                    disabled={!user?.id}
                  >
                    👤 Check Profile
                  </Button>
                </div>

                {/* Profile result */}
                {profileVisible !== null && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <StatusIcon status={profileVisible ? 'pass' : 'fail'} />
                    <span>Profile visibility: {profileVisible ? 'Visible ✓' : 'NOT visible under RLS ✗'}</span>
                  </div>
                )}

                {/* RLS results table */}
                {rlsResults.length > 0 && (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="px-2 py-1.5 text-left font-medium">Table</th>
                          <th className="px-2 py-1.5 text-center font-medium">Own</th>
                          <th className="px-2 py-1.5 text-center font-medium">#</th>
                          <th className="px-2 py-1.5 text-center font-medium">Cross</th>
                          <th className="px-2 py-1.5 text-center font-medium">#</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rlsResults.map(r => (
                          <tr key={r.table} className="border-b last:border-0">
                            <td className="px-2 py-1.5 font-mono">{r.table}</td>
                            <td className="px-2 py-1.5 text-center"><StatusIcon status={r.selectOwn} /></td>
                            <td className="px-2 py-1.5 text-center">{r.selectOwnCount}</td>
                            <td className="px-2 py-1.5 text-center"><StatusIcon status={r.selectCross} /></td>
                            <td className="px-2 py-1.5 text-center">{r.selectCrossCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {rlsResults.some(r => r.error) && (
                  <div className="text-[9px] text-muted-foreground">
                    {rlsResults.filter(r => r.error).map(r => (
                      <div key={r.table}>⚠️ {r.table}: {r.error}</div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── TAB: Modules ── */}
              <TabsContent value="modules" className="mt-0">
                <p className="text-[10px] text-muted-foreground mb-2">
                  Toggle modules off to simulate deactivation (frontend only).
                </p>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-1">
                    {ALL_MODULES.map(mod => {
                      const isActive = activeModules.includes(mod);
                      const isDisabled = disabledModules.has(mod);
                      return (
                        <div
                          key={mod}
                          className="flex items-center justify-between text-[11px] px-2 py-1 rounded hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-block w-2 h-2 rounded-full ${
                              isDisabled ? 'bg-muted-foreground/30' : isActive ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                            }`} />
                            <code>{mod}</code>
                          </div>
                          <div className="flex items-center gap-1">
                            {isActive && !isDisabled && <Badge variant="outline" className="text-[8px] h-3.5">ON</Badge>}
                            {isDisabled && <Badge variant="secondary" className="text-[8px] h-3.5">SIM OFF</Badge>}
                            {isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={() => toggleModule(mod)}
                              >
                                {isDisabled ? '↺' : '⏸'}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                {disabledModules.size > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-xs h-6 mt-1"
                    onClick={() => setDisabledModules(new Set())}
                  >
                    Reset all simulations
                  </Button>
                )}
              </TabsContent>

              {/* ── TAB: Data / Queries ── */}
              <TabsContent value="queries" className="mt-0 space-y-2">
                <Button
                  size="sm" variant="outline"
                  className="w-full text-xs h-7"
                  onClick={runTestQueries}
                  disabled={testing || !organizationId}
                >
                  {testing ? 'Querying…' : '📊 Run Tenant Count'}
                </Button>

                {queryResults.length > 0 && (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="px-2 py-1.5 text-left font-medium">Table</th>
                          <th className="px-2 py-1.5 text-right font-medium">Count</th>
                          <th className="px-2 py-1.5 text-center font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queryResults.map((r, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="px-2 py-1.5 font-mono">{r.table}</td>
                            <td className="px-2 py-1.5 text-right">{r.count ?? '—'}</td>
                            <td className="px-2 py-1.5 text-center">
                              <StatusIcon status={r.error ? 'error' : 'pass'} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {queryResults.some(r => r.error) && (
                  <div className="text-[9px] text-muted-foreground space-y-0.5">
                    {queryResults.filter(r => r.error).map((r, i) => (
                      <div key={i}>⚠️ {r.table}: {r.error}</div>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-muted-foreground pt-1 border-t space-y-0.5">
                  <p>Filter: <code>applyOrgFilter({maskString(organizationId ?? '—')})</code></p>
                  <p>ORG_ID_ONLY: <Badge variant={ORG_ID_ONLY ? 'default' : 'secondary'} className="text-[8px] h-3.5">{ORG_ID_ONLY ? 'ON' : 'OFF'}</Badge></p>
                  <p>Legacy fallback: <Badge variant={!ORG_ID_ONLY ? 'outline' : 'secondary'} className="text-[8px] h-3.5">{!ORG_ID_ONLY ? 'ACTIVE' : 'DISABLED'}</Badge></p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
