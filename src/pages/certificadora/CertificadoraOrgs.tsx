import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

const organizaciones = [
  { id: '1', nombre: 'Cooperativa Café de la Selva', tipo: 'Cooperativa', pais: 'Guatemala', certificaciones: ['Rainforest Alliance', 'Fairtrade'], estado: 'vigente' },
  { id: '2', nombre: 'Cooperativa Los Altos', tipo: 'Cooperativa', pais: 'Guatemala', certificaciones: ['Fairtrade'], estado: 'vigente' },
  { id: '3', nombre: 'Exportadora Sol de América', tipo: 'Exportador', pais: 'Guatemala', certificaciones: ['EUDR Compliance'], estado: 'por_vencer' },
  { id: '4', nombre: 'Cooperativa Montaña Verde', tipo: 'Cooperativa', pais: 'Costa Rica', certificaciones: ['Rainforest Alliance'], estado: 'vigente' },
];

export default function CertificadoraOrgs() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Organizaciones Certificadas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {organizaciones.map((o) => (
            <div key={o.id} className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-foreground">{o.nombre}</p>
                  <p className="text-sm text-muted-foreground">{o.tipo} — {o.pais}</p>
                </div>
                <Badge variant={o.estado === 'vigente' ? 'default' : 'secondary'}>{o.estado === 'vigente' ? 'Vigente' : 'Por vencer'}</Badge>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {o.certificaciones.map((c) => <Badge key={c} variant="outline">{c}</Badge>)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
