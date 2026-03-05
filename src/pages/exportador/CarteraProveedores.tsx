/**
 * CarteraProveedores — Vista del exportador para gestionar cooperativas vinculadas,
 * proveedores externos y explorar el directorio público.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Users, MapPin, TrendingUp, Shield, Leaf, AlertTriangle,
  Plus, Search, Building2, Globe, Send, Eye, CheckCircle, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Demo data ──
const cooperativasVinculadas = [
  { id: '1', nombre: 'Cooperativa Café de la Selva', pais: 'Nicaragua', region: 'Matagalpa', productores: 120, volumenKg: 45000, ventanaCosecha: 'Nov-Mar', eudrPct: 83, riesgoClimatico: 'medio' as const, reclamos: 2, reclamosAltos: 0, estado: 'activo' as const },
  { id: '2', nombre: 'Cooperativa Montaña Verde', pais: 'Nicaragua', region: 'Jinotega', productores: 200, volumenKg: 68000, ventanaCosecha: 'Oct-Feb', eudrPct: 88, riesgoClimatico: 'bajo' as const, reclamos: 0, reclamosAltos: 0, estado: 'activo' as const },
  { id: '3', nombre: 'Cooperativa Sierra Nevada', pais: 'Nicaragua', region: 'Estelí', productores: 85, volumenKg: 22000, ventanaCosecha: 'Nov-Mar', eudrPct: 60, riesgoClimatico: 'alto' as const, reclamos: 5, reclamosAltos: 2, estado: 'activo' as const },
];

const proveedoresExternos = [
  { id: '1', nombre: 'Finca El Paraíso', pais: 'Honduras', contacto: 'Carlos Mejía', volumen: '120 sacos', eudrDocs: 'parcial' },
  { id: '2', nombre: 'Productora Alta Vista', pais: 'Guatemala', contacto: 'María Fernández', volumen: '80 sacos', eudrDocs: 'completo' },
];

const directorio = [
  { id: '10', nombre: 'Cooperativa Los Altos', pais: 'Guatemala', region: 'Antigua', productores: 150, eudrPct: 92, riesgoClimatico: 'bajo' as const, especialidad: 'SHB Lavado' },
  { id: '11', nombre: 'Asociación Cafetalera del Sur', pais: 'Costa Rica', region: 'Tarrazú', productores: 300, eudrPct: 95, riesgoClimatico: 'bajo' as const, especialidad: 'Honey Process' },
  { id: '12', nombre: 'Cooperativa Cerro Azul', pais: 'Honduras', region: 'Copán', productores: 90, eudrPct: 45, riesgoClimatico: 'medio' as const, especialidad: 'Natural Process' },
];

const riesgoBadge = (r: string) => {
  if (r === 'bajo') return <Badge className="bg-emerald-600 text-white border-0 text-xs">Bajo</Badge>;
  if (r === 'medio') return <Badge className="bg-amber-500 text-white border-0 text-xs">Medio</Badge>;
  return <Badge variant="destructive" className="text-xs">Alto</Badge>;
};

const eudrColor = (pct: number) => pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-500' : 'text-destructive';

export default function CarteraProveedores() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSolicitud, setShowSolicitud] = useState<string | null>(null);
  const [showDetalle, setShowDetalle] = useState<typeof cooperativasVinculadas[0] | null>(null);
  const [solicitudMsg, setSolicitudMsg] = useState('');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Red de Proveedores</h1>
          <p className="text-sm text-muted-foreground">Cooperativas vinculadas, proveedores externos y directorio</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Building2 className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Cooperativas vinculadas</span></div><p className="text-xl font-bold text-foreground">{cooperativasVinculadas.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Productores en red</span></div><p className="text-xl font-bold text-foreground">{cooperativasVinculadas.reduce((s, c) => s + c.productores, 0)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Volumen disponible</span></div><p className="text-xl font-bold text-foreground">{(cooperativasVinculadas.reduce((s, c) => s + c.volumenKg, 0) / 1000).toFixed(0)}t</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Shield className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">EUDR promedio</span></div><p className="text-xl font-bold text-foreground">{Math.round(cooperativasVinculadas.reduce((s, c) => s + c.eudrPct, 0) / cooperativasVinculadas.length)}%</p></CardContent></Card>
      </div>

      <Tabs defaultValue="cooperativas">
        <TabsList>
          <TabsTrigger value="cooperativas"><Building2 className="h-4 w-4 mr-1" /> Cooperativas</TabsTrigger>
          <TabsTrigger value="externos"><Users className="h-4 w-4 mr-1" /> Proveedores externos</TabsTrigger>
          <TabsTrigger value="explorar"><Globe className="h-4 w-4 mr-1" /> Explorar</TabsTrigger>
        </TabsList>

        {/* ── Cooperativas vinculadas ── */}
        <TabsContent value="cooperativas" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground text-left">
                    <th className="px-4 py-3 font-medium">Cooperativa</th>
                    <th className="px-4 py-3 font-medium">Región</th>
                    <th className="px-4 py-3 font-medium">Volumen (kg)</th>
                    <th className="px-4 py-3 font-medium">Ventana</th>
                    <th className="px-4 py-3 font-medium">EUDR</th>
                    <th className="px-4 py-3 font-medium">Riesgo</th>
                    <th className="px-4 py-3 font-medium">Reclamos</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr></thead>
                  <tbody>
                    {cooperativasVinculadas.map(c => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3"><div><p className="font-medium text-foreground">{c.nombre}</p><p className="text-xs text-muted-foreground">{c.productores} productores</p></div></td>
                        <td className="px-4 py-3 text-muted-foreground">{c.region}, {c.pais}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{c.volumenKg.toLocaleString()}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.ventanaCosecha}</td>
                        <td className="px-4 py-3"><span className={`font-bold ${eudrColor(c.eudrPct)}`}>{c.eudrPct}%</span></td>
                        <td className="px-4 py-3">{riesgoBadge(c.riesgoClimatico)}</td>
                        <td className="px-4 py-3">{c.reclamos > 0 ? <span className="text-destructive font-medium">{c.reclamos} ({c.reclamosAltos} altos)</span> : <span className="text-muted-foreground">0</span>}</td>
                        <td className="px-4 py-3"><Button variant="ghost" size="sm" onClick={() => setShowDetalle(c)}><Eye className="h-4 w-4" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Proveedores externos ── */}
        <TabsContent value="externos" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Agregar proveedor</Button>
          </div>
          {proveedoresExternos.map(p => (
            <Card key={p.id}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground">{p.pais} · Contacto: {p.contacto} · {p.volumen}</p>
                  </div>
                  <Badge variant={p.eudrDocs === 'completo' ? 'default' : 'secondary'}>EUDR: {p.eudrDocs}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Explorar directorio ── */}
        <TabsContent value="explorar" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, país o región..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {directorio.filter(d => !searchTerm || d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || d.region.toLowerCase().includes(searchTerm.toLowerCase())).map(d => (
              <Card key={d.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div>
                    <p className="font-medium text-foreground">{d.nombre}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{d.region}, {d.pais}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Productores</span><p className="font-bold text-foreground">{d.productores}</p></div>
                    <div><span className="text-muted-foreground">EUDR</span><p className={`font-bold ${eudrColor(d.eudrPct)}`}>{d.eudrPct}%</p></div>
                    <div><span className="text-muted-foreground">Riesgo</span><div className="mt-0.5">{riesgoBadge(d.riesgoClimatico)}</div></div>
                  </div>
                  <p className="text-xs text-muted-foreground">Especialidad: {d.especialidad}</p>
                  <Button size="sm" className="w-full" onClick={() => { setShowSolicitud(d.id); setSolicitudMsg(`Estimada ${d.nombre},\n\nNos gustaría establecer una relación comercial con su cooperativa. Somos una empresa exportadora interesada en café de alta calidad de la región ${d.region}.\n\nQuedamos atentos.\nSaludos cordiales`); }}>
                    <Send className="h-4 w-4 mr-1" /> Solicitar vinculación
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detalle cooperativa */}
      <Dialog open={!!showDetalle} onOpenChange={() => setShowDetalle(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {showDetalle && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />{showDetalle.nombre}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Región</p><p className="font-medium text-foreground">{showDetalle.region}, {showDetalle.pais}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Productores</p><p className="font-medium text-foreground">{showDetalle.productores}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Volumen</p><p className="font-medium text-foreground">{showDetalle.volumenKg.toLocaleString()} kg</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Ventana cosecha</p><p className="font-medium text-foreground">{showDetalle.ventanaCosecha}</p></div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Cumplimiento EUDR</p>
                  <div className="flex items-center gap-3">
                    <Progress value={showDetalle.eudrPct} className="flex-1 h-2" />
                    <span className={`font-bold text-sm ${eudrColor(showDetalle.eudrPct)}`}>{showDetalle.eudrPct}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Riesgo climático</span>
                  {riesgoBadge(showDetalle.riesgoClimatico)}
                </div>
                {showDetalle.reclamos > 0 && (
                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-destructive" /><span className="text-foreground">{showDetalle.reclamos} reclamos ({showDetalle.reclamosAltos} alta severidad)</span></div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Solicitud vinculación */}
      <Dialog open={!!showSolicitud} onOpenChange={() => setShowSolicitud(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Solicitar Vinculación</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Mensaje de presentación</Label>
            <Textarea value={solicitudMsg} onChange={e => setSolicitudMsg(e.target.value)} rows={6} className="text-xs" />
            <p className="text-[10px] text-muted-foreground">La cooperativa recibirá esta solicitud y podrá aceptarla o rechazarla.</p>
            <Button className="w-full" onClick={() => { toast.success('Solicitud de vinculación enviada'); setShowSolicitud(null); }}>
              <Send className="h-4 w-4 mr-1" /> Enviar solicitud
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
