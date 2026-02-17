import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const verificaciones = [
  { id: '1', tipo: 'Hash de documento', codigo: 'DOC-2026-0045', fecha: '2026-02-14', resultado: 'verificado' },
  { id: '2', tipo: 'Lote por código', codigo: 'LOT-2026-001', fecha: '2026-02-12', resultado: 'verificado' },
  { id: '3', tipo: 'Trazabilidad', codigo: 'ICO-GT-2026-001', fecha: '2026-02-10', resultado: 'verificado' },
];

export default function CertificadoraVerificar() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary" /> Verificar Documento o Lote</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Ingrese hash, código de lote o código ICO..." className="flex-1" />
            <Button><CheckCircle className="h-4 w-4 mr-1" /> Verificar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Verificaciones Recientes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {verificaciones.map((v) => (
            <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium text-foreground">{v.tipo}</p>
                <p className="text-sm text-muted-foreground">{v.codigo} — {v.fecha}</p>
              </div>
              <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" /> Verificado</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
