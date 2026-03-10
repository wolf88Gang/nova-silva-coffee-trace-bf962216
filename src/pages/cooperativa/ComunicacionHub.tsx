import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Mail } from 'lucide-react';
import ComunicacionPanel from '@/components/cooperativa/ComunicacionPanel';
import EmailTemplatePreview from '@/components/comunicacion/EmailTemplatePreview';

export default function ComunicacionHub() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="avisos">
        <TabsList>
          <TabsTrigger value="avisos" className="gap-1.5">
            <MessageSquare className="h-4 w-4" /> Avisos
          </TabsTrigger>
          <TabsTrigger value="plantillas" className="gap-1.5">
            <Mail className="h-4 w-4" /> Plantillas Email
          </TabsTrigger>
        </TabsList>
        <TabsContent value="avisos">
          <ComunicacionPanel />
        </TabsContent>
        <TabsContent value="plantillas">
          <EmailTemplatePreview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
