/**
 * Índice del dominio Agronomía.
 */
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FlaskConical, Bug, BarChart3 } from 'lucide-react';

export default function AgronomiaIndex() {
  return (
    <>
      <MainHeader title="Agronomía" subtitle="Nutrición, sanidad y rendimiento" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        <Link to="/agronomia/nutricion">
          <Card className="hover:border-primary/50 transition-colors h-full">
            <CardHeader className="flex flex-row items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              <span>Nutrición</span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Plan nutricional y recomendaciones científicas
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/agronomia/guard">
          <Card className="hover:border-primary/50 transition-colors h-full">
            <CardHeader className="flex flex-row items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              <span>Nova Guard</span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Alertas y sanidad vegetal
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/agronomia/yield">
          <Card className="hover:border-primary/50 transition-colors h-full">
            <CardHeader className="flex flex-row items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Nova Yield</span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Estimaciones y rendimiento
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  );
}
