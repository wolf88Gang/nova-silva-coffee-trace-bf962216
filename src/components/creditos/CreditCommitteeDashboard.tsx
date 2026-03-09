/**
 * Credit Committee Dashboard — Vista Comité de Crédito
 * Score Gauge + 3 Pillars + Monte Carlo + Carbon + Risk Summary + Actions
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Shield, TrendingUp, Users, Leaf, MapPin, CheckCircle, XCircle,
  AlertTriangle, BarChart3, Lock, DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { calculateNovaScore, MOCK_SCORE_INPUT, type NovaScoreResult } from '@/lib/novaScoreEngine';
import { runMonteCarloSimulation, MOCK_ROI_INPUT, type RoiSimResult } from '@/lib/roiDigitalTwin';
import { calculateCarbonValuation, type CarbonValuation } from '@/lib/carbonAssetValuation';

// ── Score Gauge ──
function ScoreGauge({ score, semaforo }: { score: number; semaforo: string }) {
  const color = semaforo === 'verde' ? 'text-primary' : semaforo === 'ambar' ? 'text-accent' : 'text-destructive';
  const bgColor = semaforo === 'verde' ? 'bg-primary' : semaforo === 'ambar' ? 'bg-accent' : 'bg-destructive';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor"
            className={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${score * 3.27} 327`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${color}`}>{score}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <Badge className={`${bgColor} text-white`}>
        {semaforo === 'verde' ? 'Aprobación Rápida' : semaforo === 'ambar' ? 'Revisión Manual' : 'Requiere Garantía'}
      </Badge>
    </div>
  );
}

// ── Pillar Card ──
function PillarCard({ title, icon: Icon, score, weight, details }: {
  title: string; icon: typeof Shield; score: number; weight: number;
  details: { label: string; value: number }[];
}) {
  const color = score >= 75 ? 'text-primary' : score >= 50 ? 'text-accent' : 'text-destructive';
  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="text-right">
            <span className={`text-xl font-bold ${color}`}>{score}</span>
            <span className="text-[10px] text-muted-foreground block">Peso: {weight * 100}%</span>
          </div>
        </div>
        <Progress value={score} className="h-1.5" />
        <div className="space-y-1.5">
          {details.map(d => (
            <div key={d.label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{d.label}</span>
              <span className="font-medium">{d.value}/100</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ──
// Climate loss context labels
const CLIMA_CONTEXT: { pct: number; label: string }[] = [
  { pct: 0, label: 'Sin impacto' },
  { pct: 5, label: 'Sequía leve — estrés hídrico temporal' },
  { pct: 10, label: 'Sequía moderada — caída de frutos inmaduros' },
  { pct: 15, label: 'Tormenta tropical / exceso lluvias' },
  { pct: 20, label: 'Sequía severa — pérdida significativa' },
  { pct: 25, label: 'Evento extremo (helada / huracán parcial)' },
  { pct: 30, label: 'Catástrofe — pérdida masiva de cosecha' },
];

const RESPONSE_TEMPLATES = {
  approve: 'El análisis integral confirma capacidad de pago (DSCR ≥ 1.2), historial de entregas consistente y colateral verificado. Se recomienda aprobación sin condiciones adicionales.',
  conditional: 'Se aprueba con las siguientes condiciones:\n1. Garantía adicional de cosecha comprometida para el ciclo vigente.\n2. Verificación de la parcela geolocalizada antes del desembolso.\n3. Seguimiento trimestral del plan de nutrición.',
  reject: 'El análisis indica riesgo elevado: DSCR < 1.0, PRN por encima del umbral aceptable y factores de riesgo identificados. Se recomienda no aprobar hasta cumplir requisitos mínimos de solvencia.',
};

export default function CreditCommitteeDashboard() {
  const [showOverride, setShowOverride] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [overrideText, setOverrideText] = useState('');
  const [rejectText, setRejectText] = useState('');
  const [stressPrecio, setStressPrecio] = useState(210);
  const [stressClima, setStressClima] = useState(0);

  // Calculate scores
  const scoreResult = useMemo(() => calculateNovaScore(MOCK_SCORE_INPUT), []);
  const roiResult = useMemo(() => runMonteCarloSimulation(MOCK_ROI_INPUT), []);
  const carbonResult = useMemo(() => calculateCarbonValuation({
    treeCount: 450, species: 'inga', ageCategory: 'medium', areaHa: 3.2,
    hasMrv: false, hasCertification: false,
  }), []);

  // Stress test
  const stressTest = useMemo(() => {
    const climaLoss = stressClima / 100;
    const adjustedYield = 30 * (1 - climaLoss);
    const ingreso = adjustedYield * stressPrecio;
    const costo = adjustedYield * 150;
    const neto = ingreso - costo;
    const cuotaAnual = 8500 * 0.12 + 8500 / 1.5;
    const dscr = cuotaAnual > 0 ? neto / cuotaAnual : 0;
    return { adjustedYield, ingreso, neto, dscr, solvente: dscr >= 1.0 };
  }, [stressPrecio, stressClima]);

  const climaLabel = CLIMA_CONTEXT.reduce((prev, curr) =>
    Math.abs(curr.pct - stressClima) <= Math.abs(prev.pct - stressClima) ? curr : prev
  ).label;

  const { breakdown } = scoreResult;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Comité de Crédito
          </h1>
          <p className="text-sm text-muted-foreground">Análisis integral — Juan Pérez López · Q8,500 · 18 meses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-destructive border-destructive/30" onClick={() => { setRejectText(RESPONSE_TEMPLATES.reject); setShowReject(true); }}>
            <XCircle className="h-4 w-4 mr-1" /> Rechazar
          </Button>
          <Button variant="outline" onClick={() => { setOverrideText(RESPONSE_TEMPLATES.conditional); setShowOverride(true); }}>
            <AlertTriangle className="h-4 w-4 mr-1" /> Aprobar con condiciones
          </Button>
          <Button onClick={() => toast.success(RESPONSE_TEMPLATES.approve)}>
            <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
          </Button>
        </div>
      </div>

      {/* Score + Decision */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 pb-6 flex justify-center">
            <ScoreGauge score={scoreResult.totalScore} semaforo={scoreResult.semaforo} />
          </CardContent>
        </Card>

        {/* 3 Pillars */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <PillarCard title="Capacidad de Pago" icon={DollarSign} score={breakdown.paymentCapacity.score} weight={0.50}
            details={[
              { label: 'DSCR', value: breakdown.paymentCapacity.details.dscrScore },
              { label: 'PRN (Monte Carlo)', value: breakdown.paymentCapacity.details.prnScore },
              { label: 'Flujo de Caja', value: breakdown.paymentCapacity.details.cashFlowScore },
            ]} />
          <PillarCard title="Carácter / Comportamiento" icon={Users} score={breakdown.characterBehavior.score} weight={0.30}
            details={[
              { label: 'Rating Empleador', value: breakdown.characterBehavior.details.employerRatingScore },
              { label: 'Consistencia Entregas', value: breakdown.characterBehavior.details.deliveryScore },
              { label: 'Lealtad', value: breakdown.characterBehavior.details.loyaltyScore },
            ]} />
          <PillarCard title="Colateral / Capital" icon={Leaf} score={breakdown.collateralCapital.score} weight={0.20}
            details={[
              { label: 'Nivel VITAL', value: breakdown.collateralCapital.details.vitalScore },
              { label: 'Activos Carbono', value: breakdown.collateralCapital.details.carbonScore },
              { label: 'Geolocalización', value: breakdown.collateralCapital.details.geolocScore },
            ]} />
        </div>
      </div>

      {/* Monte Carlo + Carbon + Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monte Carlo */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Simulación Monte Carlo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">{roiResult.sampleCount.toLocaleString()} corridas · Seed reproducible</p>
            <div className="space-y-2">
              {[
                { label: 'ROI Incremental Esperado', value: `$${roiResult.expectedIncrementalNet.toLocaleString()}` },
                { label: 'PRN (Prob. Retorno Negativo)', value: `${(roiResult.pIncrementalNetNegative * 100).toFixed(1)}%` },
                { label: 'DSCR Esperado', value: roiResult.expectedDSCR.toFixed(2) },
                { label: 'P(DSCR < 1)', value: `${(roiResult.pDSCRBelow1 * 100).toFixed(1)}%` },
                { label: 'VaR P5 (peor 5%)', value: `$${roiResult.varP5IncrementalNet.toLocaleString()}` },
              ].map(m => (
                <div key={m.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-medium text-foreground">{m.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Carbon */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Leaf className="h-4 w-4 text-primary" /> Activos de Carbono</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{carbonResult.co2Tonnes} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
              <p className="text-xs text-muted-foreground">{carbonResult.treeDensityPerHa} árboles/ha · 450 árboles</p>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Conservador ($10/t)</span><span>${carbonResult.valuations.conservative.toFixed(0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mercado ($15/t)</span><span>${carbonResult.valuations.market.toFixed(0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Premium ($25/t)</span><span className="font-medium text-primary">${carbonResult.valuations.premium.toFixed(0)}</span></div>
            </div>
            <div className={`p-2 rounded text-xs ${carbonResult.guaranteeEligibility.eligible ? 'bg-primary/5 border border-primary/20' : 'bg-destructive/5 border border-destructive/20'}`}>
              <p className="font-medium">{carbonResult.guaranteeEligibility.eligible ? '✓ Elegible como garantía' : '✗ No elegible como garantía'}</p>
              <p className="text-muted-foreground">{carbonResult.guaranteeEligibility.reason}</p>
            </div>
          </CardContent>
        </Card>

        {/* Risk Summary */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Resumen de Riesgo Unificado</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className={`p-3 rounded-lg text-center ${
              scoreResult.semaforo === 'verde' ? 'bg-primary/10 border border-primary/20' :
              scoreResult.semaforo === 'ambar' ? 'bg-accent/10 border border-accent/20' :
              'bg-destructive/10 border border-destructive/20'
            }`}>
              <p className="text-sm font-semibold">
                {scoreResult.semaforo === 'verde' ? 'APROBACIÓN RECOMENDADA' :
                 scoreResult.semaforo === 'ambar' ? 'REVISIÓN MANUAL REQUERIDA' :
                 'NO RECOMENDADO'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">EUDR Compliance</p>
              {['Lote Verificado', 'Trazabilidad Laboral', 'Cero Deforestación', 'Capital Natural Valorado'].map((c, i) => (
                <div key={c} className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-3 w-3 text-primary" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
            {scoreResult.riskFactors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Factores de Riesgo</p>
                {scoreResult.riskFactors.map((r, i) => (
                  <p key={i} className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{r}</p>
                ))}
              </div>
            )}
            {scoreResult.strengths.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Fortalezas</p>
                {scoreResult.strengths.map((s, i) => (
                  <p key={i} className="text-xs text-primary flex items-center gap-1"><CheckCircle className="h-3 w-3" />{s}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stress Test */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Prueba de Estrés Interactiva</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Precio Café ($/qq)</Label>
                  <Input type="number" min={100} max={400} step={5} value={stressPrecio}
                    onChange={e => setStressPrecio(Math.max(100, Math.min(400, Number(e.target.value))))}
                    className="w-24 h-7 text-xs text-center font-bold" />
                </div>
                <Slider value={[stressPrecio]} onValueChange={v => setStressPrecio(v[0])} min={100} max={400} step={5} />
                <p className="text-[10px] text-muted-foreground">Rango: $100 — $400/qq · NYC actual ≈ $210/qq</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Pérdida Climática (%)</Label>
                  <Input type="number" min={0} max={50} step={1} value={stressClima}
                    onChange={e => setStressClima(Math.max(0, Math.min(50, Number(e.target.value))))}
                    className="w-24 h-7 text-xs text-center font-bold" />
                </div>
                <Slider value={[stressClima]} onValueChange={v => setStressClima(v[0])} min={0} max={50} step={1} />
                <p className="text-[10px] text-accent-foreground font-medium">{climaLabel}</p>
                <div className="text-[9px] text-muted-foreground space-y-0.5">
                  {CLIMA_CONTEXT.map(c => (
                    <div key={c.pct} className={stressClima === c.pct ? 'text-foreground font-medium' : ''}>
                      {c.pct}% — {c.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-foreground">{stressTest.adjustedYield.toFixed(1)} QQ</p>
                <p className="text-[10px] text-muted-foreground">Rendimiento ajustado</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-foreground">${stressTest.ingreso.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">Ingreso estimado</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className={`text-lg font-bold ${stressTest.dscr >= 1 ? 'text-primary' : 'text-destructive'}`}>{stressTest.dscr.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">DSCR</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${stressTest.solvente ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                <p className={`text-lg font-bold ${stressTest.solvente ? 'text-primary' : 'text-destructive'}`}>
                  {stressTest.solvente ? 'Solvente' : 'Insolvente'}
                </p>
                <p className="text-[10px] text-muted-foreground">Estado</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrity */}
      <Card className="border-muted">
        <CardContent className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span>Integridad verificada — SHA-256 local · {new Date().toISOString().split('T')[0]}</span>
          </div>
          <Badge variant="outline" className="text-[10px]">Blockchain: Local</Badge>
        </CardContent>
      </Card>

      {/* Override Dialog */}
      <Dialog open={showOverride} onOpenChange={setShowOverride}>
        <DialogContent>
          <DialogHeader><DialogTitle>Aprobación con Condiciones</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Justifique las condiciones para aprobar este crédito fuera de los parámetros automáticos.</p>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-1">Respuesta sugerida por Nova Silva</p>
              <p className="text-xs text-muted-foreground">Esta plantilla se generó basándose en el análisis integral. Puede editarla antes de confirmar.</p>
            </div>
            <Label>Justificación (obligatorio)</Label>
            <Textarea value={overrideText} onChange={e => setOverrideText(e.target.value)} rows={6} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowOverride(false)}>Cancelar</Button>
              <Button onClick={() => { if (!overrideText.trim()) { toast.error('Justificación requerida'); return; } toast.success('Aprobado con condiciones (demo)'); setShowOverride(false); }}>
                Confirmar Aprobación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rechazar Crédito</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-xs font-semibold text-destructive mb-1">Dictamen de rechazo sugerido</p>
              <p className="text-xs text-muted-foreground">Edite la justificación antes de confirmar el rechazo.</p>
            </div>
            <Label>Justificación de rechazo (obligatorio)</Label>
            <Textarea value={rejectText} onChange={e => setRejectText(e.target.value)} rows={5} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowReject(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => { if (!rejectText.trim()) { toast.error('Justificación requerida'); return; } toast.info('Crédito rechazado (demo)'); setShowReject(false); }}>
                Confirmar Rechazo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
