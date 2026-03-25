/**
 * ExportadoresAsociados — Vista cooperativa para gestionar solicitudes y relaciones con exportadores
 * Incluye ficha de detalle rica con historial, índice de justicia, contacto y envío de ofertas
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Building2, CheckCircle, XCircle, Clock, Mail, Phone, Globe, Send,
  TrendingUp, TrendingDown, BarChart3, Package, MessageSquare,
  ArrowUpRight, ArrowDownRight, Star, AlertTriangle, ThumbsUp, ThumbsDown,
  ExternalLink, History,
} from 'lucide-react';
import { toast } from 'sonner';
import { DEMO_LOTES_ACOPIO } from '@/lib/demo-data';

interface Relacion {
  id: string; exportadorNombre: string; pais: string; fechaSolicitud: string;
  estado: 'pendiente' | 'activo' | 'inactivo'; origen: string;
  contacto?: string; email?: string; telefono?: string;
  // Rich data
  exportacionesPrevias?: number;
  volumenTotalQQ?: number;
  precioPromedio?: number;
  precioMercado?: number;
  indiceFairness?: number; // 0-100
  preferencias?: string[];
  noQuiere?: string[];
  problemasPrevios?: string[];
  solicitudesRecientes?: string[];
  ultimaCompra?: string;
}

const relacionesIniciales: Relacion[] = [
  {
    id: '1', exportadorNombre: 'Volcafe S.A.', pais: 'Suiza', fechaSolicitud: '2026-01-15',
    estado: 'activo', origen: 'solicitud_exportador',
    contacto: 'Hans Weber', email: 'h.weber@volcafe.com', telefono: '+41 44 123 4567',
    exportacionesPrevias: 8, volumenTotalQQ: 450, precioPromedio: 295000, precioMercado: 285000,
    indiceFairness: 82,
    preferencias: ['Cafés SHB', 'Proceso lavado', 'Score 84+', 'Origen Huehuetenango'],
    noQuiere: ['Cafés naturales', 'Lotes menores a 10 QQ'],
    problemasPrevios: ['Retraso en pago de 15 días en lote LOT-2025-031'],
    solicitudesRecientes: ['Buscan 100 QQ de SHB para contrato Q2 2026'],
    ultimaCompra: '2026-01-28',
  },
  {
    id: '2', exportadorNombre: 'CECA Trading', pais: 'Guatemala', fechaSolicitud: '2026-02-01',
    estado: 'activo', origen: 'admin',
    contacto: 'María Fernández', email: 'm.fernandez@cecatrading.gt', telefono: '+502 2345-6789',
    exportacionesPrevias: 12, volumenTotalQQ: 680, precioPromedio: 278000, precioMercado: 285000,
    indiceFairness: 65,
    preferencias: ['Alto volumen', 'Pergamino primera', 'Entregas programadas mensuales'],
    noQuiere: ['Cafés con humedad alta (>12%)', 'Lotes mezclados sin trazabilidad'],
    problemasPrevios: ['Descuento por humedad en 2 lotes (2025)', 'Precio por debajo del mercado en 3 de 12 compras'],
    solicitudesRecientes: ['Interesados en lote orgánico certificado'],
    ultimaCompra: '2026-02-10',
  },
  {
    id: '3', exportadorNombre: 'Nordic Approach', pais: 'Noruega', fechaSolicitud: '2026-02-20',
    estado: 'pendiente', origen: 'solicitud_exportador',
    contacto: 'Erik Olsen', email: 'erik@nordicapproach.no', telefono: '+47 22 33 44 55',
    exportacionesPrevias: 0, volumenTotalQQ: 0, precioPromedio: 0, precioMercado: 285000,
    indiceFairness: 0,
    preferencias: ['Micro-lotes specialty 86+', 'Historias de origen', 'Trazabilidad completa'],
    noQuiere: [],
    problemasPrevios: [],
    solicitudesRecientes: ['Primera solicitud de vinculación — buscan micro-lotes de altitude 1600+ msnm'],
    ultimaCompra: undefined,
  },
  {
    id: '4', exportadorNombre: 'Mercon Coffee Group', pais: 'Holanda', fechaSolicitud: '2026-02-25',
    estado: 'pendiente', origen: 'solicitud_exportador',
    contacto: 'Jan de Vries', email: 'j.devries@mercon.com', telefono: '+31 10 234 5678',
    exportacionesPrevias: 0, volumenTotalQQ: 0,
    indiceFairness: 0,
    preferencias: ['Volúmenes grandes (200+ QQ)', 'Consistency en calidad', 'Certificaciones Rainforest'],
    noQuiere: [],
    problemasPrevios: [],
    solicitudesRecientes: ['Buscan proveedor estable para contrato anual 2026-2027'],
  },
  {
    id: '5', exportadorNombre: 'Specialty Imports LLC', pais: 'USA', fechaSolicitud: '2025-11-10',
    estado: 'inactivo', origen: 'solicitud_exportador',
    contacto: 'Sarah Johnson', email: 's.johnson@specialtyimports.us', telefono: '+1 503 555 0123',
    exportacionesPrevias: 3, volumenTotalQQ: 120, precioPromedio: 310000, precioMercado: 285000,
    indiceFairness: 92,
    preferencias: ['Micro-lotes', 'Direct trade', 'Transparency reports'],
    noQuiere: ['Non-traceable lots'],
    problemasPrevios: [],
    solicitudesRecientes: [],
    ultimaCompra: '2025-09-15',
  },
];

function FairnessIndicator({ score }: { score: number }) {
  if (score === 0) return <Badge variant="outline" className="text-xs">Sin datos</Badge>;
  const color = score >= 80 ? 'text-primary' : score >= 60 ? 'text-accent-foreground' : 'text-destructive';
  const label = score >= 80 ? 'Justo' : score >= 60 ? 'Aceptable' : 'Por debajo';
  const Icon = score >= 80 ? ThumbsUp : score >= 60 ? TrendingUp : ThumbsDown;
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className={`text-sm font-bold ${color}`}>{score}/100</span>
      <span className="text-xs text-muted-foreground">({label})</span>
    </div>
  );
}

export default function ExportadoresAsociados() {
  const [relaciones, setRelaciones] = useState(relacionesIniciales);
  const [selectedRelacion, setSelectedRelacion] = useState<Relacion | null>(null);
  const [showOfertaDialog, setShowOfertaDialog] = useState(false);
  const [showMensajeDialog, setShowMensajeDialog] = useState(false);
  const [mensajeTexto, setMensajeTexto] = useState('');
  const [selectedLote, setSelectedLote] = useState('');

  const pendientes = relaciones.filter(r => r.estado === 'pendiente');
  const activas = relaciones.filter(r => r.estado === 'activo');
  const inactivas = relaciones.filter(r => r.estado === 'inactivo');
  const lotesDisponibles = DEMO_LOTES_ACOPIO.filter(l => l.estado === 'disponible');

  const handleAceptar = (id: string) => {
    setRelaciones(prev => prev.map(r => r.id === id ? { ...r, estado: 'activo' as const } : r));
    toast.success('Solicitud aceptada. Exportador vinculado.');
  };
  const handleRechazar = (id: string) => {
    setRelaciones(prev => prev.map(r => r.id === id ? { ...r, estado: 'inactivo' as const } : r));
    toast.info('Solicitud rechazada.');
  };
  const handleToggle = (id: string) => {
    setRelaciones(prev => prev.map(r => r.id === id ? { ...r, estado: r.estado === 'activo' ? 'inactivo' as const : 'activo' as const } : r));
  };

  const handleEnviarMensaje = () => {
    if (!mensajeTexto.trim()) { toast.error('Escribe un mensaje'); return; }
    toast.success(`Mensaje enviado a ${selectedRelacion?.exportadorNombre}`);
    setShowMensajeDialog(false);
    setMensajeTexto('');
  };

  const handleEnviarOferta = () => {
    if (!selectedLote) { toast.error('Selecciona un lote'); return; }
    const lote = lotesDisponibles.find(l => l.id === selectedLote);
    toast.success(`Oferta de lote ${lote?.codigo} enviada a ${selectedRelacion?.exportadorNombre}`);
    setShowOfertaDialog(false);
    setSelectedLote('');
  };

  const openDetail = (r: Relacion) => setSelectedRelacion(r);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Exportadores Asociados</h1>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{pendientes.length} solicitudes pendientes</span>
        <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-primary" />{activas.length} relaciones activas</span>
        <span className="flex items-center gap-1"><XCircle className="h-4 w-4" />{inactivas.length} inactivas</span>
      </div>

      <Tabs defaultValue="solicitudes">
        <TabsList>
          <TabsTrigger value="solicitudes"><Clock className="h-4 w-4 mr-1" /> Solicitudes ({pendientes.length})</TabsTrigger>
          <TabsTrigger value="relaciones"><Building2 className="h-4 w-4 mr-1" /> Relaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="solicitudes" className="mt-4 space-y-3">
          {pendientes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay solicitudes pendientes</p>
          ) : pendientes.map(r => (
            <Card key={r.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="cursor-pointer" onClick={() => openDetail(r)}>
                    <p className="font-medium text-foreground hover:text-primary transition-colors">{r.exportadorNombre}</p>
                    <p className="text-xs text-muted-foreground">{r.pais} · Solicitado el {r.fechaSolicitud}</p>
                    <Badge variant="outline" className="text-xs mt-1">{r.origen === 'solicitud_exportador' ? 'Solicitud del exportador' : 'Registrado por admin'}</Badge>
                    {r.solicitudesRecientes?.[0] && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{r.solicitudesRecientes[0]}"</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openDetail(r)}>Ver perfil</Button>
                    <Button size="sm" onClick={() => handleAceptar(r.id)}><CheckCircle className="h-4 w-4 mr-1" /> Aceptar</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRechazar(r.id)}><XCircle className="h-4 w-4 mr-1" /> Rechazar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="relaciones" className="mt-4 space-y-3">
          {[...activas, ...inactivas].map(r => (
            <Card key={r.id} className={`cursor-pointer transition-colors hover:border-primary/30 ${r.estado === 'activo' ? '' : 'opacity-60'}`} onClick={() => openDetail(r)}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-foreground">{r.exportadorNombre}</p>
                      <Badge variant={r.estado === 'activo' ? 'default' : 'secondary'}>{r.estado === 'activo' ? 'Activo' : 'Inactivo'}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{r.pais}</span>
                      <span>Desde {r.fechaSolicitud}</span>
                      {r.exportacionesPrevias != null && r.exportacionesPrevias > 0 && (
                        <span className="flex items-center gap-1"><History className="h-3 w-3" />{r.exportacionesPrevias} compras previas</span>
                      )}
                    </div>
                    {r.indiceFairness != null && r.indiceFairness > 0 && (
                      <div className="mt-1"><FairnessIndicator score={r.indiceFairness} /></div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setSelectedRelacion(r); setShowOfertaDialog(true); }}>
                      <Package className="h-4 w-4 mr-1" /> Enviar oferta
                    </Button>
                    <Switch checked={r.estado === 'activo'} onCheckedChange={e => { e; handleToggle(r.id); }} onClick={e => e.stopPropagation()} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* ═══ FICHA DETALLE EXPORTADOR ═══ */}
      <Dialog open={!!selectedRelacion && !showOfertaDialog && !showMensajeDialog} onOpenChange={() => setSelectedRelacion(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedRelacion && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {selectedRelacion.exportadorNombre}
                  <Badge variant={selectedRelacion.estado === 'activo' ? 'default' : selectedRelacion.estado === 'pendiente' ? 'secondary' : 'outline'}>
                    {selectedRelacion.estado}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="perfil" className="mt-2">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="perfil">Perfil</TabsTrigger>
                  <TabsTrigger value="historial">Historial</TabsTrigger>
                  <TabsTrigger value="preferencias">Preferencias</TabsTrigger>
                  <TabsTrigger value="acciones">Acciones</TabsTrigger>
                </TabsList>

                <TabsContent value="perfil" className="space-y-4 mt-4">
                  {/* Contact */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Contacto</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedRelacion.contacto && (
                        <div className="p-3 rounded-lg border border-border flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{selectedRelacion.contacto}</span>
                        </div>
                      )}
                      {selectedRelacion.email && (
                        <a href={`mailto:${selectedRelacion.email}`} className="p-3 rounded-lg border border-border flex items-center gap-2 hover:bg-muted/50 transition-colors">
                          <Mail className="h-4 w-4 text-primary" />
                          <span className="text-sm text-foreground">{selectedRelacion.email}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                        </a>
                      )}
                      {selectedRelacion.telefono && (
                        <a href={`tel:${selectedRelacion.telefono.replace(/\s/g, '')}`} className="p-3 rounded-lg border border-border flex items-center gap-2 hover:bg-muted/50 transition-colors">
                          <Phone className="h-4 w-4 text-primary" />
                          <span className="text-sm text-foreground">{selectedRelacion.telefono}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Fairness Index */}
                  {selectedRelacion.indiceFairness != null && selectedRelacion.indiceFairness > 0 && (
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                      <h4 className="text-sm font-semibold text-primary">Índice de Justicia Comercial</h4>
                      <div className="flex items-center gap-4">
                        <FairnessIndicator score={selectedRelacion.indiceFairness} />
                        <Progress value={selectedRelacion.indiceFairness} className="flex-1 h-2" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedRelacion.indiceFairness >= 80
                          ? `${selectedRelacion.exportadorNombre} ha pagado consistentemente a precios justos o por encima del mercado. Relación comercial saludable.`
                          : selectedRelacion.indiceFairness >= 60
                          ? `Los precios ofrecidos por ${selectedRelacion.exportadorNombre} han sido aceptables, aunque en algunas transacciones estuvieron por debajo de la referencia. Recomendamos negociar con datos de mercado.`
                          : `Precaución: ${selectedRelacion.exportadorNombre} ha ofrecido precios por debajo del mercado en la mayoría de transacciones. Sugerimos reevaluar la relación o negociar condiciones más favorables.`
                        }
                      </p>
                    </div>
                  )}

                  {/* KPIs */}
                  <div className="grid grid-cols-2 grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{selectedRelacion.exportacionesPrevias ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Compras previas</p>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{selectedRelacion.volumenTotalQQ?.toLocaleString() ?? 0}</p>
                      <p className="text-xs text-muted-foreground">QQ totales</p>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">₡{((selectedRelacion.precioPromedio ?? 0) / 1000).toFixed(0)}k</p>
                      <p className="text-xs text-muted-foreground">Precio prom./QQ</p>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-sm font-medium text-foreground">{selectedRelacion.ultimaCompra ?? 'Nunca'}</p>
                      <p className="text-xs text-muted-foreground">Última compra</p>
                    </div>
                  </div>

                  {/* Nova Silva Interpretation */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs font-semibold text-primary mb-1">Interpretación Nova Silva</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRelacion.exportacionesPrevias && selectedRelacion.exportacionesPrevias > 0
                        ? `${selectedRelacion.exportadorNombre} ha comprado ${selectedRelacion.volumenTotalQQ} QQ en ${selectedRelacion.exportacionesPrevias} transacciones desde ${selectedRelacion.fechaSolicitud}. ${
                            selectedRelacion.precioPromedio && selectedRelacion.precioMercado
                              ? selectedRelacion.precioPromedio >= selectedRelacion.precioMercado
                                ? `Su precio promedio (₡${selectedRelacion.precioPromedio.toLocaleString()}/QQ) está ${Math.round(((selectedRelacion.precioPromedio / selectedRelacion.precioMercado) - 1) * 100)}% por encima del mercado, indicando una relación comercial favorable. `
                                : `Su precio promedio (₡${selectedRelacion.precioPromedio.toLocaleString()}/QQ) está ${Math.round((1 - (selectedRelacion.precioPromedio / selectedRelacion.precioMercado)) * 100)}% por debajo del mercado actual. Considere negociar mejores condiciones en la próxima transacción. `
                              : ''
                          }${selectedRelacion.problemasPrevios && selectedRelacion.problemasPrevios.length > 0 ? `Nota: Se han registrado ${selectedRelacion.problemasPrevios.length} incidente(s) que conviene monitorear.` : 'No se han registrado incidentes.'}`
                        : `${selectedRelacion.exportadorNombre} es un contacto nuevo sin historial de transacciones. ${selectedRelacion.solicitudesRecientes?.[0] ? `Han expresado interés en: "${selectedRelacion.solicitudesRecientes[0]}". ` : ''}Recomendamos iniciar con un lote pequeño de prueba para validar la relación antes de comprometer volúmenes grandes.`
                      }
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="historial" className="space-y-4 mt-4">
                  {selectedRelacion.problemasPrevios && selectedRelacion.problemasPrevios.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-1 mb-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" /> Problemas registrados
                      </h4>
                      {selectedRelacion.problemasPrevios.map((p, i) => (
                        <div key={i} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-sm text-foreground mb-2">
                          {p}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedRelacion.solicitudesRecientes && selectedRelacion.solicitudesRecientes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-1 mb-2">
                        <MessageSquare className="h-4 w-4 text-primary" /> Solicitudes recientes
                      </h4>
                      {selectedRelacion.solicitudesRecientes.map((s, i) => (
                        <div key={i} className="p-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground mb-2">
                          {s}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedRelacion.precioPromedio != null && selectedRelacion.precioMercado != null && selectedRelacion.exportacionesPrevias != null && selectedRelacion.exportacionesPrevias > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-1 mb-2">
                        <BarChart3 className="h-4 w-4 text-primary" /> Comparación de precios
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg border border-border text-center">
                          <p className="text-xs text-muted-foreground">Precio del exportador</p>
                          <p className="text-xl font-bold text-foreground">₡{selectedRelacion.precioPromedio.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">promedio/QQ</p>
                        </div>
                        <div className="p-3 rounded-lg border border-border text-center">
                          <p className="text-xs text-muted-foreground">Referencia de mercado</p>
                          <p className="text-xl font-bold text-foreground">₡{selectedRelacion.precioMercado.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">actual/QQ</p>
                        </div>
                      </div>
                      <div className={`mt-2 p-2 rounded text-center text-sm font-medium ${
                        selectedRelacion.precioPromedio >= selectedRelacion.precioMercado
                          ? 'bg-primary/10 text-primary'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {selectedRelacion.precioPromedio >= selectedRelacion.precioMercado ? (
                          <span className="flex items-center justify-center gap-1"><ArrowUpRight className="h-4 w-4" /> +{Math.round(((selectedRelacion.precioPromedio / selectedRelacion.precioMercado) - 1) * 100)}% sobre mercado</span>
                        ) : (
                          <span className="flex items-center justify-center gap-1"><ArrowDownRight className="h-4 w-4" /> -{Math.round((1 - (selectedRelacion.precioPromedio / selectedRelacion.precioMercado)) * 100)}% bajo mercado</span>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="preferencias" className="space-y-4 mt-4">
                  {selectedRelacion.preferencias && selectedRelacion.preferencias.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 text-primary" /> Lo que buscan / les gusta
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRelacion.preferencias.map((p, i) => (
                          <Badge key={i} className="bg-primary/10 text-primary border-primary/20">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRelacion.noQuiere && selectedRelacion.noQuiere.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-1 mb-2">
                        <XCircle className="h-4 w-4 text-destructive" /> Lo que NO quieren
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRelacion.noQuiere.map((p, i) => (
                          <Badge key={i} variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedRelacion.preferencias?.length === 0 && selectedRelacion.noQuiere?.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-6">No hay preferencias registradas aún</p>
                  )}
                </TabsContent>

                <TabsContent value="acciones" className="space-y-3 mt-4">
                  <Button className="w-full justify-start" onClick={() => { setShowMensajeDialog(true); }}>
                    <MessageSquare className="h-4 w-4 mr-2" /> Enviar mensaje
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => { setShowOfertaDialog(true); }}>
                    <Package className="h-4 w-4 mr-2" /> Enviar oferta de lote
                  </Button>
                  {selectedRelacion.email && (
                    <a href={`mailto:${selectedRelacion.email}`}>
                      <Button variant="outline" className="w-full justify-start">
                        <Mail className="h-4 w-4 mr-2" /> Enviar correo electrónico
                      </Button>
                    </a>
                  )}
                  {selectedRelacion.telefono && (
                    <a href={`tel:${selectedRelacion.telefono.replace(/\s/g, '')}`}>
                      <Button variant="outline" className="w-full justify-start">
                        <Phone className="h-4 w-4 mr-2" /> Llamar
                      </Button>
                    </a>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ ENVIAR MENSAJE ═══ */}
      <Dialog open={showMensajeDialog} onOpenChange={v => { if (!v) setShowMensajeDialog(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Mensaje a {selectedRelacion?.exportadorNombre}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={mensajeTexto}
            onChange={e => setMensajeTexto(e.target.value)}
            placeholder="Escribe tu mensaje..."
            rows={5}
          />
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleEnviarMensaje}><Send className="h-4 w-4 mr-1" /> Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ ENVIAR OFERTA DE LOTE ═══ */}
      <Dialog open={showOfertaDialog} onOpenChange={v => { if (!v) setShowOfertaDialog(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Ofrecer lote a {selectedRelacion?.exportadorNombre}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Seleccionar lote disponible</p>
              <Select value={selectedLote} onValueChange={setSelectedLote}>
                <SelectTrigger><SelectValue placeholder="Seleccionar lote" /></SelectTrigger>
                <SelectContent>
                  {lotesDisponibles.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.codigo} — {l.pesoQQ} QQ {l.tipoCafe}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedLote && (() => {
              const lote = lotesDisponibles.find(l => l.id === selectedLote);
              return lote ? (
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm space-y-1">
                  <p className="font-medium text-foreground">{lote.codigo}</p>
                  <p className="text-xs text-muted-foreground">{lote.pesoQQ} QQ ({lote.pesoKg.toLocaleString()} kg) · {lote.tipoCafe} · {lote.productores} productores</p>
                </div>
              ) : null;
            })()}
            {selectedRelacion?.preferencias && selectedRelacion.preferencias.length > 0 && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-semibold text-primary mb-1">Este exportador busca:</p>
                <p className="text-xs text-muted-foreground">{selectedRelacion.preferencias.join(', ')}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleEnviarOferta}><Send className="h-4 w-4 mr-1" /> Enviar oferta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
