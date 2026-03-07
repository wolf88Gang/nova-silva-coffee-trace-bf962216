import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Award, Plus } from 'lucide-react';
import { useOrgCertifications, type OrgCertification } from '@/hooks/useOrgCertifications';
import { DEMO_CERTIFICATIONS } from '@/lib/demoInsightsData';
import { toast } from 'sonner';

const CERTIFICADORAS = ['fairtrade', 'rainforest_alliance', 'gcp', 'organic_usda', 'organic_eu', 'utz', '4c'] as const;

export default function OrgCertificationsManager() {
  const { certifications, isLoading, addCert, toggleCert } = useOrgCertifications();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ certificadora: '', codigo: '', fecha_emision: '', fecha_vencimiento: '' });

  // Use demo data if real data fails/empty
  const displayCerts: OrgCertification[] = certifications.length > 0 ? certifications : DEMO_CERTIFICATIONS;
  const isDemo = certifications.length === 0;

  function handleAdd() {
    if (!form.certificadora) { toast.error('Seleccione una certificadora'); return; }
    addCert.mutate(
      { certificadora: form.certificadora, codigo: form.codigo || null, fecha_emision: form.fecha_emision || null, fecha_vencimiento: form.fecha_vencimiento || null, activo: true },
      { onSuccess: () => { setOpen(false); setForm({ certificadora: '', codigo: '', fecha_emision: '', fecha_vencimiento: '' }); } }
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base"><Award className="h-4 w-4" /> Certificaciones</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Agregar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Agregar certificación</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Certificadora</Label>
                <Select value={form.certificadora} onValueChange={(v) => setForm({ ...form, certificadora: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>{CERTIFICADORAS.map((c) => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Código</Label><Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} /></div>
              <div><Label>Fecha de emisión</Label><Input type="date" value={form.fecha_emision} onChange={(e) => setForm({ ...form, fecha_emision: e.target.value })} /></div>
              <div><Label>Fecha de vencimiento</Label><Input type="date" value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} /></div>
              <Button onClick={handleAdd} disabled={addCert.isPending} className="w-full">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground text-sm">Cargando...</p> : (
          <div className="space-y-2">
            {displayCerts.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                <div>
                  <span className="font-medium capitalize">{c.certificadora.replace('_', ' ')}</span>
                  {c.codigo && <span className="text-muted-foreground ml-2">#{c.codigo}</span>}
                  {c.fecha_vencimiento && <span className="text-muted-foreground ml-2 text-xs">Vence: {c.fecha_vencimiento}</span>}
                </div>
                <Switch
                  checked={c.activo}
                  onCheckedChange={(v) => !isDemo && toggleCert.mutate({ id: c.id, activo: v })}
                  disabled={isDemo}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
