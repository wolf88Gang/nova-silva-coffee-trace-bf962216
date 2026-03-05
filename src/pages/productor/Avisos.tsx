import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Bell, MessageSquare, Users, Send, Search, Phone, Mail, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { TecnicoContactLink, TecnicoContactBanner } from '@/components/common/TecnicoContactCard';

// ── Avisos data ──
interface Aviso {
  id: string; titulo: string; tipo: 'informativo' | 'urgente' | 'evento';
  fecha: string; leido: boolean; contenido: string;
}

const avisos: Aviso[] = [
  { id: '1', titulo: 'Inicio de temporada de cosecha 2026', tipo: 'informativo', fecha: '2026-02-14', leido: false, contenido: 'Se informa a todos los productores que la temporada de cosecha 2026 inicia oficialmente el 1 de marzo. Recuerden preparar beneficiaderos y coordinar con su cuadrilla asignada. La cooperativa habilitará puntos de acopio adicionales en las comunidades San Miguel y El Progreso.' },
  { id: '2', titulo: 'Alerta: Roya detectada en zona El Progreso', tipo: 'urgente', fecha: '2026-02-13', leido: false, contenido: 'Se ha detectado presencia de roya en la zona El Progreso. Se recomienda inspeccionar sus parcelas y aplicar fungicida preventivo. Contacte a su técnico asignado para programar visita de monitoreo. La cooperativa tiene disponible Caldo Bordelés en inventario.' },
  { id: '3', titulo: 'Capacitación en buenas prácticas agrícolas', tipo: 'evento', fecha: '2026-02-10', leido: true, contenido: 'Se invita a participar en la capacitación sobre buenas prácticas el 20 de febrero en la sede de la cooperativa. Temas: manejo integrado de plagas, conservación de suelos y cosecha selectiva. Cupos limitados a 30 participantes.' },
  { id: '4', titulo: 'Nuevo precio de referencia para pergamino', tipo: 'informativo', fecha: '2026-02-05', leido: true, contenido: 'El precio de referencia para café pergamino se ha actualizado a Q 3,200/kg efectivo a partir del 1 de febrero. Este precio aplica para entregas de calidad estándar (factor ≥ 88, humedad ≤ 12%).' },
  { id: '5', titulo: 'Pago de entregas de enero disponible', tipo: 'informativo', fecha: '2026-02-01', leido: true, contenido: 'Los pagos correspondientes a las entregas del mes de enero ya se encuentran disponibles. Puede verificar el monto en la sección de Finanzas de su panel. La transferencia se realizará el próximo viernes.' },
];

// ── Contacts data ──
interface Contacto {
  id: string; nombre: string; rol: string; telefono: string; email: string; disponible: boolean;
}

const contactos: Contacto[] = [
  { id: '1', nombre: 'Ing. Roberto Castañeda', rol: 'Técnico Asignado', telefono: '+502 5555-1234', email: 'r.castaneda@cooperativa.org', disponible: true },
  { id: '2', nombre: 'Lic. María Fernández', rol: 'Coordinadora de Acopio', telefono: '+502 5555-2345', email: 'm.fernandez@cooperativa.org', disponible: true },
  { id: '3', nombre: 'Ing. Carlos Méndez', rol: 'Jefe de Operaciones', telefono: '+502 5555-3456', email: 'c.mendez@cooperativa.org', disponible: false },
  { id: '4', nombre: 'Lic. Ana Pérez', rol: 'Créditos y Finanzas', telefono: '+502 5555-4567', email: 'a.perez@cooperativa.org', disponible: true },
  { id: '5', nombre: 'Cooperativa Central', rol: 'Oficina Principal', telefono: '+502 5555-0000', email: 'info@cooperativa.org', disponible: true },
];

// ── Messages data ──
interface Mensaje {
  id: string; de: string; fecha: string; texto: string; tipo: 'recibido' | 'enviado'; adjunto?: string;
}

const mensajes: Mensaje[] = [
  { id: '1', de: 'Ing. Roberto Castañeda', fecha: '2026-02-25 14:30', texto: 'Buenos días Don Juan, confirmo visita técnica para el jueves 27 a las 8am. Revisaremos la parcela El Mirador y el plan de tratamiento contra broca.', tipo: 'recibido' },
  { id: '2', de: 'Yo', fecha: '2026-02-25 15:10', texto: 'Perfecto ingeniero, lo espero. Tengo preparadas las muestras de las hojas con síntomas que le mencioné.', tipo: 'enviado' },
  { id: '3', de: 'Coordinación Acopio', fecha: '2026-02-24 09:00', texto: 'Recordatorio: Las entregas de café pergamino se reciben de lunes a viernes de 7am a 4pm. No olvide traer su boleta de entrega.', tipo: 'recibido' },
  { id: '4', de: 'Ing. Roberto Castañeda', fecha: '2026-02-20 11:15', texto: 'Le adjunto el resultado de su análisis de suelo. El pH está en 5.2, recomiendo aplicar cal dolomita antes de la próxima fertilización.', tipo: 'recibido', adjunto: 'analisis_suelo_feb2026.pdf' },
  { id: '5', de: 'Yo', fecha: '2026-02-20 16:30', texto: 'Gracias ingeniero. ¿Cuántos sacos de cal necesitaría por hectárea?', tipo: 'enviado' },
];

const tipoBadge = (tipo: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    informativo: { label: 'Informativo', variant: 'default' },
    urgente: { label: 'Urgente', variant: 'destructive' },
    evento: { label: 'Evento', variant: 'secondary' },
  };
  const { label, variant } = map[tipo] ?? map.informativo;
  return <Badge variant={variant} className="text-[10px]">{label}</Badge>;
};

/** Replaces "técnico asignado" mentions in text with clickable links */
function renderContenidoConLinks(text: string) {
  const pattern = /(Contacte a su técnico asignado|técnico asignado|contacte.*técnico)/gi;
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    if (pattern.test(part)) {
      return <TecnicoContactLink key={i} label={part} className="text-sm" />;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function Avisos() {
  const [selectedAviso, setSelectedAviso] = useState<Aviso | null>(null);
  const [selectedContacto, setSelectedContacto] = useState<Contacto | null>(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [searchContacto, setSearchContacto] = useState('');
  const noLeidos = avisos.filter(a => !a.leido).length;

  const filteredContactos = contactos.filter(c =>
    c.nombre.toLowerCase().includes(searchContacto.toLowerCase()) ||
    c.rol.toLowerCase().includes(searchContacto.toLowerCase())
  );

  const handleEnviarMensaje = () => {
    if (!nuevoMensaje.trim()) return;
    toast.success('Mensaje enviado');
    setNuevoMensaje('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comunidad</h1>
        <p className="text-sm text-muted-foreground">Avisos, contactos y mensajería con tu organización</p>
      </div>

      <Tabs defaultValue="avisos">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="avisos" className="flex items-center gap-1.5"><Bell className="h-3.5 w-3.5" /> Avisos {noLeidos > 0 && <Badge variant="destructive" className="text-[9px] h-4 px-1 ml-1">{noLeidos}</Badge>}</TabsTrigger>
          <TabsTrigger value="mensajes" className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Mensajes</TabsTrigger>
          <TabsTrigger value="contactos" className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Contactos</TabsTrigger>
        </TabsList>

        {/* ── AVISOS ── */}
        <TabsContent value="avisos" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1"><Bell className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Avisos no leídos</span></div>
              <p className="text-2xl font-bold text-foreground">{noLeidos}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Avisos de la Cooperativa</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {avisos.map((a) => (
                <button key={a.id} onClick={() => setSelectedAviso(a)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors cursor-pointer group ${!a.leido ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' : 'border-border hover:bg-muted/50'}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`text-sm ${!a.leido ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{a.titulo}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {tipoBadge(a.tipo)}
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{a.contenido}</p>
                  <p className="text-xs text-muted-foreground mt-2">{a.fecha}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Aviso Detail Dialog */}
          <Dialog open={!!selectedAviso} onOpenChange={() => setSelectedAviso(null)}>
            <DialogContent className="max-w-lg">
              {selectedAviso && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" /> {selectedAviso.titulo}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {tipoBadge(selectedAviso.tipo)}
                      <span className="text-xs text-muted-foreground">{selectedAviso.fecha}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {renderContenidoConLinks(selectedAviso.contenido)}
                    </p>
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-3 pb-3">
                        <p className="text-xs font-semibold text-primary mb-1">Interpretación Nova Silva</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedAviso.tipo === 'urgente'
                            ? <>Esta alerta requiere acción inmediata. <TecnicoContactLink label="Contacte a su técnico asignado" forwardMessage={selectedAviso.contenido} className="text-sm" /> para coordinación.</>
                            : selectedAviso.tipo === 'evento'
                            ? 'Participar en capacitaciones mejora su puntaje VITAL en el componente de Capacidad Adaptativa.'
                            : 'Información importante para la planificación de su ciclo productivo.'}
                        </p>
                      </CardContent>
                    </Card>
                    {selectedAviso.tipo === 'urgente' && (
                      <TecnicoContactBanner context={selectedAviso.contenido} />
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => { toast.success('Aviso marcado como leído'); setSelectedAviso(null); }}>
                        Marcar como leído
                      </Button>
                      <Button className="flex-1" onClick={() => { toast.info('Respuesta enviada a la cooperativa'); setSelectedAviso(null); }}>
                        <Send className="h-4 w-4 mr-1" /> Responder
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── MENSAJES ── */}
        <TabsContent value="mensajes" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Conversaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {mensajes.map(m => (
                  <div key={m.id} className={`flex ${m.tipo === 'enviado' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${m.tipo === 'enviado' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border'}`}>
                      <p className={`text-xs font-semibold mb-1 ${m.tipo === 'enviado' ? 'text-primary-foreground/80' : 'text-foreground'}`}>{m.de}</p>
                      <p className={`text-sm ${m.tipo === 'enviado' ? 'text-primary-foreground' : 'text-foreground'}`}>{m.texto}</p>
                      {m.adjunto && (
                        <button className={`mt-2 text-xs flex items-center gap-1 underline ${m.tipo === 'enviado' ? 'text-primary-foreground/80' : 'text-primary'}`}
                          onClick={() => toast.info(`Descargando: ${m.adjunto}`)}>
                          📎 {m.adjunto}
                        </button>
                      )}
                      <p className={`text-[10px] mt-1 ${m.tipo === 'enviado' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{m.fecha}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Compose */}
              <div className="flex gap-2 pt-3 border-t border-border">
                <Input
                  value={nuevoMensaje}
                  onChange={e => setNuevoMensaje(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  onKeyDown={e => e.key === 'Enter' && handleEnviarMensaje()}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleEnviarMensaje} disabled={!nuevoMensaje.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Puedes adjuntar imágenes y documentos presionando el clip 📎 (próximamente)</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CONTACTOS ── */}
        <TabsContent value="contactos" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar contacto..." value={searchContacto} onChange={e => setSearchContacto(e.target.value)} className="pl-9" />
          </div>

          <div className="space-y-2">
            {filteredContactos.map(c => (
              <button key={c.id} onClick={() => setSelectedContacto(c)}
                className="w-full text-left flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${c.disponible ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {c.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">{c.rol}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${c.disponible ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </div>
              </button>
            ))}
          </div>

          {/* Contact Detail Dialog */}
          <Dialog open={!!selectedContacto} onOpenChange={() => setSelectedContacto(null)}>
            <DialogContent className="max-w-sm">
              {selectedContacto && (
                <>
                  <DialogHeader>
                    <DialogTitle>{selectedContacto.nombre}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary mb-2">
                        {selectedContacto.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedContacto.rol}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <div className={`h-2 w-2 rounded-full ${selectedContacto.disponible ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                        <span className="text-xs text-muted-foreground">{selectedContacto.disponible ? 'Disponible' : 'No disponible'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button onClick={() => toast.info(`Llamando a ${selectedContacto.telefono}`)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">{selectedContacto.telefono}</span>
                      </button>
                      <button onClick={() => toast.info(`Abriendo correo para ${selectedContacto.email}`)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">{selectedContacto.email}</span>
                      </button>
                    </div>
                    <Button className="w-full" onClick={() => { toast.info('Abriendo conversación...'); setSelectedContacto(null); }}>
                      <MessageSquare className="h-4 w-4 mr-1" /> Enviar mensaje
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
