import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Building2, User, MapPin, FileText, ShieldCheck, ChevronRight, ChevronLeft,
  CheckCircle2, AlertTriangle, Globe, Phone, Mail, Hash, Truck, Leaf
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */
export interface ProveedorData {
  // Step 1 — Datos generales
  nombre: string;
  tipo: 'cooperativa' | 'productor_individual' | 'empresa' | 'intermediario';
  cedulaJuridica: string;
  pais: string;
  region: string;
  direccion: string;
  // Step 2 — Contacto
  contactoNombre: string;
  contactoCargo: string;
  telefono: string;
  email: string;
  sitioWeb: string;
  // Step 3 — Comercial
  productosServicios: string[];
  certificaciones: string[];
  condicionesPago: string;
  moneda: string;
  plazoEntregaDias: string;
  volumenEstimado: string;
  // Step 4 — EUDR & Legal
  tieneTrazabilidad: boolean;
  geolocalizado: boolean;
  tienePermisoAmbiental: boolean;
  tieneTituloPropiedad: boolean;
  aceptaAuditoria: boolean;
  notasLegales: string;
}

const INITIAL_DATA: ProveedorData = {
  nombre: '', tipo: 'cooperativa', cedulaJuridica: '', pais: 'Costa Rica', region: '', direccion: '',
  contactoNombre: '', contactoCargo: '', telefono: '', email: '', sitioWeb: '',
  productosServicios: [], certificaciones: [], condicionesPago: 'contado', moneda: 'USD',
  plazoEntregaDias: '', volumenEstimado: '',
  tieneTrazabilidad: false, geolocalizado: false, tienePermisoAmbiental: false,
  tieneTituloPropiedad: false, aceptaAuditoria: false, notasLegales: '',
};

const TIPOS_PROVEEDOR = [
  { value: 'cooperativa', label: 'Cooperativa' },
  { value: 'productor_individual', label: 'Productor individual' },
  { value: 'empresa', label: 'Empresa / Casa comercial' },
  { value: 'intermediario', label: 'Intermediario' },
];

const PAISES = ['Costa Rica', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Panamá', 'Colombia', 'Brasil', 'Perú', 'México', 'Otro'];

const PRODUCTOS = ['Café pergamino', 'Café oro', 'Café cereza', 'Fertilizantes', 'Agroquímicos', 'Biocontrol', 'Empaques', 'Combustible', 'Maquinaria', 'Transporte', 'Otro'];

const CERTIFICACIONES = ['Orgánico', 'Fairtrade', 'Rainforest Alliance', 'UTZ', 'C.A.F.E. Practices', '4C', 'Bird Friendly', 'Demeter', 'Ninguna'];

const CONDICIONES_PAGO = [
  { value: 'contado', label: 'Contado' },
  { value: 'credito_15', label: 'Crédito 15 días' },
  { value: 'credito_30', label: 'Crédito 30 días' },
  { value: 'credito_60', label: 'Crédito 60 días' },
  { value: 'credito_90', label: 'Crédito 90 días' },
  { value: 'consignacion', label: 'Consignación' },
];

const STEPS = [
  { label: 'Datos generales', icon: Building2 },
  { label: 'Contacto', icon: User },
  { label: 'Comercial', icon: Truck },
  { label: 'EUDR y Legal', icon: ShieldCheck },
  { label: 'Confirmación', icon: CheckCircle2 },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: ProveedorData) => void;
  contexto?: 'inventario' | 'comercial';
}

export default function ProveedorWizard({ open, onOpenChange, onComplete, contexto = 'comercial' }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ProveedorData>(INITIAL_DATA);

  const update = (partial: Partial<ProveedorData>) => setData(prev => ({ ...prev, ...partial }));

  const toggleArray = (field: 'productosServicios' | 'certificaciones', value: string) => {
    setData(prev => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const canNext = () => {
    if (step === 0) return !!data.nombre && !!data.tipo && !!data.pais;
    if (step === 1) return !!data.contactoNombre && (!!data.telefono || !!data.email);
    if (step === 2) return data.productosServicios.length > 0;
    return true;
  };

  const eudrScore = () => {
    let s = 0;
    if (data.tieneTrazabilidad) s++;
    if (data.geolocalizado) s++;
    if (data.tienePermisoAmbiental) s++;
    if (data.tieneTituloPropiedad) s++;
    if (data.aceptaAuditoria) s++;
    return s;
  };

  const eudrStatus = () => {
    const s = eudrScore();
    if (s >= 4) return { label: 'Cumple EUDR', color: 'bg-emerald-500', variant: 'default' as const };
    if (s >= 2) return { label: 'Parcial', color: 'bg-amber-500', variant: 'secondary' as const };
    return { label: 'No cumple', color: 'bg-destructive', variant: 'destructive' as const };
  };

  const handleFinish = () => {
    onComplete(data);
    toast.success(`Proveedor "${data.nombre}" registrado exitosamente`);
    setData(INITIAL_DATA);
    setStep(0);
    onOpenChange(false);
  };

  const reset = () => { setData(INITIAL_DATA); setStep(0); };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Registrar Proveedor {contexto === 'inventario' ? '(Insumos)' : '(Comercial)'}
          </DialogTitle>
        </DialogHeader>

        {/* ── Step indicator ── */}
        <div className="flex items-center gap-1 mb-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-1.5 rounded-md transition-colors w-full justify-center
                  ${i === step ? 'bg-primary text-primary-foreground' : i < step ? 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20' : 'bg-muted text-muted-foreground'}`}
              >
                <s.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline truncate">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>

        {/* ══════ STEP 0: Datos generales ══════ */}
        {step === 0 && (
          <div className="space-y-3 animate-fade-in">
            <div className="space-y-1">
              <Label>Nombre o razón social *</Label>
              <Input value={data.nombre} onChange={e => update({ nombre: e.target.value })} placeholder="Ej: Cooperativa Montaña Verde" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo de proveedor *</Label>
                <Select value={data.tipo} onValueChange={v => update({ tipo: v as ProveedorData['tipo'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS_PROVEEDOR.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Cédula jurídica / NIT</Label>
                <Input value={data.cedulaJuridica} onChange={e => update({ cedulaJuridica: e.target.value })} placeholder="Ej: 3-101-123456" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>País *</Label>
                <Select value={data.pais} onValueChange={v => update({ pais: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAISES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Región / Departamento</Label>
                <Input value={data.region} onChange={e => update({ region: e.target.value })} placeholder="Ej: Tarrazú" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Dirección</Label>
              <Input value={data.direccion} onChange={e => update({ direccion: e.target.value })} placeholder="Dirección física" />
            </div>
          </div>
        )}

        {/* ══════ STEP 1: Contacto ══════ */}
        {step === 1 && (
          <div className="space-y-3 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nombre de contacto *</Label>
                <Input value={data.contactoNombre} onChange={e => update({ contactoNombre: e.target.value })} placeholder="Nombre completo" />
              </div>
              <div className="space-y-1">
                <Label>Cargo</Label>
                <Input value={data.contactoCargo} onChange={e => update({ contactoCargo: e.target.value })} placeholder="Ej: Gerente comercial" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> Teléfono</Label>
                <Input value={data.telefono} onChange={e => update({ telefono: e.target.value })} placeholder="+506 8888-0000" />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
                <Input type="email" value={data.email} onChange={e => update({ email: e.target.value })} placeholder="contacto@ejemplo.com" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1"><Globe className="h-3 w-3" /> Sitio web</Label>
              <Input value={data.sitioWeb} onChange={e => update({ sitioWeb: e.target.value })} placeholder="https://..." />
            </div>
          </div>
        )}

        {/* ══════ STEP 2: Comercial ══════ */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label>Productos / Servicios que ofrece *</Label>
              <div className="flex flex-wrap gap-2">
                {PRODUCTOS.map(p => (
                  <button
                    key={p}
                    onClick={() => toggleArray('productosServicios', p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                      ${data.productosServicios.includes(p) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Certificaciones</Label>
              <div className="flex flex-wrap gap-2">
                {CERTIFICACIONES.map(c => (
                  <button
                    key={c}
                    onClick={() => toggleArray('certificaciones', c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                      ${data.certificaciones.includes(c) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-muted/50 text-muted-foreground border-border hover:border-emerald-500/50'}`}
                  >
                    <Leaf className="h-3 w-3 inline mr-1" />{c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Condiciones de pago</Label>
                <Select value={data.condicionesPago} onValueChange={v => update({ condicionesPago: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONDICIONES_PAGO.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Moneda</Label>
                <Select value={data.moneda} onValueChange={v => update({ moneda: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD (Dólares)</SelectItem>
                    <SelectItem value="CRC">CRC (Colones)</SelectItem>
                    <SelectItem value="GTQ">GTQ (Quetzales)</SelectItem>
                    <SelectItem value="EUR">EUR (Euros)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Plazo de entrega (días)</Label>
                <Input type="number" value={data.plazoEntregaDias} onChange={e => update({ plazoEntregaDias: e.target.value })} placeholder="Ej: 7" />
              </div>
              <div className="space-y-1">
                <Label>Volumen estimado mensual</Label>
                <Input value={data.volumenEstimado} onChange={e => update({ volumenEstimado: e.target.value })} placeholder="Ej: 50 sacos" />
              </div>
            </div>
          </div>
        )}

        {/* ══════ STEP 3: EUDR y Legal ══════ */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Validación de Cumplimiento EUDR</p>
              <p className="text-xs text-muted-foreground mt-1">Marque las condiciones que el proveedor cumple para la regulación europea de deforestación.</p>
            </div>
            {[
              { key: 'tieneTrazabilidad' as const, label: 'Trazabilidad completa', desc: 'Puede demostrar origen del producto hasta parcela' },
              { key: 'geolocalizado' as const, label: 'Parcelas geolocalizadas', desc: 'Coordenadas GPS verificables de áreas de producción' },
              { key: 'tienePermisoAmbiental' as const, label: 'Permiso ambiental vigente', desc: 'Documentación ambiental al día' },
              { key: 'tieneTituloPropiedad' as const, label: 'Título de propiedad / posesión', desc: 'Documentos legales de tenencia de tierra' },
              { key: 'aceptaAuditoria' as const, label: 'Acepta auditoría de terceros', desc: 'Disponible para verificación independiente' },
            ].map(item => (
              <label key={item.key} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer
                ${data[item.key] ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/20'}`}>
                <Checkbox
                  checked={data[item.key]}
                  onCheckedChange={v => update({ [item.key]: !!v })}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </label>
            ))}
            <div className="space-y-1">
              <Label>Notas legales / observaciones</Label>
              <Textarea value={data.notasLegales} onChange={e => update({ notasLegales: e.target.value })} rows={2} placeholder="Información adicional sobre documentación..." />
            </div>
          </div>
        )}

        {/* ══════ STEP 4: Confirmación ══════ */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-bold text-foreground">{data.nombre}</p>
                  <p className="text-sm text-muted-foreground">{TIPOS_PROVEEDOR.find(t => t.value === data.tipo)?.label} · {data.pais}</p>
                </div>
                <Badge variant={eudrStatus().variant}>{eudrStatus().label}</Badge>
              </div>
              {data.cedulaJuridica && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Hash className="h-3 w-3" /> {data.cedulaJuridica}
                </div>
              )}
              {data.region && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <MapPin className="h-3 w-3" /> {data.region}{data.direccion ? ` — ${data.direccion}` : ''}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Contacto</p>
                <p className="text-sm font-medium text-foreground">{data.contactoNombre}</p>
                {data.contactoCargo && <p className="text-xs text-muted-foreground">{data.contactoCargo}</p>}
                {data.telefono && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Phone className="h-3 w-3" /> {data.telefono}</p>}
                {data.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {data.email}</p>}
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Comercial</p>
                <p className="text-sm text-foreground">{CONDICIONES_PAGO.find(c => c.value === data.condicionesPago)?.label} · {data.moneda}</p>
                {data.plazoEntregaDias && <p className="text-xs text-muted-foreground">Entrega: {data.plazoEntregaDias} días</p>}
                {data.volumenEstimado && <p className="text-xs text-muted-foreground">Vol: {data.volumenEstimado}</p>}
              </div>
            </div>

            {data.productosServicios.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Productos / Servicios</p>
                <div className="flex flex-wrap gap-1.5">{data.productosServicios.map(p => <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>)}</div>
              </div>
            )}
            {data.certificaciones.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Certificaciones</p>
                <div className="flex flex-wrap gap-1.5">{data.certificaciones.map(c => <Badge key={c} className="bg-emerald-600/90 text-white border-0 text-[10px]">{c}</Badge>)}</div>
              </div>
            )}

            <div className="p-3 rounded-lg border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cumplimiento EUDR ({eudrScore()}/5)</p>
              <div className="flex gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${i < eudrScore() ? eudrStatus().color : 'bg-muted'}`} />
                ))}
              </div>
              {eudrScore() < 4 && (
                <p className="text-xs text-amber-500 flex items-center gap-1 mt-2"><AlertTriangle className="h-3 w-3" /> Proveedor con cumplimiento parcial. Se requiere validación adicional.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={() => step > 0 ? setStep(step - 1) : onOpenChange(false)} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> {step === 0 ? 'Cancelar' : 'Anterior'}
          </Button>
          <span className="text-xs text-muted-foreground">Paso {step + 1} de {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep(step + 1)} disabled={!canNext()} className="gap-1">
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleFinish} className="gap-1">
              <CheckCircle2 className="h-4 w-4" /> Registrar Proveedor
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
