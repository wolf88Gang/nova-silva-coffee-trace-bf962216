/**
 * Índice del dominio Dashboard.
 */
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LayoutDashboard, Sprout, Leaf, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardIndex() {
  return (
    <>
      <MainHeader title="Dashboard" subtitle="Vista general de tu organización" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/produccion">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center gap-2">
              <Sprout className="h-5 w-5 text-primary" />
              <span>Producción</span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Parcelas, lotes y trazabilidad de café
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/agronomia">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              <span>Agronomía</span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Nutrición, Nova Guard y Nova Yield
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/resiliencia/vital">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Protocolo VITAL</span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Resiliencia climática y trazabilidad
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  );
}
