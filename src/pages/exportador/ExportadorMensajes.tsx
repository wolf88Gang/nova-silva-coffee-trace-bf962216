import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Search, Clock, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Conversacion {
  id: string; contacto: string; org: string; rol: string;
  ultimoMensaje: string; fecha: string; noLeidos: number;
  mensajes: { autor: string; texto: string; hora: string; propio: boolean }[];
}

const conversaciones: Conversacion[] = [
  {
    id: '1', contacto: 'María García', org: 'Cooperativa Café de la Selva', rol: 'Administradora',
    ultimoMensaje: 'El lote LOT-EXP-041 ya está listo para despacho', fecha: '14:32', noLeidos: 2,
    mensajes: [
      { autor: 'Carlos Mendoza', texto: '¿Cuál es el estado del lote LOT-EXP-041?', hora: '14:15', propio: true },
      { autor: 'María García', texto: 'Está en beneficio seco, estimamos 3 días más', hora: '14:20', propio: false },
      { autor: 'Carlos Mendoza', texto: 'Perfecto, necesitamos despachar antes del 15', hora: '14:25', propio: true },
      { autor: 'María García', texto: 'El lote LOT-EXP-041 ya está listo para despacho', hora: '14:32', propio: false },
    ],
  },
  {
    id: '2', contacto: 'Ana Certificadora', org: 'CertifiCafé Internacional', rol: 'Auditora',
    ultimoMensaje: 'Certificado orgánico renovado. Adjunto el documento.', fecha: '10:05', noLeidos: 0,
    mensajes: [
      { autor: 'Ana Certificadora', texto: 'Hemos completado la auditoría del lote LOT-EXP-039', hora: '09:30', propio: false },
      { autor: 'Carlos Mendoza', texto: '¿Cuándo estará disponible el certificado actualizado?', hora: '09:45', propio: true },
      { autor: 'Ana Certificadora', texto: 'Certificado orgánico renovado. Adjunto el documento.', hora: '10:05', propio: false },
    ],
  },
  {
    id: '3', contacto: 'Hans Weber', org: 'European Coffee Trading GmbH', rol: 'Comprador',
    ultimoMensaje: 'Confirmed. We need the PSS sample by March 10.', fecha: 'ayer', noLeidos: 1,
    mensajes: [
      { autor: 'Hans Weber', texto: 'Hi Carlos, any update on Contract NS-2026-001?', hora: '16:00', propio: false },
      { autor: 'Carlos Mendoza', texto: 'Hi Hans, the first 125 bags are being prepared. ETA shipment March 20.', hora: '16:15', propio: true },
      { autor: 'Hans Weber', texto: 'Confirmed. We need the PSS sample by March 10.', hora: '16:30', propio: false },
    ],
  },
];

export default function ExportadorMensajes() {
  const [selectedId, setSelectedId] = useState<string | null>(conversaciones[0].id);
  const [nuevoMsg, setNuevoMsg] = useState('');
  const [search, setSearch] = useState('');

  const selected = conversaciones.find(c => c.id === selectedId);
  const filtered = conversaciones.filter(c =>
    c.contacto.toLowerCase().includes(search.toLowerCase()) ||
    c.org.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = () => {
    if (!nuevoMsg.trim()) return;
    toast.success('Mensaje enviado (demo)');
    setNuevoMsg('');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-primary" /> Mensajes
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Conversations list */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors ${selectedId === c.id ? 'bg-muted/50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {c.contacto.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">{c.contacto}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{c.fecha}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.org}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{c.ultimoMensaje}</p>
                  </div>
                  {c.noLeidos > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-[10px] h-5 w-5 flex items-center justify-center rounded-full p-0 shrink-0">
                      {c.noLeidos}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Chat view */}
        <Card className="lg:col-span-2 flex flex-col">
          {selected ? (
            <>
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {selected.contacto.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selected.contacto}</p>
                    <p className="text-xs text-muted-foreground">{selected.org} · {selected.rol}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {selected.mensajes.map((m, i) => (
                  <div key={i} className={`flex ${m.propio ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 ${m.propio ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="text-sm">{m.texto}</p>
                      <p className={`text-[10px] mt-1 flex items-center gap-1 ${m.propio ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground'}`}>
                        {m.hora}
                        {m.propio && <CheckCheck className="h-3 w-3" />}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={nuevoMsg}
                  onChange={e => setNuevoMsg(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!nuevoMsg.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Seleccione una conversación</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
