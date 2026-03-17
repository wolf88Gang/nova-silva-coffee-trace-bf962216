/**
 * Admin Compliance Hub — Data integrity & EUDR monitoring
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, AlertTriangle, FileText, Lock, Eye } from 'lucide-react';

const MOCK_INTEGRITY = {
  validHashes: 98.5,
  completeEvidence: 94.2,
  inconsistencyRate: 0.8,
};

const MOCK_EUDR = {
  compliant: 82,
  atRisk: 5,
  pending: 13,
};

const MOCK_AUDIT_LOG = [
  { id: 1, event: 'Hash verificado: lote LT-2026-087', time: 'Hace 1h', status: 'ok' },
  { id: 2, event: 'Alerta: gap en trazabilidad parcela P-442', time: 'Hace 3h', status: 'warning' },
  { id: 3, event: 'Nuevo dossier EUDR generado: Org Cooperativa Demo', time: 'Hace 6h', status: 'ok' },
  { id: 4, event: 'Registro alterado detectado: nutricion_aplicaciones #892', time: 'Hace 1d', status: 'critical' },
];

export default function AdminCompliance() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cumplimiento & Integridad</h1>
        <p className="text-sm text-muted-foreground mt-1">Donde Nova Silva se vuelve garante de verdad</p>
      </div>

      {/* Integrity KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4 text-center">
            <Lock className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-foreground">{MOCK_INTEGRITY.validHashes}%</p>
            <p className="text-xs text-muted-foreground mt-1">Registros con hash válido</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4 text-center">
            <FileText className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold text-foreground">{MOCK_INTEGRITY.completeEvidence}%</p>
            <p className="text-xs text-muted-foreground mt-1">Evidencia completa</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4 text-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-foreground">{MOCK_INTEGRITY.inconsistencyRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">Tasa de inconsistencias</p>
          </CardContent>
        </Card>
      </div>

      {/* EUDR Status */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Estado EUDR global</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-2xl font-bold text-emerald-500">{MOCK_EUDR.compliant}%</p>
              <p className="text-xs text-muted-foreground mt-1">Lotes conformes</p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-2xl font-bold text-red-500">{MOCK_EUDR.atRisk}%</p>
              <p className="text-xs text-muted-foreground mt-1">En riesgo</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
              <p className="text-2xl font-bold text-yellow-500">{MOCK_EUDR.pending}%</p>
              <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit log */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4" /> Auditoría automática</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {MOCK_AUDIT_LOG.map(e => (
            <div key={e.id} className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${
              e.status === 'ok' ? 'border-l-emerald-500 bg-emerald-500/5' :
              e.status === 'warning' ? 'border-l-yellow-500 bg-yellow-500/5' :
              'border-l-red-500 bg-red-500/5'
            }`}>
              {e.status === 'ok' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
               e.status === 'warning' ? <AlertTriangle className="h-4 w-4 text-yellow-500" /> :
               <AlertTriangle className="h-4 w-4 text-red-500" />}
              <div className="flex-1"><p className="text-sm text-foreground">{e.event}</p></div>
              <span className="text-xs text-muted-foreground">{e.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
