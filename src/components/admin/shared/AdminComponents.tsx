/**
 * Reusable admin panel components.
 * StatusBadge, MetricCard, AlertList, HealthIndicator, UsageProgressCard,
 * EmptyState, QuickActionButton, PendingIntegration
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, CheckCircle2, XCircle, Clock, TrendingUp,
  TrendingDown, Search, Info, ArrowRight, Construction,
} from 'lucide-react';
import type { AlertLevel, MockAlert } from '@/lib/adminMockData';

// ── StatusBadge ──

export function StatusBadge({ status, label }: { status: 'ok' | 'warning' | 'error' | 'info' | 'neutral'; label: string }) {
  const config = {
    ok: { variant: 'default' as const, className: 'bg-success/15 text-success border-success/30 hover:bg-success/20' },
    warning: { variant: 'secondary' as const, className: 'bg-warning/15 text-warning border-warning/30 hover:bg-warning/20' },
    error: { variant: 'destructive' as const, className: 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20' },
    info: { variant: 'outline' as const, className: 'bg-primary/10 text-primary border-primary/30' },
    neutral: { variant: 'outline' as const, className: '' },
  }[status];
  return <Badge variant={config.variant} className={cn('font-medium', config.className)}>{label}</Badge>;
}

// ── MetricCard ──

export function MetricCard({ label, value, icon: Icon, sublabel, trend, loading, className, source, error }: {
  label: string; value: string | number; icon: React.ElementType; sublabel?: string;
  trend?: 'up' | 'down' | 'neutral'; loading?: boolean; className?: string;
  source?: 'real' | 'mock' | 'partial'; error?: boolean;
}) {
  const isEmpty = !loading && !error && (value === '' || value === 0 || value === '0' || value === null || value === undefined);
  return (
    <Card className={cn(className, error && 'border-destructive/30')}>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-success" />}
          {trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
        </div>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : error ? (
          <p className="text-sm text-destructive">Error</p>
        ) : isEmpty ? (
          <p className="text-sm text-muted-foreground">Sin datos</p>
        ) : (
          <p className="text-2xl font-bold text-foreground">{value}</p>
        )}
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
        {source === 'mock' && <p className="text-[10px] text-muted-foreground/60 mt-1 italic">Pendiente de integración</p>}
      </CardContent>
    </Card>
  );
}

// ── HealthIndicator ──

export function HealthIndicator({ status, label }: { status: 'ok' | 'error' | 'checking'; label?: string }) {
  if (status === 'ok') return <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" />{label && <span className="text-xs text-success">{label}</span>}</div>;
  if (status === 'error') return <div className="flex items-center gap-1.5"><XCircle className="h-4 w-4 text-destructive" />{label && <span className="text-xs text-destructive">{label}</span>}</div>;
  return <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-muted-foreground animate-spin" />{label && <span className="text-xs text-muted-foreground">{label}</span>}</div>;
}

// ── AlertList ──

export function AlertList({ alerts, maxItems }: { alerts: MockAlert[]; maxItems?: number }) {
  const items = maxItems ? alerts.slice(0, maxItems) : alerts;
  const colorMap: Record<AlertLevel, string> = {
    critical: 'border-l-destructive bg-destructive/5',
    warning: 'border-l-warning bg-warning/5',
    info: 'border-l-primary bg-primary/5',
  };
  const iconColorMap: Record<AlertLevel, string> = {
    critical: 'text-destructive',
    warning: 'text-warning',
    info: 'text-primary',
  };
  return (
    <div className="space-y-2">
      {items.map(a => (
        <div key={a.id} className={cn('flex items-center gap-3 p-3 rounded-lg border-l-4', colorMap[a.level])}>
          <AlertTriangle className={cn('h-4 w-4 shrink-0', iconColorMap[a.level])} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">{a.message}</p>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
          {a.actionLabel && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 shrink-0">{a.actionLabel} <ArrowRight className="h-3 w-3" /></Button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── UsageProgressCard ──

export function UsageProgressBar({ label, value, limit, icon: Icon }: {
  label: string; value: number; limit: number; icon: React.ElementType;
}) {
  const pct = Math.min((value / limit) * 100, 100);
  const over = value > limit;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-muted-foreground" /> {label}</span>
        <span className={cn(over ? 'text-destructive font-semibold' : 'text-foreground')}>
          {value.toLocaleString()} / {limit.toLocaleString()}{over ? ' (exceso)' : ''}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', over ? 'bg-destructive' : pct > 80 ? 'bg-warning' : 'bg-primary')}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ── SearchInput ──

export function SearchInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input placeholder={placeholder ?? 'Buscar...'} value={value} onChange={e => onChange(e.target.value)} className="pl-9 h-9" />
    </div>
  );
}

// ── EmptyState ──

export function EmptyState({ title, description, icon: Icon }: {
  title: string; description: string; icon?: React.ElementType;
}) {
  const DisplayIcon = Icon || Info;
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <DisplayIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>
    </div>
  );
}

// ── PendingIntegration ──

export function PendingIntegration({ feature, compact }: { feature: string; compact?: boolean }) {
  if (compact) {
    return (
      <Badge variant="outline" className="gap-1 text-xs font-normal border-dashed border-warning/40 text-warning bg-warning/5">
        <Construction className="h-3 w-3" /> Pendiente de integración
      </Badge>
    );
  }
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-warning/30 bg-warning/5">
      <Construction className="h-5 w-5 text-warning shrink-0" />
      <div>
        <p className="text-sm font-medium text-foreground">{feature}</p>
        <p className="text-xs text-muted-foreground">Pendiente de integración con backend. Datos no verificables.</p>
      </div>
    </div>
  );
}

// ── DataSourceBadge ── Shows whether data is real or mock/pending

export function DataSourceBadge({ source, label }: { source: 'real' | 'mock' | 'partial'; label?: string }) {
  if (source === 'real') {
    return (
      <Badge variant="outline" className="gap-1 text-xs font-normal border-success/40 text-success bg-success/5">
        <CheckCircle2 className="h-3 w-3" /> {label ?? 'Datos reales'}
      </Badge>
    );
  }
  if (source === 'partial') {
    return (
      <Badge variant="outline" className="gap-1 text-xs font-normal border-warning/40 text-warning bg-warning/5">
        <AlertTriangle className="h-3 w-3" /> {label ?? 'Datos limitados'}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-xs font-normal border-dashed border-muted-foreground/40 text-muted-foreground">
      <Construction className="h-3 w-3" /> {label ?? 'Pendiente de integración'}
    </Badge>
  );
}

// ── ErrorState ──

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <XCircle className="h-10 w-10 text-destructive/50 mb-3" />
      <p className="text-sm font-medium text-foreground">Error al cargar datos</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">{message ?? 'Verificar conexión o permisos.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-xs text-primary hover:underline">Reintentar</button>
      )}
    </div>
  );
}

// ── LimitedDataNotice ──

export function LimitedDataNotice({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-dashed border-warning/30 bg-warning/5">
      <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
      <p className="text-xs text-muted-foreground">{message ?? 'Datos limitados o pendiente de integración'}</p>
    </div>
  );
}

// ── SectionHeader ──

export function SectionHeader({ title, subtitle, actions }: {
  title: string; subtitle?: string; actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
