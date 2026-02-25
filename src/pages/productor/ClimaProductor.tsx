import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Stethoscope, AlertTriangle, CheckCircle } from 'lucide-react';

const bloques = [
  { nombre: 'Agua y Suelo', puntaje: 0.72, dimensiones: ['Exposición', 'Sensibilidad', 'Cap. Adaptativa'] },
  { nombre: 'Sombra y Biodiversidad', puntaje: 0.65, dimensiones: ['Exposición', 'Cap. Adaptativa'] },
  { nombre: 'Prácticas Agrícolas', puntaje: 0.80, dimensiones: ['Sensibilidad', 'Cap. Adaptativa'] },
  { nombre: 'Infraestructura', puntaje: 0.55, dimensiones: ['Exposición', 'Sensibilidad'] },
  { nombre: 'Organización', puntaje: 0.78, dimensiones: ['Cap. Adaptativa'] },
  { nombre: 'Económico', puntaje: 0.60, dimensiones: ['Sensibilidad', 'Cap. Adaptativa'] },
];

const ivc = Math.round(bloques.reduce((s, b) => s + b.puntaje, 0) / bloques.length * 100);
const riesgoLabel = ivc >= 70 ? 'Bajo' : ivc >= 50 ? 'Medio' : 'Alto';

const planAcciones = [
  { accion: 'Instalar sistema de recolección de agua de lluvia', estado: 'pendiente', prioridad: 'Alta' },
  { accion: 'Diversificar especies de sombra con leguminosas', estado: 'en_progreso', prioridad: 'Media' },
  { accion: 'Implementar barreras vivas en zonas de erosión', estado: 'completada', prioridad: 'Alta' },
  { accion: 'Mejorar almacenamiento post-cosecha', estado: 'pendiente', prioridad: 'Media' },
];

export default function ClimaProductor() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5 text-primary" /> Protocolo VITAL</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant={riesgoLabel === 'Bajo' ? 'default' : riesgoLabel === 'Medio' ? 'secondary' : 'destructive'}>Riesgo {riesgoLabel}</Badge>
            <span className="text-3xl font-bold text-foreground">{ivc}/100</span>
          </div>
          <Progress value={ivc} className="h-3" />
          <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
            <p className="text-sm font-semibold text-primary">Su finca presenta un nivel de riesgo climático medio. Se recomienda fortalecer la infraestructura y diversificar las fuentes de ingreso.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Desglose por Bloques</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {bloques.map((b) => (
            <div key={b.nombre} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{b.nombre}</span>
                <span className="font-medium text-foreground">{Math.round(b.puntaje * 100)}%</span>
              </div>
              <Progress value={b.puntaje * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-accent" /> Plan de Acción VITAL</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {planAcciones.map((a, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                {a.estado === 'completada' ? <CheckCircle className="h-4 w-4 text-primary" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />}
                <div>
                  <p className={`text-sm ${a.estado === 'completada' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{a.accion}</p>
                </div>
              </div>
              <Badge variant={a.prioridad === 'Alta' ? 'destructive' : 'secondary'} className="text-[10px]">{a.prioridad}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
