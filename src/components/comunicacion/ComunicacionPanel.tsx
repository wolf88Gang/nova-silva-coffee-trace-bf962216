import { useState } from 'react';
import { useOrgContext } from '@/hooks/useOrgContext';
import {
  useAvisosCooperativa,
  useCreateAviso,
  useUpdateAvisoEstado,
  useDeleteAviso,
  useAvisosSectorCafe,
  type Aviso,
  type CreateAvisoInput,
  type AvisoEstado,
} from '@/hooks/useComunicacion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Plus,
  Send,
  Pause,
  Trash2,
  ExternalLink,
  Megaphone,
  Newspaper,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

// ─── Helpers ─────────────────────────────────────────────────────────────

const NIVEL_BADGE: Record<string, 'default' | 'secondary' | 'destructive'> = {
  normal: 'secondary',
  alto: 'default',
  critico: 'destructive',
};

const ESTADO_BADGE: Record<string, string> = {
  activo: 'bg-primary/10 text-primary',
  publicado: 'bg-green-100 text-green-800',
  pausado: 'bg-yellow-100 text-yellow-800',
  archivado: 'bg-muted text-muted-foreground',
};

function formatFecha(fecha: string | null) {
  if (!fecha) return '—';
  return format(new Date(fecha), "d MMM yyyy", { locale: es });
}

// ─── Formulario de nuevo aviso ────────────────────────────────────────────

interface NuevoAvisoFormProps {
  organizationId: string;
  onSuccess: () => void;
}

function NuevoAvisoForm({ organizationId, onSuccess }: NuevoAvisoFormProps) {
  const createAviso = useCreateAviso();
  const [form, setForm] = useState<Partial<CreateAvisoInput>>({
    tipo: 'general',
    nivel_importancia: 'normal',
    alcance: 'interno',
    estado: 'activo',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo?.trim()) return;

    try {
      await createAviso.mutateAsync({
        cooperativa_id: organizationId,
        titulo: form.titulo,
        resumen: form.resumen,
        texto_largo: form.texto_largo,
        tipo: form.tipo as CreateAvisoInput['tipo'],
        nivel_importancia: form.nivel_importancia as CreateAvisoInput['nivel_importancia'],
        alcance: form.alcance as CreateAvisoInput['alcance'],
        estado: form.estado as CreateAvisoInput['estado'],
      });
      toast({ title: 'Aviso creado', description: form.titulo });
      onSuccess();
    } catch {
      toast({ title: 'Error al crear aviso', variant: 'destructive' });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="titulo">Título *</Label>
        <Input
          id="titulo"
          value={form.titulo ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          placeholder="Ej: Inicio de temporada de cosecha 2026"
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="resumen">Resumen</Label>
        <Input
          id="resumen"
          value={form.resumen ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, resumen: e.target.value }))}
          placeholder="Texto breve visible en lista"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="texto">Contenido completo</Label>
        <Textarea
          id="texto"
          rows={4}
          value={form.texto_largo ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, texto_largo: e.target.value }))}
          placeholder="Descripción detallada del aviso..."
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select
            value={form.tipo}
            onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as CreateAvisoInput['tipo'] }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="alerta">Alerta</SelectItem>
              <SelectItem value="informativo">Informativo</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Importancia</Label>
          <Select
            value={form.nivel_importancia}
            onValueChange={(v) => setForm((f) => ({ ...f, nivel_importancia: v as CreateAvisoInput['nivel_importancia'] }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
              <SelectItem value="critico">Crítico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Alcance</Label>
          <Select
            value={form.alcance}
            onValueChange={(v) => setForm((f) => ({ ...f, alcance: v as CreateAvisoInput['alcance'] }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="interno">Interno</SelectItem>
              <SelectItem value="productores">Productores</SelectItem>
              <SelectItem value="publico">Público</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={createAviso.isPending}>
          {createAviso.isPending ? 'Guardando...' : 'Crear aviso'}
        </Button>
      </div>
    </form>
  );
}

// ─── Tarjeta de aviso ─────────────────────────────────────────────────────

interface AvisoCardProps {
  aviso: Aviso;
}

function AvisoCard({ aviso }: AvisoCardProps) {
  const updateEstado = useUpdateAvisoEstado();
  const deleteAviso = useDeleteAviso();

  async function handleEstado(estado: AvisoEstado) {
    try {
      await updateEstado.mutateAsync({
        id: aviso.id,
        estado,
        cooperativa_id: aviso.cooperativa_id,
      });
      toast({ title: `Aviso ${estado}` });
    } catch {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    }
  }

  async function handleDelete() {
    try {
      await deleteAviso.mutateAsync({ id: aviso.id, cooperativa_id: aviso.cooperativa_id });
      toast({ title: 'Aviso eliminado' });
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  }

  return (
    <Card className="group hover:shadow-sm transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_BADGE[aviso.estado] ?? ''}`}>
                {aviso.estado}
              </span>
              <Badge variant={NIVEL_BADGE[aviso.nivel_importancia] ?? 'secondary'}>
                {aviso.nivel_importancia}
              </Badge>
              <span className="text-xs text-muted-foreground capitalize">{aviso.tipo}</span>
            </div>

            <p className="font-medium text-sm leading-snug">{aviso.titulo}</p>

            {aviso.resumen && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{aviso.resumen}</p>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              {formatFecha(aviso.fecha_publicacion)} · {aviso.alcance}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {aviso.estado !== 'publicado' && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={updateEstado.isPending}
                onClick={() => handleEstado('publicado')}
                title="Publicar"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            )}

            {aviso.estado === 'publicado' && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={updateEstado.isPending}
                onClick={() => handleEstado('pausado')}
                title="Pausar"
              >
                <Pause className="h-3.5 w-3.5" />
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar aviso?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────

export default function ComunicacionPanel() {
  const { organizationId } = useOrgContext();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: avisos = [], isLoading: loadingAvisos } = useAvisosCooperativa(organizationId ?? undefined);
  const { data: avisosSector = [], isLoading: loadingSector } = useAvisosSectorCafe(8);

  const activos = avisos.filter((a) => a.estado === 'activo' || a.estado === 'publicado');
  const archivados = avisos.filter((a) => a.estado === 'pausado' || a.estado === 'archivado');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Comunicación</h2>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nuevo aviso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear aviso</DialogTitle>
            </DialogHeader>
            <NuevoAvisoForm
              organizationId={organizationId ?? ''}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="avisos">
        <TabsList>
          <TabsTrigger value="avisos" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Mis avisos
            {avisos.length > 0 && (
              <span className="ml-1 bg-primary/10 text-primary text-xs rounded-full px-1.5">
                {avisos.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sector" className="gap-1.5">
            <Newspaper className="h-3.5 w-3.5" />
            Noticias del sector
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Mis avisos ── */}
        <TabsContent value="avisos" className="mt-4 space-y-4">
          {loadingAvisos ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : avisos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Megaphone className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">No hay avisos creados aún.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Crear el primero
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Activos y publicados
                  </p>
                  {activos.map((aviso) => (
                    <AvisoCard key={aviso.id} aviso={aviso} />
                  ))}
                </div>
              )}

              {archivados.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Pausados / Archivados
                  </p>
                  {archivados.map((aviso) => (
                    <AvisoCard key={aviso.id} aviso={aviso} />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Noticias del sector ── */}
        <TabsContent value="sector" className="mt-4 space-y-3">
          {loadingSector ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : avisosSector.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Newspaper className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">Sin noticias del sector disponibles.</p>
              </CardContent>
            </Card>
          ) : (
            avisosSector.map((aviso) => (
              <Card key={aviso.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={NIVEL_BADGE[aviso.nivel_importancia] ?? 'secondary'}>
                          {aviso.nivel_importancia}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{aviso.fuente}</span>
                      </div>
                      <p className="font-medium text-sm">{aviso.titulo}</p>
                      {aviso.resumen && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{aviso.resumen}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatFecha(aviso.fecha_publicacion)}
                        {aviso.pais_iso ? ` · ${aviso.pais_iso}` : ''}
                      </p>
                    </div>

                    {aviso.link_externo && (
                      <a
                        href={aviso.link_externo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
