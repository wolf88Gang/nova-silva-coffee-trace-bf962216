import { useLocation, NavLink } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => { console.error("404:", location.pathname); }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-4">
        {/* Illustrated icon */}
        <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <Compass className="h-12 w-12 text-primary animate-pulse" />
        </div>
        <h1 className="text-7xl font-black text-primary tracking-tight">404</h1>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-foreground">Página no encontrada</p>
          <p className="text-sm text-muted-foreground">
            La ruta <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{location.pathname}</code> no existe o fue movida.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver atrás
          </Button>
          <NavLink to="/login">
            <Button className="gap-2 w-full"><Home className="h-4 w-4" /> Ir al Inicio</Button>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
