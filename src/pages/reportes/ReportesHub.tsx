import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  FileText, Download, Eye, BarChart3, DollarSign, Leaf, Shield,
  Bug, ShieldCheck, Boxes, Award, Sprout, Users, Printer, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateVitalReport, exportVitalReportToClipboard } from '@/lib/advancedReportsExport';
import { DEMO_PRODUCTORES } from '@/lib/demo-data';

// ── Report types ──
interface ReportType {
  id: string;
  titulo: string;
  descripcion: string;
  icon: typeof FileText;
  categoria: 'operativo' | 'cumplimiento' | 'sostenibilidad';
  ultimaGeneracion?: string;
  estado: 'disponible' | 'generando' | 'no_disponible';
}

const REPORT_TYPES: ReportType[] = [
  { id: 'ejecutivo', titulo: 'Reporte Ejecutivo', descripcion: 'Estado general de la organización: KPIs, alertas y resumen de módulos activos', icon: BarChart3, categoria: 'operativo', ultimaGeneracion: '2026-02-15', estado: 'disponible' },
  { id: 'financiero', titulo: 'Reporte Financiero', descripcion: 'Transacciones, créditos activos, cuentas por cobrar/pagar y flujo de caja', icon: DollarSign, categoria: 'operativo', ultimaGeneracion: '2026-02-10', estado: 'disponible' },
  { id: 'productivo', titulo: 'Reporte Productivo', descripcion: 'Entregas, rendimiento por productor, volumen acumulado y lotes', icon: Sprout, categoria: 'operativo', ultimaGeneracion: '2026-02-12', estado: 'disponible' },
  { id: 'genero', titulo: 'Reporte de Género', descripcion: 'Participación femenina, jóvenes, brecha salarial y plan de inclusión', icon: Users, categoria: 'sostenibilidad', ultimaGeneracion: '2026-01-30', estado: 'disponible' },
  { id: 'vital', titulo: 'Reporte VITAL', descripcion: 'Diagnósticos de sostenibilidad, IGRN por productor, plan de mejora', icon: Shield, categoria: 'sostenibilidad', ultimaGeneracion: '2026-02-08', estado: 'disponible' },
  { id: 'nova_guard', titulo: 'Reporte Nova Guard', descripcion: 'Incidencias fitosanitarias, alertas tempranas y tratamientos aplicados', icon: Bug, categoria: 'sostenibilidad', estado: 'disponible' },
  { id: 'eudr', titulo: 'Reporte EUDR', descripcion: 'Due diligence, geolocalización de parcelas, análisis de deforestación', icon: ShieldCheck, categoria: 'cumplimiento', ultimaGeneracion: '2026-02-14', estado: 'disponible' },
  { id: 'inventario', titulo: 'Reporte de Inventario', descripcion: 'Stocks actuales, movimientos, alertas de mínimos y valorización', icon: Boxes, categoria: 'operativo', estado: 'disponible' },
  { id: 'certificaciones', titulo: 'Reporte de Certificaciones', descripcion: 'Auditorías, hallazgos, sellos activos y estado de cumplimiento', icon: Award, categoria: 'cumplimiento', ultimaGeneracion: '2026-01-20', estado: 'disponible' },
  { id: 'nova_yield', titulo: 'Reporte Nova Yield', descripcion: 'Estimaciones de cosecha, curva de maduración y proyecciones', icon: Leaf, categoria: 'sostenibilidad', estado: 'disponible' },
];

// ── VITAL report HTML generator (7 sections) ──
function generateVitalHTML(): string {
  const promedio = Math.round(DEMO_PRODUCTORES.reduce((s, p) => s + p.puntajeVITAL, 0) / DEMO_PRODUCTORES.length);
  const total = DEMO_PRODUCTORES.length;
  const criticos = DEMO_PRODUCTORES.filter(p => p.puntajeVITAL < 41);
  const fragiles = DEMO_PRODUCTORES.filter(p => p.puntajeVITAL >= 41 && p.puntajeVITAL < 61);
  const construccion = DEMO_PRODUCTORES.filter(p => p.puntajeVITAL >= 61 && p.puntajeVITAL < 81);
  const resilientes = DEMO_PRODUCTORES.filter(p => p.puntajeVITAL >= 81);

  const nivelColor = (s: number) => s >= 81 ? '#16a34a' : s >= 61 ? '#ca8a04' : s >= 41 ? '#ea580c' : '#dc2626';
  const nivelLabel = (s: number) => s >= 81 ? 'Resiliente' : s >= 61 ? 'En Construcción' : s >= 41 ? 'Fragilidad' : 'Crítica';

  const barHTML = (label: string, count: number, color: string) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px"><span>${label}</span><span style="font-weight:bold;color:${color}">${count} (${pct}%)</span></div><div style="height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${color};border-radius:4px"></div></div></div>`;
  };

  const criticalRows = criticos.map(p =>
    `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">${p.nombre}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${p.comunidad}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:bold;color:#dc2626">${p.puntajeVITAL}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb"><span style="background:#fef2f2;padding:2px 8px;border-radius:4px;font-size:11px;color:#dc2626">Crítica</span></td></tr>`
  ).join('');

  const allProducerRows = [...DEMO_PRODUCTORES].sort((a, b) => a.puntajeVITAL - b.puntajeVITAL).map(p => {
    const c = nivelColor(p.puntajeVITAL);
    const l = nivelLabel(p.puntajeVITAL);
    return `<tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px">${p.nombre}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px">${p.comunidad}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:bold;color:${c};font-size:12px">${p.puntajeVITAL}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px"><span style="background:${c}15;padding:2px 6px;border-radius:4px;color:${c}">${l}</span></td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px">${p.hectareas} ha</td></tr>`;
  }).join('');

  return `
    <div style="font-family:system-ui;max-width:750px;margin:0 auto;padding:24px;color:#1a1a1a">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #1a5632">
        <div style="width:44px;height:44px;background:#1a5632;border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px">NS</div>
        <div>
          <h1 style="margin:0;font-size:22px;color:#1a5632">Reporte Protocolo VITAL</h1>
          <p style="margin:0;font-size:12px;color:#666">Nova Silva Platform — Generado: ${new Date().toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <h2 style="font-size:15px;color:#1a5632;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-top:24px">1. Resumen Ejecutivo</h2>
      <p style="font-size:13px;line-height:1.6;color:#333">Este reporte documenta el nivel de resiliencia climática de <strong>${total} productores</strong> evaluados mediante el Protocolo VITAL. El Índice Global de Resiliencia Neta (IGRN) promedio es de <strong style="color:${nivelColor(promedio)}">${promedio}/100</strong>, con ${criticos.length} productores en estado crítico y ${resilientes.length} clasificados como resilientes.</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0">
        <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;text-align:center;background:#fafafa"><p style="margin:0;font-size:11px;color:#666">Evaluados</p><p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:#1a5632">${total}</p></div>
        <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;text-align:center;background:#fafafa"><p style="margin:0;font-size:11px;color:#666">IGRN Promedio</p><p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:${nivelColor(promedio)}">${promedio}</p></div>
        <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;text-align:center;background:#fef2f2"><p style="margin:0;font-size:11px;color:#dc2626">Críticos</p><p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:#dc2626">${criticos.length}</p></div>
        <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;text-align:center;background:#f0fdf4"><p style="margin:0;font-size:11px;color:#16a34a">Resilientes</p><p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:#16a34a">${resilientes.length}</p></div>
      </div>

      <h2 style="font-size:15px;color:#1a5632;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-top:28px">2. Marco Metodológico</h2>
      <div style="background:#f8faf8;border:1px solid #d1e7d1;border-radius:8px;padding:16px;margin:12px 0">
        <p style="font-size:13px;margin:0 0 8px;font-weight:600;color:#1a5632">Fórmula IGRN</p>
        <p style="font-size:14px;font-family:monospace;background:white;padding:10px;border-radius:4px;border:1px solid #e5e7eb;margin:0;text-align:center">IGRN = (0.35 × <em>E</em>) + (0.30 × <em>S</em>) + (0.35 × <em>C</em>) × 100</p>
        <p style="font-size:11px;color:#666;margin:8px 0 0">Donde <strong>E</strong> = Exposición, <strong>S</strong> = Sensibilidad, <strong>C</strong> = Capacidad Adaptativa.</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:10px">
        <tr style="background:#f9fafb"><th style="text-align:left;padding:6px 8px;border-bottom:1px solid #e5e7eb">Nivel</th><th style="padding:6px 8px;border-bottom:1px solid #e5e7eb">Rango</th><th style="padding:6px 8px;border-bottom:1px solid #e5e7eb">Significado</th></tr>
        <tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;color:#dc2626;font-weight:bold">🔴 Crítica</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center">0–40</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">Colapso Inminente</td></tr>
        <tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;color:#ea580c;font-weight:bold">🟠 Fragilidad</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center">41–60</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">Fragilidad Sistémica</td></tr>
        <tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;color:#ca8a04;font-weight:bold">🟡 En Construcción</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center">61–80</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">Resiliencia en Construcción</td></tr>
        <tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;color:#16a34a;font-weight:bold">🟢 Resiliente</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center">81–100</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">Sostenibilidad Consolidada</td></tr>
      </table>

      <h2 style="font-size:15px;color:#1a5632;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-top:28px">3. Perfil Agregado de Resiliencia</h2>
      <div style="margin:12px 0 20px">
        ${barHTML('🔴 Crítica (0–40)', criticos.length, '#dc2626')}
        ${barHTML('🟠 Fragilidad (41–60)', fragiles.length, '#ea580c')}
        ${barHTML('🟡 En Construcción (61–80)', construccion.length, '#ca8a04')}
        ${barHTML('🟢 Resiliente (81–100)', resilientes.length, '#16a34a')}
      </div>

      <h2 style="font-size:15px;color:#1a5632;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-top:28px">4. Productores en Estado Crítico</h2>
      ${criticos.length > 0 ? `
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px">
          <tr style="background:#f9fafb"><th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb">Productor</th><th style="padding:8px;border-bottom:1px solid #e5e7eb">Comunidad</th><th style="padding:8px;border-bottom:1px solid #e5e7eb">IGRN</th><th style="padding:8px;border-bottom:1px solid #e5e7eb">Nivel</th></tr>
          ${criticalRows}
        </table>
      ` : '<p style="font-size:13px;color:#16a34a;padding:12px;background:#f0fdf4;border-radius:6px">✅ No se identificaron productores en estado crítico.</p>'}

      <h2 style="font-size:15px;color:#1a5632;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-top:28px">5. Análisis por Productor</h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px">
        <tr style="background:#f9fafb"><th style="text-align:left;padding:6px 8px;border-bottom:1px solid #e5e7eb">Productor</th><th style="padding:6px 8px;border-bottom:1px solid #e5e7eb">Comunidad</th><th style="padding:6px 8px;border-bottom:1px solid #e5e7eb">IGRN</th><th style="padding:6px 8px;border-bottom:1px solid #e5e7eb">Nivel</th><th style="padding:6px 8px;border-bottom:1px solid #e5e7eb">Área</th></tr>
        ${allProducerRows}
      </table>

      <h2 style="font-size:15px;color:#1a5632;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-top:28px">6. Recomendaciones Consolidadas</h2>
      <div style="margin:12px 0">
        <div style="padding:10px 14px;background:#fef2f2;border-left:3px solid #dc2626;border-radius:0 6px 6px 0;margin-bottom:8px;font-size:12px"><strong>Prioritario:</strong> Atención inmediata a los ${criticos.length} productores en estado crítico con planes de acción individuales.</div>
        <div style="padding:10px 14px;background:#fff7ed;border-left:3px solid #ea580c;border-radius:0 6px 6px 0;margin-bottom:8px;font-size:12px"><strong>Corto plazo:</strong> Programa de fortalecimiento para los ${fragiles.length} productores en fragilidad sistémica.</div>
        <div style="padding:10px 14px;background:#fefce8;border-left:3px solid #ca8a04;border-radius:0 6px 6px 0;margin-bottom:8px;font-size:12px"><strong>Mediano plazo:</strong> Acompañamiento sostenido a los ${construccion.length} productores en construcción.</div>
        <div style="padding:10px 14px;background:#f0fdf4;border-left:3px solid #16a34a;border-radius:0 6px 6px 0;margin-bottom:8px;font-size:12px"><strong>Capitalizar:</strong> Los ${resilientes.length} productores resilientes como promotores comunitarios.</div>
      </div>

      <h2 style="font-size:15px;color:#1a5632;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-top:28px">7. Limitaciones y Advertencias</h2>
      <ol style="font-size:11px;color:#666;line-height:1.7;padding-left:18px;margin:10px 0">
        <li>Los resultados reflejan la autoevaluación del productor y la observación del técnico en un momento específico.</li>
        <li>El Protocolo VITAL mide resiliencia percibida y observable, no resiliencia absoluta.</li>
        <li>Los datos de carbono son estimaciones basadas en factores de ajuste publicados.</li>
        <li>La integración con el Score Crediticio Nova (SCN) utiliza el nivel VITAL como proxy de gestión.</li>
        <li>Las recomendaciones son orientativas y deben ser validadas por el equipo técnico en campo.</li>
      </ol>

      <div style="margin-top:24px;padding:14px;background:#f8faf8;border:1px solid #d1e7d1;border-radius:8px">
        <p style="font-size:12px;font-weight:600;color:#1a5632;margin:0 0 6px">Interpretación Nova Silva</p>
        <p style="font-size:12px;color:#333;margin:0;line-height:1.6">Con un IGRN promedio de ${promedio}/100, la organización se ubica en el nivel <strong style="color:${nivelColor(promedio)}">${nivelLabel(promedio)}</strong>. ${criticos.length > 0 ? `Se requiere intervención prioritaria para ${criticos.length} productores en estado crítico. ` : ''}${resilientes.length > 0 ? `Los ${resilientes.length} productores resilientes representan un activo valioso como promotores comunitarios.` : ''}</p>
      </div>

      <div style="margin-top:28px;padding-top:12px;border-top:2px solid #1a5632;display:flex;justify-content:space-between;align-items:center">
        <p style="font-size:10px;color:#999;margin:0">Protocolo VITAL v2.0 — Nova Silva Platform</p>
        <p style="font-size:10px;color:#999;margin:0">Documento Confidencial — Página 1</p>
      </div>
    </div>`;
}

// ── Generic HTML Preview content ──
const getPreviewContent = (reportId: string): string => {
  if (reportId === 'vital') return generateVitalHTML();

  const previews: Record<string, string> = {
    ejecutivo: `
      <div style="font-family:system-ui;max-width:700px;margin:0 auto;padding:24px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #1a5632">
          <div style="width:40px;height:40px;background:#1a5632;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold">NS</div>
          <div><h1 style="margin:0;font-size:20px;color:#1a5632">Reporte Ejecutivo</h1><p style="margin:0;font-size:12px;color:#666">Nova Silva — Generado: 15 Feb 2026</p></div>
        </div>
        <h2 style="font-size:16px;color:#333;border-bottom:1px solid #eee;padding-bottom:8px">Indicadores Clave</h2>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
          <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;text-align:center"><p style="margin:0;font-size:12px;color:#666">Productores</p><p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#1a5632">67</p></div>
          <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;text-align:center"><p style="margin:0;font-size:12px;color:#666">Hectáreas</p><p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#1a5632">245</p></div>
          <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;text-align:center"><p style="margin:0;font-size:12px;color:#666">Volumen QQ</p><p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#1a5632">1,840</p></div>
        </div>
        <h2 style="font-size:16px;color:#333;border-bottom:1px solid #eee;padding-bottom:8px">Alertas Activas</h2>
        <div style="padding:12px;background:#fef3cd;border-radius:8px;margin-bottom:12px"><span style="font-weight:bold">⚠ Roya</span> detectada en zona El Progreso — 3 parcelas afectadas</div>
        <div style="padding:12px;background:#f8d7da;border-radius:8px;margin-bottom:12px"><span style="font-weight:bold">🔴 Crédito</span> vencido sin arreglo de pago — Pedro Ramírez Cruz</div>
        <p style="font-size:11px;color:#999;margin-top:24px;text-align:center">Nova Silva Platform — Confidencial</p>
      </div>`,
    financiero: `
      <div style="font-family:system-ui;max-width:700px;margin:0 auto;padding:24px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #1a5632">
          <div style="width:40px;height:40px;background:#1a5632;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold">NS</div>
          <div><h1 style="margin:0;font-size:20px;color:#1a5632">Reporte Financiero</h1><p style="margin:0;font-size:12px;color:#666">Periodo: Ene — Feb 2026</p></div>
        </div>
        <h2 style="font-size:16px;color:#333;border-bottom:1px solid #eee;padding-bottom:8px">Resumen de Flujo</h2>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
          <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;text-align:center"><p style="margin:0;font-size:12px;color:#666">Ingresos</p><p style="margin:4px 0 0;font-size:20px;font-weight:bold;color:#16a34a">₡4.2M</p></div>
          <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;text-align:center"><p style="margin:0;font-size:12px;color:#666">Egresos</p><p style="margin:4px 0 0;font-size:20px;font-weight:bold;color:#dc2626">₡2.8M</p></div>
          <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;text-align:center"><p style="margin:0;font-size:12px;color:#666">Saldo neto</p><p style="margin:4px 0 0;font-size:20px;font-weight:bold;color:#1a5632">₡1.4M</p></div>
        </div>
        <h2 style="font-size:16px;color:#333;border-bottom:1px solid #eee;padding-bottom:8px">Créditos Activos</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="background:#f9fafb"><th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb">Productor</th><th style="padding:8px;border-bottom:1px solid #e5e7eb">Monto</th><th style="padding:8px;border-bottom:1px solid #e5e7eb">Saldo</th><th style="padding:8px;border-bottom:1px solid #e5e7eb">Estado</th></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">Juan Pérez</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb">₡15,000</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb">₡8,500</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb"><span style="background:#d4edda;padding:2px 8px;border-radius:4px;font-size:11px">Activo</span></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">Pedro Ramírez</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb">₡5,000</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb">₡5,000</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb"><span style="background:#f8d7da;padding:2px 8px;border-radius:4px;font-size:11px">Vencido</span></td></tr></table>
        <p style="font-size:11px;color:#999;margin-top:24px;text-align:center">Nova Silva Platform — Confidencial</p>
      </div>`,
  };
  return previews[reportId] || `
    <div style="font-family:system-ui;max-width:700px;margin:0 auto;padding:24px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #1a5632">
        <div style="width:40px;height:40px;background:#1a5632;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold">NS</div>
        <div><h1 style="margin:0;font-size:20px;color:#1a5632">${REPORT_TYPES.find(r => r.id === reportId)?.titulo || 'Reporte'}</h1><p style="margin:0;font-size:12px;color:#666">Nova Silva — Generado: ${new Date().toLocaleDateString('es')}</p></div>
      </div>
      <div style="padding:20px;text-align:center;color:#666">
        <p style="font-size:14px">Vista previa del reporte</p>
        <p style="font-size:13px">Los datos se generarán desde las tablas de la organización activa.</p>
        <div style="margin:20px auto;padding:16px;border:1px solid #e5e7eb;border-radius:8px;max-width:400px">
          <p style="font-size:12px;color:#999">Secciones incluidas:</p>
          <ul style="text-align:left;font-size:13px;padding-left:20px">
            <li>Indicadores clave del periodo</li>
            <li>Tablas de detalle por recurso</li>
            <li>Gráficas de tendencia</li>
            <li>Recomendaciones Nova Silva</li>
          </ul>
        </div>
      </div>
      <p style="font-size:11px;color:#999;margin-top:24px;text-align:center">Nova Silva Platform — Confidencial</p>
    </div>`;
};

const categoriaLabel: Record<string, string> = { operativo: 'Operativo', cumplimiento: 'Cumplimiento', sostenibilidad: 'Sostenibilidad' };

export default function ReportesHub() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = (report: ReportType) => {
    setGenerating(report.id);
    toast.loading(`Generando ${report.titulo}...`);
    setTimeout(() => {
      setGenerating(null);
      toast.dismiss();
      toast.success(`${report.titulo} generado exitosamente`);
      setSelectedReport(report);
    }, 1500);
  };

  const handleDownload = () => {
    toast.success('Descarga de PDF iniciada (funcionalidad requiere backend)');
  };

  const handlePrint = () => {
    if (!selectedReport) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<html><head><title>${selectedReport.titulo} — Nova Silva</title></head><body>${getPreviewContent(selectedReport.id)}</body></html>`);
      win.document.close();
      setTimeout(() => win.print(), 300);
    }
  };

  const handleCopyText = () => {
    if (!selectedReport || selectedReport.id !== 'vital') return;
    const promedio = Math.round(DEMO_PRODUCTORES.reduce((s, p) => s + p.puntajeVITAL, 0) / DEMO_PRODUCTORES.length);
    const dist = {
      critico: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL < 41).length,
      desarrollo: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL >= 41 && p.puntajeVITAL < 61).length,
      sostenible: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL >= 61 && p.puntajeVITAL < 81).length,
      ejemplar: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL >= 81).length,
    };
    const report = generateVitalReport('Mi Cooperativa', '2025-2026', {
      evaluated: DEMO_PRODUCTORES.length,
      avgIGRN: promedio,
      critical: dist.critico,
      fragile: dist.desarrollo,
      building: dist.sostenible,
      resilient: dist.ejemplar,
    });
    const text = exportVitalReportToClipboard(report);
    navigator.clipboard.writeText(text);
    toast.success('Reporte VITAL copiado al portapapeles (texto plano)');
  };

  const byCategoria = (cat: string) => REPORT_TYPES.filter(r => r.categoria === cat);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Centro de Reportes</h1>
        <p className="text-sm text-muted-foreground">Genera, previsualiza y descarga reportes institucionales en PDF</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Tipos de reporte</p>
          <p className="text-2xl font-bold text-foreground">{REPORT_TYPES.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Disponibles</p>
          <p className="text-2xl font-bold text-foreground">{REPORT_TYPES.filter(r => r.estado === 'disponible').length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Último generado</p>
          <p className="text-sm font-medium text-foreground">15 Feb 2026</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="todos">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="todos">Todos ({REPORT_TYPES.length})</TabsTrigger>
          <TabsTrigger value="operativo">Operativos ({byCategoria('operativo').length})</TabsTrigger>
          <TabsTrigger value="cumplimiento">Cumplimiento ({byCategoria('cumplimiento').length})</TabsTrigger>
          <TabsTrigger value="sostenibilidad">Sostenibilidad ({byCategoria('sostenibilidad').length})</TabsTrigger>
        </TabsList>

        {['todos', 'operativo', 'cumplimiento', 'sostenibilidad'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(tab === 'todos' ? REPORT_TYPES : byCategoria(tab)).map(report => (
                <Card key={report.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <report.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{report.titulo}</h3>
                          <Badge variant="outline" className="text-xs">{categoriaLabel[report.categoria]}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{report.descripcion}</p>
                        {report.ultimaGeneracion && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                            <Clock className="h-3 w-3" /> Último: {report.ultimaGeneracion}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleGenerate(report)} disabled={generating === report.id}>
                            {generating === report.id ? (
                              <><Clock className="h-3.5 w-3.5 mr-1 animate-spin" /> Generando...</>
                            ) : (
                              <><Eye className="h-3.5 w-3.5 mr-1" /> Generar y previsualizar</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedReport?.titulo} — Vista Previa
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex gap-2 pb-3 border-b border-border">
                <Button size="sm" onClick={handleDownload}><Download className="h-3.5 w-3.5 mr-1" /> Descargar PDF</Button>
                <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-3.5 w-3.5 mr-1" /> Imprimir</Button>
                {selectedReport.id === 'vital' && (
                  <Button size="sm" variant="outline" onClick={handleCopyText}><FileText className="h-3.5 w-3.5 mr-1" /> Copiar Texto</Button>
                )}
              </div>
              <div
                className="border border-border rounded-lg bg-white overflow-hidden"
                dangerouslySetInnerHTML={{ __html: getPreviewContent(selectedReport.id) }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}