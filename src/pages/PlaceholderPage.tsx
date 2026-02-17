import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

// Minimal placeholder for pages that exist in the nav but aren't fully built yet
export default function PlaceholderPage({ title }: { title?: string }) {
  const location = useLocation();
  const displayTitle = title || location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Página';

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <Construction className="h-10 w-10 text-accent" />
          </div>
          <CardTitle className="capitalize">{displayTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Módulo en implementación. Los datos se conectarán próximamente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
