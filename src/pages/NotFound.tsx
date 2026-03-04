import { useLocation, NavLink } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => { console.error("404:", location.pathname); }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-xl text-foreground">La pagina que busca no existe o ha cambiado de ubicacion.</p>
        <NavLink to="/login">
          <Button className="gap-2"><Home className="h-4 w-4" /> Volver al Inicio</Button>
        </NavLink>
      </div>
    </div>
  );
};

export default NotFound;
