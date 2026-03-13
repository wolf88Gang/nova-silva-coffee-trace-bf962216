import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Link2, Send, CheckCircle2, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';

const COOPERATIVAS_DEMO = [
  { id: '1', nombre: 'Cooperativa Los Altos', region: 'Tarrazú', socios: 245, estado: null as string | null },
  { id: '2', nombre: 'Cooperativa El Valle', region: 'West Valley', socios: 180, estado: null as string | null },
  { id: '3', nombre: 'Cooperativa Monte Verde', region: 'Monteverde', socios: 120, estado: null as string | null },
  { id: '4', nombre: 'Beneficio Don Julio', region: 'Central Valley', socios: 95, estado: null as string | null },
];

export default function CooperativaAssociationCard() {
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [pendientes, setPendientes] = useState<string[]>([]);
  const [asociadas, setAsociadas] = useState<string[]>([]);

  const filteredCoops = COOPERATIVAS_DEMO.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.region.toLowerCase().includes(search.toLowerCase())
  );

  const handleSolicitar = (coopId: string, coopName: string) => {
    setPendientes(prev => [...prev, coopId]);
    toast.success(`Solicitud enviada a ${coopName}. Recibirá una notificación cuando sea aceptado.`);
  };

  const getEstado = (coopId: string) => {
    if (asociadas.includes(coopId)) return 'asociado';
    if (pendientes.includes(coopId)) return 'pendiente';
    return null;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Cooperativas asociadas
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Vincúlate a una cooperativa para compartir tus datos de producción, recibir asistencia técnica y acceder a mercados
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {asociadas.length === 0 && pendientes.length === 0 && (
            <div className="text-center py-4">
              <Link2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No estás vinculado a ninguna cooperativa</p>
              <p className="text-xs text-muted-foreground">Al vincularte, la cooperativa podrá ver tus parcelas, entregas y resultados VITAL</p>
            </div>
          )}

          {pendientes.map(coopId => {
            const coop = COOPERATIVAS_DEMO.find(c => c.id === coopId);
            if (!coop) return null;
            return (
              <div key={coopId} className="flex items-center justify-between p-3 rounded-lg border border-accent/20 bg-accent/5">
                <div>
                  <p className="text-sm font-medium text-foreground">{coop.nombre}</p>
                  <p className="text-xs text-muted-foreground">{coop.region}</p>
                </div>
                <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>
              </div>
            );
          })}

          {asociadas.map(coopId => {
            const coop = COOPERATIVAS_DEMO.find(c => c.id === coopId);
            if (!coop) return null;
            return (
              <div key={coopId} className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                <div>
                  <p className="text-sm font-medium text-foreground">{coop.nombre}</p>
                  <p className="text-xs text-muted-foreground">{coop.region}</p>
                </div>
                <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Asociado</Badge>
              </div>
            );
          })}

          <Button onClick={() => setShowDialog(true)} variant="outline" className="w-full gap-2">
            <Search className="h-4 w-4" /> Buscar cooperativa
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Buscar Cooperativa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar por nombre o región</Label>
              <Input
                placeholder="Ej: Tarrazú, Los Altos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredCoops.map(coop => {
                const estado = getEstado(coop.id);
                return (
                  <div key={coop.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{coop.nombre}</p>
                      <p className="text-xs text-muted-foreground">{coop.region} · {coop.socios} socios</p>
                    </div>
                    {estado === 'pendiente' && (
                      <Badge variant="secondary" className="text-xs gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>
                    )}
                    {estado === 'asociado' && (
                      <Badge variant="default" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3" /> Asociado</Badge>
                    )}
                    {!estado && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => handleSolicitar(coop.id, coop.nombre)}>
                        <Send className="h-3 w-3" /> Solicitar
                      </Button>
                    )}
                  </div>
                );
              })}
              {filteredCoops.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No se encontraron cooperativas</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">¿Qué datos se comparten?</span> Al asociarte, la cooperativa podrá ver: parcelas, coordenadas GPS, entregas, resultados VITAL y documentos EUDR. No se comparten datos personales (teléfono, email, cédula).
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
