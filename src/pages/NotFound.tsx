import { useLocation, NavLink } from "react-router-dom";
import { useEffect } from "react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Home, ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => { console.error("404:", location.pathname); }, [location.pathname]);

  return (
    <PublicLayout>
      <section className="pt-28 pb-20 md:pt-36 min-h-[70vh] flex items-center">
        <div className="container mx-auto px-4 lg:px-8 max-w-lg text-center space-y-6">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <p className="text-xl text-foreground">La página que busca no existe o ha cambiado de ubicación.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <NavLink to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 transition-colors">
              <Home className="h-4 w-4" /> Volver al Inicio
            </NavLink>
            <NavLink to="/contacto" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors">
              Contacto <ArrowRight className="h-4 w-4" />
            </NavLink>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {[{l:'Soluciones',t:'/soluciones'},{l:'Protocolo VITAL',t:'/plan-clima'},{l:'Impacto',t:'/impacto'}].map(i=>(
              <NavLink key={i.t} to={i.t} className="text-accent hover:underline">{i.l}</NavLink>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default NotFound;