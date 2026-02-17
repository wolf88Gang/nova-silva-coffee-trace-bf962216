import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const reportes = [
  { id: '1', titulo: 'Reporte de auditorías realizadas — Q1 2026', tipo: 'Auditorías', fecha: '2026-02-15' },
  { id: '2', titulo: 'Estado de certificaciones vigentes', tipo: 'Certificaciones', fecha: '2026-02-01' },
  { id: '3', titulo: 'No conformidades por tipo — 2025', tipo: 'No conformidades', fecha: '2026-01-15' },
  { id: '4', titulo: 'Tendencias de cumplimiento anual', tipo: 'Tendencias', fecha: '2026-01-01' },
];

export default function CertificadoraReportes() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Reportes Disponibles</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {reportes.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium text-foreground">{r.titulo}</p>
                <p className="text-xs text-muted-foreground">{r.tipo} — {r.fecha}</p>
              </div>
              <Button variant="outline" size="sm"><Download className="h-3 w-3 mr-1" /> Descargar</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
