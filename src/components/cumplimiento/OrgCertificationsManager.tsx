import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Award, Plus } from 'lucide-react';
import { useOrgCertifications } from '@/hooks/useOrgCertifications';
import { toast } from 'sonner';

export function OrgCertificationsManager() {
  const { data, isLoading, insert, update, remove, certificadoras } = useOrgCertifications();
  const [open, setOpen] = useState(false);
  const [certificadora, setCertificadora] = useState('');
  const [codigo, setCodigo] = useState('');
  const [fechaEmision, setFechaEmision] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  const handleAdd = async () => {
    if (!certificadora) {
      toast.error('Seleccioná una certificadora');
      return;
    }
    try {
      await insert({
        certificadora,
        codigo: codigo || undefined,
        fecha_emision: fechaEmision || undefined,
        fecha_vencimiento: fechaVencimiento || undefined,
        activo: true,
      });
      toast.success('Certificación agregada');
      setOpen(false);
      setCertificadora('');
      setCodigo('');
      setFechaEmision('');
      setFechaVencimiento('');
    } catch (e) {
      toast.error('Error al guardar');
      throw e;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-primary" />
            Certificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4 text-primary" />
          Certificaciones
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Certificaciones activas de la organización para cumplimiento agroquímico.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              Agregar certificación
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar certificación</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Certificadora</Label>
                <Select value={certificadora} onValueChange={setCertificadora}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {certificadoras.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Código (opcional)</Label>
                <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: FT-12345" />
              </div>
              <div>
                <Label>Fecha emisión (opcional)</Label>
                <Input
                  type="date"
                  value={fechaEmision}
                  onChange={(e) => setFechaEmision(e.target.value)}
                />
              </div>
              <div>
                <Label>Fecha vencimiento (opcional)</Label>
                <Input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin certificaciones configuradas.</p>
        ) : (
          <div className="space-y-2">
            {data.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{c.certificadora?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.codigo && `${c.codigo} · `}
                    {c.fecha_vencimiento ? `Vence ${c.fecha_vencimiento}` : 'Sin vencimiento'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.activo !== false ? 'default' : 'secondary'}>
                    {c.activo !== false ? 'Activa' : 'Inactiva'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => update({ id: c.id, activo: !(c.activo !== false) })}
                  >
                    {c.activo !== false ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(c.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
