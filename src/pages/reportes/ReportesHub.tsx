import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  FileText, Download, Eye, BarChart3, DollarSign, Leaf, Shield,
  Bug, ShieldCheck, Boxes, Award, Sprout, Users, Printer, Clock,
} from 'lucide-react';
import { toast } from 'sonner';

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

// ── HTML Preview content generators ──
const getPreviewContent = (reportId: string): string => {
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
        <h2 style="font-size:16px;color:#333;border-bottom:1px solid #eee;padding-bottom:8px">Módulos Activos</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="background:#f9fafb"><th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb">Módulo</th><th style="padding:8px;border-bottom:1px solid #e5e7eb">Estado</th></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">Protocolo VITAL</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb"><span style="background:#d4edda;padding:2px 8px;border-radius:4px;font-size:11px">Activo</span></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">EUDR</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb"><span style="background:#d4edda;padding:2px 8px;border-radius:4px;font-size:11px">Activo</span></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">Nova Guard</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e5e7eb"><span style="background:#fff3cd;padding:2px 8px;border-radius:4px;font-size:11px">Parcial</span></td></tr></table>
        <p style="font-size:11px;color:#999;margin-top:24px;text-align:center">Nova Silva Platform — Confidencial — Página 1 de 3</p>
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
      win.document.write(getPreviewContent(selectedReport.id));
      win.document.close();
      setTimeout(() => win.print(), 300);
    }
  };

  const byCategoria = (cat: string) => REPORT_TYPES.filter(r => r.categoria === cat);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Centro de Reportes</h1>
        <p className="text-sm text-muted-foreground">Genera, previsualiza y descarga reportes institucionales en PDF</p>
      </div>

      {/* Stats */}
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

      {/* Preview dialog */}
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
              {/* Action bar */}
              <div className="flex gap-2 pb-3 border-b border-border">
                <Button size="sm" onClick={handleDownload}><Download className="h-3.5 w-3.5 mr-1" /> Descargar PDF</Button>
                <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-3.5 w-3.5 mr-1" /> Imprimir</Button>
              </div>
              {/* HTML preview */}
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
